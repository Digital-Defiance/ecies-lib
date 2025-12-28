# Secure Voting System

Government-grade voting system built on ecies-lib with comprehensive cryptographic security and exhaustive testing.

## Features

### ✅ Fully Secure Methods (Single-round, Privacy-preserving)
- **Plurality** - First-past-the-post (most common)
- **Approval** - Vote for multiple candidates
- **Weighted** - Stakeholder voting with configurable limits
- **Borda Count** - Ranked voting with point allocation
- **Score Voting** - Rate candidates 0-10
- **Yes/No** - Referendums and ballot measures
- **Yes/No/Abstain** - With abstention option
- **Supermajority** - Requires 2/3 or 3/4 threshold

### ⚠️ Multi-Round Methods (Requires intermediate decryption)
- **Ranked Choice (IRV)** - Instant runoff with elimination
- **Two-Round** - Top 2 runoff election
- **STAR** - Score Then Automatic Runoff
- **STV** - Single Transferable Vote (proportional representation)

### ❌ Insecure Methods (No privacy - for special cases only)
- **Quadratic** - Quadratic voting (requires non-homomorphic operations)
- **Consensus** - Requires 95%+ agreement
- **Consent-Based** - Sociocracy-style (no strong objections)

### 🎨 Interactive Demos
All voting methods have interactive React demos in the showcase app:
- Live encryption/decryption visualization
- Real-time vote tallying
- Event logging and audit trail display
- Receipt verification
- Multi-round elimination visualization (for IRV, STAR, STV)

### Core Security Features
- ✅ **Homomorphic Encryption** - Votes remain encrypted until tally using Paillier cryptosystem
- ✅ **Verifiable Receipts** - Cryptographically signed confirmations with ECDSA
- ✅ **Public Bulletin Board** - Transparent, append-only vote publication with Merkle tree integrity
- ✅ **Immutable Audit Log** - Cryptographic hash chain for all operations
- ✅ **Event Logger** - Comprehensive event tracking with microsecond timestamps and sequence numbers
- ✅ **Role Separation** - Poll aggregator cannot decrypt votes (separate PollTallier)
- ✅ **Double-Vote Prevention** - Each member votes once per poll
- ✅ **Attack Resistance** - Tested against manipulation attempts
- ✅ **Browser Compatible** - Works in Node.js and modern browsers via Web Crypto API
- ✅ **Government-Grade Testing** - 900+ test cases covering all methods and edge cases

## Architecture

### Role Separation

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Poll (Vote Aggregator)                                     │
│  ├─ Paillier PUBLIC key only  ← encrypts & aggregates      │
│  ├─ Authority's EC keys       ← signs receipts              │
│  └─ Cannot decrypt votes                                    │
│                                                              │
│  PollTallier (Separate Entity)                              │
│  ├─ Paillier PRIVATE key      ← decrypts ONLY after close  │
│  └─ Computes results                                        │
│                                                              │
│  Voter (Member from ecies-lib)                              │
│  ├─ EC keypair                ← verifies receipts           │
│  └─ Voting public key         ← encrypts votes              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Poll** (`poll-core.ts`) - Aggregates encrypted votes, issues receipts, enforces rules
2. **PollTallier** (`tallier.ts`) - Holds private key, decrypts results after close
3. **VoteEncoder** (`encoder.ts`) - Encrypts votes using Paillier homomorphic encryption
4. **PollFactory** (`factory.ts`) - Convenient poll creation with method-specific configurations
5. **ImmutableAuditLog** (`audit.ts`) - Cryptographic hash chain for audit trail (Requirement 1.1)
6. **PublicBulletinBoard** (`bulletin-board.ts`) - Transparent, append-only vote publication (Requirement 1.2)
7. **PollEventLogger** (`event-logger.ts`) - Comprehensive event tracking (Requirement 1.3)
8. **VotingSecurityValidator** (`security.ts`) - Security level validation and enforcement

## Voting Methods

