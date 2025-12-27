/**
 * Tests for IsolatedPublicKey (Web Crypto API version)
 */

import { VOTING } from './constants';
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

describe('IsolatedPublicKey', () => {
  let testN: bigint;
  let testG: bigint;
  let testKeyId: Uint8Array;

  beforeEach(async () => {
    // Use a known prime for testing (smaller than production for speed)
    testN = 961748941n; // Prime number for testing
    testG = testN + 1n; // Simplified Paillier

    // Generate keyId from n
    const nHex = testN
      .toString(VOTING.KEY_RADIX)
      .padStart(VOTING.PUB_KEY_OFFSET, '0');
    // Encode hex string as UTF-8 bytes (not parse as hex digits)
    const encoder = new TextEncoder();
    const nBytes = encoder.encode(nHex);
    testKeyId = await sha256(nBytes);
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

  describe('Factory Method', () => {
    it('should create IsolatedPublicKey using async factory', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);

      expect(key).toBeInstanceOf(IsolatedPublicKey);
      expect(key.n).toBe(testN);
      expect(key.g).toBe(testG);
      expect(uint8ArrayEquals(key.getKeyId(), testKeyId)).toBe(true);
    });

    it('should generate unique instanceId per key', async () => {
      const key1 = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const key2 = await IsolatedPublicKey.create(testN, testG, testKeyId);

      expect(uint8ArrayEquals(key1.getInstanceId(), key2.getInstanceId())).toBe(
        false,
      );
    });
  });

  describe('Type Guard', () => {
    it('should identify IsolatedPublicKey correctly', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      expect(IsolatedPublicKey.isIsolatedPublicKey(key)).toBe(true);
    });

    it('should reject regular PublicKey', async () => {
      const { PublicKey } = await import('paillier-bigint');
      const regularKey = new PublicKey(testN, testG);
      expect(IsolatedPublicKey.isIsolatedPublicKey(regularKey)).toBe(false);
    });
  });

  describe('Key ID Management', () => {
    it('should return a copy of keyId', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const keyId1 = key.getKeyId();
      const keyId2 = key.getKeyId();

      expect(keyId1).not.toBe(keyId2); // Different objects
      expect(uint8ArrayEquals(keyId1, keyId2)).toBe(true); // Same content
    });

    it('should verify keyId matches n value', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);

      // Manually compute expected keyId
      const nHex = testN
        .toString(VOTING.KEY_RADIX)
        .padStart(VOTING.PUB_KEY_OFFSET, '0');
      // Encode hex string as UTF-8 bytes (not parse as hex digits)
      const encoder = new TextEncoder();
      const nBytes = encoder.encode(nHex);
      const expectedKeyId = await sha256(nBytes);

      expect(uint8ArrayEquals(key.getKeyId(), expectedKeyId)).toBe(true);
    });
  });

  describe('Instance ID Management', () => {
    it('should return a copy of instanceId', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const id1 = key.getInstanceId();
      const id2 = key.getInstanceId();

      expect(id1).not.toBe(id2); // Different objects
      expect(uint8ArrayEquals(id1, id2)).toBe(true); // Same content
    });

    it('should update instanceId when requested', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const originalId = key.getInstanceId();

      await key.updateInstanceId();

      const newId = key.getInstanceId();
      expect(uint8ArrayEquals(originalId, newId)).toBe(false);
    });
  });

  describe('Encryption with HMAC Tagging', () => {
    it('should encrypt and tag ciphertext', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const plaintext = 42n;

      const taggedCiphertext = await key.encryptAsync(plaintext);

      // Tagged ciphertext should be longer than untagged
      expect(taggedCiphertext).toBeGreaterThan(0n);

      // Should include HMAC tag (64 hex chars = 256 bits)
      const ciphertextHex = taggedCiphertext.toString(16);
      expect(ciphertextHex.length).toBeGreaterThan(64);
    });

    it('should throw error on synchronous encrypt', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const plaintext = 42n;

      expect(() => key.encrypt(plaintext)).toThrow();
    });

    it('should produce different ciphertexts for same plaintext (randomized)', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const plaintext = 42n;

      const ciphertext1 = await key.encryptAsync(plaintext);
      const ciphertext2 = await key.encryptAsync(plaintext);

      // Due to randomized encryption, ciphertexts should differ
      expect(ciphertext1).not.toBe(ciphertext2);
    });
  });

  describe('Instance Isolation Validation', () => {
    it('should extract instanceId from tagged ciphertext', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const plaintext = 42n;

      const taggedCiphertext = await key.encryptAsync(plaintext);
      const extractedId = await key.extractInstanceId(taggedCiphertext);

      expect(uint8ArrayEquals(extractedId, key.getInstanceId())).toBe(true);
    });

    it('should reject ciphertext from different instance', async () => {
      const key1 = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const key2 = await IsolatedPublicKey.create(testN, testG, testKeyId);

      const plaintext = 42n;
      const ciphertext1 = await key1.encryptAsync(plaintext);

      // key2 should not validate ciphertext from key1
      const extractedId = await key2.extractInstanceId(ciphertext1);
      expect(uint8ArrayEquals(extractedId, key2.getInstanceId())).toBe(false);
      expect(extractedId[0]).toBe(0); // Invalid instance marker
    });

    it('should reject ciphertext after instanceId update', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const plaintext = 42n;

      const ciphertext = await key.encryptAsync(plaintext);
      const originalId = key.getInstanceId();

      await key.updateInstanceId();

      // Original ciphertext should no longer validate with new instanceId
      const extractedId = await key.extractInstanceId(ciphertext);
      // Should return invalid marker [0] because HMAC doesn't match new instanceId
      expect(extractedId[0]).toBe(0);
      expect(uint8ArrayEquals(extractedId, key.getInstanceId())).toBe(false);
      expect(uint8ArrayEquals(originalId, key.getInstanceId())).toBe(false);
    });
  });

  describe('Homomorphic Operations', () => {
    it('should multiply ciphertext by constant', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const plaintext = 10n;
      const constant = 5n;

      const ciphertext = await key.encryptAsync(plaintext);
      const multiplied = await key.multiplyAsync(ciphertext, constant);

      expect(multiplied).toBeGreaterThan(0n);

      // Verify instanceId is preserved
      const extractedId = await key.extractInstanceId(multiplied);
      expect(uint8ArrayEquals(extractedId, key.getInstanceId())).toBe(true);
    });

    it('should throw on multiply with wrong instance', async () => {
      const key1 = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const key2 = await IsolatedPublicKey.create(testN, testG, testKeyId);

      const plaintext = 10n;
      const constant = 5n;

      const ciphertext = await key1.encryptAsync(plaintext);

      // key2 should reject ciphertext from key1
      await expect(key2.multiplyAsync(ciphertext, constant)).rejects.toThrow();
    });

    it('should add two ciphertexts', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const plaintext1 = 10n;
      const plaintext2 = 20n;

      const ciphertext1 = await key.encryptAsync(plaintext1);
      const ciphertext2 = await key.encryptAsync(plaintext2);
      const sum = await key.additionAsync(ciphertext1, ciphertext2);

      expect(sum).toBeGreaterThan(0n);

      // Verify instanceId is preserved
      const extractedId = await key.extractInstanceId(sum);
      expect(uint8ArrayEquals(extractedId, key.getInstanceId())).toBe(true);
    });

    it('should throw on addition with mismatched instances', async () => {
      const key1 = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const key2 = await IsolatedPublicKey.create(testN, testG, testKeyId);

      const plaintext = 10n;
      const ciphertext1 = await key1.encryptAsync(plaintext);
      const ciphertext2 = await key2.encryptAsync(plaintext);

      // Should reject addition of ciphertexts from different instances
      await expect(
        key1.additionAsync(ciphertext1, ciphertext2),
      ).rejects.toThrow();
    });

    it('should throw error on synchronous operations', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);
      const ciphertext = 100n;

      expect(() => key.multiply(ciphertext, 5n)).toThrow();
      expect(() => key.addition(ciphertext, ciphertext)).toThrow();
    });
  });

  describe('Key Verification', () => {
    it('should pass keyId verification', async () => {
      const key = await IsolatedPublicKey.create(testN, testG, testKeyId);

      // Should not throw
      await expect(key.verifyKeyIdAsync()).resolves.not.toThrow();
    });

    it('should fail verification with corrupted keyId', async () => {
      // Create key with incorrect keyId
      const wrongKeyId = new Uint8Array(32);
      crypto.getRandomValues(wrongKeyId);

      const key = await IsolatedPublicKey.create(testN, testG, wrongKeyId);

      // Verification should fail
      await expect(key.verifyKeyIdAsync()).rejects.toThrow();
    });
  });
});
