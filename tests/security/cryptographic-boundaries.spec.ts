/**
 * Cryptographic Boundary Tests
 * Tests edge cases and boundary conditions for government-grade security
 */

import { ECIESService } from '../../src/services/ecies/service';
import {
  VotingService,
  millerRabinTest,
  modPow,
  modInverse,
  gcd,
  lcm,
} from '../../src/services/voting.service';

jest.setTimeout(300000);

describe('Cryptographic Boundary Tests', () => {
  let votingService: VotingService;
  let ecies: ECIESService;

  beforeAll(() => {
    votingService = VotingService.getInstance();
    ecies = new ECIESService();
  });

  describe('Prime Number Edge Cases', () => {
    it('should correctly identify Mersenne primes', () => {
      const mersennePrimes = [
        3n, // 2^2 - 1
        7n, // 2^3 - 1
        31n, // 2^5 - 1
        127n, // 2^7 - 1
        8191n, // 2^13 - 1
      ];

      for (const p of mersennePrimes) {
        expect(millerRabinTest(p, 256)).toBe(true);
      }
    });

    it('should correctly identify Fermat pseudoprimes', () => {
      const carmichaelNumbers = [
        561n, // 3 × 11 × 17
        1105n, // 5 × 13 × 17
        1729n, // 7 × 13 × 19
      ];

      for (const n of carmichaelNumbers) {
        expect(millerRabinTest(n, 256)).toBe(false);
      }
    });

    it('should handle large primes near 2^256', () => {
      const largePrime = 2n ** 256n - 189n; // Known prime
      expect(millerRabinTest(largePrime, 256)).toBe(true);
    });

    it('should reject numbers with small prime factors', () => {
      const composites = [
        2n * 3n * 5n * 7n * 11n,
        1000000007n * 2n,
        999999999989n * 3n,
      ];

      for (const c of composites) {
        expect(millerRabinTest(c, 256)).toBe(false);
      }
    });
  });

  describe('Modular Arithmetic Edge Cases', () => {
    it('should handle modular exponentiation with mod 1', () => {
      expect(modPow(5n, 10n, 1n)).toBe(0n);
    });

    it('should handle zero exponent', () => {
      expect(modPow(12345n, 0n, 1000n)).toBe(1n);
    });

    it('should handle base larger than modulus', () => {
      const result = modPow(1000n, 3n, 100n);
      expect(result).toBe(0n);
    });

    it('should handle very large exponents', () => {
      const base = 2n;
      const exp = 2n ** 128n;
      const mod = 1000000007n;

      const result = modPow(base, exp, mod);
      expect(result).toBeGreaterThanOrEqual(0n);
      expect(result).toBeLessThan(mod);
    });

    it('should compute modular inverse for coprime numbers', () => {
      const testCases = [
        { a: 3n, m: 11n },
        { a: 7n, m: 26n },
        { a: 17n, m: 43n },
      ];

      for (const { a, m } of testCases) {
        const inv = modInverse(a, m);
        expect((a * inv) % m).toBe(1n);
      }
    });

    it('should handle GCD with zero', () => {
      expect(gcd(0n, 5n)).toBe(5n);
      expect(gcd(5n, 0n)).toBe(5n);
    });

    it('should handle negative numbers in GCD', () => {
      expect(gcd(-48n, 18n)).toBe(6n);
      expect(gcd(48n, -18n)).toBe(6n);
      expect(gcd(-48n, -18n)).toBe(6n);
    });

    it('should compute LCM correctly for edge cases', () => {
      expect(lcm(1n, 1n)).toBe(1n);
      expect(lcm(1n, 100n)).toBe(100n);
      expect(lcm(12n, 18n)).toBe(36n);
    });
  });

  describe('Key Size Boundaries', () => {
    it('should reject key sizes below minimum', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));

      await expect(
        votingService.generateDeterministicKeyPair(seed, 1024, 128),
      ).rejects.toThrow('at least 2048 bits');
    });

    it('should accept minimum secure key size', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
    });

    it('should handle maximum practical key size', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        4096,
        64,
      );

      const plaintext = 42n;
      const ciphertext = keyPair.publicKey.encrypt(plaintext);
      const decrypted = keyPair.privateKey.decrypt(ciphertext);

      expect(decrypted).toBe(plaintext);
    }, 600000);

    it('should reject odd key sizes', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));

      await expect(
        votingService.generateDeterministicKeyPair(seed, 2049, 128),
      ).rejects.toThrow('must be even');
    });
  });

  describe('Seed Entropy Requirements', () => {
    it('should reject insufficient seed entropy', async () => {
      const weakSeed = new Uint8Array(16);

      await expect(
        votingService.generateDeterministicKeyPair(weakSeed, 2048, 128),
      ).rejects.toThrow('at least 32 bytes');
    });

    it('should accept minimum seed size', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      expect(keyPair).toBeDefined();
    });

    it('should handle maximum seed size', async () => {
      const largeSeed = crypto.getRandomValues(new Uint8Array(256));
      const keyPair = await votingService.generateDeterministicKeyPair(
        largeSeed,
        2048,
        64,
      );

      expect(keyPair).toBeDefined();
    });

    it('should produce different keys from different seeds', async () => {
      const seed1 = crypto.getRandomValues(new Uint8Array(64));
      const seed2 = crypto.getRandomValues(new Uint8Array(64));

      const kp1 = await votingService.generateDeterministicKeyPair(
        seed1,
        2048,
        64,
      );
      const kp2 = await votingService.generateDeterministicKeyPair(
        seed2,
        2048,
        64,
      );

      expect(kp1.publicKey.n).not.toBe(kp2.publicKey.n);
    });
  });

  describe('Miller-Rabin Iteration Requirements', () => {
    it('should reject insufficient iterations', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));

      await expect(
        votingService.generateDeterministicKeyPair(seed, 2048, 32),
      ).rejects.toThrow('at least 64 Miller-Rabin iterations');
    });

    it('should accept minimum iterations', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      expect(keyPair).toBeDefined();
    });

    it('should handle maximum practical iterations', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        512,
      );

      expect(keyPair).toBeDefined();
    }, 600000);
  });

  describe('ECIES Key Format Boundaries', () => {
    it('should handle compressed public keys (33 bytes)', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      expect(publicKey.length).toBe(33);

      const votingKeys = await votingService.deriveVotingKeysFromECDH(
        privateKey,
        publicKey,
      );

      expect(votingKeys.publicKey).toBeDefined();
    });

    it('should handle compressed public keys as default', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      expect(publicKey.length).toBe(33);

      const votingKeys = await votingService.deriveVotingKeysFromECDH(
        privateKey,
        publicKey,
      );

      expect(votingKeys.publicKey).toBeDefined();
    });

    it('should reject invalid raw key length', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);
      const rawPublicKey = publicKey.slice(1);

      expect(rawPublicKey.length).toBe(32);

      await expect(
        votingService.deriveVotingKeysFromECDH(privateKey, rawPublicKey),
      ).rejects.toThrow('Invalid public key length');
    });

    it('should reject invalid key lengths', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);
      const invalidKey = new Uint8Array(32);

      await expect(
        votingService.deriveVotingKeysFromECDH(privateKey, invalidKey),
      ).rejects.toThrow('Invalid public key length');
    });

    it('should reject empty keys', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      await expect(
        votingService.deriveVotingKeysFromECDH(privateKey, new Uint8Array(0)),
      ).rejects.toThrow('required');
    });
  });

  describe('Paillier Plaintext Space Boundaries', () => {
    it('should handle zero plaintext', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      const encrypted = keyPair.publicKey.encrypt(0n);
      const decrypted = keyPair.privateKey.decrypt(encrypted);

      expect(decrypted).toBe(0n);
    });

    it('should handle maximum safe plaintext', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      const maxSafe = keyPair.publicKey.n / 4n;
      const encrypted = keyPair.publicKey.encrypt(maxSafe);
      const decrypted = keyPair.privateKey.decrypt(encrypted);

      expect(decrypted).toBe(maxSafe);
    });

    it('should handle negative plaintexts via modular arithmetic', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      const negative = -42n;
      const encrypted = keyPair.publicKey.encrypt(negative);
      const decrypted = keyPair.privateKey.decrypt(encrypted);

      const expected = keyPair.publicKey.n + negative;
      expect(decrypted).toBe(expected);
    });
  });

  describe('Homomorphic Operation Boundaries', () => {
    it('should handle addition overflow', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      const large = keyPair.publicKey.n / 3n;
      const enc1 = keyPair.publicKey.encrypt(large);
      const enc2 = keyPair.publicKey.encrypt(large);
      const enc3 = keyPair.publicKey.encrypt(large);

      const sum = keyPair.publicKey.addition(
        keyPair.publicKey.addition(enc1, enc2),
        enc3,
      );

      const decrypted = keyPair.privateKey.decrypt(sum);
      expect(decrypted).toBe((large * 3n) % keyPair.publicKey.n);
    });

    it('should handle scalar multiplication with zero', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      const plaintext = 42n;
      const encrypted = keyPair.publicKey.encrypt(plaintext);
      const result = keyPair.publicKey.multiply(encrypted, 0n);
      const decrypted = keyPair.privateKey.decrypt(result);

      expect(decrypted).toBe(0n);
    });

    it('should handle scalar multiplication with one', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      const plaintext = 42n;
      const encrypted = keyPair.publicKey.encrypt(plaintext);
      const result = keyPair.publicKey.multiply(encrypted, 1n);
      const decrypted = keyPair.privateKey.decrypt(result);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle very large scalar multiplication', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(64));
      const keyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      const plaintext = 7n;
      const scalar = 999999999999n;
      const encrypted = keyPair.publicKey.encrypt(plaintext);
      const result = keyPair.publicKey.multiply(encrypted, scalar);
      const decrypted = keyPair.privateKey.decrypt(result);

      expect(decrypted).toBe((plaintext * scalar) % keyPair.publicKey.n);
    });
  });
});
