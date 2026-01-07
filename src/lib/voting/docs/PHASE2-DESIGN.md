# Phase 2: Voter Eligibility & Registration - Design Document

## Overview

Phase 2 builds a cryptographically secured voter registry system with credential issuance, eligibility verification, and revocation capabilities. This system integrates with the existing Member system and voting infrastructure.

## Architecture Principles

1. **Separation of Concerns**: Registry, eligibility, credentials are separate modules
2. **Cryptographic Security**: All credentials use unforgeable signatures
3. **Audit Trail**: Every operation logged in immutable audit log
4. **Flexible Rules**: Configurable eligibility criteria
5. **Privacy-Preserving**: Minimal PII exposure, hashed identifiers where possible
6. **Revocation Support**: Immediate credential invalidation with CRL/OCSP

## Core Components

### 2.1 Voter Registration System

**Purpose**: Maintain cryptographically secured voter registry with unique credentials

**Key Interfaces**:

```typescript
// Core voter registration record
interface VoterRegistration {
  readonly voterId: Uint8Array;              // Unique voter identifier
  readonly memberId: Uint8Array;             // Link to Member system
  readonly credentialId: Uint8Array;         // Unique credential identifier
  readonly registrationDate: number;         // Unix timestamp
  readonly expirationDate?: number;          // Optional expiration
  readonly jurisdiction: string;             // Geographic/organizational jurisdiction
  readonly eligibilityCriteria: EligibilityCriteria;
  readonly status: RegistrationStatus;
  readonly metadata: RegistrationMetadata;
  readonly signature: Uint8Array;            // Authority signature
}

enum RegistrationStatus {
  Active = 'active',
  Suspended = 'suspended',
  Revoked = 'revoked',
  Expired = 'expired',
  PendingVerification = 'pending_verification'
}

interface RegistrationMetadata {
  readonly registrarId: Uint8Array;          // Who registered this voter
  readonly verificationMethod: string;       // How identity was verified
  readonly lastUpdated: number;
  readonly version: number;                  // For version control
  readonly previousVersionHash?: Uint8Array; // Link to previous version
}

// Main registry interface
interface IVoterRegistry {
  // Registration operations
  registerVoter(
    member: IMember,
    criteria: EligibilityCriteria,
    registrar: IMember,
    metadata?: Record<string, unknown>
  ): Promise<VoterRegistration>;
  
  updateRegistration(
    voterId: Uint8Array,
    updates: Partial<VoterRegistration>,
    updater: IMember
  ): Promise<VoterRegistration>;
  
  // Query operations
  getRegistration(voterId: Uint8Array): Promise<VoterRegistration | null>;
  getRegistrationByMember(memberId: Uint8Array): Promise<VoterRegistration | null>;
  isRegistered(voterId: Uint8Array): Promise<boolean>;
  
  // Bulk operations
  importVoterRoll(
    roll: VoterRollImport,
    registrar: IMember
  ): Promise<VoterRollImportResult>;
  
  exportVoterRoll(
    jurisdiction?: string,
    includeRevoked?: boolean
  ): Promise<VoterRollExport>;
  
  // Duplicate detection
  detectDuplicates(
    registration: Partial<VoterRegistration>
  ): Promise<VoterRegistration[]>;
  
  // Audit
  getAuditLog(): AuditLog;
  getRegistrationHistory(voterId: Uint8Array): Promise<VoterRegistration[]>;
}
```

### 2.2 Eligibility Verification

**Purpose**: Verify voter eligibility against configurable rules before voting

**Key Interfaces**:

```typescript
// Eligibility criteria definition
interface EligibilityCriteria {
  readonly minAge?: number;                  // Minimum age requirement
  readonly maxAge?: number;                  // Maximum age (if applicable)
  readonly jurisdiction: string;             // Required jurisdiction
  readonly citizenship?: string[];           // Required citizenship(s)
  readonly residencyMonths?: number;         // Minimum residency period
  readonly customRules?: CustomEligibilityRule[];
  readonly requiredAttributes?: Record<string, unknown>;
}

interface CustomEligibilityRule {
  readonly ruleId: string;
  readonly description: string;
  readonly validator: (voter: VoterRegistration) => boolean | Promise<boolean>;
}

// Eligibility check result
interface EligibilityCheckResult {
  readonly eligible: boolean;
  readonly voterId: Uint8Array;
  readonly pollId: Uint8Array;
  readonly timestamp: number;
  readonly failedRules?: EligibilityRuleFailure[];
  readonly signature: Uint8Array;            // Authority signature
}

interface EligibilityRuleFailure {
  readonly rule: string;
  readonly reason: string;
  readonly severity: 'error' | 'warning';
}

// Main eligibility verifier interface
interface IEligibilityVerifier {
  // Verification operations
  verifyEligibility(
    voter: VoterRegistration,
    poll: Poll,
    authority: IMember
  ): Promise<EligibilityCheckResult>;
  
  // Rule management
  addCustomRule(rule: CustomEligibilityRule): void;
  removeCustomRule(ruleId: string): void;
  getActiveRules(): CustomEligibilityRule[];
  
  // Batch verification
  verifyBatch(
    voters: VoterRegistration[],
    poll: Poll,
    authority: IMember
  ): Promise<Map<Uint8Array, EligibilityCheckResult>>;
  
  // Configuration
  setDefaultCriteria(criteria: EligibilityCriteria): void;
  getDefaultCriteria(): EligibilityCriteria;
}
```

