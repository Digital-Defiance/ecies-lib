/**
 * Types of interval triggers for threshold decryption scheduling.
 *
 * Interval decryption allows real-time vote tallies during voting
 * without compromising individual vote privacy.
 */
export enum IntervalTriggerType {
  /** Trigger decryption at fixed time intervals (e.g., hourly) */
  TimeBased = 'time-based',
  /** Trigger decryption after a certain number of votes */
  VoteCountBased = 'vote-count-based',
  /** Trigger on either time or vote count, whichever comes first */
  Hybrid = 'hybrid',
}
