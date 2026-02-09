/**
 * Tests for CeremonyCoordinator
 *
 * Validates ceremony lifecycle, duplicate prevention, ZK proof validation,
 * timeout handling, and event subscription.
 */
import {
  describe,
  it,
  expect,
  beforeAll,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import {
  CeremonyCoordinator,
  CeremonyNotFoundError,
  CeremonyAlreadyCompleteError,
  DuplicatePartialSubmissionError,
  InvalidCeremonyPartialProofError,
} from './ceremony-coordinator';
import { CeremonyStatus } from './enumerations/ceremony-status';
import type { ThresholdKeyPair, PartialDecryption } from './interfaces';
import { PartialDecryptionService } from './partial-decryption-service';
import { ThresholdKeyGenerator } from './threshold-key-generator';

describe('CeremonyCoordinator', () => {
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

  function makeCoordinator(timeoutMs = 0) {
    return new CeremonyCoordinator<string>(
      keyPair.publicKey,
      keyPair.verificationKeys,
      keyPair.theta,
      keyPair.config,
      timeoutMs,
    );
  }

  function computePartial(
    encryptedTally: bigint[],
    shareIndex: number,
    nonce: Uint8Array,
  ): PartialDecryption {
    return partialService.computePartial(
      encryptedTally,
      keyPair.keyShares[shareIndex],
      nonce,
    );
  }

  describe('startCeremony', () => {
    it('should create a ceremony with InProgress status', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      expect(ceremony.status).toBe(CeremonyStatus.InProgress);
      expect(ceremony.pollId).toBe('poll-1');
      expect(ceremony.intervalNumber).toBe(1);
      expect(ceremony.encryptedTally).toEqual([ciphertext]);
      expect(ceremony.partials.size).toBe(0);
      expect(ceremony.nonce).toBeInstanceOf(Uint8Array);
      expect(ceremony.nonce.length).toBe(32);
      expect(ceremony.id).toBeTruthy();
    });

    it('should generate unique IDs for different ceremonies', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(1n);
      const c1 = coordinator.startCeremony('poll-1', 1, [ciphertext]);
      const c2 = coordinator.startCeremony('poll-1', 2, [ciphertext]);

      expect(c1.id).not.toBe(c2.id);
    });
  });

  describe('submitPartial', () => {
    it('should accept a valid partial decryption', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      const partial = computePartial([ciphertext], 0, ceremony.nonce);
      const accepted = coordinator.submitPartial(ceremony.id, partial);

      expect(accepted).toBe(true);
      expect(ceremony.partials.size).toBe(1);
    });

    it('should auto-complete when k partials are collected', () => {
      const coordinator = makeCoordinator();
      const plaintext = 42n;
      const ciphertext = keyPair.publicKey.encrypt(plaintext);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      for (let i = 0; i < 3; i++) {
        coordinator.submitPartial(
          ceremony.id,
          computePartial([ciphertext], i, ceremony.nonce),
        );
      }

      expect(ceremony.status).toBe(CeremonyStatus.Completed);
      expect(ceremony.result).toBeDefined();
      expect(ceremony.result?.tallies[0]).toBe(plaintext);
      expect(ceremony.completedAt).toBeDefined();
    });

    it('should reject duplicate submissions from the same Guardian', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(10n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      const partial = computePartial([ciphertext], 0, ceremony.nonce);
      coordinator.submitPartial(ceremony.id, partial);

      expect(() => coordinator.submitPartial(ceremony.id, partial)).toThrow(
        DuplicatePartialSubmissionError,
      );
    });

    it('should reject submissions to a completed ceremony', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(10n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      // Complete the ceremony with k=3 partials
      for (let i = 0; i < 3; i++) {
        coordinator.submitPartial(
          ceremony.id,
          computePartial([ciphertext], i, ceremony.nonce),
        );
      }

      // 4th submission should be rejected
      expect(() =>
        coordinator.submitPartial(
          ceremony.id,
          computePartial([ciphertext], 3, ceremony.nonce),
        ),
      ).toThrow(CeremonyAlreadyCompleteError);
    });

    it('should reject submissions with wrong ceremony nonce', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(10n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      const wrongNonce = new Uint8Array(32);
      const partial = computePartial([ciphertext], 0, wrongNonce);

      expect(() => coordinator.submitPartial(ceremony.id, partial)).toThrow(
        InvalidCeremonyPartialProofError,
      );
    });

    it('should reject submissions with invalid ZK proof (tampered value)', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(10n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      const partial = computePartial([ciphertext], 0, ceremony.nonce);
      const tampered: PartialDecryption = {
        ...partial,
        values: [partial.values[0] + 1n],
      };

      expect(() => coordinator.submitPartial(ceremony.id, tampered)).toThrow(
        InvalidCeremonyPartialProofError,
      );
    });

    it('should throw CeremonyNotFoundError for unknown ceremony', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(10n);
      const nonce = new Uint8Array(32);
      const partial = computePartial([ciphertext], 0, nonce);

      expect(() => coordinator.submitPartial('nonexistent', partial)).toThrow(
        CeremonyNotFoundError,
      );
    });

    it('should reject submissions with out-of-range guardian index', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(10n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      const partial = computePartial([ciphertext], 0, ceremony.nonce);
      const outOfRange: PartialDecryption = {
        ...partial,
        guardianIndex: 99,
        ceremonyNonce: ceremony.nonce,
      };

      expect(() => coordinator.submitPartial(ceremony.id, outOfRange)).toThrow(
        InvalidCeremonyPartialProofError,
      );
    });
  });

  describe('getCeremony', () => {
    it('should return a ceremony by ID', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(1n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      const found = coordinator.getCeremony(ceremony.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(ceremony.id);
    });

    it('should return undefined for unknown ID', () => {
      const coordinator = makeCoordinator();
      expect(coordinator.getCeremony('nonexistent')).toBeUndefined();
    });
  });

  describe('getCeremoniesForPoll', () => {
    it('should return all ceremonies for a poll', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(1n);

      coordinator.startCeremony('poll-1', 1, [ciphertext]);
      coordinator.startCeremony('poll-1', 2, [ciphertext]);
      coordinator.startCeremony('poll-2', 1, [ciphertext]);

      const poll1Ceremonies = coordinator.getCeremoniesForPoll('poll-1');
      expect(poll1Ceremonies).toHaveLength(2);

      const poll2Ceremonies = coordinator.getCeremoniesForPoll('poll-2');
      expect(poll2Ceremonies).toHaveLength(1);
    });

    it('should return empty array for unknown poll', () => {
      const coordinator = makeCoordinator();
      expect(coordinator.getCeremoniesForPoll('unknown')).toHaveLength(0);
    });
  });

  describe('onCeremonyComplete', () => {
    it('should notify listeners when a ceremony completes', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      const completedCeremonies: string[] = [];
      coordinator.onCeremonyComplete((c) => completedCeremonies.push(c.id));

      for (let i = 0; i < 3; i++) {
        coordinator.submitPartial(
          ceremony.id,
          computePartial([ciphertext], i, ceremony.nonce),
        );
      }

      expect(completedCeremonies).toEqual([ceremony.id]);
    });

    it('should support multiple listeners', () => {
      const coordinator = makeCoordinator();
      const ciphertext = keyPair.publicKey.encrypt(1n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      let count1 = 0;
      let count2 = 0;
      coordinator.onCeremonyComplete(() => count1++);
      coordinator.onCeremonyComplete(() => count2++);

      for (let i = 0; i < 3; i++) {
        coordinator.submitPartial(
          ceremony.id,
          computePartial([ciphertext], i, ceremony.nonce),
        );
      }

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe('timeout handling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should mark ceremony as TimedOut after timeout elapses', () => {
      const coordinator = makeCoordinator(5_000);
      const ciphertext = keyPair.publicKey.encrypt(1n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      // Submit only 1 partial (need 3)
      coordinator.submitPartial(
        ceremony.id,
        computePartial([ciphertext], 0, ceremony.nonce),
      );

      jest.advanceTimersByTime(5_000);

      expect(ceremony.status).toBe(CeremonyStatus.TimedOut);
      expect(ceremony.completedAt).toBeDefined();
    });

    it('should not timeout a completed ceremony', () => {
      const coordinator = makeCoordinator(5_000);
      const ciphertext = keyPair.publicKey.encrypt(42n);
      const ceremony = coordinator.startCeremony('poll-1', 1, [ciphertext]);

      // Complete the ceremony before timeout
      for (let i = 0; i < 3; i++) {
        coordinator.submitPartial(
          ceremony.id,
          computePartial([ciphertext], i, ceremony.nonce),
        );
      }

      expect(ceremony.status).toBe(CeremonyStatus.Completed);

      // Advance past timeout — status should remain Completed
      jest.advanceTimersByTime(10_000);
      expect(ceremony.status).toBe(CeremonyStatus.Completed);
    });
  });
});
