/**
 * Tests for DecryptionCombiner
 *
 * Validates combining partial decryptions using Lagrange interpolation
 * to produce the final plaintext tally.
 */
import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  DecryptionCombiner,
  InsufficientPartialsError,
  InvalidPartialInCombineError,
  CombineFailedError,
} from './decryption-combiner';
import type { ThresholdKeyPair, PartialDecryption } from './interfaces';
import { PartialDecryptionService } from './partial-decryption-service';
import { ThresholdKeyGenerator } from './threshold-key-generator';

describe('DecryptionCombiner', () => {
  let keyPair: ThresholdKeyPair;
  let partialService: PartialDecryptionService;
  let combiner: DecryptionCombiner;
  const ceremonyNonce = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

  beforeAll(async () => {
    const generator = new ThresholdKeyGenerator();
    keyPair = await generator.generate({
      totalShares: 5,
      threshold: 3,
      keyBitLength: 512,
    });
    partialService = new PartialDecryptionService(keyPair.publicKey);
    combiner = new DecryptionCombiner(
      keyPair.publicKey,
      keyPair.verificationKeys,
      keyPair.theta,
    );
  }, 120000);

  describe('combine', () => {
    it('should decrypt a single ciphertext with exactly k partials', () => {
      const plaintext = 42n;
      const ciphertext = keyPair.publicKey.encrypt(plaintext);

      // Compute k=3 partial decryptions
      const partials: PartialDecryption[] = [];
      for (let i = 0; i < 3; i++) {
        partials.push(
          partialService.computePartial(
            [ciphertext],
            keyPair.keyShares[i],
            ceremonyNonce,
          ),
        );
      }

      const result = combiner.combine(
        partials,
        [ciphertext],
        keyPair.publicKey,
        keyPair.config,
      );

      expect(result.tallies).toHaveLength(1);
      expect(result.tallies[0]).toBe(plaintext);
    });

    it('should decrypt with more than k partials', () => {
      const plaintext = 100n;
      const ciphertext = keyPair.publicKey.encrypt(plaintext);

      // Compute all 5 partial decryptions
      const partials: PartialDecryption[] = keyPair.keyShares.map((share) =>
        partialService.computePartial([ciphertext], share, ceremonyNonce),
      );

      const result = combiner.combine(
        partials,
        [ciphertext],
        keyPair.publicKey,
        keyPair.config,
      );

      expect(result.tallies).toHaveLength(1);
      expect(result.tallies[0]).toBe(plaintext);
    });

    it('should decrypt zero correctly', () => {
      const plaintext = 0n;
      const ciphertext = keyPair.publicKey.encrypt(plaintext);

      const partials: PartialDecryption[] = [];
      for (let i = 0; i < 3; i++) {
        partials.push(
          partialService.computePartial(
            [ciphertext],
            keyPair.keyShares[i],
            ceremonyNonce,
          ),
        );
      }

      const result = combiner.combine(
        partials,
        [ciphertext],
        keyPair.publicKey,
        keyPair.config,
      );

      expect(result.tallies[0]).toBe(0n);
    });

    it('should include participating guardian indices', () => {
      const ciphertext = keyPair.publicKey.encrypt(1n);

      const partials = [
        partialService.computePartial(
          [ciphertext],
          keyPair.keyShares[0],
          ceremonyNonce,
        ),
        partialService.computePartial(
          [ciphertext],
          keyPair.keyShares[2],
          ceremonyNonce,
        ),
        partialService.computePartial(
          [ciphertext],
          keyPair.keyShares[4],
          ceremonyNonce,
        ),
      ];

      const result = combiner.combine(
        partials,
        [ciphertext],
        keyPair.publicKey,
        keyPair.config,
      );

      expect(result.participatingGuardians).toEqual([1, 3, 5]);
    });

    it('should include a combined ZK proof', () => {
      const ciphertext = keyPair.publicKey.encrypt(10n);

      const partials: PartialDecryption[] = [];
      for (let i = 0; i < 3; i++) {
        partials.push(
          partialService.computePartial(
            [ciphertext],
            keyPair.keyShares[i],
            ceremonyNonce,
          ),
        );
      }

      const result = combiner.combine(
        partials,
        [ciphertext],
        keyPair.publicKey,
        keyPair.config,
      );

      expect(result.combinedProof.partialProofs).toHaveLength(3);
      expect(typeof result.combinedProof.aggregatedCommitment).toBe('bigint');
      expect(result.combinedProof.inputHash).toBeInstanceOf(Uint8Array);
    });

    it('should throw InsufficientPartialsError with fewer than k partials', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);

      const partials = [
        partialService.computePartial(
          [ciphertext],
          keyPair.keyShares[0],
          ceremonyNonce,
        ),
        partialService.computePartial(
          [ciphertext],
          keyPair.keyShares[1],
          ceremonyNonce,
        ),
      ];

      expect(() =>
        combiner.combine(
          partials,
          [ciphertext],
          keyPair.publicKey,
          keyPair.config,
        ),
      ).toThrow(InsufficientPartialsError);
    });

    it('should throw CombineFailedError for empty encrypted tally', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);

      const partials: PartialDecryption[] = [];
      for (let i = 0; i < 3; i++) {
        partials.push(
          partialService.computePartial(
            [ciphertext],
            keyPair.keyShares[i],
            ceremonyNonce,
          ),
        );
      }

      expect(() =>
        combiner.combine(partials, [], keyPair.publicKey, keyPair.config),
      ).toThrow(CombineFailedError);
    });

    it('should throw InvalidPartialInCombineError for tampered partial', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);

      const partials: PartialDecryption[] = [];
      for (let i = 0; i < 3; i++) {
        partials.push(
          partialService.computePartial(
            [ciphertext],
            keyPair.keyShares[i],
            ceremonyNonce,
          ),
        );
      }

      // Tamper with the first partial
      const tampered = [
        { ...partials[0], values: [partials[0].values[0] + 1n] },
        partials[1],
        partials[2],
      ];

      expect(() =>
        combiner.combine(
          tampered,
          [ciphertext],
          keyPair.publicKey,
          keyPair.config,
        ),
      ).toThrow(InvalidPartialInCombineError);
    });

    it('should produce the same result with different k-subsets of guardians', () => {
      const plaintext = 77n;
      const ciphertext = keyPair.publicKey.encrypt(plaintext);

      // Subset 1: guardians 1, 2, 3
      const partials1 = [0, 1, 2].map((i) =>
        partialService.computePartial(
          [ciphertext],
          keyPair.keyShares[i],
          ceremonyNonce,
        ),
      );

      // Subset 2: guardians 3, 4, 5
      const partials2 = [2, 3, 4].map((i) =>
        partialService.computePartial(
          [ciphertext],
          keyPair.keyShares[i],
          ceremonyNonce,
        ),
      );

      const result1 = combiner.combine(
        partials1,
        [ciphertext],
        keyPair.publicKey,
        keyPair.config,
      );

      const result2 = combiner.combine(
        partials2,
        [ciphertext],
        keyPair.publicKey,
        keyPair.config,
      );

      expect(result1.tallies[0]).toBe(plaintext);
      expect(result2.tallies[0]).toBe(plaintext);
    });
  });

  describe('verifyCombined', () => {
    it('should verify a valid combined decryption', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);

      const partials: PartialDecryption[] = [];
      for (let i = 0; i < 3; i++) {
        partials.push(
          partialService.computePartial(
            [ciphertext],
            keyPair.keyShares[i],
            ceremonyNonce,
          ),
        );
      }

      const result = combiner.combine(
        partials,
        [ciphertext],
        keyPair.publicKey,
        keyPair.config,
      );

      const isValid = combiner.verifyCombined(
        result,
        [ciphertext],
        keyPair.verificationKeys,
        keyPair.publicKey,
      );

      expect(isValid).toBe(true);
    });

    it('should reject verification with empty encrypted tally', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);

      const partials: PartialDecryption[] = [];
      for (let i = 0; i < 3; i++) {
        partials.push(
          partialService.computePartial(
            [ciphertext],
            keyPair.keyShares[i],
            ceremonyNonce,
          ),
        );
      }

      const result = combiner.combine(
        partials,
        [ciphertext],
        keyPair.publicKey,
        keyPair.config,
      );

      const isValid = combiner.verifyCombined(
        result,
        [],
        keyPair.verificationKeys,
        keyPair.publicKey,
      );

      expect(isValid).toBe(false);
    });
  });
});
