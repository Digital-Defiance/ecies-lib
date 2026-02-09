/**
 * Property-Based Tests: Partial Decryption Service
 *
 * Feature: real-time-threshold-voting
 * These tests validate partial decryption computation and ZK proofs.
 *
 * Property 2: ZK Proof Soundness
 * Property 4: Serialization Round-Trip
 *
 * **Validates: Requirements 3.2, 3.4, 3.5, 3.6**
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fc from 'fast-check';
import type { ThresholdKeyPair } from './interfaces';
import { PartialDecryptionService } from './partial-decryption-service';
import { ThresholdKeyGenerator } from './threshold-key-generator';

describe('Property-Based Tests: Partial Decryption Service', () => {
  let keyPair: ThresholdKeyPair;
  let service: PartialDecryptionService;

  beforeAll(async () => {
    const generator = new ThresholdKeyGenerator();
    keyPair = await generator.generate({
      totalShares: 5,
      threshold: 3,
      keyBitLength: 512,
    });
    service = new PartialDecryptionService(keyPair.publicKey);
  }, 60000);

  /**
   * Property 2: ZK Proof Soundness
   * Feature: real-time-threshold-voting, Property 2: ZK Proof Soundness
   * **Validates: Requirements 3.2, 3.4, 3.5**
   *
   * For any partial decryption, the accompanying ZK proof is valid if and only
   * if the partial decryption was computed correctly using the Guardian's actual
   * key share. Invalid proofs SHALL be rejected, and valid proofs SHALL be accepted.
   */
  describe('Property 2: ZK Proof Soundness', () => {
    it('valid partial decryptions should always verify with the correct verification key', () => {
      fc.assert(
        fc.property(
          // Generate random plaintext values and random share index
          fc.bigInt({ min: 0n, max: 10000n }),
          fc.integer({ min: 0, max: keyPair.keyShares.length - 1 }),
          fc.uint8Array({ minLength: 8, maxLength: 32 }),
          (plaintext, shareIdx, nonce) => {
            const ciphertext = keyPair.publicKey.encrypt(plaintext);
            const share = keyPair.keyShares[shareIdx];

            const partial = service.computePartial([ciphertext], share, nonce);

            const isValid = service.verifyPartial(
              partial,
              [ciphertext],
              share.verificationKey,
              keyPair.publicKey,
            );

            expect(isValid).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('partial decryptions should fail verification with a wrong verification key', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 10000n }),
          // Generate two distinct share indices
          fc
            .integer({ min: 0, max: keyPair.keyShares.length - 1 })
            .chain((idx) =>
              fc.tuple(
                fc.constant(idx),
                fc
                  .integer({ min: 0, max: keyPair.keyShares.length - 2 })
                  .map((j) => (j >= idx ? j + 1 : j)),
              ),
            ),
          fc.uint8Array({ minLength: 8, maxLength: 32 }),
          (plaintext, [proverIdx, wrongIdx], nonce) => {
            const ciphertext = keyPair.publicKey.encrypt(plaintext);
            const proverShare = keyPair.keyShares[proverIdx];
            const wrongShare = keyPair.keyShares[wrongIdx];

            const partial = service.computePartial(
              [ciphertext],
              proverShare,
              nonce,
            );

            // Verify with the WRONG guardian's verification key
            const isValid = service.verifyPartial(
              partial,
              [ciphertext],
              wrongShare.verificationKey,
              keyPair.publicKey,
            );

            expect(isValid).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('tampered partial decryption values should fail verification', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 10000n }),
          fc.integer({ min: 0, max: keyPair.keyShares.length - 1 }),
          fc.uint8Array({ minLength: 8, maxLength: 32 }),
          fc.bigInt({ min: 1n, max: 1000n }),
          (plaintext, shareIdx, nonce, tamperOffset) => {
            const ciphertext = keyPair.publicKey.encrypt(plaintext);
            const share = keyPair.keyShares[shareIdx];

            const partial = service.computePartial([ciphertext], share, nonce);

            // Tamper with the partial decryption values
            const tampered = {
              ...partial,
              values: [partial.values[0] + tamperOffset],
            };

            const isValid = service.verifyPartial(
              tampered,
              [ciphertext],
              share.verificationKey,
              keyPair.publicKey,
            );

            expect(isValid).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: Serialization Round-Trip
   * Feature: real-time-threshold-voting, Property 4: Serialization Round-Trip
   * **Validates: Requirements 3.6**
   *
   * For any partial decryption, serializing then deserializing SHALL produce
   * a value equivalent to the original.
   */
  describe('Property 4: Serialization Round-Trip', () => {
    it('serialize then deserialize should produce an equivalent partial decryption', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 10000n }),
          fc.integer({ min: 0, max: keyPair.keyShares.length - 1 }),
          fc.uint8Array({ minLength: 8, maxLength: 32 }),
          (plaintext, shareIdx, nonce) => {
            const ciphertext = keyPair.publicKey.encrypt(plaintext);
            const share = keyPair.keyShares[shareIdx];

            const original = service.computePartial([ciphertext], share, nonce);

            const serialized = service.serialize(original);
            const deserialized = service.deserialize(serialized);

            // All fields must be equivalent
            expect(deserialized.guardianIndex).toBe(original.guardianIndex);
            expect(deserialized.values).toEqual(original.values);
            expect(deserialized.proof.commitment).toBe(
              original.proof.commitment,
            );
            expect(deserialized.proof.challenge).toBe(original.proof.challenge);
            expect(deserialized.proof.response).toBe(original.proof.response);
            expect(deserialized.ceremonyNonce).toEqual(original.ceremonyNonce);
            expect(deserialized.timestamp).toBe(original.timestamp);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('deserialized partial decryptions should still pass verification', () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 10000n }),
          fc.integer({ min: 0, max: keyPair.keyShares.length - 1 }),
          fc.uint8Array({ minLength: 8, maxLength: 32 }),
          (plaintext, shareIdx, nonce) => {
            const ciphertext = keyPair.publicKey.encrypt(plaintext);
            const share = keyPair.keyShares[shareIdx];

            const original = service.computePartial([ciphertext], share, nonce);

            const serialized = service.serialize(original);
            const deserialized = service.deserialize(serialized);

            // The deserialized partial should verify just like the original
            const isValid = service.verifyPartial(
              deserialized,
              [ciphertext],
              share.verificationKey,
              keyPair.publicKey,
            );

            expect(isValid).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