### 2.3 Voter Roll Management

**Purpose**: Import, export, and manage voter rolls with version control

**Key Interfaces**:

```typescript
// Voter roll import/export formats
interface VoterRollImport {
  readonly source: string;                   // Source system identifier
  readonly format: VoterRollFormat;
  readonly jurisdiction: string;
  readonly effectiveDate: number;
  readonly voters: VoterRollEntry[];
  readonly signature?: Uint8Array;           // Optional source signature
}

enum VoterRollFormat {
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  EML = 'eml',                               // Election Markup Language
  Custom = 'custom'
}

interface VoterRollEntry {
  readonly externalId: string;               // ID from source system
  readonly name: string;
  readonly dateOfBirth?: string;
  readonly jurisdiction: string;
  readonly address?: string;
  readonly customFields?: Record<string, unknown>;
}

interface VoterRollImportResult {
  readonly totalRecords: number;
  readonly imported: number;
  readonly duplicates: number;
  readonly errors: number;
  readonly warnings: VoterRollWarning[];
  readonly importId: Uint8Array;
  readonly timestamp: number;
}

interface VoterRollWarning {
  readonly recordIndex: number;
  readonly externalId: string;
  readonly message: string;
  readonly severity: 'warning' | 'error';
}

interface VoterRollExport {
  readonly jurisdiction: string;
  readonly exportDate: number;
  readonly version: number;
  readonly voterCount: number;
  readonly voters: VoterRegistration[];
  readonly signature: Uint8Array;
}

// Voter roll manager interface
interface IVoterRollManager {
  // Import operations
  importRoll(
    roll: VoterRollImport,
    registrar: IMember,
    options?: ImportOptions
  ): Promise<VoterRollImportResult>;
  
  validateImport(roll: VoterRollImport): Promise<VoterRollWarning[]>;
  
  // Export operations
  exportRoll(
    jurisdiction: string,
    format: VoterRollFormat,
    authority: IMember
  ): Promise<VoterRollExport>;
  
  // Version control
  getVersion(jurisdiction: string): Promise<number>;
  getRollHistory(jurisdiction: string): Promise<VoterRollVersion[]>;
  rollback(jurisdiction: string, version: number, authority: IMember): Promise<void>;
  
  // Duplicate detection
  detectDuplicates(
    strategy: DuplicateDetectionStrategy
  ): Promise<DuplicateGroup[]>;
  
  mergeDuplicates(
    duplicates: DuplicateGroup,
    authority: IMember
  ): Promise<VoterRegistration>;
}

interface ImportOptions {
  readonly skipDuplicates?: boolean;
  readonly updateExisting?: boolean;
  readonly validateOnly?: boolean;
  readonly batchSize?: number;
}

interface VoterRollVersion {
  readonly version: number;
  readonly timestamp: number;
  readonly voterCount: number;
  readonly changeType: 'import' | 'update' | 'rollback';
  readonly authorityId: Uint8Array;
}

enum DuplicateDetectionStrategy {
  ExactMatch = 'exact',
  FuzzyName = 'fuzzy_name',
  DateOfBirth = 'dob',
  Address = 'address',
  Combined = 'combined'
}

interface DuplicateGroup {
  readonly voters: VoterRegistration[];
  readonly confidence: number;               // 0-1 confidence score
  readonly matchedFields: string[];
}
```

### 2.4 Credential Issuance

**Purpose**: Issue unforgeable cryptographic credentials to registered voters

**Key Interfaces**:

