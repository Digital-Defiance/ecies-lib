# Threshold Voting Security Considerations

This document describes security considerations and best practices for deploying the Real-Time Threshold Voting system. It covers Guardian key management, ceremony security, and operational guidelines.

## Cryptographic Foundation

The threshold voting system is based on Damgård et al.'s "Generalization of Paillier's Public-Key System with Applications to Electronic Voting." The core security guarantee is:

- **k-of-n threshold**: Any k Guardians can cooperate to decrypt aggregate tallies, but fewer than k Guardians learn nothing about the plaintext.
- **Zero-knowledge proofs**: Every partial decryption includes a ZK proof of correct computation, preventing Guardians from submitting invalid partials.
- **Homomorphic aggregation**: Individual votes are never decrypted; only aggregate tallies are revealed.

## Guardian Key Management

### Key Generation

- Generate threshold keys in a secure, air-gapped environment when possible.
- Use a key bit length of at least 2048 bits (the default). For high-security elections, consider 3072 bits.
- Verify that the generated public key is compatible with standard Paillier encryption before distributing shares.
- Record the key generation event in the audit log, including the public key hash and (k, n) configuration.

### Key Share Distribution

- Distribute key shares over authenticated, encrypted channels (e.g., TLS with mutual authentication).
- Never transmit key shares in plaintext.
- Each Guardian should receive exactly one share and confirm receipt.
- Store the share index-to-Guardian mapping in the audit log.
- Consider using the `encryptedWrapper` field in `SerializedKeyShare` for an additional layer of encryption during distribution.

### Key Share Storage

- Guardians should store key shares in hardware security modules (HSMs) or encrypted storage with strong access controls.
- Key shares should never be stored in plaintext on disk or in memory longer than necessary.
- Implement key share backup procedures — losing more than (n - k) shares makes decryption impossible.
- Consider splitting each Guardian's share further using a secondary secret sharing scheme for disaster recovery.

### Key Share Rotation

- The system supports key share rotation without regenerating all shares (Requirement 12.5).
- Rotate a Guardian's share if there is any suspicion of compromise.
- Record all rotation events in the audit log.
- After rotation, verify that the new share produces valid partial decryptions with a test ciphertext.

## Ceremony Security

### Ceremony Nonces

- Each decryption ceremony generates a unique nonce to prevent replay attacks (Requirement 12.6).
- Guardians must include the ceremony nonce in their partial decryptions.
- The CeremonyCoordinator rejects partials with mismatched nonces.
- Never reuse ceremony nonces across different ceremonies.

### Duplicate Submission Prevention

- The CeremonyCoordinator prevents the same Guardian from submitting multiple partial decryptions for the same ceremony (Requirement 6.5).
- This prevents a compromised Guardian from flooding the system with invalid partials.

### ZK Proof Verification

- Every partial decryption is verified against its ZK proof before acceptance.
- Invalid proofs are rejected and logged as security events.
- The combined decryption also produces a combined ZK proof that third parties can verify.
- Never skip proof verification, even in testing or staging environments.

### Ceremony Timeouts

- Configure ceremony timeouts appropriate to your deployment (default: 300 seconds).
- If a ceremony times out before collecting k partials, it is marked as failed and can be retried.
- Monitor timeout frequency — frequent timeouts may indicate Guardian availability issues or network problems.

### Minimum Interval Enforcement

- The IntervalScheduler enforces a minimum interval between ceremonies to prevent excessive decryption operations.
- Set the minimum interval based on your security requirements and Guardian availability.
- Excessively frequent decryptions could theoretically leak information about voting patterns through timing analysis.

## Operational Security

### Guardian Availability

- Ensure at least k Guardians are online and available at all times during voting.
- Monitor Guardian status through the GuardianRegistry's status change events.
- Designate backup Guardians with pre-distributed backup shares for failover.
- Plan for the scenario where exactly k Guardians are available — this is the minimum viable configuration.

### Audit Log Integrity

- The ThresholdAuditLog maintains a cryptographic hash chain for all threshold operations.
- Verify the hash chain integrity regularly during and after elections.
- Export audit logs to immutable storage (e.g., write-once media) for archival.
- All threshold operations are logged before results are revealed (Requirement 12.4).

### Tally Verification

- Publish all interval tallies with their combined ZK proofs to the PublicTallyFeed.
- Third-party auditors can independently verify any published tally using only public information.
- The TallyVerifier checks: proof validity, Guardian authorization, tally-to-ciphertext match, and timestamp validity.
- Encourage multiple independent verifiers to check results.

### Network Security

- All communication between Guardians and the CeremonyCoordinator should use TLS 1.3 or later.
- Authenticate Guardians using their verification keys or mutual TLS certificates.
- Consider using a dedicated, isolated network for ceremony communication.
- Implement rate limiting on partial decryption submissions.

## Threat Model

### Protected Against

- **Single point of compromise**: No single Guardian can decrypt votes alone.
- **Invalid partial decryptions**: ZK proofs ensure only correctly computed partials are accepted.
- **Replay attacks**: Ceremony nonces prevent reuse of partial decryptions.
- **Premature result disclosure**: Tallies are only revealed after k Guardians cooperate.
- **Audit tampering**: Hash-chained audit log detects any modification.
- **Vote manipulation**: Homomorphic encryption prevents tampering with individual votes.

### Not Protected Against (Requires Additional Measures)

- **Coercion of k or more Guardians**: If k Guardians collude or are coerced, they can decrypt tallies at will. Mitigate by choosing k and n carefully and selecting Guardians from independent organizations.
- **Side-channel attacks on Guardian devices**: Key shares on compromised devices may be extracted. Mitigate with HSMs.
- **Denial of service**: If more than (n - k) Guardians are unavailable, decryption is impossible. Mitigate with backup Guardians and redundant infrastructure.
- **Traffic analysis**: Timing of interval decryptions may reveal voting patterns. Mitigate with fixed-interval scheduling rather than vote-count-based triggers.

## Configuration Recommendations

### Small Organization (Board Vote)

- **Configuration**: 2-of-3 Guardians
- **Interval**: Single decryption at poll close
- **Key size**: 2048 bits
- **Ceremony timeout**: 600 seconds (10 minutes)

### Corporate Governance (Shareholder Vote)

- **Configuration**: 3-of-5 Guardians
- **Interval**: Vote-count-based (e.g., every 1000 votes)
- **Key size**: 2048 bits
- **Ceremony timeout**: 300 seconds (5 minutes)

### Government Election (US-Scale)

- **Configuration**: 5-of-9 Guardians
- **Interval**: Time-based (e.g., hourly)
- **Key size**: 3072 bits
- **Ceremony timeout**: 300 seconds (5 minutes)
- **Additional**: HSM-stored key shares, dedicated ceremony network, multiple independent verifiers
