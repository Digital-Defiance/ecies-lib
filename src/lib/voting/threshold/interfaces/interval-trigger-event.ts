import type { PlatformID } from '../../../../interfaces/platform-id';
import type { IntervalTriggerType } from '../enumerations/interval-trigger-type';

/**
 * Event emitted when an interval trigger fires.
 */
export interface IntervalTriggerEvent<TID extends PlatformID = Uint8Array> {
  /** Poll ID */
  readonly pollId: TID;
  /** Interval number (sequential) */
  readonly intervalNumber: number;
  /** Type of trigger that fired */
  readonly triggerType: IntervalTriggerType;
  /** Reason for the trigger */
  readonly triggerReason: 'time' | 'vote-count' | 'poll-close';
  /** Current vote count at trigger time */
  readonly currentVoteCount: number;
  /** Timestamp of the trigger */
  readonly timestamp: number;
}
