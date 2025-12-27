/**
 * Tests for IsolatedPrivateKey (Web Crypto API version)
 */

import { VOTING } from './constants';
import { IsolatedPrivateKey } from './isolated-private';
import { IsolatedPublicKey } from './isolated-public';

// Add BigInt serialization support for Jest
// @ts-ignore
if (typeof BigInt.prototype.toJSON === 'undefined') {
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

// Extend timeout for cryptographic operations
jest.setTimeout(30000);

describe('IsolatedPrivateKey', () => {
  let testN: bigint;
  let testG: bigint;
  let testLambda: bigint;
  let testMu: bigint;
  let testKeyId: Uint8Array;
  let testPublicKey: IsolatedPublicKey;

  beforeEach(async () => {
    // Use a known prime for testing
    const p = 31n;
    const q = 37n;
    testN = p * q; // 1147
    testG = testN + 1n;
    testLambda = (p - 1n) * (q - 1n); // 1080

    // Compute mu = (L(g^lambda mod n^2))^-1 mod n
    // For simplified Paillier where g = n + 1:
    // g^lambda mod n^2 = (n+1)^lambda mod n^2
    const nSquared = testN * testN;
    const gLambda = modPow(testG, testLambda, nSquared);
    const lValue = (gLambda - 1n) / testN;
    testMu = modInverse(lValue, testN);

    // Generate keyId from n
    const nHex = testN
      .toString(VOTING.KEY_RADIX)
      .padStart(VOTING.PUB_KEY_OFFSET, '0');
    // Encode hex string as UTF-8 bytes (not parse as hex digits)
    const encoder = new TextEncoder();
    const nBytes = encoder.encode(nHex);
    testKeyId = await sha256(nBytes);

    // Create isolated public key
    testPublicKey = await IsolatedPublicKey.create(testN, testG, testKeyId);
  });

  // Helper functions
  async function sha256(data: Uint8Array): Promise<Uint8Array> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  function uint8ArrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    if (mod === 1n) return 0n;
    let result = 1n;
    base = base % mod;
    while (exp > 0n) {
      if (exp % 2n === 1n) {
        result = (result * base) % mod;
      }
      exp = exp >> 1n;
      base = (base * base) % mod;
    }
    return result;
  }

  function modInverse(a: bigint, m: bigint): bigint {
    const gcdResult = extendedGcd(a, m);
    if (gcdResult.gcd !== 1n) {
      throw new Error('Modular inverse does not exist');
    }
    return ((gcdResult.x % m) + m) % m;
  }

  function extendedGcd(
    a: bigint,
    b: bigint,
  ): { gcd: bigint; x: bigint; y: bigint } {
    if (b === 0n) {
      return { gcd: a, x: 1n, y: 0n };
    }
    const result = extendedGcd(b, a % b);
    return {
      gcd: result.gcd,
      x: result.y,
      y: result.x - (a / b) * result.y,
    };
  }

  describe('Constructor', () => {
    it('should create IsolatedPrivateKey with IsolatedPublicKey', () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );

      expect(privateKey).toBeInstanceOf(IsolatedPrivateKey);
      expect(privateKey.lambda).toBe(testLambda);
      expect(privateKey.mu).toBe(testMu);
    });

    it('should reject non-IsolatedPublicKey', async () => {
      const { PublicKey } = await import('paillier-bigint');
      const regularKey = new PublicKey(testN, testG);

      expect(
        () => new IsolatedPrivateKey(testLambda, testMu, regularKey as any),
      ).toThrow();
    });

    it('should store original keyId and instanceId', () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );

      const originalKeyId = privateKey.getOriginalKeyId();
      const originalInstanceId = privateKey.getOriginalInstanceId();

      expect(uint8ArrayEquals(originalKeyId, testPublicKey.getKeyId())).toBe(
        true,
      );
      expect(
        uint8ArrayEquals(originalInstanceId, testPublicKey.getInstanceId()),
      ).toBe(true);
    });
  });

  describe('Decryption with Instance Validation', () => {
    it('should decrypt tagged ciphertext from matching instance', async () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );
      const plaintext = 42n;

      const ciphertext = await testPublicKey.encryptAsync(plaintext);
      const decrypted = await privateKey.decryptAsync(ciphertext);

      expect(decrypted).toBe(plaintext);
    });

    it('should reject ciphertext from different instance', async () => {
      // Create two different instances
      const publicKey1 = await IsolatedPublicKey.create(
        testN,
        testG,
        testKeyId,
      );
      const publicKey2 = await IsolatedPublicKey.create(
        testN,
        testG,
        testKeyId,
      );

      const privateKey1 = new IsolatedPrivateKey(
        testLambda,
        testMu,
        publicKey1,
      );

      const plaintext = 42n;
      const ciphertext = await publicKey2.encryptAsync(plaintext);

      // Should reject ciphertext from different instance
      await expect(privateKey1.decryptAsync(ciphertext)).rejects.toThrow();
    });

    it('should reject ciphertext after public key instanceId update', async () => {
      const publicKey = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const privateKey = new IsolatedPrivateKey(testLambda, testMu, publicKey);

      const plaintext = 42n;
      const ciphertext = await publicKey.encryptAsync(plaintext);

      // Update instance ID
      await publicKey.updateInstanceId();

      // Should reject old ciphertext
      await expect(privateKey.decryptAsync(ciphertext)).rejects.toThrow();
    });

    it('should throw error on synchronous decrypt', () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );
      const ciphertext = 100n;

      expect(() => privateKey.decrypt(ciphertext)).toThrow();
    });

    it('should reject ciphertext with invalid HMAC', async () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );
      const plaintext = 42n;

      const ciphertext = await testPublicKey.encryptAsync(plaintext);

      // Corrupt the HMAC by flipping a bit
      const corruptedCiphertext = ciphertext ^ 1n;

      await expect(
        privateKey.decryptAsync(corruptedCiphertext),
      ).rejects.toThrow();
    });
  });

  describe('Round-trip Encryption/Decryption', () => {
    it('should correctly round-trip small values', async () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );

      const testValues = [0n, 1n, 10n, 100n];

      for (const value of testValues) {
        const ciphertext = await testPublicKey.encryptAsync(value);
        const decrypted = await privateKey.decryptAsync(ciphertext);
        expect(decrypted).toBe(value);
      }
    });

    it('should handle homomorphic multiplication result', async () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );
      const plaintext = 10n;
      const constant = 3n;

      const ciphertext = await testPublicKey.encryptAsync(plaintext);
      const multiplied = await testPublicKey.multiplyAsync(
        ciphertext,
        constant,
      );
      const decrypted = await privateKey.decryptAsync(multiplied);

      // Due to modular arithmetic, result should be (10 * 3) mod n
      expect(decrypted).toBe((plaintext * constant) % testN);
    });

    it('should handle homomorphic addition result', async () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );
      const plaintext1 = 10n;
      const plaintext2 = 20n;

      const ciphertext1 = await testPublicKey.encryptAsync(plaintext1);
      const ciphertext2 = await testPublicKey.encryptAsync(plaintext2);
      const sum = await testPublicKey.additionAsync(ciphertext1, ciphertext2);
      const decrypted = await privateKey.decryptAsync(sum);

      // Due to modular arithmetic, result should be (10 + 20) mod n
      expect(decrypted).toBe((plaintext1 + plaintext2) % testN);
    });
  });

  describe('Accessor Methods', () => {
    it('should return copy of original keyId', () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );

      const keyId1 = privateKey.getOriginalKeyId();
      const keyId2 = privateKey.getOriginalKeyId();

      expect(keyId1).not.toBe(keyId2); // Different objects
      expect(uint8ArrayEquals(keyId1, keyId2)).toBe(true); // Same content
    });

    it('should return copy of original instanceId', () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );

      const id1 = privateKey.getOriginalInstanceId();
      const id2 = privateKey.getOriginalInstanceId();

      expect(id1).not.toBe(id2); // Different objects
      expect(uint8ArrayEquals(id1, id2)).toBe(true); // Same content
    });

    it('should return reference to original public key', () => {
      const privateKey = new IsolatedPrivateKey(
        testLambda,
        testMu,
        testPublicKey,
      );

      const publicKey = privateKey.getOriginalPublicKey();

      expect(publicKey).toBe(testPublicKey);
    });
  });

  describe('Security Properties', () => {
    it('should maintain instance isolation across multiple encryptions', async () => {
      const publicKey = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const privateKey = new IsolatedPrivateKey(testLambda, testMu, publicKey);

      // Encrypt multiple values
      const plaintexts = [1n, 2n, 3n, 4n, 5n];
      const ciphertexts = await Promise.all(
        plaintexts.map((p) => publicKey.encryptAsync(p)),
      );

      // All should decrypt correctly
      const decrypted = await Promise.all(
        ciphertexts.map((c) => privateKey.decryptAsync(c)),
      );

      expect(decrypted).toEqual(plaintexts);
    });

    it('should prevent cross-key decryption attempts', async () => {
      // Create two different key pairs
      const publicKey1 = await IsolatedPublicKey.create(
        testN,
        testG,
        testKeyId,
      );
      const publicKey2 = await IsolatedPublicKey.create(
        testN,
        testG,
        testKeyId,
      );

      const privateKey1 = new IsolatedPrivateKey(
        testLambda,
        testMu,
        publicKey1,
      );
      const privateKey2 = new IsolatedPrivateKey(
        testLambda,
        testMu,
        publicKey2,
      );

      const plaintext = 42n;
      const ciphertext1 = await publicKey1.encryptAsync(plaintext);
      const ciphertext2 = await publicKey2.encryptAsync(plaintext);

      // Each private key should only decrypt its own ciphertext
      await expect(privateKey1.decryptAsync(ciphertext1)).resolves.toBe(
        plaintext,
      );
      await expect(privateKey2.decryptAsync(ciphertext2)).resolves.toBe(
        plaintext,
      );
      await expect(privateKey1.decryptAsync(ciphertext2)).rejects.toThrow();
      await expect(privateKey2.decryptAsync(ciphertext1)).rejects.toThrow();
    });
  });
});
