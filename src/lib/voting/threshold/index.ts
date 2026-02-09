/**
 * Threshold Voting Module
 *
 * Implements Real-Time Threshold Voting for secure, distributed vote tallying.
 * Based on Damgård et al.'s "Generalization of Paillier's Public-Key System
 * with Applications to Electronic Voting."
 *
 * Key features:
 * - Threshold Paillier cryptography (k-of-n Guardians required for decryption)
 * - Real-time interval decryption during voting
 * - Zero-knowledge proofs for all decryption operations
 * - Integration with hierarchical aggregation (Precinct → County → State → National)
 * - Backward compatible with single-authority polls
 *
 * @example
 * ```typescript
 * import {
 *   ThresholdKeyGenerator,
 *   GuardianRegistry,
 *   CeremonyCoordinator,
 *   GuardianStatus,
 * } from './voting/threshold';
 *
 * // Generate threshold keys (5-of-9 configuration)
 * const keyGen = new ThresholdKeyGenerator();
 * const keyPair = await keyGen.generate({ totalShares: 9, threshold: 5 });
 *
 * // Register Guardians
 * const registry = new GuardianRegistry();
 * keyPair.keyShares.forEach((share, i) => {
 *   registry.register({
 *     id: guardianIds[i],
 *     name: `Guardian ${i + 1}`,
 *     shareIndex: share.index,
 *     verificationKey: share.verificationKey,
 *     status: GuardianStatus.Online,
 *   });
 * });
 *
 * // Create threshold poll and conduct voting...
 * ```
 */

// Re-export enumerations
export * from './enumerations';

// Re-export interfaces
export type * from './interfaces';

// Re-export classes
export {
  ThresholdKeyGenerator,
  InvalidThresholdConfigError,
  KeyGenerationFailedError,
} from './threshold-key-generator';

export {
  PartialDecryptionService,
  InvalidPartialProofError,
  DeserializationError,
} from './partial-decryption-service';

export {
  DecryptionCombiner,
  InsufficientPartialsError,
  InvalidPartialInCombineError,
  CombineFailedError,
} from './decryption-combiner';

export {
  GuardianRegistry,
  GuardianAlreadyRegisteredError,
  GuardianNotFoundError,
  InvalidShareIndexError,
  RegistryFullError,
} from './guardian-registry';

export {
  IntervalScheduler,
  PollNotConfiguredError,
  InvalidIntervalConfigError,
  PollSchedulingStateError,
} from './interval-scheduler';

export {
  CeremonyCoordinator,
  CeremonyNotFoundError,
  CeremonyAlreadyCompleteError,
  DuplicatePartialSubmissionError,
  InvalidCeremonyPartialProofError,
} from './ceremony-coordinator';

export { PublicTallyFeed } from './public-tally-feed';

export { TallyVerifier } from './tally-verifier';

export { ThresholdPoll } from './threshold-poll';

export {
  ThresholdPollFactory,
  InsufficientGuardiansError,
  InvalidThresholdPollConfigError,
} from './threshold-poll-factory';

export { ThresholdPrecinctAggregator } from './threshold-precinct-aggregator';

export { ThresholdCountyAggregator } from './threshold-county-aggregator';

export { ThresholdStateAggregator } from './threshold-state-aggregator';

export { ThresholdNationalAggregator } from './threshold-national-aggregator';

export { ThresholdAuditLog } from './threshold-audit-log';
