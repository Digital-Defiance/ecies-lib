/**
 * Hierarchical Vote Aggregator for U.S. Scale Elections
 * Handles millions of votes through precinct → county → state → national aggregation
 */
import type { PublicKey } from 'paillier-bigint';
import type { IMember, PlatformID } from '../../interfaces';
import { JurisdictionLevel } from './enumerations/jurisdictional-level';
import { AggregatedTally } from './interfaces/aggregated-tally';
import { ICheckpointManager } from './interfaces/checkpoint-manager';
import { EncryptedVote } from './interfaces/encrypted-vote';
import { JurisdictionConfig } from './interfaces/jurisdiction-config';
import { IVoteLogger } from './interfaces/vote-logger';
import { Poll } from './poll-core';

/**
 * Precinct-level aggregator - handles ~900 votes in memory
 * Optional persistence via injected logger/checkpoint manager
 */
export class PrecinctAggregator<TID extends PlatformID = Uint8Array> {
  private readonly poll: Poll<TID>;
  private readonly config: JurisdictionConfig<TID>;
  private readonly logger?: IVoteLogger<TID>;
  private readonly checkpointMgr?: ICheckpointManager<TID>;
  private checkpointInterval = 100;

  constructor(
    poll: Poll<TID>,
    config: JurisdictionConfig<TID>,
    logger?: IVoteLogger<TID>,
    checkpointMgr?: ICheckpointManager<TID>,
  ) {
    if (config.level !== JurisdictionLevel.Precinct) {
      throw new Error('PrecinctAggregator requires precinct-level config');
    }
    this.poll = poll;
    this.config = config;
    this.logger = logger;
    this.checkpointMgr = checkpointMgr;
  }

  async vote(voter: IMember<TID>, vote: EncryptedVote<TID>): Promise<void> {
    this.poll.vote(voter, vote);

    if (this.logger) {
      await this.logger.appendVote(voter.id, vote.encrypted, Date.now());
    }

    if (
      this.checkpointMgr &&
      this.poll.voterCount % this.checkpointInterval === 0
    ) {
      await this.checkpointMgr.saveCheckpoint(this.getTally());
    }
  }

  getTally(): AggregatedTally<TID> {
    const votes = this.poll.getEncryptedVotes();
    const choiceCount = this.poll.choices.length;
    const encryptedTallies: bigint[] = Array(choiceCount).fill(0n) as bigint[];

    for (const encryptedVote of votes.values()) {
      for (let i = 0; i < choiceCount; i++) {
        encryptedTallies[i] = encryptedVote[i];
      }
    }

    return {
      jurisdictionId: this.config.id,
      level: JurisdictionLevel.Precinct,
      encryptedTallies,
      voterCount: this.poll.voterCount,
      timestamp: Date.now(),
    };
  }

  close(): void {
    this.poll.close();
  }
}

/**
 * County-level aggregator - combines precinct tallies
 */
export class CountyAggregator<TID extends PlatformID = Uint8Array> {
  private readonly config: JurisdictionConfig<TID>;
  private readonly precinctTallies = new Map<string, AggregatedTally<TID>>();
  private readonly votingPublicKey: PublicKey;

  constructor(config: JurisdictionConfig<TID>, votingPublicKey: PublicKey) {
    if (config.level !== JurisdictionLevel.County) {
      throw new Error('CountyAggregator requires county-level config');
    }
    this.config = config;
    this.votingPublicKey = votingPublicKey;
  }

  /**
   * Add precinct tally to county aggregate
   */
  addPrecinctTally(tally: AggregatedTally<TID>): void {
    const key = this.toKey(tally.jurisdictionId);
    this.precinctTallies.set(key, tally);
  }

  /**
   * Get aggregated county tally
   */
  getTally(): AggregatedTally<TID> {
    const tallies = Array.from(this.precinctTallies.values());
    if (tallies.length === 0) {
      throw new Error('No precinct tallies to aggregate');
    }

    const choiceCount = tallies[0].encryptedTallies.length;
    const encryptedTallies: bigint[] = Array(choiceCount).fill(0n) as bigint[];
    let totalVoters = 0;

    for (const tally of tallies) {
      for (let i = 0; i < choiceCount; i++) {
        if (encryptedTallies[i] === 0n) {
          encryptedTallies[i] = tally.encryptedTallies[i];
        } else {
          // Homomorphic addition
          encryptedTallies[i] = this.votingPublicKey.addition(
            encryptedTallies[i] as bigint,
            tally.encryptedTallies[i],
          );
        }
      }
      totalVoters += tally.voterCount;
    }

    return {
      jurisdictionId: this.config.id,
      level: JurisdictionLevel.County,
      encryptedTallies,
      voterCount: totalVoters,
      timestamp: Date.now(),
      childJurisdictions: tallies.map((t) => t.jurisdictionId),
    };
  }

