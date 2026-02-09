/**
 * Threshold State Aggregator
 *
 * Extends the standard StateAggregator with threshold decryption support.
 * Enforces that threshold decryption is required at this level when any
 * child jurisdiction uses threshold decryption (Requirement 10.6).
 *
 * @module voting/threshold
 */

import type { PublicKey } from 'paillier-bigint';
import type { PlatformID } from '../../../interfaces/platform-id';
import { StateAggregator } from '../hierarchical-aggregator';
import type { JurisdictionConfig } from '../interfaces/jurisdiction-config';
import { CeremonyStatus } from './enumerations/ceremony-status';
import type { ICeremonyCoordinator } from './interfaces/ceremony-coordinator';
import type { IntervalTally } from './interfaces/interval-tally';
import type { IPublicTallyFeed } from './interfaces/public-tally-feed';
import type { IThresholdAggregator } from './interfaces/threshold-aggregator';
import type { ThresholdKeyConfig } from './interfaces/threshold-key-config';

/**
 * State-level aggregator with threshold decryption support.
 *
 * Combines county tallies using homomorphic addition (inherited) and
 * enforces that threshold decryption is required at this level when
 * child jurisdictions use threshold decryption.
 *
 * @example
 * ```typescript
 * const state = new ThresholdStateAggregator(
 *   config, publicKey, thresholdConfig, choices, pollId, tallyFeed,
 * );
 *
 * // Add county tallies
 * state.addCountyTally(countyTally);
 *
 * // Perform interval decryption (enforced at state level)
 * const tally = await state.performIntervalDecryption(coordinator, 1);
 * ```
 */
export class ThresholdStateAggregator<TID extends PlatformID = Uint8Array>
  extends StateAggregator<TID>
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
  private _thresholdRequired = true;

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
   * Whether threshold decryption is enforced at this level.
   * Per Requirement 10.6, if a child jurisdiction uses threshold
   * decryption, all higher levels must also use it.
   */
  get thresholdRequired(): boolean {
    return this._thresholdRequired;
  }

  set thresholdRequired(value: boolean) {
    this._thresholdRequired = value;
  }

  /**
   * Get the encrypted aggregate tally for this state.
   */
  getEncryptedTally(): bigint[] {
    const tally = this.getTally();
    return [...tally.encryptedTallies];
  }

  /**
   * Perform an interval decryption at the state level.
   *
   * Enforces that threshold decryption is required at this level
   * before proceeding with the ceremony.
   */
  async performIntervalDecryption(
    ceremonyCoordinator: ICeremonyCoordinator<TID>,
    intervalNumber: number,
  ): Promise<IntervalTally<TID>> {
    if (!this._thresholdRequired) {
      throw new Error('Threshold decryption is not enabled at the state level');
    }

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
   * Propagate an interval tally result from a child (county) aggregator.
   */
  propagateToParent(tally: IntervalTally<TID>): void {
    const existing = this._childIntervalTallies.get(tally.intervalNumber) ?? [];
    existing.push(tally);
    this._childIntervalTallies.set(tally.intervalNumber, existing);

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
