/**
 * Voting system types - browser compatible
 * Uses ecies-lib Member interface
 */
import type { IMember } from '../../interfaces/member';

// Re-export IMember for convenience
export type { IMember };

/**
 * Voting methods supported by the poll system.
 *
 * Methods are classified by security level:
 * - Fully Homomorphic: Single-round, privacy-preserving (no intermediate decryption)
 * - Multi-Round: Requires decryption between rounds (less secure)
 * - Insecure: Cannot be made secure with Paillier encryption
 */
export enum VotingMethod {
  // ✅ Fully homomorphic (single-round, privacy-preserving)
  /** First-past-the-post voting - most votes wins */
  Plurality = 'plurality',
  /** Approval voting - vote for multiple candidates */
  Approval = 'approval',
  /** Weighted voting - stakeholder voting with configurable weights */
  Weighted = 'weighted',
  /** Borda count - ranked voting with point allocation */
  Borda = 'borda',
  /** Score voting - rate candidates 0-10 */
  Score = 'score',
  /** Yes/No referendum */
  YesNo = 'yes-no',
  /** Yes/No/Abstain referendum with abstention option */
  YesNoAbstain = 'yes-no-abstain',
  /** Supermajority - requires 2/3 or 3/4 threshold */
  Supermajority = 'supermajority',

  // ⚠️ Multi-round (requires decryption between rounds)
  /** Ranked choice voting (IRV) - instant runoff with elimination */
  RankedChoice = 'ranked-choice',
  /** Two-round voting - top 2 runoff election */
  TwoRound = 'two-round',
  /** STAR voting - Score Then Automatic Runoff */
  STAR = 'star',
  /** Single Transferable Vote - proportional representation */
  STV = 'stv',

  // ❌ Insecure (requires non-additive operations or reveals individual votes)
  /** Quadratic voting - requires sqrt operation (not homomorphic) */
  Quadratic = 'quadratic',
  /** Consensus voting - requires 95%+ agreement (no privacy) */
  Consensus = 'consensus',
  /** Consent-based voting - sociocracy style (no privacy) */
  ConsentBased = 'consent-based',
}

/**
 * Cryptographically signed receipt proving a vote was cast.
 * Can be used to verify participation without revealing vote content.
 */
export interface VoteReceipt {
  /** Unique identifier of the voter */
  voterId: Uint8Array;
  /** Unique identifier of the poll */
  pollId: Uint8Array;
  /** Unix timestamp when vote was cast */
  timestamp: number;
  /** Cryptographic signature from poll authority */
  signature: Uint8Array;
  /** Random nonce for uniqueness */
  nonce: Uint8Array;
}

/**
 * Results of a completed poll after tallying.
 * Includes winner(s), tallies, and round-by-round data for multi-round methods.
 */
export interface PollResults {
  /** Voting method used */
  method: VotingMethod;
  /** Array of choice names */
  choices: string[];
  /** Index of winning choice (undefined if tie) */
  winner?: number;
  /** Indices of tied winners (for ties or multi-winner methods) */
  winners?: number[];
  /** Indices of eliminated choices (for RCV) */
  eliminated?: number[];
  /** Round-by-round results (for multi-round methods) */
  rounds?: RoundResult[];
  /** Final vote tallies for each choice */
  tallies: bigint[];
  /** Total number of unique voters */
  voterCount: number;
}

/**
 * Results from a single round of multi-round voting.
 * Used in RCV, Two-Round, STAR, and STV methods.
 */
export interface RoundResult {
  /** Round number (1-indexed) */
  round: number;
  /** Vote tallies for this round */
  tallies: bigint[];
  /** Index of choice eliminated this round (if any) */
  eliminated?: number;
  /** Index of winner determined this round (if any) */
  winner?: number;
}

/**
 * Encrypted vote data using Paillier homomorphic encryption.
 * Structure varies by voting method.
 */
export interface EncryptedVote {
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
  plaintext?: PlaintextVote;
}

/**
 * Plaintext vote data for insecure voting methods.
 * WARNING: Only use for Quadratic, Consensus, or ConsentBased methods.
 */
export interface PlaintextVote {
  /** Unique identifier of the voter */
  voterId: Uint8Array;
  /** Single choice index */
  choiceIndex?: number;
  /** Multiple choice indices */
  choices?: number[];
  /** Vote weight */
  weight?: bigint;
  /** Objection text (for consent-based voting) */
  objection?: string;
}

/**
 * Configuration for supermajority voting.
 * Defines the required threshold as a fraction (e.g., 2/3, 3/4).
 */
export interface SupermajorityConfig {
  /** Numerator of the fraction (e.g., 2 for 2/3) */
  numerator: number;
  /** Denominator of the fraction (e.g., 3 for 2/3) */
  denominator: number;
}
