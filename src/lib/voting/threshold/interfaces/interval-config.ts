import type { IntervalTriggerType } from '../enumerations/interval-trigger-type';

/**
 * Configuration for interval decryption scheduling.
 */
export interface IntervalConfig {
  /** Type of interval trigger */
  readonly triggerType: IntervalTriggerType;
  /** Time interval in milliseconds (for time-based/hybrid) */
  readonly timeIntervalMs?: number;
  /** Vote count interval (for vote-count-based/hybrid) */
  readonly voteCountInterval?: number;
  /** Minimum interval between ceremonies (rate limiting) */
  readonly minimumIntervalMs: number;
  /** Timeout for ceremony completion */
  readonly ceremonyTimeoutMs: number;
}
