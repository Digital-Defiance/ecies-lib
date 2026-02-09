/**
 * Threshold Poll
 *
 * Extends the standard Poll with threshold decryption support,
 * integrating IntervalScheduler, CeremonyCoordinator, and PublicTallyFeed.
 * Uses the same encryption (Paillier) and vote encoding as standard polls.
 *
 * @module voting/threshold
 */

import type { PublicKey } from 'paillier-bigint';
import type { IMember, PlatformID } from '../../../interfaces';
import type { VotingMethod } from '../enumerations';
import type { EncryptedVote } from '../interfaces/encrypted-vote';
import type { VoteReceipt } from '../interfaces/voting-receipt';
import { Poll } from '../poll-core';
import { CeremonyCoordinator } from './ceremony-coordinator';
import type { ICeremonyCoordinator } from './interfaces/ceremony-coordinator';
import type { IntervalConfig } from './interfaces/interval-config';
import type { IIntervalScheduler } from './interfaces/interval-scheduler';
import type { IPublicTallyFeed } from './interfaces/public-tally-feed';
import type { ThresholdKeyConfig } from './interfaces/threshold-key-config';
import type { IThresholdPoll } from './interfaces/threshold-poll';
import type { ThresholdPollConfig } from './interfaces/threshold-poll-config';
import { IntervalScheduler } from './interval-scheduler';
import { PublicTallyFeed } from './public-tally-feed';

/**
 * A poll with threshold decryption support.
 *
 * Wraps a standard Poll and adds:
 * - Interval scheduling for periodic decryption ceremonies
 * - Ceremony coordination for collecting Guardian partial decryptions
 * - Public tally feed for broadcasting verified interval tallies
 *
 * Uses the same encryption and vote encoding as standard polls,
 * ensuring full compatibility with existing vote encoders and talliers.
 *
 * @example
 * ```typescript
 * const poll = new ThresholdPoll(
 *   id, choices, method, authority, publicKey, thresholdConfig,
 * );
 *
 * // Cast votes (same as standard poll)
 * poll.vote(voter, encryptedVote);
 *
 * // Start interval scheduling
 * poll.intervalScheduler.start(poll.id);
 *
 * // Close triggers final ceremony
 * poll.close();
 * ```
 */
export class ThresholdPoll<
  TID extends PlatformID = Uint8Array,
> implements IThresholdPoll<TID> {
  private readonly _innerPoll: Poll<TID>;
  private readonly _thresholdConfig: ThresholdKeyConfig;
  private readonly _intervalConfig: IntervalConfig;
  private readonly _intervalScheduler: IIntervalScheduler<TID>;
  private readonly _ceremonyCoordinator: ICeremonyCoordinator<TID>;
  private readonly _tallyFeed: IPublicTallyFeed<TID>;

  constructor(
    id: TID,
    choices: string[],
    method: VotingMethod,
    authority: IMember<TID>,
    publicKey: PublicKey,
    config: ThresholdPollConfig<TID>,
  ) {
    // Create the inner standard poll (same encryption and vote encoding)
    this._innerPoll = new Poll<TID>(id, choices, method, authority, publicKey);

    this._thresholdConfig = config.thresholdConfig;
    this._intervalConfig = config.intervalConfig;

    // Create interval scheduler and configure for this poll
    this._intervalScheduler = new IntervalScheduler<TID>();
    this._intervalScheduler.configure(id, config.intervalConfig);

    // Create ceremony coordinator if key pair is provided
    if (config.keyPair) {
      this._ceremonyCoordinator = new CeremonyCoordinator<TID>(
        config.keyPair.publicKey,
        config.keyPair.verificationKeys,
        config.keyPair.theta,
        config.thresholdConfig,
        config.intervalConfig.ceremonyTimeoutMs,
      );
    } else {
      // Create a coordinator with the authority's public key
      // (verification keys and theta will need to be set later when key pair is generated)
      this._ceremonyCoordinator = new CeremonyCoordinator<TID>(
        publicKey,
        [],
        0n,
        config.thresholdConfig,
        config.intervalConfig.ceremonyTimeoutMs,
      );
    }

    // Create public tally feed
    this._tallyFeed = new PublicTallyFeed<TID>();
  }

  // --- IThresholdPoll properties ---

  get thresholdConfig(): ThresholdKeyConfig {
    return this._thresholdConfig;
  }

  get intervalConfig(): IntervalConfig {
    return this._intervalConfig;
  }

  get intervalScheduler(): IIntervalScheduler<TID> {
    return this._intervalScheduler;
  }

  get ceremonyCoordinator(): ICeremonyCoordinator<TID> {
    return this._ceremonyCoordinator;
  }

  get tallyFeed(): IPublicTallyFeed<TID> {
    return this._tallyFeed;
  }

  get isThresholdEnabled(): true {
    return true;
  }

  // --- IPoll delegation ---

  get id(): TID {
    return this._innerPoll.id;
  }

  get choices(): ReadonlyArray<string> {
    return this._innerPoll.choices;
  }

  get method(): VotingMethod {
    return this._innerPoll.method;
  }

  get isClosed(): boolean {
    return this._innerPoll.isClosed;
  }

  get voterCount(): number {
    return this._innerPoll.voterCount;
  }

  get createdAt(): number {
    return this._innerPoll.createdAt;
  }

  get closedAt(): number | undefined {
    return this._innerPoll.closedAt;
  }

  get auditLog() {
    return this._innerPoll.auditLog;
  }

  getEncryptedVotes(): ReadonlyMap<string, readonly bigint[]> {
    return this._innerPoll.getEncryptedVotes();
  }

  vote(
    voter: IMember<TID>,
    encryptedVote: EncryptedVote<TID>,
  ): VoteReceipt<TID> {
    const receipt = this._innerPoll.vote(voter, encryptedVote);

    // Notify the interval scheduler of the new vote
    try {
      this._intervalScheduler.notifyVote(this.id);
    } catch {
      // Scheduler may not be started yet; ignore
    }

    return receipt;
  }

  verifyReceipt(voter: IMember<TID>, receipt: VoteReceipt<TID>): boolean {
    return this._innerPoll.verifyReceipt(voter, receipt);
  }

  close(): void {
    this._innerPoll.close();

    // Trigger final decryption ceremony
    try {
      this._intervalScheduler.triggerFinal(this.id);
    } catch {
      // Scheduler may not be configured; ignore
    }
  }
}
