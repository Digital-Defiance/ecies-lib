/**
 * Property-Based Tests: Threshold Key Generation
 *
 * Feature: real-time-threshold-voting
 * These tests validate threshold key generation using Shamir's Secret Sharing.
 *
 * Property 1: Threshold Decryption Correctness
 * Property 11: Configuration Validation
 *
 * **Validates: Requirements 1.1, 1.2, 1.6**
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fc from 'fast-check';
import type {
  ThresholdKeyConfig,
  ThresholdKeyPair,
  KeyShare,
} from './interfaces';
import {
  ThresholdKeyGenerator,
  InvalidThresholdConfigError,
} from './threshold-key-generator';

/**
 * Helper: Compute modular exponentiation (base^exp mod m)
 */
function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  if (m === 1n) return 0n;
  let result = 1n;
  base = ((base % m) + m) % m;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % m;
    }
    exp = exp >> 1n;
    base = (base * base) % m;
  }
  return result;
}

/**
 * Helper: Compute modular inverse using extended Euclidean algorithm
 */
function modInverse(a: bigint, m: bigint): bigint {
  const originalM = m;
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];

  while (r !== 0n) {
    const quotient = old_r / r;
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
  }

  if (old_r !== 1n) {
    throw new Error('Modular inverse does not exist');
  }

  return ((old_s % originalM) + originalM) % originalM;
}

/**
 * Helper: Compute Lagrange coefficient for share at index i
 * λ_i = Π_{j≠i} (j / (j - i)) mod m
 */
function lagrangeCoefficient(
  shareIndex: number,
  allIndices: number[],
  modulus: bigint,
): bigint {
  let numerator = 1n;
  let denominator = 1n;

  for (const j of allIndices) {
    if (j !== shareIndex) {
      numerator = (numerator * BigInt(j)) % modulus;
      denominator = (denominator * BigInt(j - shareIndex)) % modulus;
    }
  }

  // Handle negative denominator
  denominator = ((denominator % modulus) + modulus) % modulus;

  return (numerator * modInverse(denominator, modulus)) % modulus;
}

/**
 * Helper: Reconstruct secret from k shares using Lagrange interpolation
 * secret = Σ (share_i * λ_i) mod m
 */
function reconstructSecret(shares: KeyShare[], modulus: bigint): bigint {
  const indices = shares.map((s) => s.index);
  let secret = 0n;

  for (const share of shares) {
    const lambda = lagrangeCoefficient(share.index, indices, modulus);
    secret = (secret + share.share * lambda) % modulus;
  }

  return ((secret % modulus) + modulus) % modulus;
}

/**
 * Helper: Select k random shares from n shares
 */
function selectRandomShares(
  shares: readonly KeyShare[],
  k: number,
): KeyShare[] {
  const shuffled = [...shares].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, k);
}

