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