### Security Levels

All methods are classified by security level:

```typescript
import { VotingSecurityValidator, SecurityLevel } from './voting';

// Check security level
const level = VotingSecurityValidator.getSecurityLevel(VotingMethod.Plurality);
// Returns: SecurityLevel.FullyHomomorphic

// Validate before use
VotingSecurityValidator.validate(VotingMethod.Quadratic); // Throws error
VotingSecurityValidator.validate(VotingMethod.Quadratic, { allowInsecure: true }); // OK
```

### Method Comparison

| Method | Security | Use Case | Multi-Winner |
|--------|----------|----------|-------------|
| Plurality | ✅ Full | General elections | No |
| Approval | ✅ Full | Committee selection | No |
| Weighted | ✅ Full | Shareholder voting | No |
| Borda | ✅ Full | Ranked preferences | No |
| Score | ✅ Full | Rating candidates | No |
| YesNo | ✅ Full | Referendums | No |
| Supermajority | ✅ Full | Constitutional changes | No |
| RankedChoice | ⚠️ Multi | Modern elections | No |
| TwoRound | ⚠️ Multi | Presidential elections | No |
| STAR | ⚠️ Multi | Hybrid score/runoff | No |
| STV | ⚠️ Multi | Proportional representation | Yes |
| Quadratic | ❌ None | Budget allocation | No |
| Consensus | ❌ None | Small groups | No |
| ConsentBased | ❌ None | Cooperatives | No |

## Government Requirements (EARS Specification)

### 1.1 Immutable Audit Log ✅

```typescript
import { ImmutableAuditLog } from './voting';

const auditLog = new ImmutableAuditLog(authority);

// Record poll creation
auditLog.recordPollCreated(pollId, { choices: ['A', 'B'] });

// Record vote cast
auditLog.recordVoteCast(pollId, voterIdHash);

// Record poll closure
auditLog.recordPollClosed(pollId, { finalTally: [100n, 200n] });

// Verify chain integrity
const isValid = auditLog.verifyChain();
```

**Features:**
- Cryptographically signed entries
- Hash-chained for immutability
- Microsecond-precision timestamps
- Verifiable chain of custody

### 1.2 Public Bulletin Board ✅

```typescript
import { PublicBulletinBoard } from './voting';

const board = new PublicBulletinBoard(authority);

// Publish encrypted vote
const entry = board.publishVote(pollId, encryptedVote, voterIdHash);

// Publish tally with proof
const proof = board.publishTally(
  pollId,
  tallies,
  choices,
  encryptedVotes
);

// Any observer can download and verify
const allEntries = board.getAllEntries();
const isValid = board.verifyEntry(entry);
const isTallyValid = board.verifyTallyProof(proof);

// Export for archival
const archive = board.export();
```

**Features:**
- Append-only publication
- Merkle tree for structural integrity
- Zero-knowledge proofs of correct decryption
- Public verification by any observer
- Complete export for archival

### 1.3 Event Logging ✅

```typescript
import { PollEventLogger, EventType } from './voting';

const eventLogger = new PollEventLogger();

// Log poll creation
eventLogger.logPollCreated(pollId, creatorId, {
  method: 'plurality',
  choices: ['Alice', 'Bob', 'Charlie'],
});

// Log vote cast
eventLogger.logVoteCast(pollId, voterToken, {
  ipAddress: '192.168.1.1',
});

// Log poll closure
eventLogger.logPollClosed(pollId, tallyHash, {
  totalVotes: 100,
});

// Query events
const allEvents = eventLogger.getEvents();
const pollEvents = eventLogger.getEventsForPoll(pollId);
const voteEvents = eventLogger.getEventsByType(EventType.VoteCast);

// Verify sequence integrity
const isValid = eventLogger.verifySequence();

// Export for archival
const archive = eventLogger.export();
```

**Features:**
- Microsecond-precision timestamps
- Sequential event numbering
- Comprehensive event types (creation, voting, closure, verification, tally, audit)
- Anonymized voter tokens
- Poll configuration tracking
- Sequence integrity verification