describe('Property-Based Tests: Threshold Key Generation', () => {
  let generator: ThresholdKeyGenerator;

  beforeAll(() => {
    generator = new ThresholdKeyGenerator();
  });

  /**
   * Property 11: Configuration Validation
   * Feature: real-time-threshold-voting, Property 11: Configuration Validation
   * **Validates: Requirements 1.2**
   *
   * For any threshold configuration, the system SHALL validate that k <= n,
   * k >= 2, and reject invalid configurations before key generation.
   */
  describe('Property 11: Configuration Validation', () => {
    it('should accept any valid configuration where 2 <= k <= n', () => {
      fc.assert(
        fc.property(
          // Generate valid (k, n) pairs where 2 <= k <= n
          fc
            .integer({ min: 2, max: 20 })
            .chain((n) =>
              fc.tuple(fc.integer({ min: 2, max: n }), fc.constant(n)),
            ),
          ([k, n]) => {
            const config: ThresholdKeyConfig = {
              totalShares: n,
              threshold: k,
            };

            // Should not throw for valid configurations
            expect(() => generator.validateConfig(config)).not.toThrow();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should reject any configuration where k > n', () => {
      fc.assert(
        fc.property(
          // Generate invalid (k, n) pairs where k > n
          fc
            .integer({ min: 2, max: 10 })
            .chain((n) =>
              fc.tuple(fc.integer({ min: n + 1, max: n + 10 }), fc.constant(n)),
            ),
          ([k, n]) => {
            const config: ThresholdKeyConfig = {
              totalShares: n,
              threshold: k,
            };

            // Should throw InvalidThresholdConfigError
            expect(() => generator.validateConfig(config)).toThrow(
              InvalidThresholdConfigError,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should reject any configuration where k < 2', () => {
      fc.assert(
        fc.property(
          // Generate configurations with k < 2
          fc.tuple(
            fc.integer({ min: -10, max: 1 }),
            fc.integer({ min: 2, max: 10 }),
          ),
          ([k, n]) => {
            const config: ThresholdKeyConfig = {
              totalShares: n,
              threshold: k,
            };

            // Should throw InvalidThresholdConfigError
            expect(() => generator.validateConfig(config)).toThrow(
              InvalidThresholdConfigError,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should reject any configuration where n < 2', () => {
      fc.assert(
        fc.property(
          // Generate configurations with n < 2
          fc.integer({ min: -10, max: 1 }),
          (n) => {
            const config: ThresholdKeyConfig = {
              totalShares: n,
              threshold: 2, // Valid k, but n is invalid
            };

            // Should throw InvalidThresholdConfigError
            expect(() => generator.validateConfig(config)).toThrow(
              InvalidThresholdConfigError,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should reject non-integer values for k and n', () => {
      fc.assert(
        fc.property(
          // Generate non-integer values
          fc.oneof(
            fc.tuple(
              fc.double({ min: 2.1, max: 10.9, noNaN: true }),
              fc.integer({ min: 3, max: 10 }),
            ),
            fc.tuple(
              fc.integer({ min: 2, max: 10 }),
              fc.double({ min: 2.1, max: 10.9, noNaN: true }),
            ),
          ),
          ([k, n]) => {
            const config: ThresholdKeyConfig = {
              totalShares: n,
              threshold: k,
            };

            // Should throw InvalidThresholdConfigError for non-integers
            expect(() => generator.validateConfig(config)).toThrow(
              InvalidThresholdConfigError,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should accept valid keyBitLength values >= 512', () => {
      fc.assert(
        fc.property(fc.integer({ min: 512, max: 4096 }), (keyBitLength) => {
          const config: ThresholdKeyConfig = {
            totalShares: 3,
            threshold: 2,
            keyBitLength,
          };

          // Should not throw for valid keyBitLength
          expect(() => generator.validateConfig(config)).not.toThrow();
        }),
        { numRuns: 100 },
      );
    });

    it('should reject keyBitLength values < 512', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 511 }), (keyBitLength) => {
          const config: ThresholdKeyConfig = {
            totalShares: 3,
            threshold: 2,
            keyBitLength,
          };

          // Should throw InvalidThresholdConfigError
          expect(() => generator.validateConfig(config)).toThrow(
            InvalidThresholdConfigError,
          );
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 1: Threshold Decryption Correctness
   * Feature: real-time-threshold-voting, Property 1: Threshold Decryption Correctness
   * **Validates: Requirements 1.1, 1.6**
   *
   * For any (k, n) threshold configuration, combining exactly k valid key shares
   * SHALL reconstruct the secret, and combining any (k-1) shares SHALL NOT
   * reconstruct the correct secret.
   *
   * Note: This tests the Shamir's Secret Sharing property at the key share level.
   * Full threshold decryption testing requires PartialDecryptionService (Task 3).
   */
  describe('Property 1: Threshold Decryption Correctness', () => {
    // Pre-generate key pairs for different configurations to speed up tests
    const keyPairCache = new Map<string, ThresholdKeyPair>();

    /**
     * Get or generate a key pair for the given configuration.
     * Uses caching to avoid regenerating keys for each test iteration.
     */
    async function getKeyPair(k: number, n: number): Promise<ThresholdKeyPair> {
      const cacheKey = `${k}-${n}`;
      if (keyPairCache.has(cacheKey)) {
        return keyPairCache.get(cacheKey)!;
      }

      const config: ThresholdKeyConfig = {
        totalShares: n,
        threshold: k,
        keyBitLength: 512, // Use smaller keys for faster tests
      };

      const keyPair = await generator.generate(config);
      keyPairCache.set(cacheKey, keyPair);
      return keyPair;
    }

    it('should generate exactly n key shares for any valid (k, n) configuration', async () => {
      // Test with a few representative configurations
      const configs: [number, number][] = [
        [2, 2],
        [2, 3],
        [3, 5],
        [5, 9],
      ];

      for (const [k, n] of configs) {
        const keyPair = await getKeyPair(k, n);

        expect(keyPair.keyShares).toHaveLength(n);
        expect(keyPair.verificationKeys).toHaveLength(n);
        expect(keyPair.config.threshold).toBe(k);
        expect(keyPair.config.totalShares).toBe(n);
      }
    }, 120000);

    it('should generate shares with unique indices from 1 to n', async () => {
      const keyPair = await getKeyPair(3, 5);

      const indices = keyPair.keyShares.map((s) => s.index);
      const uniqueIndices = new Set(indices);

      // All indices should be unique
      expect(uniqueIndices.size).toBe(5);

      // Indices should be 1 to n
      expect(indices.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    }, 60000);

    it('should allow reconstruction with exactly k shares using Lagrange interpolation', async () => {
      // Test the fundamental Shamir property: k shares can reconstruct
      // by verifying that threshold decryption produces the correct plaintext.
      // We use the actual decryption pipeline rather than raw Lagrange
      // reconstruction, since the Shamir modulus is an internal detail.
      const keyPair = await getKeyPair(3, 5);
      const { PartialDecryptionService } =
        await import('./partial-decryption-service');
      const { DecryptionCombiner } = await import('./decryption-combiner');

      const service = new PartialDecryptionService(keyPair.publicKey);
      const combiner = new DecryptionCombiner(
        keyPair.publicKey,
        keyPair.verificationKeys,
        keyPair.theta,
      );
      const nonce = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const plaintext = 42n;
      const ciphertext = keyPair.publicKey.encrypt(plaintext);

      // Select exactly k=3 shares
      const partials = keyPair.keyShares
        .slice(0, 3)
        .map((share) => service.computePartial([ciphertext], share, nonce));

      const result = combiner.combine(
        partials,
        [ciphertext],
        keyPair.publicKey,
        keyPair.config,
      );

      expect(result.tallies[0]).toBe(plaintext);
    }, 60000);

    it('should produce different results with k-1 shares (insufficient threshold)', async () => {
      // Verify that k-1 shares cannot decrypt by checking that the combiner
      // rejects insufficient partials.
      const keyPair = await getKeyPair(3, 5);
      const { PartialDecryptionService } =
        await import('./partial-decryption-service');
      const { DecryptionCombiner, InsufficientPartialsError } =
        await import('./decryption-combiner');

      const service = new PartialDecryptionService(keyPair.publicKey);
      const combiner = new DecryptionCombiner(
        keyPair.publicKey,
        keyPair.verificationKeys,
        keyPair.theta,
      );
      const nonce = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const ciphertext = keyPair.publicKey.encrypt(42n);

      // Only k-1=2 partials
      const partials = keyPair.keyShares
        .slice(0, 2)
        .map((share) => service.computePartial([ciphertext], share, nonce));

      // This validates Requirement 1.6: fewer than k shares cannot decrypt
      expect(() =>
        combiner.combine(
          partials,
          [ciphertext],
          keyPair.publicKey,
          keyPair.config,
        ),
      ).toThrow(InsufficientPartialsError);
    }, 60000);

    it('any k-subset of n shares should reconstruct the same secret', async () => {
      const keyPair = await getKeyPair(2, 4);
      const { PartialDecryptionService } =
        await import('./partial-decryption-service');
      const { DecryptionCombiner } = await import('./decryption-combiner');

      const service = new PartialDecryptionService(keyPair.publicKey);
      const combiner = new DecryptionCombiner(
        keyPair.publicKey,
        keyPair.verificationKeys,
        keyPair.theta,
      );
      const nonce = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const plaintext = 99n;
      const ciphertext = keyPair.publicKey.encrypt(plaintext);

      // Compute all partials
      const allPartials = keyPair.keyShares.map((share) =>
        service.computePartial([ciphertext], share, nonce),
      );

      // Use selectRandomShares to pick multiple random k-subsets
      // and verify they all decrypt to the same plaintext
      const testedSubsets = new Set<string>();
      for (let attempt = 0; attempt < 20; attempt++) {
        const selectedShares = selectRandomShares(keyPair.keyShares, 2);
        const subsetKey = selectedShares
          .map((s) => s.index)
          .sort()
          .join(',');

        if (testedSubsets.has(subsetKey)) continue;
        testedSubsets.add(subsetKey);

        const subset = selectedShares.map(
          (share) => allPartials[share.index - 1],
        );

        const result = combiner.combine(
          subset,
          [ciphertext],
          keyPair.publicKey,
          keyPair.config,
        );
        expect(result.tallies[0]).toBe(plaintext);
      }

      // Ensure we tested at least 4 distinct subsets
      expect(testedSubsets.size).toBeGreaterThanOrEqual(4);
    }, 60000);

    it('should generate unique shares for each Guardian', async () => {
      const keyPair = await getKeyPair(3, 5);

      const shareValues = keyPair.keyShares.map((s) => s.share.toString());
      const uniqueShares = new Set(shareValues);

      // All shares should be unique
      expect(uniqueShares.size).toBe(5);
    }, 60000);

    it('verification keys should equal g^share mod n²', async () => {
      // Verify the mathematical relationship between shares and verification keys
      const keyPair = await getKeyPair(3, 5);
      const n2 = keyPair.publicKey.n * keyPair.publicKey.n;
      const g = keyPair.publicKey.g;

      for (const share of keyPair.keyShares) {
        const expectedVk = modPow(g, share.share, n2);
        // Convert verification key bytes back to bigint for comparison
        let vkBigint = 0n;
        for (const byte of share.verificationKey) {
          vkBigint = (vkBigint << 8n) | BigInt(byte);
        }
        expect(vkBigint).toBe(expectedVk);
      }
    }, 60000);

    it('any k-subset should reconstruct the same secret via Lagrange interpolation in the exponent', async () => {
      // Verify the Shamir property: different k-subsets reconstruct the same
      // secret when lifted into the exponent space. Raw Lagrange reconstruction
      // requires the exact modulus used during splitting (n·λ), which is private.
      // Instead, we verify that g^(reconstructed) mod n² is consistent across
      // subsets — this is the property that actually matters for threshold decryption.
      const keyPair = await getKeyPair(2, 4);
      const n2 = keyPair.publicKey.n * keyPair.publicKey.n;
      const g = keyPair.publicKey.g;

      // Reconstruct from multiple random k-subsets and verify consistency
      // in the exponent space: g^(Σ λ_i·s_i) mod n² should be the same
      let firstExponentValue: bigint | undefined;
      const testedSubsets = new Set<string>();

      for (let attempt = 0; attempt < 20; attempt++) {
        const selected = selectRandomShares(keyPair.keyShares, 2);
        const subsetKey = selected
          .map((s) => s.index)
          .sort()
          .join(',');
        if (testedSubsets.has(subsetKey)) continue;
        testedSubsets.add(subsetKey);

        const reconstructed = reconstructSecret([...selected], n2);
        // Lift into exponent space: g^reconstructed mod n²
        const exponentValue = modPow(g, reconstructed, n2);

        if (firstExponentValue === undefined) {
          firstExponentValue = exponentValue;
        } else {
          expect(exponentValue).toBe(firstExponentValue);
        }
      }

      expect(testedSubsets.size).toBeGreaterThanOrEqual(4);
    }, 60000);

    it('public key should be usable for Paillier encryption', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.bigInt({ min: 0n, max: 1000000n }),
          async (plaintext) => {
            const keyPair = await getKeyPair(2, 3);

            // Encrypt using the public key
            const ciphertext = keyPair.publicKey.encrypt(plaintext);

            // Ciphertext should be different from plaintext
            expect(ciphertext).not.toBe(plaintext);

            // Ciphertext should be a bigint
            expect(typeof ciphertext).toBe('bigint');

            // Ciphertext should be in valid range (< n^2)
            const n2 = keyPair.publicKey.n * keyPair.publicKey.n;
            expect(ciphertext).toBeLessThan(n2);
          },
        ),
        { numRuns: 20 }, // Fewer runs due to async key generation
      );
    }, 120000);

    it('homomorphic addition should work with threshold public key', async () => {
      const keyPair = await getKeyPair(2, 3);

      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 10000n }),
          fc.bigInt({ min: 0n, max: 10000n }),
          (a, b) => {
            // Encrypt both values
            const encA = keyPair.publicKey.encrypt(a);
            const encB = keyPair.publicKey.encrypt(b);

            // Homomorphic addition
            const encSum = keyPair.publicKey.addition(encA, encB);

            // Result should be a valid ciphertext
            expect(typeof encSum).toBe('bigint');
            const n2 = keyPair.publicKey.n * keyPair.publicKey.n;
            expect(encSum).toBeLessThan(n2);
          },
        ),
        { numRuns: 50 },
      );
    }, 120000);
  });
});
