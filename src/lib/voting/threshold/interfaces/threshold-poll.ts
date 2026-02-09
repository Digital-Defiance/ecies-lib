import type { PlatformID } from '../../../../interfaces/platform-id';
import type { IPoll } from '../../interfaces/poll';
import type { ICeremonyCoordinator } from './ceremony-coordinator';
import type { IntervalConfig } from './interval-config';
import type { IIntervalScheduler } from './interval-scheduler';
import type { IPublicTallyFeed } from './public-tally-feed';
import type { ThresholdKeyConfig } from './threshold-key-config';

/**
 * Extended poll interface with threshold decryption support.
 */
export interface IThresholdPoll<
  TID extends PlatformID = Uint8Array,
> extends IPoll<TID> {
  /** Threshold configuration */
  readonly thresholdConfig: ThresholdKeyConfig;

  /** Interval configuration */
  readonly intervalConfig: IntervalConfig;

  /** Get the interval scheduler */
  readonly intervalScheduler: IIntervalScheduler<TID>;

  /** Get the ceremony coordinator */
  readonly ceremonyCoordinator: ICeremonyCoordinator<TID>;

  /** Get the public tally feed */
  readonly tallyFeed: IPublicTallyFeed<TID>;

  /** Whether threshold decryption is enabled */
  readonly isThresholdEnabled: true;
}