## Usage

### Prerequisites

```typescript
import { Member, MemberType, EmailString } from '@digitaldefiance/ecies-lib';
import {
  PollFactory,
  VoteEncoder,
  PollTallier,
  VotingMethod,
  VotingSecurityValidator
} from '@digitaldefiance/ecies-lib/voting';

// Create authority with voting keys
const { member: authority, mnemonic } = Member.newMember(
  MemberType.System,
  'Election Authority',
  new EmailString('authority@example.com')
);
await authority.deriveVotingKeys();

// Create voters
const voter1 = Member.newMember(
  MemberType.Individual,
  'Alice',
  new EmailString('alice@example.com')
).member;
await voter1.deriveVotingKeys();
```

### Quick Start

```typescript
import { Member } from '@digitaldefiance/ecies-lib';
import { PollFactory, VoteEncoder, PollTallier } from './voting';

// 1. Create authority
const { member: authority, mnemonic } = Member.newMember(
  MemberType.System,
  'Election Authority',
  new EmailString('authority@example.com')
);
await authority.deriveVotingKeys();

// 2. Create poll
const poll = PollFactory.createPlurality(
  ['Alice', 'Bob', 'Charlie'],
  authority
);

// 3. Create voters and cast votes
const voter = Member.newMember(/* ... */).member;
await voter.deriveVotingKeys();

const encoder = new VoteEncoder(authority.votingPublicKey!);
const vote = encoder.encodePlurality(0, 3); // Vote for Alice
const receipt = poll.vote(voter, vote);

// 4. Close and tally
poll.close();
const tallier = new PollTallier(
  authority,
  authority.votingPrivateKey!,
  authority.votingPublicKey!
);
const results = tallier.tally(poll);

console.log('Winner:', results.choices[results.winner!]);
```

```typescript
import { Member } from '@digitaldefiance/ecies-lib';
import { PollFactory, VoteEncoder, PollTallier } from './voting';

// Create authority with voting keys
const authority = Member.newMember(/* ... */);
await authority.deriveVotingKeys();

// Create poll
const poll = PollFactory.createPlurality(
  ['Alice', 'Bob', 'Charlie'],
  authority
);

// Create voters
const voter1 = Member.newMember(/* ... */);
await voter1.deriveVotingKeys();

// Cast vote
const encoder = new VoteEncoder(authority.votingPublicKey!);
const vote = encoder.encodePlurality(0, 3); // Vote for Alice
const receipt = poll.vote(voter1, vote);

// Verify receipt
const isValid = poll.verifyReceipt(voter1, receipt);

// Close and tally
poll.close();
const tallier = new PollTallier(
  authority,
  authority.votingPrivateKey!,
  authority.votingPublicKey!
);
const results = tallier.tally(poll);

console.log('Winner:', results.choices[results.winner!]);
console.log('Tallies:', results.tallies);
```

### Ranked Choice Voting (True IRV)

```typescript
const poll = PollFactory.createRankedChoice(
  ['Alice', 'Bob', 'Charlie', 'Diana'],
  authority
);

const encoder = new VoteEncoder(authority.votingPublicKey!);

// Voter ranks: Alice > Bob > Charlie
const vote = encoder.encodeRankedChoice([0, 1, 2], 4);
poll.vote(voter, vote);

// ... more votes ...

poll.close();
const results = tallier.tally(poll);

// Results include elimination rounds
console.log('Winner:', results.choices[results.winner!]);
console.log('Rounds:', results.rounds);
console.log('Eliminated:', results.eliminated);
```

### Weighted Voting

```typescript
const poll = PollFactory.createWeighted(
  ['Proposal A', 'Proposal B'],
  authority,
  1000n // Maximum weight
);

const encoder = new VoteEncoder(authority.votingPublicKey!);

// Large stakeholder votes with weight 500
const vote = encoder.encodeWeighted(0, 500n, 2);
poll.vote(whale, vote);
```

