# Phase 2 Implementation Plan

## Build Order & Dependencies

### Stage 1: Foundation Types (Week 1)

**Goal**: Define all TypeScript interfaces and types

**Files to Create**:
1. `src/lib/voting/registry/types.ts` - Registration types
2. `src/lib/voting/eligibility/types.ts` - Eligibility types
3. `src/lib/voting/voter-roll/types.ts` - Voter roll types
4. `src/lib/voting/credentials/types.ts` - Credential types

**Dependencies**: None (pure type definitions)

**Deliverables**:
- Complete type definitions for all Phase 2 components
- Exported from respective index.ts files
- Documentation comments on all interfaces

**Validation**:
- TypeScript compilation succeeds
- No circular dependencies
- All types properly exported

---

### Stage 2: Voter Registry Core (Week 1-2)

**Goal**: Implement basic voter registration system

**Files to Create**:
1. `src/lib/voting/registry/voter-registry.ts`
2. `src/lib/voting/registry/voter-registry.spec.ts`
3. `src/lib/voting/registry/index.ts`

**Implementation Details**:

```typescript
// voter-registry.ts structure
export class VoterRegistry implements IVoterRegistry {
  private registrations: Map<string, VoterRegistration>;
  private memberIndex: Map<string, string>;
  private authority: IMember;
  private auditLog: ImmutableAuditLog;
  
  constructor(authority: IMember) {
    // Initialize maps and audit log
  }
  
  async registerVoter(
    member: IMember,
    criteria: EligibilityCriteria,
    registrar: IMember,
    metadata?: Record<string, unknown>
  ): Promise<VoterRegistration> {
    // 1. Generate unique voterId
    // 2. Check for duplicates
    // 3. Create registration record
    // 4. Sign with authority
    // 5. Store in maps
    // 6. Log to audit trail
    // 7. Return registration
  }
  
  // Implement remaining interface methods
}
```

**Test Coverage**:
- Register new voter
- Prevent duplicate registration
- Update existing registration
- Query by voterId and memberId
- Registration history with version control
- Audit log verification

**Dependencies**: 
- ImmutableAuditLog (existing)
- IMember interface (existing)

---

### Stage 3: Eligibility Verification (Week 2)

**Goal**: Implement configurable eligibility rules engine

**Files to Create**:
1. `src/lib/voting/eligibility/eligibility-verifier.ts`
2. `src/lib/voting/eligibility/rules.ts` - Built-in rules
3. `src/lib/voting/eligibility/eligibility-verifier.spec.ts`
4. `src/lib/voting/eligibility/index.ts`

**Implementation Details**:

```typescript
// eligibility-verifier.ts structure
export class EligibilityVerifier implements IEligibilityVerifier {
  private customRules: Map<string, CustomEligibilityRule>;
  private defaultCriteria: EligibilityCriteria;
  private auditLog: ImmutableAuditLog;
  
  async verifyEligibility(
    voter: VoterRegistration,
    poll: Poll,
    authority: IMember
  ): Promise<EligibilityCheckResult> {
    // 1. Check registration status
    // 2. Validate age requirements
    // 3. Validate jurisdiction
    // 4. Validate citizenship
    // 5. Run custom rules
    // 6. Generate signed result
    // 7. Log check to audit trail
    // 8. Return result
  }
  
  // Built-in rule validators
  private validateAge(voter: VoterRegistration): boolean;
  private validateJurisdiction(voter: VoterRegistration, poll: Poll): boolean;
  private validateCitizenship(voter: VoterRegistration): boolean;
}

// rules.ts - Built-in rules
export const BUILT_IN_RULES = {
  minimumAge: (minAge: number) => (voter: VoterRegistration) => {
    // Calculate age from metadata
    // Return true if meets minimum
  },
  
  jurisdictionMatch: (voter: VoterRegistration, poll: Poll) => {
    // Check voter jurisdiction matches poll jurisdiction
  },
  
  activeStatus: (voter: VoterRegistration) => {
    // Check registration status is Active
  }
};
```

**Test Coverage**:
- Age validation (min/max)
- Jurisdiction matching
- Citizenship validation
- Custom rule execution
- Batch verification
- Failed rule reporting
- Audit logging

**Dependencies**:
- VoterRegistry (Stage 2)
- Poll (existing)

---

### Stage 4: Credential Issuance (Week 3)

**Goal**: Issue cryptographic credentials to voters

**Files to Create**:
1. `src/lib/voting/credentials/credential-issuer.ts`
2. `src/lib/voting/credentials/credential-types.ts`
3. `src/lib/voting/credentials/credential-issuer.spec.ts`
4. `src/lib/voting/credentials/index.ts`

