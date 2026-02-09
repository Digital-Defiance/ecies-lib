/**
 * Tally Verifier
 *
 * Third-party verification of published interval tallies.
 * Validates that tallies were correctly decrypted by checking:
 * 1. Combined ZK proof validity
 * 2. Tally consistency with encrypted aggregate
 * 3. Guardian authorization
 * 4. Timestamp validity
 *
 * Designed to be implementable by any third party using only public information.
 *
 * @module voting/threshold
 */

import type { PublicKey } from 'paillier-bigint';
import type { PlatformID } from '../../../interfaces/platform-id';
import { DecryptionCombiner } from './decryption-combiner';
import type {
  IntervalTally,
  VerificationResult,
  ITallyVerifier,
  ThresholdKeyConfig,
} from './interfaces';

/**
 * Verifies published interval tallies using only public information.
 *
 * Each verification produces a detailed {@link VerificationResult} indicating
 * which checks passed and which failed, enabling auditors to pinpoint issues.
 *
 * @example
 * ```typescript
 * const verifier = new TallyVerifier(publicKey, verificationKeys, thresholdConfig, theta);
 *
 * const result = verifier.verify(
 *   publishedTally,
 *   encryptedTally,
 *   verificationKeys,
 *   publicKey,
 *   [1, 2, 3, 5, 7], // registered Guardian indices
 * );
 *
 * if (!result.valid) {
 *   console.error('Verification failed:', result.error);
 *   console.log('Checks:', result.checks);
 * }
 * ```
 */
export class TallyVerifier<
  TID extends PlatformID = Uint8Array,
> implements ITallyVerifier<TID> {
  private readonly combiner: DecryptionCombiner;
  private readonly thresholdConfig: ThresholdKeyConfig;

  constructor(
    publicKey: PublicKey,
    verificationKeys: readonly Uint8Array[],
    thresholdConfig: ThresholdKeyConfig,
    theta: bigint,
  ) {
    this.combiner = new DecryptionCombiner(publicKey, verificationKeys, theta);
    this.thresholdConfig = thresholdConfig;
  }

  /**
   * Verify a published interval tally.
   *
   * Performs four independent checks:
   * 1. **proofValid** – the combined ZK proof is cryptographically valid
   * 2. **guardiansAuthorized** – all participating Guardians are registered
   * 3. **tallyMatchesEncrypted** – the tally is consistent with the encrypted aggregate
   * 4. **timestampValid** – the timestamp is a reasonable positive value
   *
   * @param tally - The published interval tally to verify
   * @param encryptedTally - The encrypted aggregate ciphertexts
   * @param verificationKeys - Public verification keys for all Guardians
   * @param publicKey - The Paillier public key
   * @param registeredGuardians - Indices of all registered Guardians
   * @returns Detailed verification result with per-check status
   */
  verify(
    tally: IntervalTally<TID>,
    encryptedTally: bigint[],
    verificationKeys: readonly Uint8Array[],
    publicKey: PublicKey,
    registeredGuardians: readonly number[],
  ): VerificationResult {
    const errors: string[] = [];

    const proofValid = this.checkProof(
      tally,
      encryptedTally,
      verificationKeys,
      publicKey,
      errors,
    );

    const guardiansAuthorized = this.checkGuardians(
      tally,
      registeredGuardians,
      errors,
    );

    const tallyMatchesEncrypted = this.checkTallyMatchesEncrypted(
      tally,
      encryptedTally,
      errors,
    );

    const timestampValid = this.checkTimestamp(tally, errors);

    const checks = {
      proofValid,
      guardiansAuthorized,
      tallyMatchesEncrypted,
      timestampValid,
    };

    const valid =
      proofValid &&
      guardiansAuthorized &&
      tallyMatchesEncrypted &&
      timestampValid;

    return {
      valid,
      checks,
      ...(errors.length > 0 ? { error: errors.join('; ') } : {}),
    };
  }

  /**
   * Validate the combined ZK proof using the DecryptionCombiner's verification.
   */
  private checkProof(
    tally: IntervalTally<TID>,
    encryptedTally: bigint[],
    verificationKeys: readonly Uint8Array[],
    publicKey: PublicKey,
    errors: string[],
  ): boolean {
    try {
      // Build a CombinedDecryption from the tally to pass to verifyCombined
      const combinedDecryption = {
        tallies: [...tally.tallies],
        combinedProof: tally.proof,
        participatingGuardians: tally.participatingGuardians,
        ceremonyId: '',
        timestamp: tally.timestamp,
      };

      const valid = this.combiner.verifyCombined(
        combinedDecryption,
        encryptedTally,
        verificationKeys,
        publicKey,
      );

      if (!valid) {
        errors.push('Combined ZK proof verification failed');
      }

      return valid;
    } catch (e) {
      errors.push(
        `Proof verification threw: ${e instanceof Error ? e.message : String(e)}`,
      );
      return false;
    }
  }

  /**
   * Verify all participating Guardians are in the registered set
   * and that at least k Guardians participated.
   */
  private checkGuardians(
    tally: IntervalTally<TID>,
    registeredGuardians: readonly number[],
    errors: string[],
  ): boolean {
    const registeredSet = new Set(registeredGuardians);

    // Check that enough Guardians participated
    if (tally.participatingGuardians.length < this.thresholdConfig.threshold) {
      errors.push(
        `Insufficient participating Guardians: ${tally.participatingGuardians.length} < threshold ${this.thresholdConfig.threshold}`,
      );
      return false;
    }

    // Check each participating Guardian is registered
    for (const guardianIndex of tally.participatingGuardians) {
      if (!registeredSet.has(guardianIndex)) {
        errors.push(
          `Guardian ${guardianIndex} is not in the registered Guardian set`,
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Verify the tally dimensions match the encrypted aggregate.
   *
   * A full re-decryption is not possible without key shares (by design),
   * so we verify structural consistency: the number of tally entries
   * must match the number of encrypted ciphertexts.
   */
  private checkTallyMatchesEncrypted(
    tally: IntervalTally<TID>,
    encryptedTally: bigint[],
    errors: string[],
  ): boolean {
    if (encryptedTally.length === 0) {
      errors.push('Encrypted tally is empty');
      return false;
    }

    if (tally.tallies.length !== encryptedTally.length) {
      errors.push(
        `Tally length (${tally.tallies.length}) does not match encrypted tally length (${encryptedTally.length})`,
      );
      return false;
    }

    // Verify tallies are non-negative
    for (let i = 0; i < tally.tallies.length; i++) {
      if (tally.tallies[i] < 0n) {
        errors.push(`Tally at index ${i} is negative: ${tally.tallies[i]}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Verify the timestamp is a valid positive number.
   */
  private checkTimestamp(tally: IntervalTally<TID>, errors: string[]): boolean {
    if (tally.timestamp <= 0) {
      errors.push(`Invalid timestamp: ${tally.timestamp}`);
      return false;
    }

    return true;
  }
}
