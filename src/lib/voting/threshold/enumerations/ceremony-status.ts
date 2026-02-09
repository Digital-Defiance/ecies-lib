/**
 * Status of a threshold decryption ceremony.
 *
 * A ceremony is the coordinated process where k-of-n Guardians submit
 * their partial decryptions to reveal an aggregate tally.
 */
export enum CeremonyStatus {
  /** Ceremony created but not yet started */
  Pending = 'pending',
  /** Ceremony is actively collecting partial decryptions */
  InProgress = 'in-progress',
  /** Ceremony completed successfully with k valid partials */
  Completed = 'completed',
  /** Ceremony failed due to invalid partials or other errors */
  Failed = 'failed',
  /** Ceremony timed out before receiving k valid partials */
  TimedOut = 'timed-out',
}