**Implementation Details**:

```typescript
// credential-issuer.ts structure
export class CredentialIssuer implements ICredentialIssuer {
  private credentials: Map<string, VoterCredential>;
  private voterCredentials: Map<string, Set<string>>;
  private authority: IMember;
  private auditLog: ImmutableAuditLog;
  
  async issueCredential(
    voter: VoterRegistration,
    type: CredentialType,
    authority: IMember,
    options?: CredentialOptions
  ): Promise<VoterCredential> {
    // 1. Validate voter registration
    // 2. Generate unique credentialId
    // 3. Create credential based on type
    // 4. Sign with authority
    // 5. Store credential
    // 6. Log issuance
    // 7. Return credential
  }
  
  async issueVotingToken(
    voter: VoterRegistration,
    poll: Poll,
    authority: IMember
  ): Promise<VotingTokenCredential> {
    // Poll-specific token generation
    // Single-use token with poll binding
  }
  
  async verifyCredential(
    credential: VoterCredential,
    authority: IMember
  ): Promise<boolean> {
    // 1. Verify signature
    // 2. Check expiration
    // 3. Validate structure
    // 4. Return result
  }
}

// credential-types.ts - Type-specific implementations
export class BearerTokenCredentialFactory {
  static create(
    voterId: Uint8Array,
    authority: IMember,
    options?: CredentialOptions
  ): BearerTokenCredential {
    // Generate bearer token
    // Add nonce for uniqueness
    // Sign with authority
  }
}

export class VotingTokenCredentialFactory {
  static create(
    voterId: Uint8Array,
    pollId: Uint8Array,
    authority: IMember
  ): VotingTokenCredential {
    // Generate poll-specific token
    // Bind to poll ID
    // Mark as single-use
  }
}
```

**Test Coverage**:
- Issue bearer token
- Issue voting token
- Issue poll-specific credentials
- Verify valid credentials
- Reject expired credentials
- Reject forged credentials
- Multiple credentials per voter
- Credential expiration

**Dependencies**:
- VoterRegistry (Stage 2)
- Poll (existing)

---

### Stage 5: Credential Revocation (Week 3-4)

**Goal**: Implement immediate credential revocation with CRL

**Files to Create**:
1. `src/lib/voting/credentials/revocation-manager.ts`
2. `src/lib/voting/credentials/crl.ts`
3. `src/lib/voting/credentials/ocsp.ts`
4. `src/lib/voting/credentials/revocation-manager.spec.ts`

**Implementation Details**:

```typescript
// revocation-manager.ts structure
export class CredentialRevocationManager implements ICredentialRevocationManager {
  private revocations: Map<string, CredentialRevocation>;
  private crl: CertificateRevocationList;
  private authority: IMember;
  private auditLog: ImmutableAuditLog;
  
  async revokeCredential(
    credentialId: Uint8Array,
    reason: RevocationReason,
    justification: string,
    authority: IMember
  ): Promise<CredentialRevocation> {
    // 1. Validate credential exists
    // 2. Create revocation record
    // 3. Sign with authority
    // 4. Add to revocation map
    // 5. Update CRL
    // 6. Log revocation
    // 7. Return revocation record
  }
  
  async getCRL(): Promise<CertificateRevocationList> {
    // Generate current CRL
    // Include all revoked credentials
    // Sign with authority
    // Return CRL
  }
  
  async checkStatus(credentialId: Uint8Array): Promise<OCSPResponse> {
    // Check if credential is revoked
    // Generate OCSP response
    // Sign response
    // Return status
  }
}

// crl.ts - CRL generation
export class CRLGenerator {
  static generate(
    revocations: CredentialRevocation[],
    authority: IMember,
    version: number
  ): CertificateRevocationList {
    // Create CRL structure
    // Add all revocations
    // Set update times
    // Sign with authority
  }
  
  static verify(
    crl: CertificateRevocationList,
    authority: IMember
  ): boolean {
    // Verify CRL signature
    // Check version
    // Validate structure
  }
}

// ocsp.ts - OCSP implementation
export class OCSPResponder {
  static generateResponse(
    credentialId: Uint8Array,
    status: CredentialStatus,
    revocation: CredentialRevocation | null,
    authority: IMember
  ): OCSPResponse {
    // Create OCSP response
    // Include status and revocation info
    // Sign with authority
  }
}
```

**Test Coverage**:
- Revoke single credential
- Revoke all voter credentials
- CRL generation
- CRL verification
- OCSP status check
- Prevent revoked credential use
- Revocation audit trail
- Revocation reasons

