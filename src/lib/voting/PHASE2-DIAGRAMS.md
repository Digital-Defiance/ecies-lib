# Phase 2 Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GOVERNMENT VOTING SYSTEM - PHASE 2                        │
│                    Voter Eligibility & Registration                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1 (Existing)                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │    Poll      │  │ VoteEncoder  │  │ PollTallier  │  │ BulletinBoard│   │
│  │              │  │              │  │              │  │              │   │
│  │ - Aggregate  │  │ - Encrypt    │  │ - Decrypt    │  │ - Publish    │   │
│  │ - Receipts   │  │ - Paillier   │  │ - Tally      │  │ - Verify     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2 (New)                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │VoterRegistry │  │ Eligibility  │  │ Credential   │  │  Revocation  │   │
│  │              │  │  Verifier    │  │   Issuer     │  │   Manager    │   │
│  │ - Register   │  │ - Verify     │  │ - Issue      │  │ - Revoke     │   │
│  │ - Update     │  │ - Rules      │  │ - Verify     │  │ - CRL/OCSP   │   │
│  │ - Query      │  │ - Batch      │  │ - Types      │  │ - Audit      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      VoterRollManager                                 │  │
│  │  - Import (CSV, JSON, XML, EML)                                      │  │
│  │  - Export                                                             │  │
│  │  - Duplicate Detection                                                │  │
│  │  - Version Control                                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION TO VOTE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  Voter  │
    │ (Member)│
    └────┬────┘
         │
         │ 1. Register
         ↓
    ┌─────────────────┐
    │ VoterRegistry   │
    │                 │
    │ - Create record │
    │ - Sign with     │
    │   authority     │
    │ - Store         │
    │ - Audit log     │
    └────┬────────────┘
         │
         │ 2. Issue Credential
         ↓
    ┌─────────────────┐
    │ CredentialIssuer│
    │                 │
    │ - Generate ID   │
    │ - Create token  │
    │ - Sign          │
    │ - Store         │
    └────┬────────────┘
         │
         │ 3. Attempt to Vote
         ↓
    ┌─────────────────┐
    │ Eligibility     │
    │ Verifier        │
    │                 │
    │ - Check age     │
    │ - Check juris.  │
    │ - Custom rules  │
    │ - Sign result   │
    └────┬────────────┘
         │
         │ 4. Check Revocation
         ↓
    ┌─────────────────┐
    │ Revocation      │
    │ Manager         │
    │                 │
    │ - Check CRL     │
    │ - OCSP query    │
    │ - Return status │
    └────┬────────────┘
         │
         │ 5. Cast Vote (if eligible & not revoked)
         ↓
    ┌─────────────────┐
    │     Poll        │
    │   (Phase 1)     │
    │                 │
    │ - Encrypt vote  │
    │ - Store         │
    │ - Issue receipt │
    └─────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                          │
└─────────────────────────────────────────────────────────────────────────────┘

External System          VoterRollManager         VoterRegistry
     │                         │                        │
     │  Voter Roll (CSV)       │                        │
     ├────────────────────────>│                        │
     │                         │                        │
     │                         │  Parse & Validate      │
     │                         │                        │
     │                         │  Register Voters       │
     │                         ├───────────────────────>│
     │                         │                        │
     │                         │                        │  Store with
     │                         │                        │  signatures
     │                         │                        │
     │                         │  Detect Duplicates     │
     │                         │<───────────────────────┤
     │                         │                        │
     │  Import Result          │                        │
     │<────────────────────────┤                        │
     │                         │                        │
                               │                        │
                               │                        │
                          CredentialIssuer              │
                               │                        │
                               │  Get Registration      │
                               │<───────────────────────┤
                               │                        │
                               │  Issue Credential      │
                               │                        │
                               │  Store Credential      │
                               │                        │
                               ↓                        │
                          RevocationManager             │
                               │                        │
                               │  Revoke Credential     │
                               │                        │
                               │  Update CRL            │
                               │                        │
                               │  Publish to            │
                               │  Bulletin Board        │
                               ↓                        │
                          BulletinBoard                 │
                          (Phase 1)                     │
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 1: Cryptographic Signatures                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  All records signed by authority:                                       │ │
│  │  - VoterRegistration.signature                                          │ │
│  │  - VoterCredential.signature                                            │ │
│  │  - CredentialRevocation.signature                                       │ │
│  │  - EligibilityCheckResult.signature                                     │ │
│  │  - CertificateRevocationList.signature                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 2: Hash Chains                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Version control via hash chains:                                       │ │
│  │  - RegistrationMetadata.previousVersionHash                             │ │
│  │  - VoterRollVersion linked by hash                                      │ │
│  │  - ImmutableAuditLog hash chain                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 3: Nonces & Timestamps                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Replay attack prevention:                                               │ │
│  │  - BearerTokenCredential.nonce                                          │ │
│  │  - VoterCredential.issuedAt                                             │ │
│  │  - VoterCredential.expiresAt                                            │ │
│  │  - EligibilityCheckResult.timestamp                                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 4: Audit Logging                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Immutable audit trail:                                                  │ │
│  │  - All registration operations logged                                    │ │
│  │  - All credential operations logged                                      │ │
│  │  - All revocation operations logged                                      │ │
│  │  - All eligibility checks logged                                         │ │
│  │  - Chain verification available                                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 5: Access Control                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Authority-based operations:                                             │ │
│  │  - Only authority can register voters                                    │ │
│  │  - Only authority can issue credentials                                  │ │
│  │  - Only authority can revoke credentials                                 │ │
│  │  - Only authority can update registrations                               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Credential Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CREDENTIAL LIFECYCLE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   ISSUED     │  ← CredentialIssuer.issueCredential()
    │              │
    │ - Active     │
    │ - Signed     │
    │ - Timestamped│
    └──────┬───────┘
           │
           │ Time passes
           │
           ↓
    ┌──────────────┐
    │   ACTIVE     │  ← Used for voting
    │              │
    │ - Verified   │
    │ - Not expired│
    │ - Not revoked│
    └──────┬───────┘
           │
           │ Multiple paths:
           │
    ┌──────┴───────┬──────────────┬──────────────┐
    │              │              │              │
    ↓              ↓              ↓              ↓
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│EXPIRED │   │REVOKED │   │SUSPENDED│   │ USED   │
│        │   │        │   │        │   │        │
│- Time  │   │- Admin │   │- Temp  │   │- Single│
│  limit │   │- Fraud │   │  issue │   │  use   │
│        │   │- Inelig│   │        │   │  token │
└────────┘   └────────┘   └────────┘   └────────┘
    │              │              │              │
    │              │              │              │
    └──────────────┴──────────────┴──────────────┘
                   │
                   ↓
            ┌──────────────┐
            │   INVALID    │
            │              │
            │ - Cannot vote│
            │ - In CRL     │
            │ - Logged     │
            └──────────────┘
