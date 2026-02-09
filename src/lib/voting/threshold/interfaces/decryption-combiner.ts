import type { PublicKey } from 'paillier-bigint';
import type { CombinedDecryption } from './combined-decryption';
import type { PartialDecryption } from './partial-decryption';
import type { ThresholdKeyConfig } from './threshold-key-config';

/**
 * Interface for combining partial decryptions.
 */
export interface IDecryptionCombiner {
  /** Combine k partial decryptions into final plaintext */
  combine(
    partials: readonly PartialDecryption[],
    encryptedTally: bigint[],
    publicKey: PublicKey,
    config: ThresholdKeyConfig,
  ): CombinedDecryption;

  /** Verify a combined decryption */
  verifyCombined(
    combined: CombinedDecryption,
    encryptedTally: bigint[],
    verificationKeys: readonly Uint8Array[],
    publicKey: PublicKey,
  ): boolean;
}
