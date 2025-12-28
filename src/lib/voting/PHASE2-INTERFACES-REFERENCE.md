# Phase 2 Interfaces Quick Reference

## Table of Contents

1. [Voter Registration](#voter-registration)
2. [Eligibility Verification](#eligibility-verification)
3. [Voter Roll Management](#voter-roll-management)
4. [Credential Issuance](#credential-issuance)
5. [Credential Revocation](#credential-revocation)
6. [Integration Flow](#integration-flow)

---

## Voter Registration

### IVoterRegistry

**Purpose**: Main interface for voter registration operations

**Key Methods**:

```typescript
interface IVoterRegistry {
  // Register new voter
  registerVoter(
    member: IMember,
    criteria: EligibilityCriteria,
    registrar: IMember,
    metadata?: Record<string, unknown>
  ): Promise<VoterRegistration>;
  
  // Update existing registration
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
  importVoterRoll(roll: VoterRollImport, registrar: IMember): Promise<VoterRollImportResult>;
  exportVoterRoll(jurisdiction?: string): Promise<VoterRollExport>;
  
  // Duplicate detection
  detectDuplicates(registration: Partial<VoterRegistration>): Promise<VoterRegistration[]>;
  
  // Audit
  getAuditLog(): AuditLog;
  getRegistrationHistory(voterId: Uint8Array): Promise<VoterRegistration[]>;
}
```

### VoterRegistration

**Purpose**: Core voter registration record

```typescript
interface VoterRegistration {
  readonly voterId: Uint8Array;              // Unique voter ID
  readonly memberId: Uint8Array;             // Link to Member system
  readonly credentialId: Uint8Array;         // Credential reference
  readonly registrationDate: number;         // Unix timestamp
  readonly expirationDate?: number;          // Optional expiration
  readonly jurisdiction: string;             // Geographic/org jurisdiction
  readonly eligibilityCriteria: EligibilityCriteria;
  readonly status: RegistrationStatus;       // Active, Suspended, Revoked, etc.
  readonly metadata: RegistrationMetadata;
  readonly signature: Uint8Array;            // Authority signature
}
```

### RegistrationStatus

```typescript
enum RegistrationStatus {
  Active = 'active',
  Suspended = 'suspended',
  Revoked = 'revoked',
  Expired = 'expired',
  PendingVerification = 'pending_verification'
}
```

---

## Eligibility Verification

### IEligibilityVerifier

**Purpose**: Verify voter eligibility against configurable rules

**Key Methods**:

```typescript
interface IEligibilityVerifier {
  // Verify single voter
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

### EligibilityCriteria

**Purpose**: Define eligibility requirements

```typescript
interface EligibilityCriteria {
  readonly minAge?: number;                  // Minimum age
  readonly maxAge?: number;                  // Maximum age
  readonly jurisdiction: string;             // Required jurisdiction
  readonly citizenship?: string[];           // Required citizenship(s)
  readonly residencyMonths?: number;         // Minimum residency
  readonly customRules?: CustomEligibilityRule[];
  readonly requiredAttributes?: Record<string, unknown>;
}
```

### EligibilityCheckResult

**Purpose**: Result of eligibility verification

```typescript
interface EligibilityCheckResult {
  readonly eligible: boolean;                // Pass/fail
  readonly voterId: Uint8Array;
  readonly pollId: Uint8Array;
  readonly timestamp: number;
  readonly failedRules?: EligibilityRuleFailure[];
  readonly signature: Uint8Array;            // Authority signature
}
```

### CustomEligibilityRule

**Purpose**: Define custom validation rules

```typescript
interface CustomEligibilityRule {
  readonly ruleId: string;
  readonly description: string;
  readonly validator: (voter: VoterRegistration) => boolean | Promise<boolean>;
}
```

---

## Voter Roll Management

### IVoterRollManager

**Purpose**: Import/export voter rolls with version control

**Key Methods**:

```typescript
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
  detectDuplicates(strategy: DuplicateDetectionStrategy): Promise<DuplicateGroup[]>;
  mergeDuplicates(duplicates: DuplicateGroup, authority: IMember): Promise<VoterRegistration>;
}
```

### VoterRollImport

**Purpose**: Structure for importing voter rolls

```typescript
interface VoterRollImport {
  readonly source: string;                   // Source system
  readonly format: VoterRollFormat;          // CSV, JSON, XML, EML
  readonly jurisdiction: string;
  readonly effectiveDate: number;
  readonly voters: VoterRollEntry[];
  readonly signature?: Uint8Array;           // Optional source signature
}
```

### VoterRollFormat

```typescript
enum VoterRollFormat {
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  EML = 'eml',                               // Election Markup Language
  Custom = 'custom'
}
```

### DuplicateDetectionStrategy

```typescript
enum DuplicateDetectionStrategy {
  ExactMatch = 'exact',
  FuzzyName = 'fuzzy_name',
  DateOfBirth = 'dob',
  Address = 'address',
  Combined = 'combined'
}
```

---

## Credential Issuance

### ICredentialIssuer

**Purpose**: Issue and verify cryptographic credentials

**Key Methods**:

```typescript
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
  verifyCredential(credential: VoterCredential, authority: IMember): Promise<boolean>;
  verifyVotingToken(token: VotingTokenCredential, poll: Poll): Promise<boolean>;
  
  // Query operations
  getCredential(credentialId: Uint8Array): Promise<VoterCredential | null>;
  getCredentialsForVoter(voterId: Uint8Array): Promise<VoterCredential[]>;
  
  // Status operations
  getCredentialStatus(credentialId: Uint8Array): Promise<CredentialStatus>;
  isCredentialValid(credential: VoterCredential): Promise<boolean>;
}
```

### CredentialType

```typescript
enum CredentialType {
  PKICertificate = 'pki_certificate',        // X.509 certificate
  BlindSignature = 'blind_signature',        // Anonymous credential
  AnonymousCredential = 'anonymous',         // Zero-knowledge credential
  BearerToken = 'bearer_token',              // Simple signed token
  VotingToken = 'voting_token'               // Poll-specific token
}
```

### VoterCredential

**Purpose**: Base credential interface

```typescript
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
```

### BearerTokenCredential

**Purpose**: Simple signed token credential (for demo)

```typescript
interface BearerTokenCredential extends VoterCredential {
  readonly type: CredentialType.BearerToken;
  readonly token: Uint8Array;
  readonly nonce: Uint8Array;
}
```

### VotingTokenCredential

**Purpose**: Poll-specific voting token

```typescript
interface VotingTokenCredential extends VoterCredential {
  readonly type: CredentialType.VotingToken;
  readonly pollId: Uint8Array;
  readonly token: Uint8Array;
  readonly singleUse: boolean;
}
```

---

## Credential Revocation

### ICredentialRevocationManager

**Purpose**: Manage credential revocation with CRL/OCSP

**Key Methods**:

```typescript
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
  generateOCSPResponse(credentialId: Uint8Array, authority: IMember): Promise<OCSPResponse>;
  
  // Query operations
  isRevoked(credentialId: Uint8Array): Promise<boolean>;
  getRevocation(credentialId: Uint8Array): Promise<CredentialRevocation | null>;
  getRevocationsForVoter(voterId: Uint8Array): Promise<CredentialRevocation[]>;
  
  // Audit
  getRevocationLog(): AuditLog;
}
```

### RevocationReason

```typescript
enum RevocationReason {
  Expired = 'expired',
  Compromised = 'compromised',
  Ineligible = 'ineligible',
  Duplicate = 'duplicate',
  Administrative = 'administrative',
  Fraudulent = 'fraudulent',
  Requested = 'requested'
}
```

### CredentialRevocation

**Purpose**: Revocation record

```typescript
interface CredentialRevocation {
  readonly credentialId: Uint8Array;
  readonly voterId: Uint8Array;
  readonly revokedAt: number;
  readonly revokedBy: Uint8Array;            // Authority ID
  readonly reason: RevocationReason;
  readonly justification: string;
  readonly signature: Uint8Array;
}
```

### CertificateRevocationList

**Purpose**: CRL structure

```typescript
interface CertificateRevocationList {
  readonly version: number;
  readonly issuer: Uint8Array;
  readonly thisUpdate: number;
  readonly nextUpdate: number;
  readonly revokedCredentials: CredentialRevocation[];
  readonly signature: Uint8Array;
}
```

---

## Integration Flow

### Complete Registration-to-Vote Flow

```typescript
// 1. Setup components
const authority = await createAuthority();
const registry = new VoterRegistry(authority);
const verifier = new EligibilityVerifier(defaultCriteria, authority);
const issuer = new CredentialIssuer(authority);
const revocationManager = new CredentialRevocationManager(authority);

// 2. Register voter
const registration = await registry.registerVoter(
  member,
  eligibilityCriteria,
  registrar
);

// 3. Issue credential
const credential = await issuer.issueCredential(
  registration,
  CredentialType.BearerToken,
  authority
);

// 4. Create poll
const poll = PollFactory.createPlurality(['Alice', 'Bob'], authority);

// 5. Verify eligibility
const eligibility = await verifier.verifyEligibility(
  registration,
  poll,
  authority
);

if (!eligibility.eligible) {
  throw new Error('Voter not eligible');
}

// 6. Check credential status
const credentials = await issuer.getCredentialsForVoter(registration.voterId);
const isRevoked = await revocationManager.isRevoked(credentials[0].credentialId);

if (isRevoked) {
  throw new Error('Credential revoked');
}

// 7. Cast vote
const encoder = new VoteEncoder(authority.votingPublicKey!);
const vote = encoder.encodePlurality(0, 2);
const receipt = poll.vote(member, vote);

// 8. Close and tally
poll.close();
const tallier = new PollTallier(authority, authority.votingPrivateKey!, authority.votingPublicKey!);
const results = tallier.tally(poll);
```

### Credential Revocation Flow

```typescript
// 1. Revoke credential
const revocation = await revocationManager.revokeCredential(
  credentialId,
  RevocationReason.Administrative,
  'Voter moved out of jurisdiction',
  authority
);

// 2. Update CRL
const crl = await revocationManager.updateCRL(authority);

// 3. Publish CRL to bulletin board (optional)
bulletinBoard.publishCRL(crl);

// 4. Verify revocation prevents voting
const isRevoked = await revocationManager.isRevoked(credentialId);
// isRevoked === true

// 5. Attempt to vote fails
try {
  poll.vote(member, vote);
} catch (error) {
  // Error: Credential revoked
}
```

### Voter Roll Import Flow

```typescript
// 1. Prepare import
const voterRoll: VoterRollImport = {
  source: 'State Election System',
  format: VoterRollFormat.CSV,
  jurisdiction: 'District-1',
  effectiveDate: Date.now(),
  voters: [
    { externalId: '12345', name: 'Alice Johnson', jurisdiction: 'District-1' },
    { externalId: '12346', name: 'Bob Smith', jurisdiction: 'District-1' },
    // ... more voters
  ]
};

// 2. Validate import
const warnings = await rollManager.validateImport(voterRoll);
if (warnings.some(w => w.severity === 'error')) {
  console.error('Import has errors:', warnings);
  return;
}

// 3. Import roll
const result = await rollManager.importRoll(voterRoll, registrar, {
  skipDuplicates: true,
  updateExisting: false
});

console.log(`Imported: ${result.imported}/${result.totalRecords}`);
console.log(`Duplicates: ${result.duplicates}`);
console.log(`Errors: ${result.errors}`);

// 4. Detect duplicates
const duplicates = await rollManager.detectDuplicates(
  DuplicateDetectionStrategy.Combined
);

// 5. Merge duplicates
for (const group of duplicates) {
  if (group.confidence > 0.9) {
    await rollManager.mergeDuplicates(group, authority);
  }
}

// 6. Export roll
const exportedRoll = await rollManager.exportRoll(
  'District-1',
  VoterRollFormat.JSON,
  authority
);
```

---

## Usage Examples

### Example 1: Simple Registration

```typescript
const registration = await registry.registerVoter(
  member,
  {
    minAge: 18,
    jurisdiction: 'District-1',
    citizenship: ['US']
  },
  registrar
);

console.log('Voter registered:', registration.voterId);
```

### Example 2: Custom Eligibility Rule

```typescript
const customRule: CustomEligibilityRule = {
  ruleId: 'property-owner',
  description: 'Voter must be a property owner',
  validator: async (voter) => {
    // Check property ownership
    return voter.metadata.propertyOwner === true;
  }
};

verifier.addCustomRule(customRule);

const eligibility = await verifier.verifyEligibility(registration, poll, authority);
```

### Example 3: Issue Poll-Specific Token

```typescript
const votingToken = await issuer.issueVotingToken(
  registration,
  poll,
  authority
);

// Token is bound to specific poll
console.log('Token for poll:', votingToken.pollId);
console.log('Single use:', votingToken.singleUse);
```

### Example 4: Check Revocation Status

```typescript
const isRevoked = await revocationManager.isRevoked(credentialId);

if (isRevoked) {
  const revocation = await revocationManager.getRevocation(credentialId);
  console.log('Revoked at:', new Date(revocation.revokedAt));
  console.log('Reason:', revocation.reason);
  console.log('Justification:', revocation.justification);
}
```

---

## Type Hierarchy

```
IVoterRegistry
├── VoterRegistration
│   ├── RegistrationStatus (enum)
│   ├── RegistrationMetadata
│   └── EligibilityCriteria
│
IEligibilityVerifier
├── EligibilityCheckResult
│   └── EligibilityRuleFailure
├── CustomEligibilityRule
└── EligibilityCriteria
│
IVoterRollManager
├── VoterRollImport
│   ├── VoterRollFormat (enum)
│   └── VoterRollEntry
├── VoterRollImportResult
│   └── VoterRollWarning
├── VoterRollExport
├── DuplicateDetectionStrategy (enum)
└── DuplicateGroup
│
ICredentialIssuer
├── VoterCredential (base)
│   ├── BearerTokenCredential
│   ├── VotingTokenCredential
│   ├── PKICertificateCredential
│   ├── BlindSignatureCredential
│   └── AnonymousCredential
├── CredentialType (enum)
├── CredentialStatus (enum)
└── CredentialOptions
│
ICredentialRevocationManager
├── CredentialRevocation
│   └── RevocationReason (enum)
├── CertificateRevocationList
└── OCSPResponse
```

---

## Implementation Checklist

### Phase 2.1: Voter Registration
- [ ] Define VoterRegistration interface
- [ ] Define IVoterRegistry interface
- [ ] Implement VoterRegistry class
- [ ] Add audit logging
- [ ] Add duplicate detection
- [ ] Write unit tests

### Phase 2.2: Eligibility Verification
- [ ] Define EligibilityCriteria interface
- [ ] Define IEligibilityVerifier interface
- [ ] Implement EligibilityVerifier class
- [ ] Add built-in rules
- [ ] Add custom rule support
- [ ] Write unit tests

### Phase 2.3: Voter Roll Management
- [ ] Define VoterRollImport interface
- [ ] Define IVoterRollManager interface
- [ ] Implement VoterRollManager class
- [ ] Add CSV importer
- [ ] Add JSON importer
- [ ] Add duplicate detection
- [ ] Add version control
- [ ] Write unit tests

### Phase 2.4: Credential Issuance
- [ ] Define VoterCredential interface
- [ ] Define ICredentialIssuer interface
- [ ] Implement CredentialIssuer class
- [ ] Implement BearerToken type
- [ ] Implement VotingToken type
- [ ] Add verification
- [ ] Write unit tests

### Phase 2.5: Credential Revocation
- [ ] Define CredentialRevocation interface
- [ ] Define ICredentialRevocationManager interface
- [ ] Implement CredentialRevocationManager class
- [ ] Implement CRL generation
- [ ] Implement OCSP responses
- [ ] Add audit logging
- [ ] Write unit tests

### Phase 2.6: Integration
- [ ] Create RegistrationPollFlow class
- [ ] Integrate with existing Poll system
- [ ] Add end-to-end tests
- [ ] Create demo
- [ ] Write documentation
