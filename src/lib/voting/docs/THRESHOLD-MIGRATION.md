# Migration Guide: Single-Authority to Threshold Decryption

This guide walks through upgrading an existing single-authority voting setup to use threshold decryption with k-of-n Guardians.

## Overview

The threshold voting system is fully backward compatible. Existing single-authority polls continue to work unchanged. You can adopt threshold decryption incrementally — per poll, per jurisdiction, or system-wide.

### What Changes

| Aspect | Single-Authority | Threshold |
|--------|-----------------|-----------|
| Key holder | One authority | k-of-n Guardians |
| Decryption | After poll close only | At configurable intervals + poll close |
| Trust model | Single point of trust | Distributed trust |
| Real-time tallies | Not available | Available via PublicTallyFeed |
| Verification | Basic tally proof | ZK proofs for every decryption |

### What Stays the Same

- Vote encryption (Paillier homomorphic encryption)
- Vote encoding (VoteEncoder API)
- All 15+ voting methods
- Hierarchical aggregation structure
- Audit logging (extended, not replaced)
- Receipt generation and verification

## Step-by-Step Migration

### Step 1: Generate Threshold Keys

Replace single Paillier key generation with threshold key generation.

**Before (single-authority):**

```typescript
import { Member, MemberType, EmailString, ECIESService } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();
const { member: authority } = Member.newMember(
  ecies, MemberType.System, 'Authority', new EmailString('auth@example.com')
);
await authority.deriveVotingKeys();
// authority.votingPublicKey and authority.votingPrivateKey are now available
```

**After (threshold):**

```typescript
import { ThresholdKeyGenerator } from '@digitaldefiance/ecies-lib/voting/threshold';

const keyGen = new ThresholdKeyGenerator();
const keyPair = await keyGen.generate({
  totalShares: 5,  // n = 5 Guardians
  threshold: 3,    // k = 3 required for decryption
  keyBitLength: 2048,
});

// keyPair.publicKey replaces authority.votingPublicKey for encryption
// keyPair.keyShares are distributed to Guardians (replaces authority.votingPrivateKey)
```

### Step 2: Register Guardians

Create a GuardianRegistry and register your key holders.

```typescript
import {
  GuardianRegistry,
  GuardianStatus,
} from '@digitaldefiance/ecies-lib/voting/threshold';

const registry = new GuardianRegistry<Uint8Array>({
  totalShares: 5,
  threshold: 3,
});

// Register each Guardian with their verification key
keyPair.keyShares.forEach((share, i) => {
  registry.register({
    id: guardianIds[i],           // unique identifier
    name: `Guardian ${i + 1}`,
    shareIndex: share.index,
    verificationKey: share.verificationKey,
    status: GuardianStatus.Online,
  });
});

// Monitor Guardian availability
registry.onStatusChange((event) => {
  console.log(`Guardian ${event.guardianId}: ${event.previousStatus} → ${event.newStatus}`);
});
```

### Step 3: Create Threshold Polls

Replace `PollFactory` with `ThresholdPollFactory`.

**Before (single-authority):**

```typescript
import { PollFactory, VotingMethod } from '@digitaldefiance/ecies-lib/voting';

const poll = PollFactory.createPlurality(['Alice', 'Bob', 'Charlie'], authority);
```

**After (threshold):**

```typescript
import {
  ThresholdPollFactory,
  IntervalTriggerType,
} from '@digitaldefiance/ecies-lib/voting/threshold';
import { ImmutableAuditLog } from '@digitaldefiance/ecies-lib/voting';

const auditLog = new ImmutableAuditLog(authority);
const factory = new ThresholdPollFactory(auditLog);

const poll = factory.createThresholdPoll(
  ['Alice', 'Bob', 'Charlie'],
  VotingMethod.Plurality,
  authority,
  {
    thresholdConfig: { totalShares: 5, threshold: 3 },
    intervalConfig: {
      triggerType: IntervalTriggerType.TimeBased,
      timeIntervalMs: 3600000,    // hourly tallies
      minimumIntervalMs: 60000,   // at least 1 minute between ceremonies
      ceremonyTimeoutMs: 300000,  // 5 minute timeout per ceremony
    },
    guardianRegistry: registry,
    keyPair,
  }
);
```