  private toKey(id: TID): string {
    if (id instanceof Uint8Array) {
      return Array.from(id)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return String(id);
  }
}

/**
 * State-level aggregator - combines county tallies
 */
export class StateAggregator<TID extends PlatformID = Uint8Array> {
  private readonly config: JurisdictionConfig<TID>;
  private readonly countyTallies = new Map<string, AggregatedTally<TID>>();
  private readonly votingPublicKey: PublicKey;

  constructor(config: JurisdictionConfig<TID>, votingPublicKey: PublicKey) {
    if (config.level !== JurisdictionLevel.State) {
      throw new Error('StateAggregator requires state-level config');
    }
    this.config = config;
    this.votingPublicKey = votingPublicKey;
  }

  addCountyTally(tally: AggregatedTally<TID>): void {
    const key = this.toKey(tally.jurisdictionId);
    this.countyTallies.set(key, tally);
  }

  getTally(): AggregatedTally<TID> {
    const tallies = Array.from(this.countyTallies.values());
    if (tallies.length === 0) {
      throw new Error('No county tallies to aggregate');
    }

    const choiceCount = tallies[0].encryptedTallies.length;
    const encryptedTallies: bigint[] = Array(choiceCount).fill(0n) as bigint[];
    let totalVoters = 0;

    for (const tally of tallies) {
      for (let i = 0; i < choiceCount; i++) {
        if (encryptedTallies[i] === 0n) {
          encryptedTallies[i] = tally.encryptedTallies[i];
        } else {
          encryptedTallies[i] = this.votingPublicKey.addition(
            encryptedTallies[i] as bigint,
            tally.encryptedTallies[i],
          );
        }
      }
      totalVoters += tally.voterCount;
    }

    return {
      jurisdictionId: this.config.id,
      level: JurisdictionLevel.State,
      encryptedTallies,
      voterCount: totalVoters,
      timestamp: Date.now(),
      childJurisdictions: tallies.map((t) => t.jurisdictionId),
    };
  }

  private toKey(id: TID): string {
    if (id instanceof Uint8Array) {
      return Array.from(id)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return String(id);
  }
}

/**
 * National-level aggregator - combines state tallies and decrypts final result
 */
export class NationalAggregator<TID extends PlatformID = Uint8Array> {
  private readonly config: JurisdictionConfig<TID>;
  private readonly stateTallies = new Map<string, AggregatedTally<TID>>();
  private readonly votingPublicKey: PublicKey;

  constructor(config: JurisdictionConfig<TID>, votingPublicKey: PublicKey) {
    if (config.level !== JurisdictionLevel.National) {
      throw new Error('NationalAggregator requires national-level config');
    }
    this.config = config;
    this.votingPublicKey = votingPublicKey;
  }

  addStateTally(tally: AggregatedTally<TID>): void {
    const key = this.toKey(tally.jurisdictionId);
    this.stateTallies.set(key, tally);
  }

  getTally(): AggregatedTally<TID> {
    const tallies = Array.from(this.stateTallies.values());
    if (tallies.length === 0) {
      throw new Error('No state tallies to aggregate');
    }

    const choiceCount = tallies[0].encryptedTallies.length;
    const encryptedTallies: bigint[] = Array(choiceCount).fill(0n) as bigint[];
    let totalVoters = 0;

    for (const tally of tallies) {
      for (let i = 0; i < choiceCount; i++) {
        if (encryptedTallies[i] === 0n) {
          encryptedTallies[i] = tally.encryptedTallies[i];
        } else {
          encryptedTallies[i] = this.votingPublicKey.addition(
            encryptedTallies[i] as bigint,
            tally.encryptedTallies[i],
          );
        }
      }
      totalVoters += tally.voterCount;
    }

    return {
      jurisdictionId: this.config.id,
      level: JurisdictionLevel.National,
      encryptedTallies,
      voterCount: totalVoters,
      timestamp: Date.now(),
      childJurisdictions: tallies.map((t) => t.jurisdictionId),
    };
  }

  private toKey(id: TID): string {
    if (id instanceof Uint8Array) {
      return Array.from(id)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return String(id);
  }
}

// Re-export types and enums for convenience
export { JurisdictionLevel } from './enumerations/jurisdictional-level';
export type { JurisdictionConfig } from './interfaces/jurisdiction-config';