**Dependencies**:
- CredentialIssuer (Stage 4)

---

### Stage 6: Voter Roll Management (Week 4-5)

**Goal**: Import/export voter rolls with duplicate detection

**Files to Create**:
1. `src/lib/voting/voter-roll/voter-roll-manager.ts`
2. `src/lib/voting/voter-roll/duplicate-detector.ts`
3. `src/lib/voting/voter-roll/importers/csv-importer.ts`
4. `src/lib/voting/voter-roll/importers/json-importer.ts`
5. `src/lib/voting/voter-roll/voter-roll-manager.spec.ts`

**Implementation Details**:

```typescript
// voter-roll-manager.ts structure
export class VoterRollManager implements IVoterRollManager {
  private registry: IVoterRegistry;
  private versions: Map<string, VoterRollVersion[]>;
  private authority: IMember;
  
  async importRoll(
    roll: VoterRollImport,
    registrar: IMember,
    options?: ImportOptions
  ): Promise<VoterRollImportResult> {
    // 1. Validate import format
    // 2. Parse voter entries
    // 3. Detect duplicates
    // 4. Register voters in batches
    // 5. Track errors and warnings
    // 6. Create version record
    // 7. Return import result
  }
  
  async detectDuplicates(
    strategy: DuplicateDetectionStrategy
  ): Promise<DuplicateGroup[]> {
    // Run duplicate detection algorithm
    // Group potential duplicates
    // Calculate confidence scores
    // Return groups
  }
  
  async exportRoll(
    jurisdiction: string,
    format: VoterRollFormat,
    authority: IMember
  ): Promise<VoterRollExport> {
    // 1. Query voters by jurisdiction
    // 2. Format according to type
    // 3. Sign export
    // 4. Return export
  }
}

// duplicate-detector.ts
export class DuplicateDetector {
  static detectExactMatch(
    voters: VoterRegistration[]
  ): DuplicateGroup[] {
    // Find exact matches on key fields
  }
  
  static detectFuzzyName(
    voters: VoterRegistration[]
  ): DuplicateGroup[] {
    // Use Levenshtein distance for name matching
  }
  
  static detectCombined(
    voters: VoterRegistration[]
  ): DuplicateGroup[] {
    // Combine multiple strategies
    // Weight by confidence
  }
}

// csv-importer.ts
export class CSVImporter {
  static parse(csvData: string): VoterRollEntry[] {
    // Parse CSV format
    // Validate columns
    // Return entries
  }
}

// json-importer.ts
export class JSONImporter {
  static parse(jsonData: string): VoterRollEntry[] {
    // Parse JSON format
    // Validate schema
    // Return entries
  }
}
```

**Test Coverage**:
- Import CSV voter roll
- Import JSON voter roll
- Detect exact duplicates
- Detect fuzzy name matches
- Export voter roll
- Version control
- Rollback to previous version
- Batch processing
- Error handling

**Dependencies**:
- VoterRegistry (Stage 2)

---

### Stage 7: Integration & Flow (Week 5)

**Goal**: Integrate all components into cohesive voting flow

**Files to Create**:
1. `src/lib/voting/integration/registration-poll-flow.ts`
2. `src/lib/voting/integration/registration-poll-flow.spec.ts`
3. `src/lib/voting/integration/index.ts`

**Implementation Details**:

```typescript
// registration-poll-flow.ts
export class RegistrationPollFlow {
  private registry: IVoterRegistry;
  private verifier: IEligibilityVerifier;
  private issuer: ICredentialIssuer;
  private revocationManager: ICredentialRevocationManager;
  
  constructor(
    registry: IVoterRegistry,
    verifier: IEligibilityVerifier,
    issuer: ICredentialIssuer,
    revocationManager: ICredentialRevocationManager
  ) {
    // Store dependencies
  }
  
  async registerAndIssueCredential(
    member: IMember,
    criteria: EligibilityCriteria,
    registrar: IMember
  ): Promise<{
    registration: VoterRegistration;
    credential: VoterCredential;
  }> {
    // 1. Register voter
    // 2. Issue credential
    // 3. Return both
  }
  
  async verifyAndVote(
    voter: IMember,
    poll: Poll,
    vote: EncryptedVote,
    authority: IMember
  ): Promise<VoteReceipt> {
    // 1. Get voter registration
    // 2. Verify eligibility
    // 3. Get credentials
    // 4. Check revocation status
    // 5. Cast vote
    // 6. Return receipt
  }
  
  async revokeAndPreventVoting(
    voterId: Uint8Array,
    reason: RevocationReason,
    justification: string,
    authority: IMember
  ): Promise<void> {
    // 1. Revoke all credentials
    // 2. Update registration status
    // 3. Log action
  }
}
```

