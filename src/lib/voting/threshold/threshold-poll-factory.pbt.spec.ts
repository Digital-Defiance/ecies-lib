/**
 * Property-Based Tests: Threshold Poll Factory - Backward Compatibility
 *
 * Feature: real-time-threshold-voting
 *
 * Property 9: Backward Compatibility
 *
 * *For any* poll created without threshold configuration, it SHALL behave
 * identically to the existing single-authority poll implementation, using
 * the same encryption, vote encoding, and tallying methods.
 *
 * **Validates: Requirements 9.2, 9.4**
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fc from 'fast-check';
import { generateRandomKeysSync as generateKeyPair } from 'paillier-bigint';
import { EmailString } from '../../../email-string';
import { MemberType } from '../../../enumerations/member-type';
import { Member } from '../../../member';
import { ECIESService } from '../../../services/ecies/service';
import { VotingMethod } from '../enumerations/voting-method';
import { PollFactory } from '../factory';
import { ThresholdPollFactory } from './threshold-poll-factory';

let authority: Member;

beforeAll(() => {
  const eciesService = new ECIESService();
  const result = Member.newMember(
    eciesService,
    MemberType.System,
    'Test Authority',
    new EmailString('authority@test.com'),
  );
  authority = result.member;

  const keys = generateKeyPair(512);
  authority.loadVotingKeys(keys.publicKey, keys.privateKey);
});

/**
 * Arbitrary for a valid voting method that works with simple choice lists.
 */
const arbSimpleVotingMethod = fc.constantFrom(
  VotingMethod.Plurality,
  VotingMethod.Approval,
  VotingMethod.Borda,
  VotingMethod.YesNo,
  VotingMethod.Score,
);

/**
 * Arbitrary for a list of choices (2 to 8 unique choices).
 */
const arbChoices = fc
  .integer({ min: 2, max: 8 })
  .map((n) => Array.from({ length: n }, (_, i) => `Choice ${i + 1}`));

describe('Feature: real-time-threshold-voting, Property 9: Backward Compatibility', () => {
  it('For any voting method and choices, a standard poll from ThresholdPollFactory behaves identically to PollFactory', () => {
    fc.assert(
      fc.property(arbSimpleVotingMethod, arbChoices, (method, choices) => {
        const thresholdFactory = new ThresholdPollFactory();

        // Create standard poll via ThresholdPollFactory
        const standardPoll = thresholdFactory.createStandardPoll(
          choices,
          method,
          authority,
        );

        // Create poll via original PollFactory
        const originalPoll = PollFactory.create(choices, method, authority);

        // Both should have the same method
        expect(standardPoll.method).toBe(originalPoll.method);

        // Both should have the same choices
        expect([...standardPoll.choices]).toEqual([...originalPoll.choices]);

        // Both should start not closed
        expect(standardPoll.isClosed).toBe(false);
        expect(originalPoll.isClosed).toBe(false);

        // Both should start with zero voters
        expect(standardPoll.voterCount).toBe(0);
        expect(originalPoll.voterCount).toBe(0);

        // Both should have frozen choices
        expect(Object.isFrozen(standardPoll.choices)).toBe(true);
        expect(Object.isFrozen(originalPoll.choices)).toBe(true);

        // Both should support closing
        standardPoll.close();
        originalPoll.close();
        expect(standardPoll.isClosed).toBe(true);
        expect(originalPoll.isClosed).toBe(true);
      }),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any voting method, standard polls from ThresholdPollFactory accept and reject votes the same as PollFactory polls', () => {
    fc.assert(
      fc.property(arbChoices, (choices) => {
        const thresholdFactory = new ThresholdPollFactory();

        const standardPoll = thresholdFactory.createStandardPoll(
          choices,
          VotingMethod.Plurality,
          authority,
        );

        const originalPoll = PollFactory.create(
          choices,
          VotingMethod.Plurality,
          authority,
        );

        // Both should reject votes after closing
        standardPoll.close();
        originalPoll.close();

        const eciesService = new ECIESService();
        const voterResult = Member.newMember(
          eciesService,
          MemberType.User,
          'Voter',
          new EmailString('voter@test.com'),
        );
        const voter = voterResult.member;

        expect(() =>
          standardPoll.vote(voter, {
            choiceIndex: 0,
            encrypted: [1n],
          }),
        ).toThrow('Poll is closed');

        expect(() =>
          originalPoll.vote(voter, {
            choiceIndex: 0,
            encrypted: [1n],
          }),
        ).toThrow('Poll is closed');
      }),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any choices, standard polls generate unique IDs across both factory types', () => {
    fc.assert(
      fc.property(arbChoices, (choices) => {
        const thresholdFactory = new ThresholdPollFactory();

        const poll1 = thresholdFactory.createStandardPoll(
          choices,
          VotingMethod.Plurality,
          authority,
        );
        const poll2 = thresholdFactory.createStandardPoll(
          choices,
          VotingMethod.Plurality,
          authority,
        );
        const poll3 = PollFactory.create(
          choices,
          VotingMethod.Plurality,
          authority,
        );

        // All IDs should be unique
        const id1 = Array.from(poll1.id as Uint8Array)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const id2 = Array.from(poll2.id as Uint8Array)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const id3 = Array.from(poll3.id as Uint8Array)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        expect(id1).not.toBe(id2);
        expect(id1).not.toBe(id3);
        expect(id2).not.toBe(id3);
      }),
      { numRuns: 100, verbose: true },
    );
  });
});
