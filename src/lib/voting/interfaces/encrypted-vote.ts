import type { PlatformID } from '../../../interfaces';
import { PlaintextVote } from './plaintext-vote';

/**
 * Encrypted vote data using Paillier homomorphic encryption.
 * Structure varies by voting method.
 */
export interface EncryptedVote<TID extends PlatformID = Uint8Array> {
  /** Single choice index (for Plurality, Weighted, etc.) */
  choiceIndex?: number;
  /** Multiple choice indices (for Approval voting) */
  choices?: number[];
  /** Ranked choice indices in preference order (for RCV, Borda) */
  rankings?: number[];
  /** Vote weight (for Weighted voting) */
  weight?: bigint;
  /** Score value 0-10 (for Score voting) */
  score?: number;
  /** Array of encrypted vote values (one per choice) */
  encrypted: bigint[];
  /** Plaintext vote data (only for insecure methods) */
  plaintext?: PlaintextVote<TID>;
}
