import type { PlatformID } from '../../../../interfaces/platform-id';
import type { IntervalTally } from './interval-tally';

/**
 * A subscription to the public tally feed.
 */
export interface TallySubscription<TID extends PlatformID = Uint8Array> {
  /** Subscription ID */
  readonly id: string;
  /** Poll ID being subscribed to */
  readonly pollId: TID;
  /** Callback for new tallies */
  readonly onTally: (tally: IntervalTally<TID>) => void;
  /** Unsubscribe function */
  unsubscribe(): void;
}