### Borda Count

```typescript
const poll = PollFactory.createBorda(
  ['Option A', 'Option B', 'Option C'],
  authority
);

const encoder = new VoteEncoder(authority.votingPublicKey!);

// Rank all options: A > B > C
// A gets 3 points, B gets 2, C gets 1
const vote = encoder.encodeBorda([0, 1, 2], 3);
poll.vote(voter, vote);
```

### Score Voting

```typescript
const poll = PollFactory.createScore(
  ['Candidate A', 'Candidate B', 'Candidate C'],
  authority
);

const encoder = new VoteEncoder(authority.votingPublicKey!);

// Rate candidates 0-10
const vote = encoder.encode(
  VotingMethod.Score,
  { choiceIndex: 0, score: 8 },  // Give Candidate A a score of 8
  3
);
poll.vote(voter, vote);
```

### Yes/No Referendum

```typescript
const poll = PollFactory.createYesNo(
  ['Approve Budget Increase'],
  authority
);

const encoder = new VoteEncoder(authority.votingPublicKey!);
const vote = encoder.encodeYesNo(true);  // Vote yes
poll.vote(voter, vote);
```

### Supermajority Voting

```typescript
const poll = PollFactory.createSupermajority(
  ['Constitutional Amendment'],
  authority,
  { numerator: 2, denominator: 3 }  // Requires 2/3 majority
);

const encoder = new VoteEncoder(authority.votingPublicKey!);
const vote = encoder.encodePlurality(0, 1);
poll.vote(voter, vote);

poll.close();
const results = tallier.tally(poll);
// results.winner is only set if 2/3 threshold is met
```

### Security Validation

```typescript
// Check security level before creating poll
const level = VotingSecurityValidator.getSecurityLevel(VotingMethod.Quadratic);
console.log(level); // SecurityLevel.Insecure

// Validate method (throws if insecure)
try {
  VotingSecurityValidator.validate(VotingMethod.Quadratic);
} catch (error) {
  console.error('Method is not secure!');
}

// Allow insecure methods explicitly
VotingSecurityValidator.validate(VotingMethod.Quadratic, { allowInsecure: true });

// Require fully secure methods only
VotingSecurityValidator.validate(VotingMethod.RankedChoice, { requireFullySecure: true });
// Throws: RankedChoice requires intermediate decryption
```

### Using All Government Requirements Together

```typescript
import {
  PollFactory,
  VoteEncoder,
  PollTallier,
  ImmutableAuditLog,
  PublicBulletinBoard,
  PollEventLogger
} from '@digitaldefiance/ecies-lib/voting';

// 1. Create all tracking systems
const auditLog = new ImmutableAuditLog(authority);
const bulletinBoard = new PublicBulletinBoard(authority);
const eventLogger = new PollEventLogger();

// 2. Create poll
const poll = PollFactory.createPlurality(['Alice', 'Bob', 'Charlie'], authority);

// 3. Log poll creation (Requirement 1.3)
eventLogger.logPollCreated(poll.id, authority.id, {
  method: 'plurality',
  choices: ['Alice', 'Bob', 'Charlie']
});

// 4. Cast votes
const encoder = new VoteEncoder(authority.votingPublicKey!);
const vote = encoder.encodePlurality(0, 3);
const receipt = poll.vote(voter1, vote);

// 5. Publish to bulletin board (Requirement 1.2)
const voterIdHash = crypto.getRandomValues(new Uint8Array(32));
bulletinBoard.publishVote(poll.id, vote.encrypted, voterIdHash);

// 6. Log vote cast (Requirement 1.3)
eventLogger.logVoteCast(poll.id, voterIdHash, {
  timestamp: Date.now()
});

// 7. Close poll
poll.close();

// 8. Tally votes
const tallier = new PollTallier(
  authority,
  authority.votingPrivateKey!,
  authority.votingPublicKey!
);
const results = tallier.tally(poll);

// 9. Publish tally with proof (Requirement 1.2)
const encryptedVotes = Array.from(poll.getEncryptedVotes().values());
const tallyProof = bulletinBoard.publishTally(
  poll.id,
  results.tallies,
  results.choices,
  encryptedVotes
);

// 10. Log poll closure (Requirement 1.3)
const tallyHash = new Uint8Array(
  await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(results.tallies.join(','))
  )
);
eventLogger.logPollClosed(poll.id, tallyHash, {
  totalVotes: results.voterCount,
  winner: results.choices[results.winner!]
});

// 11. Verify everything
console.log('Audit log valid:', poll.auditLog.verifyChain());
console.log('Bulletin board valid:', bulletinBoard.verifyMerkleTree());
console.log('Event sequence valid:', eventLogger.verifySequence());
console.log('Tally proof valid:', bulletinBoard.verifyTallyProof(tallyProof));

// 12. Export for archival
const auditExport = poll.auditLog.getEntries();
const bulletinExport = bulletinBoard.export();
const eventExport = eventLogger.export();
```

