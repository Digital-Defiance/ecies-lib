import type { PlatformID } from '../../../../interfaces/platform-id';
import type { IntervalTally } from './interval-tally';
import type { TallySubscription } from './tally-subscription';

/**
 * Interface for the public tally feed.
 */
export interface IPublicTallyFeed<TID extends PlatformID = Uint8Array> {
  /** Publish a new interval tally */
  publish(tally: IntervalTally<TID>): void;

  /** Subscribe to tally updates for a poll */
  subscribe(
    pollId: TID,
    onTally: (tally: IntervalTally<TID>) => void,
  ): TallySubscription<TID>;

  /** Get current tally for a poll */
  getCurrentTally(pollId: TID): IntervalTally<TID> | undefined;

  /** Get all historical tallies for a poll */
  getHistory(pollId: TID): readonly IntervalTally<TID>[];

  /** Get tally for specific interval */
  getTallyAtInterval(
    pollId: TID,
    intervalNumber: number,
  ): IntervalTally<TID> | undefined;
}
