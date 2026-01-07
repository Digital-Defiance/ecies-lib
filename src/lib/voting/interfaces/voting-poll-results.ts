/**
 * Result of a voting poll with decrypted tallies
 */
export interface VotingPollResults {
  /** Total number of votes cast */
  totalVotes: bigint;
  /** Tallies for each choice */
  tallies: bigint[];
  /** Choice names */
  choices: string[];
  /** Percentage for each choice (0-100) */
  percentages: number[];
  /** Index of the winning choice */
  winnerIndex: number;
  /** Name of the winning choice */
  winnerName: string;
  /** Number of unique voters */
  voterCount: number;
}
