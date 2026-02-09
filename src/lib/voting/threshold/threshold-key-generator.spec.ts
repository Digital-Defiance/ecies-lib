/**
 * Tests for ThresholdKeyGenerator
 *
 * Validates threshold key generation using Shamir's Secret Sharing.
 */
import { describe, it, expect, beforeAll } from '@jest/globals';
import type { ThresholdKeyConfig, ThresholdKeyPair } from './interfaces';
import {
  ThresholdKeyGenerator,
  InvalidThresholdConfigError,
} from './threshold-key-generator';

describe('ThresholdKeyGenerator', () => {
  let generator: ThresholdKeyGenerator;

  beforeAll(() => {
    generator = new ThresholdKeyGenerator();
  });

  describe('validateConfig', () => {
    it('should accept valid configuration (2,3)', () => {
      expect(() => {
        generator.validateConfig({ totalShares: 3, threshold: 2 });
      }).not.toThrow();
    });

    it('should accept valid configuration (5,9)', () => {
      expect(() => {
        generator.validateConfig({ totalShares: 9, threshold: 5 });
      }).not.toThrow();
    });

    it('should accept valid configuration with keyBitLength', () => {
      expect(() => {
        generator.validateConfig({
          totalShares: 5,
          threshold: 3,
          keyBitLength: 1024,
        });
      }).not.toThrow();
    });

    it('should reject k > n', () => {
      expect(() => {
        generator.validateConfig({ totalShares: 3, threshold: 5 });
      }).toThrow(InvalidThresholdConfigError);
      expect(() => {
        generator.validateConfig({ totalShares: 3, threshold: 5 });
      }).toThrow('cannot exceed total shares');
    });

    it('should reject k < 2', () => {
      expect(() => {
        generator.validateConfig({ totalShares: 3, threshold: 1 });
      }).toThrow(InvalidThresholdConfigError);
      expect(() => {
        generator.validateConfig({ totalShares: 3, threshold: 1 });
      }).toThrow('must be an integer >= 2');
    });

    it('should reject n < 2', () => {
      expect(() => {
        generator.validateConfig({ totalShares: 1, threshold: 1 });
      }).toThrow(InvalidThresholdConfigError);
    });

    it('should reject non-integer values', () => {
      expect(() => {
        generator.validateConfig({ totalShares: 3.5, threshold: 2 });
      }).toThrow(InvalidThresholdConfigError);

      expect(() => {
        generator.validateConfig({ totalShares: 3, threshold: 2.5 });
      }).toThrow(InvalidThresholdConfigError);
    });

    it('should reject keyBitLength < 512', () => {
      expect(() => {
        generator.validateConfig({
          totalShares: 3,
          threshold: 2,
          keyBitLength: 256,
        });
      }).toThrow(InvalidThresholdConfigError);
    });
  });

  describe('generate', () => {
    // Use smaller key size for faster tests
    const testConfig: ThresholdKeyConfig = {
      totalShares: 3,
      threshold: 2,
      keyBitLength: 512,
    };

    let keyPair: ThresholdKeyPair;

    beforeAll(async () => {
      keyPair = await generator.generate(testConfig);
    }, 30000); // 30 second timeout for key generation

    it('should generate correct number of shares', () => {
      expect(keyPair.keyShares).toHaveLength(testConfig.totalShares);
    });

    it('should generate shares with correct indices (1-indexed)', () => {
      const indices = keyPair.keyShares.map((s) => s.index);
      expect(indices).toEqual([1, 2, 3]);
    });

    it('should generate verification keys for each share', () => {
      expect(keyPair.verificationKeys).toHaveLength(testConfig.totalShares);
      for (const vk of keyPair.verificationKeys) {
        expect(vk).toBeInstanceOf(Uint8Array);
        expect(vk.length).toBeGreaterThan(0);
      }
    });

    it('should include verification key in each share', () => {
      for (let i = 0; i < keyPair.keyShares.length; i++) {
        expect(keyPair.keyShares[i].verificationKey).toEqual(
          keyPair.verificationKeys[i],
        );
      }
    });

    it('should generate a valid Paillier public key', () => {
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.publicKey.n).toBeDefined();
      expect(typeof keyPair.publicKey.n).toBe('bigint');
      expect(keyPair.publicKey.g).toBeDefined();
      expect(typeof keyPair.publicKey.g).toBe('bigint');
    });

    it('should preserve configuration in output', () => {
      expect(keyPair.config.totalShares).toBe(testConfig.totalShares);
      expect(keyPair.config.threshold).toBe(testConfig.threshold);
      expect(keyPair.config.keyBitLength).toBe(testConfig.keyBitLength);
    });

    it('should generate unique shares', () => {
      const shareValues = keyPair.keyShares.map((s) => s.share);
      const uniqueShares = new Set(shareValues.map((s) => s.toString()));
      expect(uniqueShares.size).toBe(testConfig.totalShares);
    });

    it('should generate unique verification keys', () => {
      const vkStrings = keyPair.verificationKeys.map((vk) =>
        Array.from(vk)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      );
      const uniqueVks = new Set(vkStrings);
      expect(uniqueVks.size).toBe(testConfig.totalShares);
    });

    it('public key should be usable for encryption', () => {
      const plaintext = 42n;
      const ciphertext = keyPair.publicKey.encrypt(plaintext);
      expect(typeof ciphertext).toBe('bigint');
      expect(ciphertext).not.toBe(plaintext);
    });
  });

  describe('generate with different configurations', () => {
    it('should generate 2-of-2 threshold keys', async () => {
      const config: ThresholdKeyConfig = {
        totalShares: 2,
        threshold: 2,
        keyBitLength: 512,
      };
      const keyPair = await generator.generate(config);

      expect(keyPair.keyShares).toHaveLength(2);
      expect(keyPair.config.threshold).toBe(2);
    }, 30000);

    it('should generate 3-of-5 threshold keys', async () => {
      const config: ThresholdKeyConfig = {
        totalShares: 5,
        threshold: 3,
        keyBitLength: 512,
      };
      const keyPair = await generator.generate(config);

      expect(keyPair.keyShares).toHaveLength(5);
      expect(keyPair.config.threshold).toBe(3);
    }, 30000);

    it('should use default key bit length when not specified', async () => {
      const config: ThresholdKeyConfig = {
        totalShares: 2,
        threshold: 2,
      };
      const keyPair = await generator.generate(config);

      expect(keyPair.config.keyBitLength).toBe(2048);
    }, 60000);
  });

  describe('error handling', () => {
    it('should throw InvalidThresholdConfigError for invalid config', async () => {
      await expect(
        generator.generate({ totalShares: 3, threshold: 5 }),
      ).rejects.toThrow(InvalidThresholdConfigError);
    });
  });
});
