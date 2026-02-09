import type { ZKProof } from './zk-proof';

/**
 * Combined zero-knowledge proof from multiple Guardians.
 *
 * Aggregates individual proofs to demonstrate that the combined
 * decryption was performed correctly by authorized Guardians.
 */
export interface CombinedZKProof {
  /** Individual proofs from each Guardian */
  readonly partialProofs: readonly ZKProof[];
  /** Aggregated verification data */
  readonly aggregatedCommitment: bigint;
  /** Hash of all inputs */
  readonly inputHash: Uint8Array;
}