```typescript
// Credential types
enum CredentialType {
  PKICertificate = 'pki_certificate',        // X.509 certificate
  BlindSignature = 'blind_signature',        // Anonymous credential
  AnonymousCredential = 'anonymous',         // Zero-knowledge credential
  BearerToken = 'bearer_token',              // Simple signed token
  VotingToken = 'voting_token'               // Poll-specific token
}

// Base credential interface
interface VoterCredential {
  readonly credentialId: Uint8Array;
  readonly voterId: Uint8Array;
  readonly type: CredentialType;
  readonly issuedAt: number;
  readonly expiresAt?: number;
  readonly issuer: Uint8Array;               // Authority ID
  readonly signature: Uint8Array;
  readonly status: CredentialStatus;
  readonly metadata?: Record<string, unknown>;
}

enum CredentialStatus {
  Active = 'active',
  Revoked = 'revoked',
  Expired = 'expired',
  Suspended = 'suspended'
}

// PKI Certificate credential
interface PKICertificateCredential extends VoterCredential {
  readonly type: CredentialType.PKICertificate;
  readonly certificate: Uint8Array;          // X.509 DER encoded
  readonly publicKey: Uint8Array;
  readonly serialNumber: string;
}

// Blind signature credential (for anonymity)
interface BlindSignatureCredential extends VoterCredential {
  readonly type: CredentialType.BlindSignature;
  readonly blindedToken: Uint8Array;
  readonly unblindingFactor: Uint8Array;
}

// Anonymous credential (zero-knowledge)
interface AnonymousCredential extends VoterCredential {
  readonly type: CredentialType.AnonymousCredential;
  readonly commitment: Uint8Array;
  readonly proof: Uint8Array;
}

// Bearer token (simple)
interface BearerTokenCredential extends VoterCredential {
  readonly type: CredentialType.BearerToken;
  readonly token: Uint8Array;
  readonly nonce: Uint8Array;
}

// Voting token (poll-specific)
interface VotingTokenCredential extends VoterCredential {
  readonly type: CredentialType.VotingToken;
  readonly pollId: Uint8Array;
  readonly token: Uint8Array;
  readonly singleUse: boolean;
}

// Credential issuer interface
interface ICredentialIssuer {
  // Issuance operations
  issueCredential(
    voter: VoterRegistration,
    type: CredentialType,
    authority: IMember,
    options?: CredentialOptions
  ): Promise<VoterCredential>;
  
  issueVotingToken(
    voter: VoterRegistration,
    poll: Poll,
    authority: IMember
  ): Promise<VotingTokenCredential>;
  
  // Verification operations
  verifyCredential(
    credential: VoterCredential,
    authority: IMember
  ): Promise<boolean>;
  
  verifyVotingToken(
    token: VotingTokenCredential,
    poll: Poll
  ): Promise<boolean>;
  
  // Query operations
  getCredential(credentialId: Uint8Array): Promise<VoterCredential | null>;
  getCredentialsForVoter(voterId: Uint8Array): Promise<VoterCredential[]>;
  
  // Status operations
  getCredentialStatus(credentialId: Uint8Array): Promise<CredentialStatus>;
  isCredentialValid(credential: VoterCredential): Promise<boolean>;
}

interface CredentialOptions {
  readonly expirationDays?: number;
  readonly pollSpecific?: Uint8Array;        // Poll ID for poll-specific credentials
  readonly singleUse?: boolean;
  readonly metadata?: Record<string, unknown>;
}
```

### 2.5 Credential Revocation

**Purpose**: Immediate credential invalidation with audit trail

**Key Interfaces**:

```typescript
// Revocation record
interface CredentialRevocation {
  readonly credentialId: Uint8Array;
  readonly voterId: Uint8Array;
  readonly revokedAt: number;
  readonly revokedBy: Uint8Array;            // Authority ID
  readonly reason: RevocationReason;
  readonly justification: string;
  readonly signature: Uint8Array;
}

enum RevocationReason {
  Expired = 'expired',
  Compromised = 'compromised',
  Ineligible = 'ineligible',
  Duplicate = 'duplicate',
  Administrative = 'administrative',
  Fraudulent = 'fraudulent',
  Requested = 'requested'
}

// Certificate Revocation List
interface CertificateRevocationList {
  readonly version: number;
  readonly issuer: Uint8Array;
  readonly thisUpdate: number;
  readonly nextUpdate: number;
  readonly revokedCredentials: CredentialRevocation[];
  readonly signature: Uint8Array;
}

// OCSP (Online Certificate Status Protocol) response
interface OCSPResponse {
  readonly credentialId: Uint8Array;
  readonly status: CredentialStatus;
  readonly thisUpdate: number;
  readonly nextUpdate?: number;
  readonly revocationTime?: number;
  readonly revocationReason?: RevocationReason;
  readonly signature: Uint8Array;
}

// Revocation manager interface
interface ICredentialRevocationManager {
  // Revocation operations
  revokeCredential(
    credentialId: Uint8Array,
    reason: RevocationReason,
    justification: string,
    authority: IMember
  ): Promise<CredentialRevocation>;
  
  revokeAllCredentials(
    voterId: Uint8Array,
    reason: RevocationReason,
    justification: string,
    authority: IMember
  ): Promise<CredentialRevocation[]>;
  
  // CRL operations
  getCRL(): Promise<CertificateRevocationList>;
  updateCRL(authority: IMember): Promise<CertificateRevocationList>;
  verifyCRL(crl: CertificateRevocationList): Promise<boolean>;
  
  // OCSP operations
  checkStatus(credentialId: Uint8Array): Promise<OCSPResponse>;
  generateOCSPResponse(
    credentialId: Uint8Array,
    authority: IMember
  ): Promise<OCSPResponse>;
  
  // Query operations
  isRevoked(credentialId: Uint8Array): Promise<boolean>;
  getRevocation(credentialId: Uint8Array): Promise<CredentialRevocation | null>;
  getRevocationsForVoter(voterId: Uint8Array): Promise<CredentialRevocation[]>;
  
  // Audit
  getRevocationLog(): AuditLog;
}
```

