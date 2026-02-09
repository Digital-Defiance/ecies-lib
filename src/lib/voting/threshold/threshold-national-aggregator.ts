/**
 * Threshold National Aggregator
 *
 * Extends the standard NationalAggregator with threshold decryption support.
 * Maintains consistency between interval tallies and the final tally after
 * poll closure (Requirement 10.5).
 *
 * @module voting/threshold
 */

import type { PublicKey } from 'paillier-bigint';
import type { PlatformID } from '../../../interfaces/platform-id';
import { NationalAggregator } from '../hierarchical-aggregator';
import type { JurisdictionConfig } from '../interfaces/jurisdiction-config';
import { CeremonyStatus } from './enumerations/ceremony-status';
import type { ICeremonyCoordinator } from './interfaces/ceremony-coordinator';
import type { IntervalTally } from './interfaces/interval-tally';
import type { IPublicTallyFeed } from './interfaces/public-tally-feed';
import type { IThresholdAggregator } from './interfaces/threshold-aggregator';
import type { ThresholdKeyConfig } from './interfaces/threshold-key-config';

/**
 * National-level aggregator with threshold decryption support.
 *
 * Combines state tallies using homomorphic addition (inherited) and
 * maintains consistency between interval tallies and the final tally.
 * The final tally (intervalNumber = -1) represents the complete,
 * authoritative result after poll closure.
 *
 * @example
 * ```typescript
 * const national = new ThresholdNationalAggregator(
 *   config, publicKey, thresholdConfig, choices, pollId, tallyFeed,
 * );
 *
 * // Add state tallies
 * national.addStateTally(stateTally);
 *
 * // Perform interval decryption
 * const tally = await national.performIntervalDecryption(coordinator, 1);
 *
 * // Perform final decryption after poll closure
 * const finalTally = await national.performFinalDecryption(coordinator);
 * ```
 */
export class ThresholdNationalAggregator<TID extends PlatformID = Uint8Array>
  extends NationalAggregator<TID>
  implements IThresholdAggregator<TID>
{
  private readonly _thresholdConfig: ThresholdKeyConfig;
  private readonly _tallyFeed?: IPublicTallyFeed<TID>;
  private readonly _intervalTallies: IntervalTally<TID>[] = [];
  private readonly _choices: readonly string[];
  private readonly _pollId: TID;
  private readonly _childIntervalTallies: Map<number, IntervalTally<TID>[]> =
    new Map();
  private _finalTally?: IntervalTally<TID>;

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
   * Get the encrypted aggregate tally for the national level.
   */
  getEncryptedTally(): bigint[] {
    const tally = this.getTally();
    return [...tally.encryptedTallies];
  }

  /**
   * Perform an interval decryption at the national level.
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
          false,
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
            false,
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
   * Perform the final decryption after poll closure.
   *
   * The final tally uses intervalNumber = -1 and isFinal = true.
   * This is the authoritative result that must be consistent with
   * the sum of all interval tallies.
   */
  async performFinalDecryption(
    ceremonyCoordinator: ICeremonyCoordinator<TID>,
  ): Promise<IntervalTally<TID>> {
    const encryptedTally = this.getEncryptedTally();

    const ceremony = ceremonyCoordinator.startCeremony(
      this._pollId,
      -1, // Final interval
      encryptedTally,
    );

    return new Promise<IntervalTally<TID>>((resolve, reject) => {
      const current = ceremonyCoordinator.getCeremony(ceremony.id);
      if (
        current &&
        current.status === CeremonyStatus.Completed &&
        current.result
      ) {
        const finalTally = this.buildIntervalTally(
          current.result.tallies,
          current.result.combinedProof,
          current.result.participatingGuardians,
          -1,
          true,
        );
        this._finalTally = finalTally;
        this._intervalTallies.push(finalTally);
        if (this._tallyFeed) {
          this._tallyFeed.publish(finalTally);
        }
        resolve(finalTally);
        return;
      }

      ceremonyCoordinator.onCeremonyComplete((completedCeremony) => {
        if (completedCeremony.id !== ceremony.id) return;

        if (
          completedCeremony.status === CeremonyStatus.Completed &&
          completedCeremony.result
        ) {
          const finalTally = this.buildIntervalTally(
            completedCeremony.result.tallies,
            completedCeremony.result.combinedProof,
            completedCeremony.result.participatingGuardians,
            -1,
            true,
          );
          this._finalTally = finalTally;
          this._intervalTallies.push(finalTally);
          if (this._tallyFeed) {
            this._tallyFeed.publish(finalTally);
          }
          resolve(finalTally);
        } else {
          reject(
            new Error(
              `Final ceremony ${ceremony.id} failed with status: ${completedCeremony.status}`,
            ),
          );
        }
      });
    });
  }

  /**
   * Propagate an interval tally result from a child (state) aggregator.
   */
  propagateToParent(tally: IntervalTally<TID>): void {
    const existing = this._childIntervalTallies.get(tally.intervalNumber) ?? [];
    existing.push(tally);
    this._childIntervalTallies.set(tally.intervalNumber, existing);
  }

  /**
   * Get all interval tallies produced by this aggregator.
   */
  getIntervalTallies(): readonly IntervalTally<TID>[] {
    return this._intervalTallies;
  }

  /**
   * Get the final tally, if available.
   */
  getFinalTally(): IntervalTally<TID> | undefined {
    return this._finalTally;
  }

  /**
   * Get child interval tallies received for a specific interval.
   */
  getChildIntervalTallies(
    intervalNumber: number,
  ): readonly IntervalTally<TID>[] {
    return this._childIntervalTallies.get(intervalNumber) ?? [];
  }

  /**
   * Check consistency between the final tally and the sum of all
   * non-final interval tallies. Returns true if the final tally
   * vote count matches the cumulative count from intervals.
   *
   * This validates Requirement 10.5: consistency between interval
   * tallies and the final tally after poll closure.
   */
  verifyConsistency(): boolean {
    if (!this._finalTally) return false;

    const nonFinalTallies = this._intervalTallies.filter((t) => !t.isFinal);
    if (nonFinalTallies.length === 0) return true;

    // The final tally's cumulative vote count should match
    // the last interval's cumulative vote count
    const lastInterval = nonFinalTallies[nonFinalTallies.length - 1];
    return (
      this._finalTally.cumulativeVoteCount >= lastInterval.cumulativeVoteCount
    );
  }

  private buildIntervalTally(
    tallies: bigint[],
    proof: IntervalTally<TID>['proof'],
    participatingGuardians: readonly number[],
    intervalNumber: number,
    isFinal: boolean,
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
      isFinal,
    };
  }
}
