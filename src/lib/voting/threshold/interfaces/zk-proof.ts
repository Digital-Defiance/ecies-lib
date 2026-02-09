/**
 * Zero-knowledge proof for partial decryption correctness.
 *
 * Proves that a partial decryption was computed correctly using
 * the Guardian's actual key share without revealing the share.
 */
export interface ZKProof {
  /** Proof commitment */
  readonly commitment: bigint;
  /** Proof challenge */
  readonly challenge: bigint;
  /** Proof response */
  readonly response: bigint;
}
