import type { PlatformID } from '../../../interfaces/platform-id';
import { VotingMethod } from '../enumerations';
import { EncryptedVote } from './encrypted-vote';
import { VoteReceipt } from './voting-receipt';

/**
 * Poll interface for vote aggregation and management.
 * Holds encrypted votes and issues receipts, but cannot decrypt votes.
 */
export interface IPoll<TID extends PlatformID = Uint8Array> {
  /** Poll ID */
  readonly id: TID;
  /** Array of choice names */
  readonly choices: ReadonlyArray<string>;
  /** Voting method */
  readonly method: VotingMethod;
  /** Whether poll is closed to new votes */
  get isClosed(): boolean;
  /** Total number of unique voters */
  get voterCount(): number;
  /** Poll creation timestamp */
  get createdAt(): number;
  /** Poll closed timestamp (undefined if not closed) */
  get closedAt(): number | undefined;

  /**
   * Get encrypted votes for tallying.
   */
  getEncryptedVotes(): ReadonlyMap<string, readonly bigint[]>;

  /**
   * Cast a vote.
   */
  vote(
    voter: import('../../../interfaces').IMember<TID>,
    vote: EncryptedVote<TID>,
  ): VoteReceipt<TID>;

  /**
   * Verify a receipt is valid.
   */
  verifyReceipt(
    voter: import('../../../interfaces').IMember<TID>,
    receipt: VoteReceipt<TID>,
  ): boolean;

  /**
   * Close the poll to new votes.
   */
  close(): void;
}
