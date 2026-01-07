import type { PlatformID } from '../../../interfaces';
import { IVoteLogger } from './vote-logger';

/**
 * Vote logger interface - implemented in node-ecies-lib
 */
export interface IVoteLoggerExtended<
  TID extends PlatformID = Uint8Array,
> extends IVoteLogger<TID> {
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
