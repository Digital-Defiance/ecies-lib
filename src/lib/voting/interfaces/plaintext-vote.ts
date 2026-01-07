import type { PlatformID } from '../../../interfaces';

/**
 * Plaintext vote data for insecure voting methods.
 * WARNING: Only use for Quadratic, Consensus, or ConsentBased methods.
 */
export interface PlaintextVote<TID extends PlatformID = Uint8Array> {
  /** Unique identifier of the voter */
  voterId: TID;
  /** Single choice index */
  choiceIndex?: number;
  /** Multiple choice indices */
  choices?: number[];
  /** Vote weight */
  weight?: bigint;
  /** Objection text (for consent-based voting) */
  objection?: string;
}