## Implementation Classes

### VoterRegistry (Implementation)

```typescript
class VoterRegistry implements IVoterRegistry {
  private readonly registrations: Map<string, VoterRegistration>;
  private readonly memberIndex: Map<string, string>;  // memberId -> voterId
  private readonly authority: IMember;
  private readonly auditLog: ImmutableAuditLog;
  
  constructor(authority: IMember);
  
  // Core methods implement IVoterRegistry interface
  // Uses audit log for all operations
  // Cryptographic signatures on all registrations
  // Version control with hash chains
}
```

### EligibilityVerifier (Implementation)

```typescript
class EligibilityVerifier implements IEligibilityVerifier {
  private readonly customRules: Map<string, CustomEligibilityRule>;
  private defaultCriteria: EligibilityCriteria;
  private readonly auditLog: ImmutableAuditLog;
  
  constructor(
    defaultCriteria: EligibilityCriteria,
    authority: IMember
  );
  
  // Implements configurable rule engine
  // Logs all eligibility checks
  // Supports async rule validation
}
```

### VoterRollManager (Implementation)

```typescript
class VoterRollManager implements IVoterRollManager {
  private readonly registry: IVoterRegistry;
  private readonly versions: Map<string, VoterRollVersion[]>;
  private readonly authority: IMember;
  
  constructor(registry: IVoterRegistry, authority: IMember);
  
  // Implements import/export with validation
  // Version control with rollback support
  // Duplicate detection algorithms
  // Batch processing for large rolls
}
```

### CredentialIssuer (Implementation)

```typescript
class CredentialIssuer implements ICredentialIssuer {
  private readonly credentials: Map<string, VoterCredential>;
  private readonly voterCredentials: Map<string, Set<string>>;
  private readonly authority: IMember;
  private readonly auditLog: ImmutableAuditLog;
  
  constructor(authority: IMember);
  
  // Issues multiple credential types
  // Cryptographic signature on all credentials
  // Verification with authority public key
  // Poll-specific token generation
}
```

### CredentialRevocationManager (Implementation)

```typescript
class CredentialRevocationManager implements ICredentialRevocationManager {
  private readonly revocations: Map<string, CredentialRevocation>;
  private readonly crl: CertificateRevocationList;
  private readonly authority: IMember;
  private readonly auditLog: ImmutableAuditLog;
  
  constructor(authority: IMember);
  
  // Immediate revocation with audit trail
  // CRL generation and verification
  // OCSP response generation
  // Automatic CRL updates
}
```

## Integration with Existing System

### Integration Points

1. **Member System**: VoterRegistration links to existing IMember via memberId
2. **Poll System**: EligibilityVerifier checks before Poll.vote()
3. **Audit System**: Reuses ImmutableAuditLog for all operations
4. **Bulletin Board**: Publishes CRL updates to PublicBulletinBoard

### Modified Poll Flow

```typescript
// Before (Phase 1):
poll.vote(voter, encryptedVote);

// After (Phase 2):
const registration = await registry.getRegistrationByMember(voter.id);
const eligibility = await verifier.verifyEligibility(registration, poll, authority);
if (!eligibility.eligible) {
  throw new Error('Voter not eligible');
}
const credential = await issuer.getCredentialsForVoter(registration.voterId);
if (await revocationManager.isRevoked(credential[0].credentialId)) {
  throw new Error('Credential revoked');
}
poll.vote(voter, encryptedVote);
```

