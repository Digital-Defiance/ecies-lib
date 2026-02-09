/**
 * Property-Based Tests: Tally Verifier
 *
 * Feature: real-time-threshold-voting
 * These tests validate tally verification using ZK proof soundness.
 *
 * Property 2: ZK Proof Soundness (verification aspect)
 *
 * *For any* partial decryption, the accompanying ZK proof is valid if and only if
 * the partial decryption was computed correctly using the Guardian's actual key share.
 * Invalid proofs SHALL be rejected, and valid proofs SHALL be accepted.
 *
 * **Validates: Requirements 8.2, 8.3, 8.4**
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fc from 'fast-check';
import { DecryptionCombiner } from './decryption-combiner';
import type {
  ThresholdKeyPair,
  PartialDecryption,
  IntervalTally,
  CombinedZKProof,
} from './interfaces';
import { PartialDecryptionService } from './partial-decryption-service';
import { TallyVerifier } from './tally-verifier';
import { ThresholdKeyGenerator } from './threshold-key-generator';

describe('Feature: real-time-threshold-voting, Property 2: ZK Proof Soundness (verification aspect)', () => {
  let keyPair: ThresholdKeyPair;
  let service: PartialDecryptionService;
  let combiner: DecryptionCombiner;
  let verifier: TallyVerifier<string>;

  const k = 2;
  const n = 3;

  beforeAll(async () => {
    const generator = new ThresholdKeyGenerator();
    keyPair = await generator.generate({
      totalShares: n,
      threshold: k,
      keyBitLength: 512,
    });
    service = new PartialDecryptionService(keyPair.publicKey);
    combiner = new DecryptionCombiner(
      keyPair.publicKey,
      keyPair.verificationKeys,
      keyPair.theta,
    );
    verifier = new TallyVerifier<string>(
      keyPair.publicKey,
      keyPair.verificationKeys,
      keyPair.config,
      keyPair.theta,
    );
  }, 120000);

  /**
   * Helper: build a valid IntervalTally from a plaintext value.
   */
  function buildValidTally(
    plaintext: bigint,
    nonce: Uint8Array,
  ): { tally: IntervalTally<string>; encryptedTally: bigint[] } {
    const ciphertext = keyPair.publicKey.encrypt(plaintext);
    const encryptedTally = [ciphertext];

    const partials: PartialDecryption[] = keyPair.keyShares
      .slice(0, k)
      .map((share) => service.computePartial(encryptedTally, share, nonce));

    const combined = combiner.combine(
      partials,
      encryptedTally,
      keyPair.publicKey,
      keyPair.config,
    );

    const tally: IntervalTally<string> = {
      pollId: 'poll-test',
      intervalNumber: 1,
      tallies: combined.tallies as readonly bigint[],
      choices: ['Yes'] as readonly string[],
      voteCount: Number(plaintext),
      cumulativeVoteCount: Number(plaintext),
      proof: combined.combinedProof,
      participatingGuardians: combined.participatingGuardians,
      timestamp: Date.now(),
      isFinal: false,
    };

    return { tally, encryptedTally };
  }

  /**
   * Req 8.2: Valid tallies with correct ZK proofs SHALL pass verification.
   */
  it('correctly decrypted tallies with valid proofs pass verification', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10000n }),
        fc.uint8Array({ minLength: 8, maxLength: 16 }),
        (plaintext, nonce) => {
          const { tally, encryptedTally } = buildValidTally(plaintext, nonce);
          const registeredGuardians = keyPair.keyShares.map((s) => s.index);

          const result = verifier.verify(
            tally,
            encryptedTally,
            keyPair.verificationKeys,
            keyPair.publicKey,
            registeredGuardians,
          );

          expect(result.valid).toBe(true);
          expect(result.checks.proofValid).toBe(true);
          expect(result.checks.guardiansAuthorized).toBe(true);
          expect(result.checks.tallyMatchesEncrypted).toBe(true);
          expect(result.checks.timestampValid).toBe(true);
          expect(result.error).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Req 8.3: Tallies with tampered proof data SHALL fail verification.
   */
  it('tallies with tampered proof inputHash fail verification', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10000n }),
        fc.uint8Array({ minLength: 8, maxLength: 16 }),
        (plaintext, nonce) => {
          const { tally, encryptedTally } = buildValidTally(plaintext, nonce);
          const registeredGuardians = keyPair.keyShares.map((s) => s.index);

          // Tamper with the proof's inputHash
          const tamperedInputHash = new Uint8Array(
            tally.proof.inputHash.length,
          );
          tamperedInputHash.set(tally.proof.inputHash);
          tamperedInputHash[0] = (tamperedInputHash[0] + 1) % 256;

          const tamperedProof: CombinedZKProof = {
            ...tally.proof,
            inputHash: tamperedInputHash,
          };

          const tamperedTally: IntervalTally<string> = {
            ...tally,
            proof: tamperedProof,
          };

          const result = verifier.verify(
            tamperedTally,
            encryptedTally,
            keyPair.verificationKeys,
            keyPair.publicKey,
            registeredGuardians,
          );

          expect(result.valid).toBe(false);
          expect(result.checks.proofValid).toBe(false);
          expect(result.error).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Req 8.4: Tallies with unauthorized Guardians SHALL fail verification.
   */
  it('tallies with unauthorized Guardian indices fail verification', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10000n }),
        fc.uint8Array({ minLength: 8, maxLength: 16 }),
        (plaintext, nonce) => {
          const { tally, encryptedTally } = buildValidTally(plaintext, nonce);

          // Provide a registered set that excludes one of the participating Guardians
          const participating = tally.participatingGuardians;
          const restrictedGuardians = participating.slice(1); // remove first

          const result = verifier.verify(
            tally,
            encryptedTally,
            keyPair.verificationKeys,
            keyPair.publicKey,
            restrictedGuardians,
          );

          expect(result.valid).toBe(false);
          expect(result.checks.guardiansAuthorized).toBe(false);
          expect(result.error).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});
