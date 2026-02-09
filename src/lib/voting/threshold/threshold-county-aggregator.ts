/**
 * Threshold County Aggregator
 *
 * Extends the standard CountyAggregator with threshold decryption support.
 * Supports different Guardian sets per jurisdiction and propagates interval
 * decryption results to parent aggregators.
 *
 * @module voting/threshold
 */

import type { PublicKey } from 'paillier-bigint';
import type { PlatformID } from '../../../interfaces/platform-id';
import { CountyAggregator } from '../hierarchical-aggregator';
import type { JurisdictionConfig } from '../interfaces/jurisdiction-config';
import { CeremonyStatus } from './enumerations/ceremony-status';
import type { ICeremonyCoordinator } from './interfaces/ceremony-coordinator';
import type { IntervalTally } from './interfaces/interval-tally';
import type { IPublicTallyFeed } from './interfaces/public-tally-feed';
import type { IThresholdAggregator } from './interfaces/threshold-aggregator';
import type { ThresholdKeyConfig } from './interfaces/threshold-key-config';

/**
 * County-level aggregator with threshold decryption support.
 *
 * Combines precinct tallies using homomorphic addition (inherited) and
 * adds the ability to perform interval decryptions. Supports different
 * Guardian sets per jurisdiction and propagates results to parent
 * (state-level) aggregators.
 *
 * @example
 * ```typescript
 * const county = new ThresholdCountyAggregator(
 *   config, publicKey, thresholdConfig, choices, pollId, tallyFeed,
 * );
 *
 * // Add precinct tallies as usual
 * county.addPrecinctTally(precinctTally);
 *
 * // Perform interval decryption
 * const tally = await county.performIntervalDecryption(coordinator, 1);
 * ```
 */
export class ThresholdCountyAggregator<TID extends PlatformID = Uint8Array>
  extends CountyAggregator<TID>
  implements IThresholdAggregator<TID>
{
  private readonly _thresholdConfig: ThresholdKeyConfig;
  private readonly _tallyFeed?: IPublicTallyFeed<TID>;
  private readonly _intervalTallies: IntervalTally<TID>[] = [];
  private readonly _choices: readonly string[];
  private readonly _pollId: TID;
  private _parentAggregator?: IThresholdAggregator<TID>;
  private readonly _childIntervalTallies: Map<number, IntervalTally<TID>[]> =
    new Map();

  constructor(
    config: JurisdictionConfig<TID>,
    publicKey: PublicKey,
    thresholdConfig: ThresholdKeyConfig,
    choices: readonly string[],
    pollId: TID,
    tallyFeed?: IPublicTallyFeed<TID>,
  ) {
    super(config, publicKey);
    this._thresholdConfig = thresholdConfig;
    this._tallyFeed = tallyFeed;
    this._choices = choices;
    this._pollId = pollId;
  }

  /**
   * Set the parent aggregator for result propagation.
   */
  setParent(parent: IThresholdAggregator<TID>): void {
    this._parentAggregator = parent;
  }

  /**
   * Get the encrypted aggregate tally for this county.
   */
  getEncryptedTally(): bigint[] {
    const tally = this.getTally();
    return [...tally.encryptedTallies];
  }

  /**
   * Perform an interval decryption at the county level.
   *
   * Starts a ceremony via the coordinator, waits for completion,
   * and publishes the result to the tally feed.
   */
  async performIntervalDecryption(
    ceremonyCoordinator: ICeremonyCoordinator<TID>,
    intervalNumber: number,
  ): Promise<IntervalTally<TID>> {
    const encryptedTally = this.getEncryptedTally();

    const ceremony = ceremonyCoordinator.startCeremony(
      this._pollId,
      intervalNumber,
      encryptedTally,
    );

    return new Promise<IntervalTally<TID>>((resolve, reject) => {
      const current = ceremonyCoordinator.getCeremony(ceremony.id);
      if (
        current &&
        current.status === CeremonyStatus.Completed &&
        current.result
      ) {
        const intervalTally = this.buildIntervalTally(
          current.result.tallies,
          current.result.combinedProof,
          current.result.participatingGuardians,
          intervalNumber,
        );
        this._intervalTallies.push(intervalTally);
        if (this._tallyFeed) {
          this._tallyFeed.publish(intervalTally);
        }
        resolve(intervalTally);
        return;
      }

      ceremonyCoordinator.onCeremonyComplete((completedCeremony) => {
        if (completedCeremony.id !== ceremony.id) return;

        if (
          completedCeremony.status === CeremonyStatus.Completed &&
          completedCeremony.result
        ) {
          const intervalTally = this.buildIntervalTally(
            completedCeremony.result.tallies,
            completedCeremony.result.combinedProof,
            completedCeremony.result.participatingGuardians,
            intervalNumber,
          );
          this._intervalTallies.push(intervalTally);
          if (this._tallyFeed) {
            this._tallyFeed.publish(intervalTally);
          }
          resolve(intervalTally);
        } else {
          reject(
            new Error(
              `Ceremony ${ceremony.id} failed with status: ${completedCeremony.status}`,
            ),
          );
        }
      });
    });
  }

  /**
   * Propagate an interval tally result from a child (precinct) aggregator.
   *
   * Collects child tallies per interval number. When propagated to this
   * county, the tally is stored for consistency tracking.
   */
  propagateToParent(tally: IntervalTally<TID>): void {
    const existing = this._childIntervalTallies.get(tally.intervalNumber) ?? [];
    existing.push(tally);
    this._childIntervalTallies.set(tally.intervalNumber, existing);

    // Forward to parent if set
    if (this._parentAggregator) {
      this._parentAggregator.propagateToParent(tally);
    }
  }

  /**
   * Get all interval tallies produced by this aggregator.
   */
  getIntervalTallies(): readonly IntervalTally<TID>[] {
    return this._intervalTallies;
  }

  /**
   * Get child interval tallies received for a specific interval.
   */
  getChildIntervalTallies(
    intervalNumber: number,
  ): readonly IntervalTally<TID>[] {
    return this._childIntervalTallies.get(intervalNumber) ?? [];
  }

  private buildIntervalTally(
    tallies: bigint[],
    proof: IntervalTally<TID>['proof'],
    participatingGuardians: readonly number[],
    intervalNumber: number,
  ): IntervalTally<TID> {
    const baseTally = this.getTally();
    const cumulativeVoteCount = baseTally.voterCount;

    const previousCumulative =
      this._intervalTallies.length > 0
        ? this._intervalTallies[this._intervalTallies.length - 1]
            .cumulativeVoteCount
        : 0;
    const voteCount = cumulativeVoteCount - previousCumulative;

    return {
      pollId: this._pollId,
      intervalNumber,
      tallies: tallies as readonly bigint[],
      choices: this._choices,
      voteCount,
      cumulativeVoteCount,
      proof,
      participatingGuardians,
      timestamp: Date.now(),
      isFinal: false,
    };
  }
}