## File Structure

```
src/lib/voting/
├── registry/
│   ├── voter-registry.ts           # VoterRegistry implementation
│   ├── voter-registry.spec.ts      # Tests
│   ├── types.ts                    # Registration types
│   └── index.ts
├── eligibility/
│   ├── eligibility-verifier.ts     # EligibilityVerifier implementation
│   ├── eligibility-verifier.spec.ts
│   ├── rules.ts                    # Built-in eligibility rules
│   ├── types.ts                    # Eligibility types
│   └── index.ts
├── voter-roll/
│   ├── voter-roll-manager.ts       # VoterRollManager implementation
│   ├── voter-roll-manager.spec.ts
│   ├── importers/                  # Format-specific importers
│   │   ├── csv-importer.ts
│   │   ├── json-importer.ts
│   │   └── eml-importer.ts
│   ├── duplicate-detector.ts       # Duplicate detection algorithms
│   ├── types.ts
│   └── index.ts
├── credentials/
│   ├── credential-issuer.ts        # CredentialIssuer implementation
│   ├── credential-issuer.spec.ts
│   ├── credential-types.ts         # Credential type implementations
│   ├── revocation-manager.ts       # CredentialRevocationManager
│   ├── revocation-manager.spec.ts
│   ├── crl.ts                      # CRL generation
│   ├── ocsp.ts                     # OCSP implementation
│   ├── types.ts
│   └── index.ts
└── integration/
    ├── registration-poll-flow.ts   # Integrated voting flow
    ├── registration-poll-flow.spec.ts
    └── index.ts
```

## Security Considerations

### Cryptographic Requirements

1. **Signatures**: All registrations, credentials, and revocations signed by authority
2. **Hash Chains**: Registration updates form hash chain for version control
3. **Nonces**: Credentials include random nonces to prevent replay attacks
4. **Expiration**: Time-limited credentials with automatic expiration
5. **Revocation**: Immediate invalidation with CRL/OCSP support

### Privacy Protections

1. **Minimal PII**: Store only required information
2. **Hashed IDs**: Voter IDs hashed in audit logs
3. **Jurisdiction Isolation**: Separate registries per jurisdiction
4. **Access Control**: Registry operations require authority credentials
5. **Audit Trail**: All operations logged but voter choices remain private

### Attack Resistance

1. **Duplicate Prevention**: Multiple detection strategies
2. **Credential Forgery**: Cryptographic signatures prevent forgery
3. **Replay Attacks**: Nonces and timestamps prevent replay
4. **Revocation Bypass**: CRL/OCSP checks before voting
5. **Eligibility Bypass**: Verification required before vote acceptance

## Testing Strategy

### Unit Tests (per component)

- VoterRegistry: Registration, updates, queries, duplicates
- EligibilityVerifier: Rule validation, custom rules, batch checks
- VoterRollManager: Import/export, version control, rollback
- CredentialIssuer: All credential types, verification
- RevocationManager: Revocation, CRL, OCSP

### Integration Tests

- Full registration-to-vote flow
- Credential lifecycle (issue, verify, revoke)
- Voter roll import with duplicate detection
- Eligibility verification with poll voting
- CRL updates on bulletin board

### Security Tests

- Credential forgery attempts
- Duplicate registration attempts
- Revoked credential usage attempts
- Eligibility bypass attempts
- Replay attack resistance

### Performance Tests

- Large voter roll import (100k+ voters)
- Batch eligibility verification
- CRL generation with 10k+ revocations
- Duplicate detection on large datasets

## Demo Implementation

For the showcase demo, implement minimal versions:

1. **VoterRegistry**: In-memory Map storage, basic CRUD
2. **EligibilityVerifier**: Age and jurisdiction rules only
3. **CredentialIssuer**: BearerToken type only
4. **RevocationManager**: Simple revocation list, no CRL/OCSP
5. **Integration**: Basic flow with 10-20 test voters

## Future Enhancements

- Blockchain-based registry for immutability
- Zero-knowledge credential proofs
- Biometric credential binding
- Multi-jurisdiction federation
- Real-time eligibility updates
- Automated duplicate resolution
- Machine learning for duplicate detection
- Hardware security module (HSM) integration

## Compliance Mapping

### EARS Requirements Coverage

- 2.1 Voter Registration System: VoterRegistry class
- 2.2 Eligibility Verification: EligibilityVerifier class
- 2.3 Voter Roll Management: VoterRollManager class
- 2.4 Credential Issuance: CredentialIssuer class
- 2.5 Credential Revocation: CredentialRevocationManager class

All requirements mapped to specific interfaces and implementations.
