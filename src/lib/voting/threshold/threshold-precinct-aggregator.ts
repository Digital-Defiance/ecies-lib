/**
 * Threshold Precinct Aggregator
 *
 * Extends the standard PrecinctAggregator with threshold decryption support,
 * enabling interval decryption at the precinct level. Uses the same
 * homomorphic aggregation as the base class but adds the ability to
 * perform threshold decryption ceremonies via a CeremonyCoordinator.
 *
 * @module voting/threshold
 */

import type { PublicKey } from 'paillier-bigint';
import type { PlatformID } from '../../../interfaces/platform-id';
import { PrecinctAggregator } from '../hierarchical-aggregator';
import type { ICheckpointManager } from '../interfaces/checkpoint-manager';
import type { JurisdictionConfig } from '../interfaces/jurisdiction-config';
import type { IVoteLogger } from '../interfaces/vote-logger';
import type { Poll } from '../poll-core';
import { CeremonyStatus } from './enumerations/ceremony-status';
import type { ICeremonyCoordinator } from './interfaces/ceremony-coordinator';
import type { IntervalTally } from './interfaces/interval-tally';
import type { IPublicTallyFeed } from './interfaces/public-tally-feed';
import type { IThresholdAggregator } from './interfaces/threshold-aggregator';
import type { ThresholdKeyConfig } from './interfaces/threshold-key-config';

/**
 * Precinct-level aggregator with threshold decryption support.
 *
 * Inherits all standard precinct aggregation behavior (vote collection,
 * homomorphic tallying, optional persistence) and adds the ability to
 * perform interval decryptions via a CeremonyCoordinator.
 *
 * @example
 * ```typescript
 * const aggregator = new ThresholdPrecinctAggregator(
 *   poll, config, publicKey, thresholdConfig, tallyFeed,
 * );
 *
 * // Cast votes as usual
 * await aggregator.vote(voter, encryptedVote);
 *
 * // Perform interval decryption
 * const tally = await aggregator.performIntervalDecryption(coordinator, 1);
 * ```
 */
export class ThresholdPrecinctAggregator<TID extends PlatformID = Uint8Array>
  extends PrecinctAggregator<TID>
  implements IThresholdAggregator<TID>
{
  private readonly _publicKey: PublicKey;
  private readonly _thresholdConfig: ThresholdKeyConfig;
  private readonly _tallyFeed?: IPublicTallyFeed<TID>;
  private readonly _intervalTallies: IntervalTally<TID>[] = [];
  private readonly _choices: readonly string[];
  private readonly _pollId: TID;
  private _parentAggregator?: IThresholdAggregator<TID>;

  constructor(
    poll: Poll<TID>,
    config: JurisdictionConfig<TID>,
    publicKey: PublicKey,
    thresholdConfig: ThresholdKeyConfig,
    tallyFeed?: IPublicTallyFeed<TID>,
    logger?: IVoteLogger<TID>,
    checkpointMgr?: ICheckpointManager<TID>,
  ) {
    super(poll, config, logger, checkpointMgr);
    this._publicKey = publicKey;
    this._thresholdConfig = thresholdConfig;
    this._tallyFeed = tallyFeed;
    this._choices = poll.choices;
    this._pollId = poll.id;
  }

  /**
   * Set the parent aggregator for result propagation.
   */
  setParent(parent: IThresholdAggregator<TID>): void {
    this._parentAggregator = parent;
  }

  /**
   * Get the encrypted aggregate tally for this precinct.
   *
   * Uses the same homomorphic aggregation as the base PrecinctAggregator.
   */
  getEncryptedTally(): bigint[] {
    const tally = this.getTally();
    return [...tally.encryptedTallies];
  }

  /**
   * Perform an interval decryption at the precinct level.
   *
   * Starts a ceremony via the coordinator, waits for it to complete,
   * and publishes the result to the tally feed.
   *
   * @param ceremonyCoordinator - The coordinator managing the ceremony
   * @param intervalNumber - The interval number for this decryption
   * @returns The decrypted interval tally
   */
  async performIntervalDecryption(
    ceremonyCoordinator: ICeremonyCoordinator<TID>,
    intervalNumber: number,
  ): Promise<IntervalTally<TID>> {
    const encryptedTally = this.getEncryptedTally();

    // Start a ceremony for this interval
    const ceremony = ceremonyCoordinator.startCeremony(
      this._pollId,
      intervalNumber,
      encryptedTally,
    );

    // Wait for the ceremony to complete (partials submitted externally)
    return new Promise<IntervalTally<TID>>((resolve, reject) => {
      // Check if already completed (synchronous submission case)
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

      // Subscribe to completion
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
   * Propagate an interval tally result to the parent aggregator.
   */
  propagateToParent(tally: IntervalTally<TID>): void {
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
   * Build an IntervalTally from decryption results.
   */
  private buildIntervalTally(
    tallies: bigint[],
    proof: IntervalTally<TID>['proof'],
    participatingGuardians: readonly number[],
    intervalNumber: number,
  ): IntervalTally<TID> {
    const baseTally = this.getTally();
    const cumulativeVoteCount = baseTally.voterCount;

    // Compute vote count for this interval
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
