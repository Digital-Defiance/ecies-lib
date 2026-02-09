/**
 * Audit event types specific to threshold voting operations.
 *
 * These events extend the base audit system to track all threshold-related
 * operations for complete auditability.
 */
export enum ThresholdAuditEventType {
  /** Threshold keys were generated */
  KeyGeneration = 'threshold-key-generation',
  /** A key share was distributed to a Guardian */
  KeyShareDistribution = 'threshold-key-share-distribution',
  /** A Guardian was registered in the system */
  GuardianRegistration = 'guardian-registration',
  /** A Guardian's status changed */
  GuardianStatusChange = 'guardian-status-change',
  /** A decryption ceremony was started */
  CeremonyStarted = 'ceremony-started',
  /** A partial decryption was submitted */
  PartialSubmitted = 'partial-submitted',
  /** A decryption ceremony completed successfully */
  CeremonyCompleted = 'ceremony-completed',
  /** A decryption ceremony failed */
  CeremonyFailed = 'ceremony-failed',
  /** A tally was published to the public feed */
  TallyPublished = 'tally-published',
  /** A key share was rotated */
  KeyShareRotation = 'key-share-rotation',
}