> **Backward compatibility**: `ThresholdPollFactory.createStandardPoll()` creates a standard single-authority poll, so you can use one factory for both types.

### Step 4: Vote Casting (No Change)

Vote casting is identical. The VoteEncoder uses the public key, which works the same way for both single-authority and threshold configurations.

```typescript
import { VoteEncoder } from '@digitaldefiance/ecies-lib/voting';

// Use keyPair.publicKey instead of authority.votingPublicKey
const encoder = new VoteEncoder(keyPair.publicKey);
const vote = encoder.encodePlurality(0, 3);
const receipt = poll.vote(voter, vote);
```

### Step 5: Replace Single Tallying with Ceremony-Based Decryption

**Before (single-authority):**

```typescript
import { PollTallier } from '@digitaldefiance/ecies-lib/voting';

poll.close();
const tallier = new PollTallier(authority, authority.votingPrivateKey!, authority.votingPublicKey!);
const results = tallier.tally(poll);
```

**After (threshold):**

Tallying happens automatically through the ceremony system. Subscribe to the PublicTallyFeed for results:

```typescript
// Subscribe to real-time interval tallies
poll.tallyFeed.subscribe(poll.id, (tally) => {
  console.log(`Interval ${tally.intervalNumber}:`, tally.tallies);
  console.log('Verified:', tally.proof !== undefined);

  if (tally.isFinal) {
    console.log('Final results:', tally.tallies);
  }
});

// When the poll closes, a final ceremony is triggered automatically
poll.close();
// The final tally arrives via the subscription above
```

### Step 6: Update Hierarchical Aggregation (If Used)

Replace standard aggregators with threshold-aware versions.

**Before:**

```typescript
import {
  PrecinctAggregator,
  CountyAggregator,
} from '@digitaldefiance/ecies-lib/voting';

const precinct = new PrecinctAggregator(precinctId, config, publicKey);
const county = new CountyAggregator(countyId, config, publicKey);
```

**After:**

```typescript
import {
  ThresholdPrecinctAggregator,
  ThresholdCountyAggregator,
  ThresholdStateAggregator,
  ThresholdNationalAggregator,
} from '@digitaldefiance/ecies-lib/voting/threshold';

const precinct = new ThresholdPrecinctAggregator(precinctId, config, keyPair.publicKey);
const county = new ThresholdCountyAggregator(countyId, config, keyPair.publicKey);

// Perform interval decryption at any level
const tally = await precinct.performIntervalDecryption(coordinator, intervalNumber);
precinct.propagateToParent(tally);
```

### Step 7: Add Tally Verification

Enable third-party verification of published tallies.

```typescript
import { TallyVerifier } from '@digitaldefiance/ecies-lib/voting/threshold';

const verifier = new TallyVerifier<Uint8Array>();

// Verify any published tally
const result = verifier.verify(
  publishedTally,
  encryptedTally,
  keyPair.verificationKeys,
  keyPair.publicKey,
  registeredGuardianIndices
);

if (!result.valid) {
  console.error('Verification failed:', result.error);
  console.error('Failed checks:', result.checks);
}
```

## Node.js Migration

For Node.js applications, import from `@digitaldefiance/node-ecies-lib` instead. The API is identical but uses Buffer-based types for better performance:

```typescript
import {
  ThresholdKeyGenerator,
  GuardianRegistry,
  ThresholdPollFactory,
  // ... all the same exports, with Buffer support
} from '@digitaldefiance/node-ecies-lib';
```

## Gradual Migration Strategy

You don't need to migrate everything at once. Here's a recommended approach:

1. **Phase 1**: Deploy threshold voting for new polls while keeping existing polls on single-authority.
2. **Phase 2**: Set up Guardian infrastructure and test with non-critical votes.
3. **Phase 3**: Enable interval decryption for real-time tallies.
4. **Phase 4**: Migrate hierarchical aggregation to threshold-aware aggregators.
5. **Phase 5**: Add third-party verification and public tally feeds.

The `ThresholdPollFactory.createStandardPoll()` method ensures you can run both types of polls from the same codebase during the transition.
