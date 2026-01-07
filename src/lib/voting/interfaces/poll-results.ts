import { VotingMethod } from '../enumerations/voting-method';
import { RoundResult } from './round-result';

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