### What's Protected

- ✅ **Vote Privacy**: Votes remain encrypted until poll closes
- ✅ **Vote Integrity**: Homomorphic encryption prevents tampering
- ✅ **Receipt Verification**: Cryptographic proof of vote acceptance
- ✅ **Double-Vote Prevention**: Each member can only vote once
- ✅ **Role Separation**: Aggregator cannot decrypt individual votes

### What's NOT Protected (By Design)

- ❌ **Coercion Resistance**: Receipts can prove how you voted
- ❌ **Distributed Trust**: Single authority holds private key
- ❌ **Anonymity**: Voter IDs are tracked (for duplicate prevention)

### Threat Model

**Protected Against:**
- Vote tampering by aggregator
- Premature result disclosure
- Unauthorized vote decryption
- Double voting

**NOT Protected Against:**
- Coercion (voter can prove their vote)
- Authority collusion (single point of trust)
- Network-level attacks (out of scope)

## API Reference

### Quick Reference

| Export | Type | Purpose |
|--------|------|----------|
| `Poll` | Class | Core poll with vote aggregation |
| `PollTallier` | Class | Decrypts and tallies votes |
| `VoteEncoder` | Class | Encrypts votes by method |
| `PollFactory` | Class | Convenient poll creation |
| `VotingSecurityValidator` | Class | Security level validation |
| `ImmutableAuditLog` | Class | Hash-chained audit trail |
| `PublicBulletinBoard` | Class | Append-only vote publication |
| `PollEventLogger` | Class | Event tracking with timestamps |
| `VotingMethod` | Enum | All 17 voting methods |
| `SecurityLevel` | Enum | Security classifications |
| `EventType` | Enum | Event types for logging |
| `AuditEventType` | Enum | Audit event types |
| `VoteReceipt` | Interface | Cryptographic vote receipt |
| `PollResults` | Interface | Tally results with winner(s) |
| `EncryptedVote` | Interface | Encrypted vote structure |
| `SupermajorityConfig` | Interface | Threshold configuration |
| `PollConfiguration` | Interface | Poll setup parameters |
| `VOTING_SECURITY` | Constant | Security level mapping |

### PollFactory

