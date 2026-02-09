import type { CombinedZKProof } from './combined-zk-proof';

/**
 * Result of combining k partial decryptions.
 *
 * Contains the decrypted plaintext tallies along with proof
 * that the decryption was performed correctly.
 */
export interface CombinedDecryption {
  /** The decrypted plaintext tallies */
  readonly tallies: bigint[];
  /** Combined proof of correct decryption */
  readonly combinedProof: CombinedZKProof;
  /** Indices of participating Guardians */
  readonly participatingGuardians: readonly number[];
  /** Ceremony identifier */
  readonly ceremonyId: string;
  /** Timestamp of combination */
  readonly timestamp: number;
}
