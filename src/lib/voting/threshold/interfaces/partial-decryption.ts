import type { ZKProof } from './zk-proof';

/**
 * A partial decryption computed by a Guardian.
 *
 * Multiple partial decryptions (at least k) are combined using
 * Lagrange interpolation to produce the final plaintext.
 */
export interface PartialDecryption {
  /** Guardian's share index */
  readonly guardianIndex: number;
  /** The partial decryption values — one per ciphertext in the encrypted tally */
  readonly values: readonly bigint[];
  /** Zero-knowledge proof of correct computation */
  readonly proof: ZKProof;
  /** Ceremony-specific nonce (replay protection) */
  readonly ceremonyNonce: Uint8Array;
  /** Timestamp of computation */
  readonly timestamp: number;
}
