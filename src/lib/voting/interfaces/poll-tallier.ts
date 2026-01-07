import type { PlatformID } from '../../../interfaces/platform-id';
import type { IPoll } from './poll';
import type { PollResults } from './poll-results';

/**
 * Poll tallier interface for decrypting and tallying votes.
 * Holds private key and can decrypt results after poll closes.
 */
export interface IPollTallier<TID extends PlatformID = Uint8Array> {
  /**
   * Tally votes and determine winner(s).
   * Automatically selects appropriate tallying algorithm based on poll's voting method.
   * @param poll - Poll to tally
   * @returns Poll results
   * @throws Error if poll is not closed
   */
  tally(poll: IPoll<TID>): PollResults;
}