```typescript
class PollFactory {
  // Generic factory method
  static create(
    choices: string[],
    method: VotingMethod,
    authority: IMember,
    options?: { maxWeight?: bigint }
  ): Poll
  
  // Convenience methods for each voting type
  static createPlurality(choices: string[], authority: IMember): Poll
  static createApproval(choices: string[], authority: IMember): Poll
  static createWeighted(choices: string[], authority: IMember, maxWeight: bigint): Poll
  static createBorda(choices: string[], authority: IMember): Poll
  static createRankedChoice(choices: string[], authority: IMember): Poll
  static createScore(choices: string[], authority: IMember): Poll
  static createYesNo(choices: string[], authority: IMember): Poll
  static createYesNoAbstain(choices: string[], authority: IMember): Poll
  static createSupermajority(choices: string[], authority: IMember, config: SupermajorityConfig): Poll
  static createTwoRound(choices: string[], authority: IMember): Poll
  static createSTAR(choices: string[], authority: IMember): Poll
  static createSTV(choices: string[], authority: IMember): Poll
  static createQuadratic(choices: string[], authority: IMember, options: { allowInsecure: true }): Poll
  static createConsensus(choices: string[], authority: IMember, options: { allowInsecure: true }): Poll
  static createConsentBased(choices: string[], authority: IMember, options: { allowInsecure: true }): Poll
}
```

### Poll

```typescript
class Poll {
  // Read-only properties
  readonly id: Uint8Array
  readonly choices: ReadonlyArray<string>
  readonly method: VotingMethod
  readonly isClosed: boolean
  readonly voterCount: number
  readonly createdAt: number
  readonly closedAt: number | undefined
  readonly auditLog: AuditLog
  
  // Core methods
  vote(voter: IMember, vote: EncryptedVote): VoteReceipt
  verifyReceipt(voter: IMember, receipt: VoteReceipt): boolean
  close(): void
  getEncryptedVotes(): ReadonlyMap<string, readonly bigint[]>
}
```

### VoteEncoder

```typescript
class VoteEncoder {
  constructor(votingPublicKey: PublicKey)
  
  // Method-specific encoding
  encodePlurality(choiceIndex: number, choiceCount: number): EncryptedVote
  encodeApproval(choices: number[], choiceCount: number): EncryptedVote
  encodeWeighted(choiceIndex: number, weight: bigint, choiceCount: number): EncryptedVote
  encodeBorda(rankings: number[], choiceCount: number): EncryptedVote
  encodeRankedChoice(rankings: number[], choiceCount: number): EncryptedVote
  encodeScore(choiceIndex: number, score: number, choiceCount: number): EncryptedVote
  encodeYesNo(choice: boolean): EncryptedVote
  encodeYesNoAbstain(choice: 'yes' | 'no' | 'abstain'): EncryptedVote
  
  // Generic encoding (auto-detects method)
  encode(
    method: VotingMethod,
    data: {
      choiceIndex?: number;
      choices?: number[];
      rankings?: number[];
      weight?: bigint;
      score?: number;
    },
    choiceCount: number
  ): EncryptedVote
}
```

### PollTallier

```typescript
class PollTallier {
  constructor(
    authority: IPollAuthority,
    votingPrivateKey: PrivateKey,
    votingPublicKey: PublicKey
  )
  
  tally(poll: Poll): PollResults
}
```

### VotingSecurityValidator

```typescript
class VotingSecurityValidator {
  // Check if method is fully secure (no intermediate decryption)
  static isFullySecure(method: VotingMethod): boolean
  
  // Check if method requires multiple rounds
  static requiresMultipleRounds(method: VotingMethod): boolean
  
  // Get security level for method
  static getSecurityLevel(method: VotingMethod): SecurityLevel
  
  // Validate method is supported and secure
  static validate(
    method: VotingMethod,
    options?: {
      requireFullySecure?: boolean;
      allowInsecure?: boolean;
    }
  ): void
}

enum SecurityLevel {
  FullyHomomorphic = 'fully-homomorphic',  // No intermediate decryption
  MultiRound = 'multi-round',              // Requires intermediate decryption
  Insecure = 'insecure'                    // Cannot be made secure with Paillier
}

// Security level mapping for all methods
const VOTING_SECURITY: Record<VotingMethod, SecurityLevel>
```

## Testing

The system includes 900+ government-grade test cases across multiple test files:

