import type { PlatformID } from '../../../../interfaces/platform-id';
import type { ICeremonyCoordinator } from './ceremony-coordinator';
import type { IntervalTally } from './interval-tally';

/**
 * Interface for hierarchical aggregators with threshold decryption.
 */
export interface IThresholdAggregator<TID extends PlatformID = Uint8Array> {
  /** Perform interval decryption at this aggregation level */
  performIntervalDecryption(
    ceremonyCoordinator: ICeremonyCoordinator<TID>,
    intervalNumber: number,
  ): Promise<IntervalTally<TID>>;

  /** Get encrypted aggregate tally */
  getEncryptedTally(): bigint[];

  /** Propagate interval result to parent aggregator */
  propagateToParent(tally: IntervalTally<TID>): void;
}
