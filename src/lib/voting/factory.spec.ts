/**
 * PollFactory Tests
 * Tests poll creation for all voting methods
 */
import { generateRandomKeysSync as generateKeyPair } from 'paillier-bigint';
import { EmailString } from '../../email-string';
import { MemberType } from '../../enumerations/member-type';
import { Member } from '../../member';
import { ECIESService } from '../../services/ecies/service';
import { VotingMethod } from './enumerations/voting-method';
import { PollFactory } from './factory';

describe('PollFactory', () => {
  let authority: Member;
  let eciesService: ECIESService;

  beforeAll(async () => {
    eciesService = new ECIESService();
    const result = Member.newMember(
      eciesService,
      MemberType.System,
      'Test Authority',
      new EmailString('authority@test.com'),
    );
    authority = result.member;

    // Generate voting keys
    const keyPair = generateKeyPair(512);
    authority.loadVotingKeys(keyPair.publicKey, keyPair.privateKey);
  });

  describe('createPlurality', () => {
    test('should create plurality poll', () => {
      const poll = PollFactory.createPlurality(
        ['A', 'B', 'C'],
        authority as any,
      );

      expect(poll.method).toBe(VotingMethod.Plurality);
      expect(poll.choices).toEqual(['A', 'B', 'C']);
      expect(poll.isClosed).toBe(false);
    });

    test('should generate unique poll IDs', () => {
      const poll1 = PollFactory.createPlurality(['A', 'B'], authority as any);
      const poll2 = PollFactory.createPlurality(['A', 'B'], authority as any);

      expect(poll1.id).not.toEqual(poll2.id);
    });
  });

  describe('createApproval', () => {
    test('should create approval poll', () => {
      const poll = PollFactory.createApproval(
        ['Red', 'Green', 'Blue'],
        authority as any,
      );

      expect(poll.method).toBe(VotingMethod.Approval);
      expect(poll.choices).toHaveLength(3);
    });
  });

  describe('createWeighted', () => {
    test('should create weighted poll with max weight', () => {
      const poll = PollFactory.createWeighted(
        ['A', 'B'],
        authority as any,
        1000n,
      );

      expect(poll.method).toBe(VotingMethod.Weighted);
      expect(poll.choices).toEqual(['A', 'B']);
    });

    test('should require max weight parameter', () => {
      const poll = PollFactory.createWeighted(
        ['A', 'B'],
        authority as any,
        100n,
      );
      expect(poll).toBeDefined();
    });
  });

  describe('createBorda', () => {
    test('should create borda poll', () => {
      const poll = PollFactory.createBorda(['X', 'Y', 'Z'], authority as any);

      expect(poll.method).toBe(VotingMethod.Borda);
      expect(poll.choices).toEqual(['X', 'Y', 'Z']);
    });
  });

  describe('createRankedChoice', () => {
    test('should create ranked choice poll', () => {
      const poll = PollFactory.createRankedChoice(
        ['A', 'B', 'C', 'D'],
        authority as any,
      );

      expect(poll.method).toBe(VotingMethod.RankedChoice);
      expect(poll.choices).toHaveLength(4);
    });
  });

  describe('Generic create', () => {
    test('should create poll with any method', () => {
      const poll = PollFactory.create(
        ['A', 'B'],
        VotingMethod.Plurality,
        authority as any,
      );

      expect(poll.method).toBe(VotingMethod.Plurality);
    });

    test('should pass options to poll', () => {
      const poll = PollFactory.create(
        ['A', 'B'],
        VotingMethod.Weighted,
        authority as any,
        { maxWeight: 500n },
      );

      expect(poll.method).toBe(VotingMethod.Weighted);
    });
  });

  describe('Validation', () => {
    test('should reject authority without voting keys', () => {
      const badAuthority = Member.newMember(
        eciesService,
        MemberType.User,
        'Bad Authority',
        new EmailString('bad@test.com'),
      ).member;
      // Don't load voting keys

      expect(() => {
        PollFactory.createPlurality(['A', 'B'], badAuthority);
      }).toThrow('voting public key');
    });

    test('should reject < 2 choices', () => {
      expect(() => {
        PollFactory.createPlurality(['Only One'], authority);
      }).toThrow('at least 2 choices');
    });

    test('should reject empty choices', () => {
      expect(() => {
        PollFactory.createPlurality([], authority);
      }).toThrow('at least 2 choices');
    });
  });

  describe('Poll Properties', () => {
    test('created polls should not be closed', () => {
      const poll = PollFactory.createPlurality(['A', 'B'], authority);
      expect(poll.isClosed).toBe(false);
    });

    test('created polls should have zero voters', () => {
      const poll = PollFactory.createPlurality(['A', 'B'], authority);
      expect(poll.voterCount).toBe(0);
    });

    test('created polls should have unique IDs', () => {
      const polls = Array.from({ length: 10 }, () =>
        PollFactory.createPlurality(['A', 'B'], authority),
      );

      const ids = polls.map((p) => Buffer.from(p.id).toString('hex'));
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('Choice Handling', () => {
    test('should preserve choice order', () => {
      const choices = ['First', 'Second', 'Third', 'Fourth'];
      const poll = PollFactory.createPlurality(choices, authority);

      expect(poll.choices).toEqual(choices);
    });

    test('should handle many choices', () => {
      const choices = Array.from({ length: 100 }, (_, i) => `Choice ${i}`);
      const poll = PollFactory.createPlurality(choices, authority);

      expect(poll.choices).toHaveLength(100);
    });

    test('should handle special characters in choices', () => {
      const choices = ['Option #1', 'Option @2', 'Option $3'];
      const poll = PollFactory.createPlurality(choices, authority);

      expect(poll.choices).toEqual(choices);
    });
  });

  describe('All Voting Methods Coverage', () => {
    test('should create TwoRound poll', () => {
      const poll = PollFactory.create(
        ['A', 'B', 'C'],
        VotingMethod.TwoRound,
        authority,
      );
      expect(poll.method).toBe(VotingMethod.TwoRound);
    });

    test('should create STAR poll', () => {
      const poll = PollFactory.create(
        ['A', 'B', 'C'],
        VotingMethod.STAR,
        authority,
      );
      expect(poll.method).toBe(VotingMethod.STAR);
    });

    test('should create STV poll', () => {
      const poll = PollFactory.create(
        ['A', 'B', 'C', 'D'],
        VotingMethod.STV,
        authority,
      );
      expect(poll.method).toBe(VotingMethod.STV);
    });

    test('should create Score poll', () => {
      const poll = PollFactory.create(
        ['A', 'B'],
        VotingMethod.Score,
        authority,
      );
      expect(poll.method).toBe(VotingMethod.Score);
    });

    test('should create YesNo poll', () => {
      const poll = PollFactory.create(
        ['Yes', 'No'],
        VotingMethod.YesNo,
        authority,
      );
      expect(poll.method).toBe(VotingMethod.YesNo);
    });

    test('should create YesNoAbstain poll', () => {
      const poll = PollFactory.create(
        ['Yes', 'No', 'Abstain'],
        VotingMethod.YesNoAbstain,
        authority,
      );
      expect(poll.method).toBe(VotingMethod.YesNoAbstain);
    });

    test('should create Supermajority poll', () => {
      const poll = PollFactory.create(
        ['Yes', 'No'],
        VotingMethod.Supermajority,
        authority,
      );
      expect(poll.method).toBe(VotingMethod.Supermajority);
    });
  });

  describe('Edge Cases and Security', () => {
    test('should handle exactly 2 choices (minimum)', () => {
      const poll = PollFactory.createPlurality(['A', 'B'], authority);
      expect(poll.choices).toHaveLength(2);
    });

    test('should handle empty string choices', () => {
      const poll = PollFactory.createPlurality(['', 'B'], authority);
      expect(poll.choices[0]).toBe('');
    });

    test('should handle very long choice names', () => {
      const longName = 'A'.repeat(1000);
      const poll = PollFactory.createPlurality([longName, 'B'], authority);
      expect(poll.choices[0]).toBe(longName);
    });

    test('should handle unicode characters in choices', () => {
      const choices = ['选项A', 'オプションB', 'विकल्प C', '🗳️ Vote'];
      const poll = PollFactory.createPlurality(choices, authority);
      expect(poll.choices).toEqual(choices);
    });

    test('should handle duplicate choice names', () => {
      const poll = PollFactory.createPlurality(['A', 'A', 'B'], authority);
      expect(poll.choices).toEqual(['A', 'A', 'B']);
    });

    test('should create poll with maximum realistic choices', () => {
      const choices = Array.from({ length: 1000 }, (_, i) => `Candidate ${i}`);
      const poll = PollFactory.createPlurality(choices, authority);
      expect(poll.choices).toHaveLength(1000);
    });

    test('should allow weighted poll with zero max weight', () => {
      const poll = PollFactory.createWeighted(['A', 'B'], authority, 0n);
      expect(poll.method).toBe(VotingMethod.Weighted);
    });

    test('should allow weighted poll with negative max weight', () => {
      const poll = PollFactory.createWeighted(['A', 'B'], authority, -100n);
      expect(poll.method).toBe(VotingMethod.Weighted);
    });

    test('should handle weighted poll with very large max weight', () => {
      const maxWeight = 2n ** 64n;
      const poll = PollFactory.createWeighted(['A', 'B'], authority, maxWeight);
      expect(poll.method).toBe(VotingMethod.Weighted);
    });
  });

  describe('Authority Validation', () => {
    test('should reject null authority', () => {
      expect(() => {
        PollFactory.createPlurality(['A', 'B'], null as any);
      }).toThrow();
    });

    test('should reject undefined authority', () => {
      expect(() => {
        PollFactory.createPlurality(['A', 'B'], undefined as any);
      }).toThrow();
    });

    test('should reject authority with null voting public key', () => {
      const badAuthority = Member.newMember(
        eciesService,
        MemberType.User,
        'Bad Authority',
        new EmailString('bad2@test.com'),
      ).member;
      // Don't load voting keys

      expect(() => {
        PollFactory.createPlurality(['A', 'B'], badAuthority);
      }).toThrow();
    });
  });

  describe('Choices Validation', () => {
    test('should reject null choices', () => {
      expect(() => {
        PollFactory.createPlurality(null as any, authority);
      }).toThrow();
    });

    test('should reject undefined choices', () => {
      expect(() => {
        PollFactory.createPlurality(undefined as any, authority);
      }).toThrow();
    });

    test('should reject single choice', () => {
      expect(() => {
        PollFactory.createPlurality(['Only One'], authority);
      }).toThrow('at least 2 choices');
    });
  });

  describe('Poll ID Generation', () => {
    test('should generate different IDs for same parameters', () => {
      const poll1 = PollFactory.createPlurality(['A', 'B'], authority);
      const poll2 = PollFactory.createPlurality(['A', 'B'], authority);
      const poll3 = PollFactory.createPlurality(['A', 'B'], authority);

      const id1 = Buffer.from(poll1.id).toString('hex');
      const id2 = Buffer.from(poll2.id).toString('hex');
      const id3 = Buffer.from(poll3.id).toString('hex');

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    test('should generate IDs of consistent length', () => {
      const polls = Array.from({ length: 10 }, () =>
        PollFactory.createPlurality(['A', 'B'], authority),
      );

      const lengths = polls.map((p) => p.id.length);
      const uniqueLengths = new Set(lengths);

      expect(uniqueLengths.size).toBe(1);
    });
  });

  describe('Immutability', () => {
    test('should return frozen choices array', () => {
      const poll = PollFactory.createPlurality(['A', 'B', 'C'], authority);
      expect(Object.isFrozen(poll.choices)).toBe(true);
    });

    test('should not allow modifying choices after creation', () => {
      const poll = PollFactory.createPlurality(['A', 'B', 'C'], authority);
      expect(() => {
        (poll.choices as any).push('D');
      }).toThrow();
    });
  });

  describe('Concurrent Creation', () => {
    test('should handle rapid poll creation', () => {
      const polls = Array.from({ length: 100 }, () =>
        PollFactory.createPlurality(['A', 'B'], authority),
      );

      expect(polls).toHaveLength(100);
      polls.forEach((poll) => {
        expect(poll.method).toBe(VotingMethod.Plurality);
        expect(poll.isClosed).toBe(false);
      });
    });
  });
});
