/**
 * Property-Based Tests: Decryption Combiner
 *
 * Feature: real-time-threshold-voting
 * These tests validate threshold decryption combining using Lagrange interpolation.
 *
 * Property 1: Threshold Decryption Correctness (k works, k-1 fails)
 * Property 3: Paillier Compatibility
 *
 * **Validates: Requirements 4.1, 4.5, 12.1**
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fc from 'fast-check';
import {
  DecryptionCombiner,
  InsufficientPartialsError,
} from './decryption-combiner';
import type { ThresholdKeyPair, PartialDecryption } from './interfaces';
import { PartialDecryptionService } from './partial-decryption-service';
import { ThresholdKeyGenerator } from './threshold-key-generator';

/**
 * Helper: Select a random k-subset from an array.
 */
function selectSubset<T>(arr: readonly T[], k: number, seed: number): T[] {
  const indices = Array.from({ length: arr.length }, (_, i) => i);
  // Deterministic shuffle using seed
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.abs((seed * (i + 1) * 2654435761) | 0) % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, k).map((i) => arr[i]);
}

describe('Property-Based Tests: Decryption Combiner', () => {
  // Pre-generate key pairs for different configurations
  const keyPairs = new Map<string, ThresholdKeyPair>();
  const services = new Map<string, PartialDecryptionService>();
  const combiners = new Map<string, DecryptionCombiner>();

  const configs: [number, number][] = [
    [2, 3],
    [3, 5],
  ];

  beforeAll(async () => {
    const generator = new ThresholdKeyGenerator();
    for (const [k, n] of configs) {
      const key = `${k}-${n}`;
      const keyPair = await generator.generate({
        totalShares: n,
        threshold: k,
        keyBitLength: 512,
      });
      keyPairs.set(key, keyPair);
      services.set(key, new PartialDecryptionService(keyPair.publicKey));
      combiners.set(
        key,
        new DecryptionCombiner(
          keyPair.publicKey,
          keyPair.verificationKeys,
          keyPair.theta,
        ),
      );
    }
  }, 120000);

  /**
   * Property 1: Threshold Decryption Correctness
   * Feature: real-time-threshold-voting, Property 1: Threshold Decryption Correctness
   * **Validates: Requirements 4.1, 4.5, 12.1**
   *
   * For any (k, n) threshold configuration and any encrypted value,
   * combining exactly k valid partial decryptions SHALL produce the correct
   * plaintext, and combining any (k-1) partial decryptions SHALL fail.
   */
  describe('Property 1: Threshold Decryption Correctness', () => {
    it('combining exactly k partials from any k-subset should produce the correct plaintext', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 10000n }),
          fc.integer({ min: 0, max: configs.length - 1 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.uint8Array({ minLength: 8, maxLength: 16 }),
          (plaintext, configIdx, subsetSeed, nonce) => {
            const [k, n] = configs[configIdx];
            const key = `${k}-${n}`;
            const keyPair = keyPairs.get(key)!;
            const service = services.get(key)!;
            const combiner = combiners.get(key)!;

            const ciphertext = keyPair.publicKey.encrypt(plaintext);

            // Compute all n partial decryptions
            const allPartials: PartialDecryption[] = keyPair.keyShares.map(
              (share) => service.computePartial([ciphertext], share, nonce),
            );

            // Select a random k-subset
            const subset = selectSubset(allPartials, k, subsetSeed);

            const result = combiner.combine(
              subset,
              [ciphertext],
              keyPair.publicKey,
              keyPair.config,
            );

            expect(result.tallies[0]).toBe(plaintext);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('combining k-1 partials should throw InsufficientPartialsError', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 10000n }),
          fc.integer({ min: 0, max: configs.length - 1 }),
          fc.uint8Array({ minLength: 8, maxLength: 16 }),
          (plaintext, configIdx, nonce) => {
            const [k, n] = configs[configIdx];
            const key = `${k}-${n}`;
            const keyPair = keyPairs.get(key)!;
            const service = services.get(key)!;
            const combiner = combiners.get(key)!;

            const ciphertext = keyPair.publicKey.encrypt(plaintext);

            // Compute only k-1 partial decryptions
            const partials: PartialDecryption[] = keyPair.keyShares
              .slice(0, k - 1)
              .map((share) =>
                service.computePartial([ciphertext], share, nonce),
              );

            expect(() =>
              combiner.combine(
                partials,
                [ciphertext],
                keyPair.publicKey,
                keyPair.config,
              ),
            ).toThrow(InsufficientPartialsError);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('different k-subsets should produce the same plaintext', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 10000n }),
          fc.integer({ min: 0, max: configs.length - 1 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1001, max: 2000 }),
          fc.uint8Array({ minLength: 8, maxLength: 16 }),
          (plaintext, configIdx, seed1, seed2, nonce) => {
            const [k, n] = configs[configIdx];
            const key = `${k}-${n}`;
            const keyPair = keyPairs.get(key)!;
            const service = services.get(key)!;
            const combiner = combiners.get(key)!;

            const ciphertext = keyPair.publicKey.encrypt(plaintext);

            const allPartials: PartialDecryption[] = keyPair.keyShares.map(
              (share) => service.computePartial([ciphertext], share, nonce),
            );

            const subset1 = selectSubset(allPartials, k, seed1);
            const subset2 = selectSubset(allPartials, k, seed2);

            const result1 = combiner.combine(
              subset1,
              [ciphertext],
              keyPair.publicKey,
              keyPair.config,
            );
            const result2 = combiner.combine(
              subset2,
              [ciphertext],
              keyPair.publicKey,
              keyPair.config,
            );

            expect(result1.tallies[0]).toBe(result2.tallies[0]);
            expect(result1.tallies[0]).toBe(plaintext);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 3: Paillier Compatibility
   * Feature: real-time-threshold-voting, Property 3: Paillier Compatibility
   * **Validates: Requirements 4.1, 12.1**
   *
   * For any value encrypted with the threshold public key, it SHALL be
   * compatible with standard Paillier homomorphic operations, and the
   * threshold decryption of homomorphically combined ciphertexts SHALL
   * equal the corresponding operation on plaintexts.
   */
  describe('Property 3: Paillier Compatibility', () => {
    it('threshold decryption of homomorphic sum should equal sum of plaintexts', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 5000n }),
          fc.bigInt({ min: 0n, max: 5000n }),
          fc.uint8Array({ minLength: 8, maxLength: 16 }),
          (a, b, nonce) => {
            const key = '2-3';
            const keyPair = keyPairs.get(key)!;
            const service = services.get(key)!;
            const combiner = combiners.get(key)!;

            // Encrypt both values
            const encA = keyPair.publicKey.encrypt(a);
            const encB = keyPair.publicKey.encrypt(b);

            // Homomorphic addition
            const encSum = keyPair.publicKey.addition(encA, encB);

            // Compute partials for the sum ciphertext
            const partials: PartialDecryption[] = keyPair.keyShares
              .slice(0, 2)
              .map((share) => service.computePartial([encSum], share, nonce));

            const result = combiner.combine(
              partials,
              [encSum],
              keyPair.publicKey,
              keyPair.config,
            );

            expect(result.tallies[0]).toBe(a + b);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('threshold decryption of scalar multiplication should equal scaled plaintext', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 1000n }),
          fc.bigInt({ min: 1n, max: 100n }),
          fc.uint8Array({ minLength: 8, maxLength: 16 }),
          (plaintext, scalar, nonce) => {
            const key = '2-3';
            const keyPair = keyPairs.get(key)!;
            const service = services.get(key)!;
            const combiner = combiners.get(key)!;

            const encrypted = keyPair.publicKey.encrypt(plaintext);
            const scaled = keyPair.publicKey.multiply(encrypted, scalar);

            const partials: PartialDecryption[] = keyPair.keyShares
              .slice(0, 2)
              .map((share) => service.computePartial([scaled], share, nonce));

            const result = combiner.combine(
              partials,
              [scaled],
              keyPair.publicKey,
              keyPair.config,
            );

            expect(result.tallies[0]).toBe(plaintext * scalar);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
