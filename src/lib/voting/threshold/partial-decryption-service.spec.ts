/**
 * Tests for PartialDecryptionService
 *
 * Validates partial decryption computation, ZK proof generation/verification,
 * and serialization/deserialization.
 */
import { describe, it, expect, beforeAll } from '@jest/globals';
import type { ThresholdKeyPair } from './interfaces';
import {
  PartialDecryptionService,
  DeserializationError,
} from './partial-decryption-service';
import { ThresholdKeyGenerator } from './threshold-key-generator';

describe('PartialDecryptionService', () => {
  let keyPair: ThresholdKeyPair;
  let service: PartialDecryptionService;
  const ceremonyNonce = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

  beforeAll(async () => {
    const generator = new ThresholdKeyGenerator();
    keyPair = await generator.generate({
      totalShares: 3,
      threshold: 2,
      keyBitLength: 512,
    });
    service = new PartialDecryptionService(keyPair.publicKey);
  }, 60000);

  describe('computePartial', () => {
    it('should compute a partial decryption with correct guardian index', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const partial = service.computePartial(
        [ciphertext],
        keyPair.keyShares[0],
        ceremonyNonce,
      );

      expect(partial.guardianIndex).toBe(keyPair.keyShares[0].index);
    });

    it('should include a ZK proof with commitment, challenge, and response', () => {
      const ciphertext = keyPair.publicKey.encrypt(100n);
      const partial = service.computePartial(
        [ciphertext],
        keyPair.keyShares[0],
        ceremonyNonce,
      );

      expect(typeof partial.proof.commitment).toBe('bigint');
      expect(typeof partial.proof.challenge).toBe('bigint');
      expect(typeof partial.proof.response).toBe('bigint');
    });

    it('should include the ceremony nonce', () => {
      const ciphertext = keyPair.publicKey.encrypt(10n);
      const partial = service.computePartial(
        [ciphertext],
        keyPair.keyShares[0],
        ceremonyNonce,
      );

      expect(partial.ceremonyNonce).toEqual(ceremonyNonce);
    });

    it('should produce different partials for different key shares', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const partial1 = service.computePartial(
        [ciphertext],
        keyPair.keyShares[0],
        ceremonyNonce,
      );
      const partial2 = service.computePartial(
        [ciphertext],
        keyPair.keyShares[1],
        ceremonyNonce,
      );

      expect(partial1.values[0]).not.toBe(partial2.values[0]);
      expect(partial1.guardianIndex).not.toBe(partial2.guardianIndex);
    });

    it('should throw for empty encrypted tally', () => {
      expect(() =>
        service.computePartial([], keyPair.keyShares[0], ceremonyNonce),
      ).toThrow('Encrypted tally must not be empty');
    });
  });

  describe('verifyPartial', () => {
    it('should verify a correctly computed partial decryption', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const share = keyPair.keyShares[0];
      const partial = service.computePartial(
        [ciphertext],
        share,
        ceremonyNonce,
      );

      const isValid = service.verifyPartial(
        partial,
        [ciphertext],
        share.verificationKey,
        keyPair.publicKey,
      );

      expect(isValid).toBe(true);
    });

    it('should verify partials from different guardians', () => {
      const ciphertext = keyPair.publicKey.encrypt(99n);

      for (const share of keyPair.keyShares) {
        const partial = service.computePartial(
          [ciphertext],
          share,
          ceremonyNonce,
        );

        const isValid = service.verifyPartial(
          partial,
          [ciphertext],
          share.verificationKey,
          keyPair.publicKey,
        );

        expect(isValid).toBe(true);
      }
    });

    it('should reject a partial with tampered value', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const share = keyPair.keyShares[0];
      const partial = service.computePartial(
        [ciphertext],
        share,
        ceremonyNonce,
      );

      // Tamper with the values
      const tampered = {
        ...partial,
        values: [partial.values[0] + 1n],
      };

      const isValid = service.verifyPartial(
        tampered,
        [ciphertext],
        share.verificationKey,
        keyPair.publicKey,
      );

      expect(isValid).toBe(false);
    });

    it('should reject a partial verified against wrong verification key', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const share0 = keyPair.keyShares[0];
      const share1 = keyPair.keyShares[1];
      const partial = service.computePartial(
        [ciphertext],
        share0,
        ceremonyNonce,
      );

      // Use wrong guardian's verification key
      const isValid = service.verifyPartial(
        partial,
        [ciphertext],
        share1.verificationKey,
        keyPair.publicKey,
      );

      expect(isValid).toBe(false);
    });

    it('should return false for empty encrypted tally', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const share = keyPair.keyShares[0];
      const partial = service.computePartial(
        [ciphertext],
        share,
        ceremonyNonce,
      );

      expect(
        service.verifyPartial(
          partial,
          [],
          share.verificationKey,
          keyPair.publicKey,
        ),
      ).toBe(false);
    });
  });

  describe('serialize and deserialize', () => {
    it('should round-trip a partial decryption', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const partial = service.computePartial(
        [ciphertext],
        keyPair.keyShares[0],
        ceremonyNonce,
      );

      const serialized = service.serialize(partial);
      const deserialized = service.deserialize(serialized);

      expect(deserialized.guardianIndex).toBe(partial.guardianIndex);
      expect(deserialized.values).toEqual(partial.values);
      expect(deserialized.proof.commitment).toBe(partial.proof.commitment);
      expect(deserialized.proof.challenge).toBe(partial.proof.challenge);
      expect(deserialized.proof.response).toBe(partial.proof.response);
      expect(deserialized.ceremonyNonce).toEqual(partial.ceremonyNonce);
      expect(deserialized.timestamp).toBe(partial.timestamp);
    });

    it('should produce a Uint8Array from serialize', () => {
      const ciphertext = keyPair.publicKey.encrypt(1n);
      const partial = service.computePartial(
        [ciphertext],
        keyPair.keyShares[0],
        ceremonyNonce,
      );

      const serialized = service.serialize(partial);
      expect(serialized).toBeInstanceOf(Uint8Array);
      expect(serialized.length).toBeGreaterThan(0);
    });

    it('should throw DeserializationError for invalid data', () => {
      const invalidData = new TextEncoder().encode('not valid json{{{');
      expect(() => service.deserialize(invalidData)).toThrow(
        DeserializationError,
      );
    });

    it('deserialized partial should still verify', () => {
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const share = keyPair.keyShares[0];
      const partial = service.computePartial(
        [ciphertext],
        share,
        ceremonyNonce,
      );

      const serialized = service.serialize(partial);
      const deserialized = service.deserialize(serialized);

      const isValid = service.verifyPartial(
        deserialized,
        [ciphertext],
        share.verificationKey,
        keyPair.publicKey,
      );

      expect(isValid).toBe(true);
    });
  });
});
