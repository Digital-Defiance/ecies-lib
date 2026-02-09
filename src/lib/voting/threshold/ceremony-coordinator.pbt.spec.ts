/**
 * Property-Based Tests: Ceremony Coordinator
 *
 * Feature: real-time-threshold-voting
 * These tests validate ceremony duplicate prevention and replay protection.
 *
 * Property 8: Ceremony Duplicate Prevention
 *
 * *For any* decryption ceremony, a Guardian SHALL be able to submit at most
 * one partial decryption. Duplicate submissions from the same Guardian
 * SHALL be rejected.
 *
 * **Validates: Requirements 6.5, 12.6**
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fc from 'fast-check';
import {
  CeremonyCoordinator,
  DuplicatePartialSubmissionError,
  InvalidCeremonyPartialProofError,
} from './ceremony-coordinator';
import type { ThresholdKeyPair } from './interfaces';
import { PartialDecryptionService } from './partial-decryption-service';
import { ThresholdKeyGenerator } from './threshold-key-generator';

let keyPair: ThresholdKeyPair;
let partialService: PartialDecryptionService;

beforeAll(async () => {
  const generator = new ThresholdKeyGenerator();
  keyPair = await generator.generate({
    totalShares: 5,
    threshold: 3,
    keyBitLength: 512,
  });
  partialService = new PartialDecryptionService(keyPair.publicKey);
}, 120_000);

/**
 * Arbitrary for a plaintext value to encrypt (small positive bigints).
 */
const arbPlaintext = fc.bigInt({ min: 0n, max: 999n });

/**
 * Arbitrary for a Guardian share index (0-based into keyShares array).
 */
const arbShareIndex = fc.integer({ min: 0, max: 4 });

describe('Feature: real-time-threshold-voting, Property 8: Ceremony Duplicate Prevention', () => {
  it('For any Guardian and any encrypted value, submitting the same Guardian twice to a ceremony is rejected', () => {
    fc.assert(
      fc.property(arbPlaintext, arbShareIndex, (plaintext, shareIdx) => {
        const ciphertext = keyPair.publicKey.encrypt(plaintext);
        const coordinator = new CeremonyCoordinator<string>(
          keyPair.publicKey,
          keyPair.verificationKeys,
          keyPair.theta,
          keyPair.config,
        );

        const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

        // First submission should succeed
        const partial = partialService.computePartial(
          [ciphertext],
          keyPair.keyShares[shareIdx],
          ceremony.nonce,
        );
        const accepted = coordinator.submitPartial(ceremony.id, partial);
        expect(accepted).toBe(true);

        // Second submission from the same Guardian must be rejected
        const partial2 = partialService.computePartial(
          [ciphertext],
          keyPair.keyShares[shareIdx],
          ceremony.nonce,
        );
        expect(() => coordinator.submitPartial(ceremony.id, partial2)).toThrow(
          DuplicatePartialSubmissionError,
        );
      }),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any ceremony, partials with a mismatched nonce are rejected (replay protection)', () => {
    fc.assert(
      fc.property(
        arbPlaintext,
        arbShareIndex,
        fc.uint8Array({ minLength: 32, maxLength: 32 }),
        (plaintext, shareIdx, wrongNonce) => {
          const ciphertext = keyPair.publicKey.encrypt(plaintext);
          const coordinator = new CeremonyCoordinator<string>(
            keyPair.publicKey,
            keyPair.verificationKeys,
            keyPair.theta,
            keyPair.config,
          );

          const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

          // Compute partial with a different nonce
          const partial = partialService.computePartial(
            [ciphertext],
            keyPair.keyShares[shareIdx],
            wrongNonce,
          );

          // If the wrong nonce happens to match the ceremony nonce, skip
          // (astronomically unlikely with 32 random bytes, but handle it)
          const noncesMatch =
            wrongNonce.length === ceremony.nonce.length &&
            wrongNonce.every((b, i) => b === ceremony.nonce[i]);

          if (noncesMatch) {
            // Nonces match by chance — submission should succeed
            expect(coordinator.submitPartial(ceremony.id, partial)).toBe(true);
          } else {
            // Nonces differ — must be rejected
            expect(() =>
              coordinator.submitPartial(ceremony.id, partial),
            ).toThrow(InvalidCeremonyPartialProofError);
          }
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any set of distinct Guardians, each can submit exactly once to the same ceremony', () => {
    fc.assert(
      fc.property(
        arbPlaintext,
        fc.shuffledSubarray([0, 1, 2, 3, 4], { minLength: 1, maxLength: 5 }),
        (plaintext, guardianIndices) => {
          const ciphertext = keyPair.publicKey.encrypt(plaintext);
          const coordinator = new CeremonyCoordinator<string>(
            keyPair.publicKey,
            keyPair.verificationKeys,
            keyPair.theta,
            keyPair.config,
          );

          const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

          // Each distinct Guardian should be able to submit once
          for (const idx of guardianIndices) {
            // Skip if ceremony already completed (k partials reached)
            if (ceremony.status !== 'in-progress') break;

            const partial = partialService.computePartial(
              [ciphertext],
              keyPair.keyShares[idx],
              ceremony.nonce,
            );
            const accepted = coordinator.submitPartial(ceremony.id, partial);
            expect(accepted).toBe(true);
          }

          // The number of accepted partials should equal the number of
          // distinct Guardians that submitted (capped by threshold completion)
          const expectedCount = Math.min(
            guardianIndices.length,
            keyPair.config.threshold,
          );
          expect(ceremony.partials.size).toBe(expectedCount);
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });
});