```bash
# Run all voting tests
npm test voting.spec.ts          # Core voting functionality
npm test voting-stress.spec.ts   # Stress tests with large datasets
npm test poll-core.spec.ts       # Poll core functionality
npm test poll-audit.spec.ts      # Audit log integration
npm test factory.spec.ts         # Poll factory
npm test encoder.spec.ts         # Vote encoding
npm test security.spec.ts        # Security validation
npm test audit.spec.ts           # Audit log
npm test bulletin-board.spec.ts  # Bulletin board
npm test event-logger.spec.ts    # Event logger
```

### Test Coverage

- ✅ All 17 voting methods (Plurality, Approval, Weighted, Borda, Score, YesNo, YesNoAbstain, Supermajority, RankedChoice, TwoRound, STAR, STV, Quadratic, Consensus, ConsentBased)
- ✅ Security validation (fully homomorphic, multi-round, insecure classifications)
- ✅ Attack resistance (vote manipulation, double voting, unauthorized decryption)
- ✅ Cryptographic correctness (homomorphic addition, receipt signatures)
- ✅ Edge cases (ties, single voter, unanimous votes, empty rankings)
- ✅ Large scale (1000 voters, 100 choices)
- ✅ Boundary conditions (max weights, zero votes, partial rankings)
- ✅ Determinism (same votes = same results)
- ✅ Receipt verification (signature validation, tampering detection)
- ✅ Multi-round elimination (IRV, STAR, STV, Two-Round)
- ✅ Government requirements (audit log, bulletin board, event logger)
- ✅ Stress testing (concurrent operations, memory limits)

### Example Test

```typescript
test('should prevent double voting', () => {
  const poll = PollFactory.createPlurality(['A', 'B'], authority);
  const encoder = new VoteEncoder(authority.votingPublicKey!);
  
  poll.vote(voter, encoder.encodePlurality(0, 2));
  
  expect(() => {
    poll.vote(voter, encoder.encodePlurality(1, 2));
  }).toThrow('Already voted');
});
```

## Design Decisions

### Why Separate Poll and Tallier?

**Security**: The entity aggregating votes should not be able to decrypt them until the poll closes. This prevents:
- Premature result disclosure
- Vote manipulation based on current results
- Coercion based on real-time tallies

### Why Not Full Anonymity?

**Practical Governance**: Real-world governance requires:
- Duplicate vote prevention (needs voter tracking)
- Verifiable receipts (needs voter identification)
- Audit trails (needs accountability)

For anonymous voting, use mix-nets or blind signatures (future enhancement).

### Why Homomorphic Encryption?

**Privacy + Verifiability**: Paillier encryption allows:
- Vote aggregation without decryption
- Mathematical proof of correct tallying
- Privacy-preserving vote counting

### Ranked Choice Algorithm

True **Instant Runoff Voting (IRV)**:
1. Count first-choice votes
2. If no majority, eliminate candidate with fewest votes
3. Redistribute eliminated candidate's votes to next choice
4. Repeat until majority winner

This is NOT Borda count (which is also supported separately).

## Browser Compatibility

All code uses standard Web Crypto API:
- `crypto.getRandomValues()` for random generation
- `crypto.subtle.digest()` for hashing (where available)
- `Uint8Array` for binary data
- No Node.js-specific APIs

Works in:
- ✅ Modern browsers (Chrome 60+, Firefox 57+, Safari 11+, Edge 79+)
- ✅ Node.js 18+
- ✅ React Native (with crypto polyfill)
- ✅ Web Workers and Service Workers

## Interactive Showcase

The `showcase/` directory contains a complete React application demonstrating all voting methods:

### Running the Showcase

```bash
cd packages/digitaldefiance-ecies-lib/showcase
npm install
npm start
```

### Available Demos

Each voting method has an interactive demo with:
- **Real-time encryption**: Watch votes being encrypted with Paillier
- **Live tallying**: See homomorphic addition in action
- **Event logging**: View comprehensive event tracking (Requirement 1.3)
- **Receipt verification**: Verify cryptographic signatures
- **Multi-round visualization**: See elimination rounds for IRV, STAR, STV
- **Themed scenarios**: Fun, relatable voting scenarios (tech stack selection, pizza toppings, etc.)

