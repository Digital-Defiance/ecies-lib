import type { PlatformID } from '../../../../interfaces/platform-id';
import type { IntervalConfig } from './interval-config';
import type { IntervalTriggerEvent } from './interval-trigger-event';

/**
 * Interface for interval decryption scheduling.
 */
export interface IIntervalScheduler<TID extends PlatformID = Uint8Array> {
  /** Configure interval scheduling for a poll */
  configure(pollId: TID, config: IntervalConfig): void;

  /** Start scheduling for a poll */
  start(pollId: TID): void;

  /** Stop scheduling for a poll */
  stop(pollId: TID): void;

  /** Notify of new vote (for vote-count triggers) */
  notifyVote(pollId: TID): void;

  /** Trigger final ceremony on poll close */
  triggerFinal(pollId: TID): void;

  /** Subscribe to interval trigger events */
  onTrigger(callback: (event: IntervalTriggerEvent<TID>) => void): void;

  /** Get current interval number for a poll */
  getCurrentInterval(pollId: TID): number;
}
