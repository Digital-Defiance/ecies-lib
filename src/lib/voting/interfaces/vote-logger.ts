/**
 * Vote logger interface for recording encrypted votes.
 */
import type { PlatformID } from '../../../interfaces';
export interface IVoteLogger<TID extends PlatformID = Uint8Array> {
  appendVote(
    voterId: TID,
    encryptedVote: bigint[],
    timestamp: number,
  ): Promise<void>;
  getVoteCount(): number;
  replayVotes(): AsyncGenerator<{
    voterId: TID;
    encryptedVote: bigint[];
    timestamp: number;
  }>;
}
