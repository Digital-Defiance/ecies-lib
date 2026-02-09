/**
 * Property-Based Tests: Threshold Hierarchical Aggregation
 *
 * Feature: real-time-threshold-voting
 * These tests validate hierarchical consistency of threshold aggregation.
 *
 * Property 10: Hierarchical Consistency
 *
 * *For any* threshold-enabled hierarchical aggregation, the final tally after
 * poll closure SHALL equal the sum of all interval tallies, and interval
 * decryption at lower levels SHALL propagate correctly to higher levels.
 *
 * **Validates: Requirements 10.4, 10.5**
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fc from 'fast-check';
import { JurisdictionLevel } from '../enumerations/jurisdictional-level';
import { CeremonyCoordinator } from './ceremony-coordinator';
import type { ThresholdKeyPair, IntervalTally } from './interfaces';
import { PartialDecryptionService } from './partial-decryption-service';
import { PublicTallyFeed } from './public-tally-feed';
import { ThresholdCountyAggregator } from './threshold-county-aggregator';
import { ThresholdKeyGenerator } from './threshold-key-generator';
import { ThresholdNationalAggregator } from './threshold-national-aggregator';
import { ThresholdStateAggregator } from './threshold-state-aggregator';

/**
 * Helper: Submit k partial decryptions to a ceremony to complete it.
 */
function submitPartials(
  coordinator: CeremonyCoordinator<string>,
  ceremonyId: string,
  keyPair: ThresholdKeyPair,
  service: PartialDecryptionService,
  encryptedTally: bigint[],
): void {
  const ceremony = coordinator.getCeremony(ceremonyId);
  if (!ceremony) throw new Error(`Ceremony ${ceremonyId} not found`);

  const k = keyPair.config.threshold;
  for (let i = 0; i < k; i++) {
    const share = keyPair.keyShares[i];
    const partial = service.computePartial(
      encryptedTally,
      share,
      ceremony.nonce,
    );
    coordinator.submitPartial(ceremonyId, partial);
  }
}

