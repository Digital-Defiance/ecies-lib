/**
 * Property-Based Tests: Public Tally Feed
 *
 * Feature: real-time-threshold-voting
 * These tests validate interval tally completeness and feed behavior.
 *
 * Property 7: Interval Tally Completeness
 *
 * *For any* published interval tally, it SHALL contain all required fields:
 * decrypted tallies, timestamp, interval number, combined ZK proof,
 * and participating Guardian indices.
 *
 * **Validates: Requirements 7.2, 7.3, 7.5**
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import type { CombinedZKProof } from './interfaces/combined-zk-proof';
import type { IntervalTally } from './interfaces/interval-tally';
import type { ZKProof } from './interfaces/zk-proof';
import { PublicTallyFeed } from './public-tally-feed';

/**
 * Arbitrary for a ZKProof.
 */
const arbZKProof: fc.Arbitrary<ZKProof> = fc.record({
  commitment: fc.bigInt({ min: 1n, max: 10000n }),
  challenge: fc.bigInt({ min: 1n, max: 10000n }),
  response: fc.bigInt({ min: 1n, max: 10000n }),
});

/**
 * Arbitrary for a CombinedZKProof with 1–5 partial proofs.
 */
const arbCombinedZKProof: fc.Arbitrary<CombinedZKProof> = fc
  .array(arbZKProof, { minLength: 1, maxLength: 5 })
  .chain((partialProofs) =>
    fc.record({
      partialProofs: fc.constant(partialProofs as readonly ZKProof[]),
      aggregatedCommitment: fc.bigInt({ min: 1n, max: 10000n }),
      inputHash: fc.uint8Array({ minLength: 32, maxLength: 32 }),
    }),
  );

/**
 * Arbitrary for a set of unique Guardian indices (1-based).
 */
const arbGuardianIndices: fc.Arbitrary<readonly number[]> = fc
  .shuffledSubarray([1, 2, 3, 4, 5], { minLength: 1, maxLength: 5 })
  .map((arr) => arr as readonly number[]);

/**
 * Arbitrary for a valid IntervalTally with all required fields.
 */
const arbIntervalTally: fc.Arbitrary<IntervalTally<string>> = fc
  .tuple(
    fc.integer({ min: 1, max: 100 }), // numChoices
    fc.integer({ min: -1, max: 50 }), // intervalNumber
    arbCombinedZKProof,
    arbGuardianIndices,
    fc.integer({ min: 0, max: 100000 }), // voteCount
    fc.integer({ min: 0, max: 1000000 }), // cumulativeVoteCount
    fc.boolean(), // isFinal
  )
  .chain(
    ([
      numChoices,
      intervalNumber,
      proof,
      participatingGuardians,
      voteCount,
      cumulativeVoteCount,
      isFinal,
    ]) =>
      fc
        .tuple(
          fc.array(fc.bigInt({ min: 0n, max: 99999n }), {
            minLength: numChoices,
            maxLength: numChoices,
          }),
          fc.array(
            fc.string({ minLength: 1, maxLength: 20, unit: 'grapheme' }),
            {
              minLength: numChoices,
              maxLength: numChoices,
            },
          ),
        )
        .map(
          ([tallies, choices]): IntervalTally<string> => ({
            pollId: 'poll-1',
            intervalNumber,
            tallies: tallies as readonly bigint[],
            choices: choices as readonly string[],
            voteCount,
            cumulativeVoteCount,
            proof,
            participatingGuardians,
            timestamp: Date.now(),
            isFinal,
          }),
        ),
  );

describe('Feature: real-time-threshold-voting, Property 7: Interval Tally Completeness', () => {
  it('For any published tally, all required fields are present and retrievable from the feed', () => {
    fc.assert(
      fc.property(arbIntervalTally, (tally) => {
        const feed = new PublicTallyFeed<string>();
        feed.publish(tally);

        const retrieved = feed.getCurrentTally('poll-1');
        expect(retrieved).toBeDefined();

        // Req 7.2: decrypted tallies, timestamp, interval number
        expect(retrieved!.tallies).toEqual(tally.tallies);
        expect(retrieved!.timestamp).toBe(tally.timestamp);
        expect(retrieved!.intervalNumber).toBe(tally.intervalNumber);

        // Req 7.3: combined ZK proof
        expect(retrieved!.proof).toBeDefined();
        expect(retrieved!.proof.partialProofs.length).toBeGreaterThan(0);
        expect(retrieved!.proof.aggregatedCommitment).toBeDefined();
        expect(retrieved!.proof.inputHash).toBeDefined();

        // Req 7.5: participating Guardian indices
        expect(retrieved!.participatingGuardians).toEqual(
          tally.participatingGuardians,
        );
        expect(retrieved!.participatingGuardians.length).toBeGreaterThan(0);
      }),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any sequence of tallies, history preserves all entries in publication order', () => {
    fc.assert(
      fc.property(
        fc.array(arbIntervalTally, { minLength: 1, maxLength: 10 }).map(
          // Ensure unique interval numbers so each is independently retrievable
          (tallies) =>
            tallies.map((t, i) => ({
              ...t,
              intervalNumber: i + 1,
            })),
        ),
        (tallies) => {
          const feed = new PublicTallyFeed<string>();

          for (const t of tallies) {
            feed.publish(t);
          }

          const history = feed.getHistory('poll-1');
          expect(history).toHaveLength(tallies.length);

          // Publication order preserved
          for (let i = 0; i < tallies.length; i++) {
            expect(history[i].intervalNumber).toBe(tallies[i].intervalNumber);
            expect(history[i].tallies).toEqual(tallies[i].tallies);
          }

          // Each interval is individually retrievable
          for (const t of tallies) {
            const found = feed.getTallyAtInterval('poll-1', t.intervalNumber);
            expect(found).toBeDefined();
            expect(found!.intervalNumber).toBe(t.intervalNumber);
          }

          // Current tally is the last published
          const current = feed.getCurrentTally('poll-1');
          expect(current).toBeDefined();
          expect(current!.intervalNumber).toBe(
            tallies[tallies.length - 1].intervalNumber,
          );
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any tally, subscribers receive the tally with all required fields intact', () => {
    fc.assert(
      fc.property(arbIntervalTally, (tally) => {
        const feed = new PublicTallyFeed<string>();
        const received: IntervalTally<string>[] = [];

        feed.subscribe('poll-1', (t) => received.push(t));
        feed.publish(tally);

        // Subscriber should have received exactly the published tally
        expect(received).toHaveLength(1);
        const r = received[0];

        // All required fields present
        expect(r.tallies).toEqual(tally.tallies);
        expect(r.timestamp).toBe(tally.timestamp);
        expect(r.intervalNumber).toBe(tally.intervalNumber);
        expect(r.proof).toBeDefined();
        expect(r.proof.partialProofs.length).toBeGreaterThan(0);
        expect(r.participatingGuardians).toEqual(tally.participatingGuardians);
      }),
      { numRuns: 100, verbose: true },
    );
  });
});
