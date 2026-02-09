import type { PlatformID } from '../../../../interfaces/platform-id';
import type { IGuardianRegistry } from './guardian-registry';
import type { IntervalConfig } from './interval-config';
import type { ThresholdKeyConfig } from './threshold-key-config';
import type { ThresholdKeyPair } from './threshold-key-pair';

/**
 * Configuration for creating a threshold-enabled poll.
 */
export interface ThresholdPollConfig<TID extends PlatformID = Uint8Array> {
  /** Threshold key configuration */
  readonly thresholdConfig: ThresholdKeyConfig;
  /** Interval configuration */
  readonly intervalConfig: IntervalConfig;
  /** Guardian registry to use */
  readonly guardianRegistry: IGuardianRegistry<TID>;
  /** Pre-generated threshold key pair (optional) */
  readonly keyPair?: ThresholdKeyPair;
}