**Test Coverage**:
- Full registration-to-vote flow
- Eligibility rejection prevents voting
- Revoked credential prevents voting
- Multiple polls with same registration
- Credential lifecycle
- Error handling at each stage

**Dependencies**:
- All previous stages

---

### Stage 8: Demo Implementation (Week 6)

**Goal**: Create minimal demo for showcase

**Files to Create**:
1. `src/lib/voting/demo/phase2-demo.ts`
2. `src/lib/voting/demo/phase2-demo.spec.ts`
3. `src/lib/voting/demo/sample-data.ts`

**Demo Scenario**:

```typescript
// phase2-demo.ts
export async function runPhase2Demo() {
  console.log('=== Phase 2: Voter Registration Demo ===\n');
  
  // 1. Setup
  const authority = await createAuthority();
  const registry = new VoterRegistry(authority);
  const verifier = new EligibilityVerifier(defaultCriteria, authority);
  const issuer = new CredentialIssuer(authority);
  const revocationManager = new CredentialRevocationManager(authority);
  
  // 2. Register 10 voters
  console.log('Registering 10 voters...');
  const voters = await registerSampleVoters(registry, authority);
  console.log(`✓ Registered ${voters.length} voters\n`);
  
  // 3. Issue credentials
  console.log('Issuing credentials...');
  const credentials = await issueCredentials(voters, issuer, authority);
  console.log(`✓ Issued ${credentials.length} credentials\n`);
  
  // 4. Create poll
  console.log('Creating poll...');
  const poll = PollFactory.createPlurality(['Alice', 'Bob', 'Charlie'], authority);
  console.log('✓ Poll created\n');
  
  // 5. Verify eligibility and vote
  console.log('Verifying eligibility and casting votes...');
  let successfulVotes = 0;
  for (const voter of voters.slice(0, 8)) {
    const registration = await registry.getRegistrationByMember(voter.id);
    const eligibility = await verifier.verifyEligibility(registration!, poll, authority);
    
    if (eligibility.eligible) {
      const encoder = new VoteEncoder(authority.votingPublicKey!);
      const vote = encoder.encodePlurality(Math.floor(Math.random() * 3), 3);
      poll.vote(voter, vote);
      successfulVotes++;
    }
  }
  console.log(`✓ ${successfulVotes} votes cast\n`);
  
  // 6. Revoke a credential
  console.log('Revoking credential for voter 9...');
  const voter9Registration = await registry.getRegistrationByMember(voters[8].id);
  const voter9Credentials = await issuer.getCredentialsForVoter(voter9Registration!.voterId);
  await revocationManager.revokeCredential(
    voter9Credentials[0].credentialId,
    RevocationReason.Administrative,
    'Demo revocation',
    authority
  );
  console.log('✓ Credential revoked\n');
  
  // 7. Try to vote with revoked credential (should fail)
  console.log('Attempting to vote with revoked credential...');
  try {
    const registration = await registry.getRegistrationByMember(voters[8].id);
    const credentials = await issuer.getCredentialsForVoter(registration!.voterId);
    const isRevoked = await revocationManager.isRevoked(credentials[0].credentialId);
    
    if (isRevoked) {
      console.log('✗ Vote rejected: Credential revoked\n');
    }
  } catch (error) {
    console.log('✗ Vote rejected\n');
  }
  
  // 8. Close and tally
  console.log('Closing poll and tallying...');
  poll.close();
  const tallier = new PollTallier(authority, authority.votingPrivateKey!, authority.votingPublicKey!);
  const results = tallier.tally(poll);
  console.log('✓ Poll tallied\n');
  
  // 9. Display results
  console.log('=== Results ===');
  console.log(`Winner: ${results.choices[results.winner!]}`);
  console.log(`Tallies: ${results.tallies.map(t => t.toString()).join(', ')}`);
  console.log(`Total voters: ${results.voterCount}\n`);
  
  // 10. Show audit trail
  console.log('=== Audit Trail ===');
  const auditEntries = registry.getAuditLog().getEntries();
  console.log(`Total audit entries: ${auditEntries.length}`);
  console.log(`Chain valid: ${registry.getAuditLog().verifyChain()}\n`);
  
  // 11. Show CRL
  console.log('=== Certificate Revocation List ===');
  const crl = await revocationManager.getCRL();
  console.log(`Revoked credentials: ${crl.revokedCredentials.length}`);
  console.log(`CRL version: ${crl.version}\n`);
  
  console.log('=== Demo Complete ===');
}

// sample-data.ts
export const SAMPLE_VOTERS = [
  { name: 'Alice Johnson', jurisdiction: 'District-1', age: 35 },
  { name: 'Bob Smith', jurisdiction: 'District-1', age: 42 },
  { name: 'Charlie Brown', jurisdiction: 'District-2', age: 28 },
  // ... 7 more
];

export const DEFAULT_CRITERIA: EligibilityCriteria = {
  minAge: 18,
  jurisdiction: 'District-1',
  citizenship: ['US']
};
```