**Demo Components:**
- `PluralityDemo.tsx` - Simple majority voting
- `ApprovalDemo.tsx` - Multi-choice approval
- `WeightedDemo.tsx` - Stakeholder voting
- `BordaDemo.tsx` - Ranked with points
- `ScoreDemo.tsx` - Rate candidates 0-10
- `RankedChoiceDemo.tsx` - Instant runoff (IRV)
- `TwoRoundDemo.tsx` - Top 2 runoff
- `STARDemo.tsx` - Score then runoff
- `STVDemo.tsx` - Proportional representation
- `YesNoDemo.tsx` - Binary referendum
- `YesNoAbstainDemo.tsx` - With abstention
- `SupermajorityDemo.tsx` - 2/3 or 3/4 threshold
- `QuadraticDemo.tsx` - Quadratic voting (insecure)
- `ConsensusDemo.tsx` - 95%+ agreement
- `ConsentBasedDemo.tsx` - Sociocracy style

### Demo Features

- **Cryptographic visualization**: See encrypted votes as bigints
- **Step-by-step tallying**: Watch decryption and counting
- **Event log display**: Real-time event tracking with timestamps
- **Audit trail**: View hash chains and signatures
- **Receipt verification**: Validate vote receipts
- **Educational content**: Learn about each voting method

## Future Enhancements

### Cryptographic Improvements
- [ ] Threshold decryption (distributed tallier with multiple key shares)
- [ ] Zero-knowledge proofs (vote validity without revealing content)
- [ ] Mix-net integration (anonymity through cryptographic shuffling)
- [ ] Blind signatures (receipt-free voting to prevent coercion)
- [ ] Verifiable shuffle proofs (prove correct mixing without revealing permutation)

### Voting Features
- [ ] Liquid democracy (vote delegation with transitive trust)
- [ ] Multi-authority polls (distributed trust across multiple entities)
- [ ] Vote delegation (proxy voting with revocation)
- [ ] Time-locked voting (scheduled vote revelation)
- [ ] Conditional voting (votes dependent on other outcomes)
- [ ] Quadratic funding (capital-constrained quadratic voting)

### Infrastructure
- [ ] Distributed bulletin board (blockchain or IPFS integration)
- [ ] Hardware security module (HSM) integration for key storage
- [ ] Multi-signature authority (require multiple authorities to tally)
- [ ] Real-time vote streaming (WebSocket support for live updates)
- [ ] Mobile SDK (React Native support with biometric authentication)

## Production Deployment

### Security Checklist

- ✅ Use production-grade key sizes (3072-bit minimum)
- ✅ Secure key storage (HSM or encrypted storage)
- ✅ Audit logging for all poll operations
- ✅ Rate limiting on vote submission
- ✅ Network security (TLS, authentication)
- ✅ Regular security audits
- ✅ Incident response plan
- ✅ Backup and recovery procedures

### Performance Considerations

- **Key Generation**: Use 3072-bit keys (slower but secure)
- **Vote Encryption**: ~10ms per vote with 3072-bit keys
- **Vote Tallying**: ~1ms per vote for decryption
- **Large Polls**: Consider batching for 10,000+ voters
- **Browser Limits**: Test with target browser's crypto performance

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Browser)                                          │
│  ├─ VoteEncoder                                             │
│  └─ Receipt verification                                    │
│                                                              │
│  Backend API                                                 │
│  ├─ Poll management                                         │
│  ├─ Vote aggregation                                        │
│  └─ Member authentication                                   │
│                                                              │
│  Secure Tallier Service (Isolated)                          │
│  ├─ Private key in HSM                                      │
│  ├─ Only accessible after poll close                        │
│  └─ Audit logging                                           │
│                                                              │
│  Database                                                    │
│  ├─ Encrypted votes                                         │
│  ├─ Receipts                                                │
│  └─ Audit logs                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## License

MIT