```

## Duplicate Detection Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DUPLICATE DETECTION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    Voter Roll Import
           │
           ↓
    ┌──────────────────┐
    │  Parse Entries   │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Exact Match      │  ← Compare: memberId, externalId
    │ Detection        │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Fuzzy Name       │  ← Levenshtein distance on names
    │ Detection        │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Date of Birth    │  ← Compare DOB if available
    │ Detection        │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Address          │  ← Compare addresses if available
    │ Detection        │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Combined         │  ← Weight multiple factors
    │ Strategy         │    Calculate confidence score
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Group Duplicates │  ← Create DuplicateGroup[]
    │                  │    with confidence scores
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Manual Review    │  ← High confidence: auto-merge
    │ or Auto-Merge    │    Low confidence: manual review
    └──────────────────┘
```

## Version Control Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VOTER ROLL VERSION CONTROL                                │
└─────────────────────────────────────────────────────────────────────────────┘

    Version 1 (Initial Import)
    ┌─────────────────────────────────┐
    │ VoterRollVersion                │
    │ - version: 1                    │
    │ - timestamp: T1                 │
    │ - voterCount: 1000              │
    │ - changeType: 'import'          │
    │ - authorityId: Authority-1      │
    │ - hash: H1                      │
    └─────────────┬───────────────────┘
                  │
                  │ previousHash: H1
                  ↓
    Version 2 (Update)
    ┌─────────────────────────────────┐
    │ VoterRollVersion                │
    │ - version: 2                    │
    │ - timestamp: T2                 │
    │ - voterCount: 1050              │
    │ - changeType: 'update'          │
    │ - authorityId: Authority-1      │
    │ - hash: H2                      │
    │ - previousHash: H1              │
    └─────────────┬───────────────────┘
                  │
                  │ previousHash: H2
                  ↓
    Version 3 (Import)
    ┌─────────────────────────────────┐
    │ VoterRollVersion                │
    │ - version: 3                    │
    │ - timestamp: T3                 │
    │ - voterCount: 1100              │
    │ - changeType: 'import'          │
    │ - authorityId: Authority-2      │
    │ - hash: H3                      │
    │ - previousHash: H2              │
    └─────────────┬───────────────────┘
                  │
                  │ Rollback to V2
                  ↓
    Version 4 (Rollback)
    ┌─────────────────────────────────┐
    │ VoterRollVersion                │
    │ - version: 4                    │
    │ - timestamp: T4                 │
    │ - voterCount: 1050              │
    │ - changeType: 'rollback'        │
    │ - authorityId: Authority-1      │
    │ - hash: H4                      │
    │ - previousHash: H3              │
    │ - rollbackTo: 2                 │
    └─────────────────────────────────┘