**Demo Output**:
```
=== Phase 2: Voter Registration Demo ===

Registering 10 voters...
✓ Registered 10 voters

Issuing credentials...
✓ Issued 10 credentials

Creating poll...
✓ Poll created

Verifying eligibility and casting votes...
✓ 8 votes cast

Revoking credential for voter 9...
✓ Credential revoked

Attempting to vote with revoked credential...
✗ Vote rejected: Credential revoked

Closing poll and tallying...
✓ Poll tallied

=== Results ===
Winner: Alice
Tallies: 4, 2, 2
Total voters: 8

=== Audit Trail ===
Total audit entries: 25
Chain valid: true

=== Certificate Revocation List ===
Revoked credentials: 1
CRL version: 1

=== Demo Complete ===
```

---

## Testing Strategy

### Unit Test Requirements

Each component must have:
- 95%+ code coverage
- All public methods tested
- Error cases tested
- Edge cases tested
- Async operations tested

### Integration Test Requirements

- Full registration-to-vote flow
- Multi-component interactions
- Error propagation
- Audit trail verification
- Performance benchmarks

### Security Test Requirements

- Credential forgery attempts
- Signature verification
- Revocation enforcement
- Duplicate prevention
- Replay attack resistance

---

## Performance Targets

### Registration Operations
- Register voter: < 10ms
- Query registration: < 1ms
- Update registration: < 10ms

### Eligibility Verification
- Single verification: < 5ms
- Batch verification (100 voters): < 100ms

### Credential Operations
- Issue credential: < 10ms
- Verify credential: < 5ms
- Check revocation: < 1ms

### Voter Roll Operations
- Import 1000 voters: < 1s
- Detect duplicates (1000 voters): < 500ms
- Export voter roll: < 100ms

---

## Documentation Requirements

### Code Documentation
- JSDoc comments on all public interfaces
- Usage examples in comments
- Type documentation
- Error documentation

### User Documentation
- README for Phase 2
- API reference
- Integration guide
- Security considerations
- Demo walkthrough

---

## Deployment Checklist

### Pre-Deployment
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Security tests passing
- [ ] Performance benchmarks met
- [ ] Code review completed
- [ ] Documentation complete

### Deployment
- [ ] Version bump
- [ ] Changelog updated
- [ ] Demo tested
- [ ] Examples verified
- [ ] Types exported correctly

### Post-Deployment
- [ ] Demo runs successfully
- [ ] Integration with Phase 1 verified
- [ ] Performance monitoring
- [ ] Security audit scheduled

---

## Risk Mitigation

### Technical Risks

**Risk**: Credential forgery
**Mitigation**: Cryptographic signatures on all credentials, verification before use

**Risk**: Performance degradation with large voter rolls
**Mitigation**: Batch processing, indexing, lazy loading

**Risk**: Duplicate detection false positives
**Mitigation**: Multiple strategies, confidence scores, manual review

**Risk**: CRL size growth
**Mitigation**: Periodic CRL rotation, delta CRLs, OCSP preferred

### Integration Risks

**Risk**: Breaking changes to existing Poll system
**Mitigation**: Backward compatibility, optional integration, feature flags

**Risk**: Audit log conflicts
**Mitigation**: Separate audit logs per component, merge for reporting

---

## Success Criteria

### Functional
- [ ] All EARS requirements implemented
- [ ] All interfaces defined and implemented
- [ ] Demo runs end-to-end
- [ ] Integration with Phase 1 working

### Quality
- [ ] 95%+ test coverage
- [ ] Zero critical security issues
- [ ] Performance targets met
- [ ] Documentation complete

### Showcase
- [ ] Demo is impressive and clear
- [ ] Shows all major features
- [ ] Runs without errors
- [ ] Explains security properties

---

## Timeline Summary

- **Week 1**: Foundation types + Registry core
- **Week 2**: Eligibility verification
- **Week 3**: Credential issuance + Revocation
- **Week 4**: Voter roll management
- **Week 5**: Integration + Testing
- **Week 6**: Demo + Documentation

**Total**: 6 weeks for complete Phase 2 implementation
