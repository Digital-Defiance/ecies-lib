import { describe, it, expect, beforeAll } from '@jest/globals';
import { Member } from '../../member';
import { VoteEncoder } from './encoder';
import { PollFactory } from './factory';
import {
  PrecinctAggregator,
  CountyAggregator,
  StateAggregator,
  NationalAggregator,
  JurisdictionLevel,
  type JurisdictionConfig,
} from './hierarchical-aggregator';
import { TestVoterPool } from './test-voter-pool';

describe('Hierarchical Aggregator', () => {
  let authority: Member;
  const choices = ['Alice', 'Bob', 'Charlie'];

  beforeAll(async () => {
    await TestVoterPool.initialize(20);
    authority = TestVoterPool.getAuthority();
  }, 60000); // 60 second timeout for pool initialization

  describe('PrecinctAggregator', () => {
    it('should create precinct aggregator', () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([1]),
        name: 'Precinct 1',
        level: JurisdictionLevel.Precinct,
      };
      const poll = PollFactory.createPlurality(choices, authority);
      const precinct = new PrecinctAggregator(poll, config);

      expect(precinct).toBeDefined();
    });

    it('should reject non-precinct config', () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([1]),
        name: 'County 1',
        level: JurisdictionLevel.County,
      };
      const poll = PollFactory.createPlurality(choices, authority);

      expect(() => new PrecinctAggregator(poll, config)).toThrow(
        'PrecinctAggregator requires precinct-level config',
      );
    });

    it('should handle votes and generate tally', async () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([1]),
        name: 'Precinct 1',
        level: JurisdictionLevel.Precinct,
      };
      const poll = PollFactory.createPlurality(choices, authority);
      const precinct = new PrecinctAggregator(poll, config);
      const encoder = new VoteEncoder(authority.votingPublicKey!);

      // Cast 3 votes
      for (let i = 0; i < 3; i++) {
        const vote = encoder.encodePlurality(i % 3, choices.length);
        await precinct.vote(TestVoterPool.getVoter(i), vote);
      }

      const tally = precinct.getTally();
      expect(tally.jurisdictionId).toEqual(config.id);
      expect(tally.level).toBe(JurisdictionLevel.Precinct);
      expect(tally.voterCount).toBe(3);
      expect(tally.encryptedTallies).toHaveLength(3);
    });

    it('should close poll', async () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([1]),
        name: 'Precinct 1',
        level: JurisdictionLevel.Precinct,
      };
      const poll = PollFactory.createPlurality(choices, authority);
      const precinct = new PrecinctAggregator(poll, config);

      precinct.close();
      expect(poll.isClosed).toBe(true);
    });
  });

  describe('CountyAggregator', () => {
    it('should create county aggregator', () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([1, 0]),
        name: 'County 1',
        level: JurisdictionLevel.County,
      };
      const county = new CountyAggregator(config, authority.votingPublicKey!);

      expect(county).toBeDefined();
    });

    it('should reject non-county config', () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([1]),
        name: 'Precinct 1',
        level: JurisdictionLevel.Precinct,
      };

      expect(
        () => new CountyAggregator(config, authority.votingPublicKey!),
      ).toThrow('CountyAggregator requires county-level config');
    });

    it('should aggregate precinct tallies', async () => {
      const countyConfig: JurisdictionConfig = {
        id: new Uint8Array([1, 0]),
        name: 'County 1',
        level: JurisdictionLevel.County,
      };
      const county = new CountyAggregator(
        countyConfig,
        authority.votingPublicKey!,
      );

      for (let p = 0; p < 2; p++) {
        const precinctConfig: JurisdictionConfig = {
          id: new Uint8Array([1, p]),
          name: `Precinct ${p}`,
          level: JurisdictionLevel.Precinct,
          parentId: countyConfig.id,
        };
        const poll = PollFactory.createPlurality(choices, authority);
        const precinct = new PrecinctAggregator(poll, precinctConfig);
        const encoder = new VoteEncoder(authority.votingPublicKey!);

        for (let i = 0; i < 5; i++) {
          const vote = encoder.encodePlurality(i % 3, choices.length);
          await precinct.vote(TestVoterPool.getVoter(p * 5 + i), vote);
        }

        county.addPrecinctTally(precinct.getTally());
      }

      const tally = county.getTally();
      expect(tally.level).toBe(JurisdictionLevel.County);
      expect(tally.voterCount).toBe(10);
      expect(tally.childJurisdictions).toHaveLength(2);
    });

    it('should throw if no precincts added', () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([1, 0]),
        name: 'County 1',
        level: JurisdictionLevel.County,
      };
      const county = new CountyAggregator(config, authority.votingPublicKey!);

      expect(() => county.getTally()).toThrow(
        'No precinct tallies to aggregate',
      );
    });
  });

  describe('StateAggregator', () => {
    it('should create state aggregator', () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([1]),
        name: 'State 1',
        level: JurisdictionLevel.State,
      };
      const state = new StateAggregator(config, authority.votingPublicKey!);

      expect(state).toBeDefined();
    });

    it('should reject non-state config', () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([1]),
        name: 'County 1',
        level: JurisdictionLevel.County,
      };

      expect(
        () => new StateAggregator(config, authority.votingPublicKey!),
      ).toThrow('StateAggregator requires state-level config');
    });

    it('should aggregate county tallies', async () => {
      const stateConfig: JurisdictionConfig = {
        id: new Uint8Array([1]),
        name: 'State 1',
        level: JurisdictionLevel.State,
      };
      const state = new StateAggregator(
        stateConfig,
        authority.votingPublicKey!,
      );

      for (let c = 0; c < 2; c++) {
        const countyConfig: JurisdictionConfig = {
          id: new Uint8Array([1, c]),
          name: `County ${c}`,
          level: JurisdictionLevel.County,
          parentId: stateConfig.id,
        };
        const county = new CountyAggregator(
          countyConfig,
          authority.votingPublicKey!,
        );

        const precinctConfig: JurisdictionConfig = {
          id: new Uint8Array([1, c, 0]),
          name: `Precinct ${c}-0`,
          level: JurisdictionLevel.Precinct,
          parentId: countyConfig.id,
        };
        const poll = PollFactory.createPlurality(choices, authority);
        const precinct = new PrecinctAggregator(poll, precinctConfig);
        const encoder = new VoteEncoder(authority.votingPublicKey!);

        for (let i = 0; i < 3; i++) {
          const vote = encoder.encodePlurality(i % 3, choices.length);
          await precinct.vote(TestVoterPool.getVoter(c * 3 + i), vote);
        }

        county.addPrecinctTally(precinct.getTally());
        state.addCountyTally(county.getTally());
      }

      const tally = state.getTally();
      expect(tally.level).toBe(JurisdictionLevel.State);
      expect(tally.voterCount).toBe(6);
      expect(tally.childJurisdictions).toHaveLength(2);
    });
  });

  describe('NationalAggregator', () => {
    it('should create national aggregator', () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([0]),
        name: 'National',
        level: JurisdictionLevel.National,
      };
      const national = new NationalAggregator(
        config,
        authority.votingPublicKey!,
      );

      expect(national).toBeDefined();
    });

    it('should reject non-national config', () => {
      const config: JurisdictionConfig = {
        id: new Uint8Array([1]),
        name: 'State 1',
        level: JurisdictionLevel.State,
      };

      expect(
        () => new NationalAggregator(config, authority.votingPublicKey!),
      ).toThrow('NationalAggregator requires national-level config');
    });

    it('should aggregate state tallies', async () => {
      const nationalConfig: JurisdictionConfig = {
        id: new Uint8Array([0]),
        name: 'National',
        level: JurisdictionLevel.National,
      };
      const national = new NationalAggregator(
        nationalConfig,
        authority.votingPublicKey!,
      );

      let voterIndex = 0;
      for (let s = 0; s < 2; s++) {
        const stateConfig: JurisdictionConfig = {
          id: new Uint8Array([s + 1]),
          name: `State ${s}`,
          level: JurisdictionLevel.State,
        };
        const state = new StateAggregator(
          stateConfig,
          authority.votingPublicKey!,
        );

        const countyConfig: JurisdictionConfig = {
          id: new Uint8Array([s + 1, 0]),
          name: `County ${s}-0`,
          level: JurisdictionLevel.County,
          parentId: stateConfig.id,
        };
        const county = new CountyAggregator(
          countyConfig,
          authority.votingPublicKey!,
        );

        const precinctConfig: JurisdictionConfig = {
          id: new Uint8Array([s + 1, 0, 0]),
          name: `Precinct ${s}-0-0`,
          level: JurisdictionLevel.Precinct,
          parentId: countyConfig.id,
        };
        const poll = PollFactory.createPlurality(choices, authority);
        const precinct = new PrecinctAggregator(poll, precinctConfig);
        const encoder = new VoteEncoder(authority.votingPublicKey!);

        for (let i = 0; i < 2; i++) {
          const vote = encoder.encodePlurality(i % 3, choices.length);
          await precinct.vote(TestVoterPool.getVoter(voterIndex++), vote);
        }

        county.addPrecinctTally(precinct.getTally());
        state.addCountyTally(county.getTally());
        national.addStateTally(state.getTally());
      }

      const tally = national.getTally();
      expect(tally.level).toBe(JurisdictionLevel.National);
      expect(tally.voterCount).toBe(4);
      expect(tally.childJurisdictions).toHaveLength(2);
    });
  });

  describe('Full Hierarchy Integration', () => {
    it('should aggregate from precinct to national', async () => {
      const encoder = new VoteEncoder(authority.votingPublicKey!);
      const nationalConfig: JurisdictionConfig = {
        id: new Uint8Array([0]),
        name: 'USA',
        level: JurisdictionLevel.National,
      };
      const national = new NationalAggregator(
        nationalConfig,
        authority.votingPublicKey!,
      );

      let voterIndex = 0;
      for (let s = 0; s < 2; s++) {
        const stateConfig: JurisdictionConfig = {
          id: new Uint8Array([s + 1]),
          name: `State ${s}`,
          level: JurisdictionLevel.State,
        };
        const state = new StateAggregator(
          stateConfig,
          authority.votingPublicKey!,
        );
        const countyConfig: JurisdictionConfig = {
          id: new Uint8Array([s + 1, 0]),
          name: `County ${s}-0`,
          level: JurisdictionLevel.County,
          parentId: stateConfig.id,
        };
        const county = new CountyAggregator(
          countyConfig,
          authority.votingPublicKey!,
        );
        const precinctConfig: JurisdictionConfig = {
          id: new Uint8Array([s + 1, 0, 0]),
          name: `Precinct ${s}-0-0`,
          level: JurisdictionLevel.Precinct,
          parentId: countyConfig.id,
        };
        const poll = PollFactory.createPlurality(choices, authority);
        const precinct = new PrecinctAggregator(poll, precinctConfig);

        for (let v = 0; v < 2; v++) {
          const vote = encoder.encodePlurality(v % 3, choices.length);
          await precinct.vote(TestVoterPool.getVoter(voterIndex++), vote);
        }

        county.addPrecinctTally(precinct.getTally());
        state.addCountyTally(county.getTally());
        national.addStateTally(state.getTally());
      }

      const tally = national.getTally();
      expect(tally.voterCount).toBe(4);
      expect(tally.level).toBe(JurisdictionLevel.National);
      expect(tally.childJurisdictions).toHaveLength(2);
    });
  });
});