```

## CRL/OCSP Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REVOCATION CHECKING FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    Voter Attempts to Vote
           │
           ↓
    ┌──────────────────┐
    │ Get Credential   │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Check Local      │  ← Fast path: Check in-memory cache
    │ Cache            │
    └────────┬─────────┘
             │
             ├─ Found in cache ──> Return status
             │
             ↓ Not in cache
    ┌──────────────────┐
    │ OCSP Query       │  ← Real-time status check
    │ (Preferred)      │    Fast, single credential
    └────────┬─────────┘
             │
             ├─ OCSP available ──> Return OCSPResponse
             │
             ↓ OCSP unavailable
    ┌──────────────────┐
    │ Download CRL     │  ← Batch revocation list
    │ (Fallback)       │    Slower, all revocations
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Verify CRL       │  ← Check signature
    │ Signature        │    Validate issuer
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Search CRL       │  ← Find credentialId
    │ for Credential   │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Cache Result     │  ← Store for future checks
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Return Status    │  ← Active or Revoked
    └──────────────────┘
```

## Integration Points with Phase 1

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1 & PHASE 2 INTEGRATION                             │
└─────────────────────────────────────────────────────────────────────────────┘

    Phase 1: Poll                          Phase 2: Registration
    ┌─────────────────┐                    ┌─────────────────┐
    │                 │                    │                 │
    │ vote(           │                    │ VoterRegistry   │
    │   voter,        │<───────────────────│                 │
    │   encryptedVote │  Check registration│ - getRegistration()
    │ )               │                    │ - isRegistered()
    │                 │                    │                 │
    └─────────────────┘                    └─────────────────┘
            │                                      │
            │                                      │
            │                              ┌───────┴─────────┐
            │                              │                 │
            │                              │ Eligibility     │
            │                              │ Verifier        │
            │                              │                 │
            │                              │ - verifyEligibility()
            │                              │                 │
            │                              └───────┬─────────┘
            │                                      │
            │                              ┌───────┴─────────┐
            │                              │                 │
            │                              │ Credential      │
            │                              │ Issuer          │
            │                              │                 │
            │                              │ - getCredentials()
            │                              │ - verifyCredential()
            │                              │                 │
            │                              └───────┬─────────┘
            │                                      │
            │                              ┌───────┴─────────┐
            │                              │                 │
            │                              │ Revocation      │
            │                              │ Manager         │
            │                              │                 │
            │                              │ - isRevoked()   │
            │                              │                 │
            │                              └─────────────────┘
            │
            ↓
    ┌─────────────────┐
    │ VoteReceipt     │
    │                 │
    │ - voterId       │
    │ - pollId        │
    │ - timestamp     │
    │ - signature     │
    └─────────────────┘
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE OPTIMIZATION STRATEGIES                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Indexing                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  VoterRegistry:                                                          │ │
│  │  - Map<voterId, VoterRegistration>     ← O(1) lookup                   │ │
│  │  - Map<memberId, voterId>              ← O(1) member lookup             │ │
│  │                                                                          │ │
│  │  CredentialIssuer:                                                       │ │
│  │  - Map<credentialId, VoterCredential>  ← O(1) credential lookup        │ │
│  │  - Map<voterId, Set<credentialId>>     ← O(1) voter credentials        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  2. Caching                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  RevocationManager:                                                      │ │
│  │  - Cache revocation status             ← Avoid CRL lookups              │ │
│  │  - TTL-based cache invalidation        ← Refresh periodically           │ │
│  │                                                                          │ │
│  │  EligibilityVerifier:                                                    │ │
│  │  - Cache eligibility results           ← Avoid re-verification          │ │
│  │  - Poll-specific cache                 ← Per-poll eligibility           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  3. Batch Processing                                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  VoterRollManager:                                                       │ │
│  │  - Import in batches of 1000           ← Reduce memory usage            │ │
│  │  - Parallel duplicate detection        ← Use worker threads             │ │
│  │                                                                          │ │
│  │  EligibilityVerifier:                                                    │ │
│  │  - Batch verification                  ← Verify 100 voters at once      │ │
│  │  - Parallel rule execution             ← Async rule validation          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  4. Lazy Loading                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  VoterRegistry:                                                          │ │
│  │  - Load registration on demand         ← Don't load all at startup      │ │
│  │  - Paginated queries                   ← Load in chunks                 │ │
│  │                                                                          │ │
│  │  CRL:                                                                    │ │
│  │  - Download only when needed           ← OCSP preferred                 │ │
│  │  - Delta CRLs for updates              ← Only new revocations           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Legend

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM SYMBOLS                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐                                                               │
│  │Component │  ← System component or class                                  │
│  └──────────┘                                                               │
│                                                                              │
│  ───────────>  ← Data flow or method call                                   │
│                                                                              │
│  <─────────>   ← Bidirectional communication                                │
│                                                                              │
│  ↓             ← Process flow                                                │
│                                                                              │
│  ├─────────    ← Branch or decision point                                   │
│                                                                              │
│  ✅            ← Implemented                                                 │
│  ⚠️            ← Design complete, ready for implementation                   │
│  ❌            ← Not started                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