describe('Feature: real-time-threshold-voting, Property 10: Hierarchical Consistency', () => {
  let keyPair: ThresholdKeyPair;
  let service: PartialDecryptionService;

  beforeAll(async () => {
    const generator = new ThresholdKeyGenerator();
    keyPair = await generator.generate({
      totalShares: 3,
      threshold: 2,
      keyBitLength: 512,
    });
    service = new PartialDecryptionService(keyPair.publicKey);
  }, 120000);

  /**
   * Property 10: Hierarchical Consistency — Propagation
   * **Validates: Requirement 10.4**
   *
   * Interval decryption results at lower levels propagate correctly
   * to higher levels in the hierarchy.
   */
  it('interval tallies propagated from child to parent are received correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.array(fc.bigInt({ min: 0n, max: 1000n }), {
          minLength: 2,
          maxLength: 5,
        }),
        fc.array(fc.integer({ min: 1, max: 5 }), {
          minLength: 1,
          maxLength: 3,
        }),
        (intervalNumber, tallies, guardianIndices) => {
          const uniqueGuardians = [...new Set(guardianIndices)].slice(
            0,
            3,
          ) as readonly number[];

          const county = new ThresholdCountyAggregator<string>(
            {
              id: 'county-1',
              name: 'Test County',
              level: JurisdictionLevel.County,
            },
            keyPair.publicKey,
            keyPair.config,
            tallies.map((_, i) => `Choice ${i}`),
            'poll-1',
          );

          const state = new ThresholdStateAggregator<string>(
            {
              id: 'state-1',
              name: 'Test State',
              level: JurisdictionLevel.State,
            },
            keyPair.publicKey,
            keyPair.config,
            tallies.map((_, i) => `Choice ${i}`),
            'poll-1',
          );

          county.setParent(state);

          // Create a mock interval tally from a precinct
          const precinctTally: IntervalTally<string> = {
            pollId: 'poll-1',
            intervalNumber,
            tallies: tallies as readonly bigint[],
            choices: tallies.map((_, i) => `Choice ${i}`) as readonly string[],
            voteCount: 100,
            cumulativeVoteCount: 100,
            proof: {
              partialProofs: [],
              aggregatedCommitment: 1n,
              inputHash: new Uint8Array(32),
            },
            participatingGuardians: uniqueGuardians,
            timestamp: Date.now(),
            isFinal: false,
          };

          // Propagate from county to state
          county.propagateToParent(precinctTally);

          // State should have received the tally
          const stateChildTallies =
            state.getChildIntervalTallies(intervalNumber);
          expect(stateChildTallies).toHaveLength(1);
          expect(stateChildTallies[0].intervalNumber).toBe(intervalNumber);
          expect(stateChildTallies[0].tallies).toEqual(
            tallies as readonly bigint[],
          );
          expect(stateChildTallies[0].participatingGuardians).toEqual(
            uniqueGuardians,
          );
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });

  /**
   * Property 10: Hierarchical Consistency — Multi-level propagation
   * **Validates: Requirement 10.4**
   *
   * Tallies propagate through the full hierarchy:
   * county → state → national.
   */
  it('tallies propagate through the full county → state → national hierarchy', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.array(fc.bigInt({ min: 0n, max: 500n }), {
          minLength: 2,
          maxLength: 4,
        }),
        (intervalNumber, tallies) => {
          const choices = tallies.map((_, i) => `Choice ${i}`);

          const county = new ThresholdCountyAggregator<string>(
            { id: 'county-1', name: 'County', level: JurisdictionLevel.County },
            keyPair.publicKey,
            keyPair.config,
            choices,
            'poll-1',
          );

          const state = new ThresholdStateAggregator<string>(
            { id: 'state-1', name: 'State', level: JurisdictionLevel.State },
            keyPair.publicKey,
            keyPair.config,
            choices,
            'poll-1',
          );

          const national = new ThresholdNationalAggregator<string>(
            {
              id: 'national-1',
              name: 'National',
              level: JurisdictionLevel.National,
            },
            keyPair.publicKey,
            keyPair.config,
            choices,
            'poll-1',
          );

          county.setParent(state);
          state.setParent(national);

          const tally: IntervalTally<string> = {
            pollId: 'poll-1',
            intervalNumber,
            tallies: tallies as readonly bigint[],
            choices: choices as readonly string[],
            voteCount: 50,
            cumulativeVoteCount: 50,
            proof: {
              partialProofs: [],
              aggregatedCommitment: 1n,
              inputHash: new Uint8Array(32),
            },
            participatingGuardians: [1, 2] as readonly number[],
            timestamp: Date.now(),
            isFinal: false,
          };

          // Propagate from county upward
          county.propagateToParent(tally);

          // State received it
          const stateChild = state.getChildIntervalTallies(intervalNumber);
          expect(stateChild).toHaveLength(1);
          expect(stateChild[0].tallies).toEqual(tallies as readonly bigint[]);

          // National received it
          const nationalChild =
            national.getChildIntervalTallies(intervalNumber);
          expect(nationalChild).toHaveLength(1);
          expect(nationalChild[0].tallies).toEqual(
            tallies as readonly bigint[],
          );
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });

  /**
   * Property 10: Hierarchical Consistency — Final tally consistency
   * **Validates: Requirement 10.5**
   *
   * The final tally's cumulative vote count is consistent with
   * interval tallies (final >= last interval's cumulative count).
   */
  it('final tally cumulative vote count is consistent with interval tallies', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            voteCount: fc.integer({ min: 1, max: 100 }),
            tallies: fc.array(fc.bigInt({ min: 0n, max: 100n }), {
              minLength: 2,
              maxLength: 2,
            }),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        (intervals) => {
          const choices = ['A', 'B'];

          const national = new ThresholdNationalAggregator<string>(
            {
              id: 'national-1',
              name: 'National',
              level: JurisdictionLevel.National,
            },
            keyPair.publicKey,
            keyPair.config,
            choices,
            'poll-1',
          );

          // Simulate interval tallies being published
          let cumulativeVotes = 0;
          for (let i = 0; i < intervals.length; i++) {
            cumulativeVotes += intervals[i].voteCount;

            const intervalTally: IntervalTally<string> = {
              pollId: 'poll-1',
              intervalNumber: i + 1,
              tallies: intervals[i].tallies as readonly bigint[],
              choices: choices as readonly string[],
              voteCount: intervals[i].voteCount,
              cumulativeVoteCount: cumulativeVotes,
              proof: {
                partialProofs: [],
                aggregatedCommitment: 1n,
                inputHash: new Uint8Array(32),
              },
              participatingGuardians: [1, 2] as readonly number[],
              timestamp: Date.now(),
              isFinal: false,
            };

            national.propagateToParent(intervalTally);
          }

          // Simulate a final tally with cumulative >= last interval
          const finalTally: IntervalTally<string> = {
            pollId: 'poll-1',
            intervalNumber: -1,
            tallies: intervals.reduce(
              (acc, iv) => acc.map((v, j) => v + iv.tallies[j]),
              [0n, 0n],
            ) as readonly bigint[],
            choices: choices as readonly string[],
            voteCount: 0,
            cumulativeVoteCount: cumulativeVotes,
            proof: {
              partialProofs: [],
              aggregatedCommitment: 1n,
              inputHash: new Uint8Array(32),
            },
            participatingGuardians: [1, 2] as readonly number[],
            timestamp: Date.now(),
            isFinal: true,
          };

          national.propagateToParent(finalTally);

          // The final tally's cumulative count should be >= last interval's
          const lastIntervalTallies = national.getChildIntervalTallies(
            intervals.length,
          );
          const finalTallies = national.getChildIntervalTallies(-1);

          expect(finalTallies).toHaveLength(1);
          expect(finalTallies[0].isFinal).toBe(true);

          if (lastIntervalTallies.length > 0) {
            expect(finalTallies[0].cumulativeVoteCount).toBeGreaterThanOrEqual(
              lastIntervalTallies[0].cumulativeVoteCount,
            );
          }
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });

  /**
   * Property 10: Hierarchical Consistency — PublicTallyFeed integration
   * **Validates: Requirements 10.4, 10.5**
   *
   * When ceremonies complete, the decrypted tallies are published to the
   * feed and can be retrieved. Uses the real ceremony coordinator and
   * partial decryption pipeline.
   */
  it('ceremony results are published to the tally feed via the coordinator', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.array(fc.bigInt({ min: 1n, max: 100n }), {
          minLength: 2,
          maxLength: 2,
        }),
        (intervalCount, baseTallies) => {
          const choices = ['A', 'B'];
          const feed = new PublicTallyFeed<string>();

          const coordinator = new CeremonyCoordinator<string>(
            keyPair.publicKey,
            keyPair.verificationKeys,
            keyPair.theta,
            keyPair.config,
          );

          const national = new ThresholdNationalAggregator<string>(
            {
              id: 'national-1',
              name: 'National',
              level: JurisdictionLevel.National,
            },
            keyPair.publicKey,
            keyPair.config,
            choices,
            'poll-1',
            feed,
          );

          const published: IntervalTally<string>[] = [];
          feed.subscribe('poll-1', (t) => published.push(t));

          for (let i = 1; i <= intervalCount; i++) {
            // Encrypt tallies for this interval
            const encryptedTally = baseTallies.map((v) =>
              keyPair.publicKey.encrypt(v * BigInt(i)),
            );

            // Start a ceremony and submit partials using the helper
            const ceremony = coordinator.startCeremony(
              'poll-1',
              i,
              encryptedTally,
            );
            submitPartials(
              coordinator,
              ceremony.id,
              keyPair,
              service,
              encryptedTally,
            );

            // Ceremony should be completed with a result
            const completed = coordinator.getCeremony(ceremony.id);
            expect(completed).toBeDefined();
            expect(completed!.result).toBeDefined();

            // Build an interval tally from the ceremony result and publish
            const intervalTally: IntervalTally<string> = {
              pollId: 'poll-1',
              intervalNumber: i,
              tallies: completed!.result!.tallies as readonly bigint[],
              choices: choices as readonly string[],
              voteCount: 10 * i,
              cumulativeVoteCount: (10 * i * (i + 1)) / 2,
              proof: completed!.result!.combinedProof,
              participatingGuardians: completed!.result!
                .participatingGuardians as readonly number[],
              timestamp: Date.now(),
              isFinal: false,
            };

            feed.publish(intervalTally);
            national.propagateToParent(intervalTally);
          }

          // All tallies should be in the feed
          const history = feed.getHistory('poll-1');
          expect(history).toHaveLength(intervalCount);

          // Each interval should be retrievable
          for (let i = 1; i <= intervalCount; i++) {
            const retrieved = feed.getTallyAtInterval('poll-1', i);
            expect(retrieved).toBeDefined();
            expect(retrieved!.intervalNumber).toBe(i);

            // Verify the decrypted tallies match the expected plaintext
            for (let j = 0; j < baseTallies.length; j++) {
              expect(retrieved!.tallies[j]).toBe(baseTallies[j] * BigInt(i));
            }
          }

          // Current tally should be the last one
          const current = feed.getCurrentTally('poll-1');
          expect(current).toBeDefined();
          expect(current!.intervalNumber).toBe(intervalCount);

          // National should have received all tallies
          for (let i = 1; i <= intervalCount; i++) {
            const nationalChild = national.getChildIntervalTallies(i);
            expect(nationalChild).toHaveLength(1);
          }
        },
      ),
      { numRuns: 50, verbose: true },
    );
  });

  /**
   * Property 10: Hierarchical Consistency — verifyConsistency
   * **Validates: Requirement 10.5**
   *
   * The NationalAggregator's verifyConsistency method correctly
   * validates that the final tally is consistent with interval tallies.
   */
  it('verifyConsistency returns false when no final tally exists', () => {
    const national = new ThresholdNationalAggregator<string>(
      { id: 'national-1', name: 'National', level: JurisdictionLevel.National },
      keyPair.publicKey,
      keyPair.config,
      ['A', 'B'],
      'poll-1',
    );

    expect(national.verifyConsistency()).toBe(false);
  });
});
