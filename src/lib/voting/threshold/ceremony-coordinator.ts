/**
 * Ceremony Coordinator
 *
 * Orchestrates threshold decryption ceremonies by collecting partial
 * decryptions from Guardians, validating ZK proofs, preventing duplicate
 * submissions, and combining results when the threshold is met.
 *
 * @module voting/threshold
 */

import type { PublicKey } from 'paillier-bigint';
import type { PlatformID } from '../../../interfaces/platform-id';
import { DecryptionCombiner } from './decryption-combiner';
import { CeremonyStatus } from './enumerations/ceremony-status';
import type { Ceremony } from './interfaces/ceremony';
import type { ICeremonyCoordinator } from './interfaces/ceremony-coordinator';
import type { PartialDecryption } from './interfaces/partial-decryption';
import type { ThresholdKeyConfig } from './interfaces/threshold-key-config';
import { PartialDecryptionService } from './partial-decryption-service';

/**
 * Error thrown when a ceremony is not found.
 */
export class CeremonyNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CeremonyNotFoundError';
  }
}

/**
 * Error thrown when submitting to a ceremony that is already complete.
 */
export class CeremonyAlreadyCompleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CeremonyAlreadyCompleteError';
  }
}

/**
 * Error thrown when a Guardian submits a duplicate partial decryption.
 */
export class DuplicatePartialSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicatePartialSubmissionError';
  }
}

/**
 * Error thrown when a partial decryption's ZK proof is invalid.
 */
export class InvalidCeremonyPartialProofError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCeremonyPartialProofError';
  }
}

/**
 * Converts a PlatformID to a string key for Map lookups.
 */
function toKey<TID extends PlatformID>(id: TID): string {
  if (id instanceof Uint8Array) {
    return Array.from(id)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return String(id);
}

/**
 * Generate a cryptographically random nonce.
 */
function generateNonce(length = 32): Uint8Array {
  const nonce = new Uint8Array(length);
  crypto.getRandomValues(nonce);
  return nonce;
}

/**
 * Generate a unique ceremony ID from a nonce.
 */
function nonceToId(nonce: Uint8Array): string {
  return Array.from(nonce)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Coordinates threshold decryption ceremonies.
 *
 * Manages the lifecycle of decryption ceremonies:
 * 1. Start a ceremony with a unique nonce
 * 2. Collect partial decryptions from Guardians (with duplicate prevention)
 * 3. Validate ZK proofs on each submission
 * 4. Combine partials when threshold k is reached
 * 5. Handle timeout and notify subscribers on completion
 *
 * @example
 * ```typescript
 * const coordinator = new CeremonyCoordinator<string>(
 *   publicKey,
 *   verificationKeys,
 *   theta,
 *   { totalShares: 5, threshold: 3 },
 *   60_000, // 60s timeout
 * );
 *
 * const ceremony = coordinator.startCeremony('poll-1', 1, encryptedTally);
 *
 * coordinator.onCeremonyComplete((c) => {
 *   console.log('Ceremony completed:', c.result?.tallies);
 * });
 *
 * // Guardians submit their partials
 * coordinator.submitPartial(ceremony.id, partial1);
 * coordinator.submitPartial(ceremony.id, partial2);
 * coordinator.submitPartial(ceremony.id, partial3); // triggers combine
 * ```
 */
export class CeremonyCoordinator<
  TID extends PlatformID = Uint8Array,
> implements ICeremonyCoordinator<TID> {
  private readonly _ceremonies: Map<string, Ceremony<TID>> = new Map();
  private readonly _pollCeremonies: Map<string, string[]> = new Map();
  private readonly _completionListeners: Array<
    (ceremony: Ceremony<TID>) => void
  > = [];
  private readonly _timeoutTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();

  private readonly _publicKey: PublicKey;
  private readonly _verificationKeys: readonly Uint8Array[];
  private readonly _theta: bigint;
  private readonly _config: ThresholdKeyConfig;
  private readonly _ceremonyTimeoutMs: number;
  private readonly _partialService: PartialDecryptionService;
  private readonly _combiner: DecryptionCombiner;

  /**
   * Create a new CeremonyCoordinator.
   *
   * @param publicKey - The Paillier public key
   * @param verificationKeys - Verification keys for each Guardian (indexed 0..n-1)
   * @param theta - The theta value from key generation (for combining)
   * @param config - Threshold configuration (k, n)
   * @param ceremonyTimeoutMs - Timeout in ms for each ceremony (0 = no timeout)
   */
  constructor(
    publicKey: PublicKey,
    verificationKeys: readonly Uint8Array[],
    theta: bigint,
    config: ThresholdKeyConfig,
    ceremonyTimeoutMs = 0,
  ) {
    this._publicKey = publicKey;
    this._verificationKeys = verificationKeys;
    this._theta = theta;
    this._config = config;
    this._ceremonyTimeoutMs = ceremonyTimeoutMs;
    this._partialService = new PartialDecryptionService(publicKey);
    this._combiner = new DecryptionCombiner(publicKey, verificationKeys, theta);
  }

  /**
   * Start a new decryption ceremony.
   *
   * Generates a unique nonce for replay protection and sets up
   * timeout handling if configured.
   *
   * @param pollId - The poll this ceremony is for
   * @param intervalNumber - The interval number triggering this ceremony
   * @param encryptedTally - The encrypted tally ciphertexts to decrypt
   * @returns The newly created ceremony
   */
  startCeremony(
    pollId: TID,
    intervalNumber: number,
    encryptedTally: bigint[],
  ): Ceremony<TID> {
    const nonce = generateNonce();
    const id = nonceToId(nonce);

    const ceremony: Ceremony<TID> = {
      id,
      pollId,
      intervalNumber,
      nonce,
      encryptedTally: [...encryptedTally],
      status: CeremonyStatus.InProgress,
      partials: new Map(),
      startedAt: Date.now(),
    };

    this._ceremonies.set(id, ceremony);

    // Track ceremony under its poll
    const pollKey = toKey(pollId);
    const existing = this._pollCeremonies.get(pollKey) ?? [];
    existing.push(id);
    this._pollCeremonies.set(pollKey, existing);

    // Set up timeout if configured
    if (this._ceremonyTimeoutMs > 0) {
      const timer = setTimeout(() => {
        this.handleTimeout(id);
      }, this._ceremonyTimeoutMs);
      this._timeoutTimers.set(id, timer);
    }

    return ceremony;
  }

  /**
   * Submit a partial decryption to a ceremony.
   *
   * Validates:
   * - Ceremony exists and is in progress
   * - Guardian has not already submitted (duplicate prevention)
   * - Ceremony nonce matches (replay protection)
   * - ZK proof is valid
   *
   * When k valid partials are collected, automatically combines them
   * and marks the ceremony as completed.
   *
   * @param ceremonyId - The ceremony to submit to
   * @param partial - The partial decryption with ZK proof
   * @returns true if the submission was accepted
   * @throws CeremonyNotFoundError if the ceremony doesn't exist
   * @throws CeremonyAlreadyCompleteError if the ceremony is not in progress
   * @throws DuplicatePartialSubmissionError if the Guardian already submitted
   * @throws InvalidCeremonyPartialProofError if the ZK proof is invalid
   */
  submitPartial(ceremonyId: string, partial: PartialDecryption): boolean {
    const ceremony = this._ceremonies.get(ceremonyId);
    if (!ceremony) {
      throw new CeremonyNotFoundError(`Ceremony '${ceremonyId}' not found`);
    }

    if (ceremony.status !== CeremonyStatus.InProgress) {
      throw new CeremonyAlreadyCompleteError(
        `Ceremony '${ceremonyId}' is not in progress (status: ${ceremony.status})`,
      );
    }

    // Duplicate prevention: check if this Guardian already submitted
    if (ceremony.partials.has(partial.guardianIndex)) {
      throw new DuplicatePartialSubmissionError(
        `Guardian ${partial.guardianIndex} has already submitted a partial decryption for ceremony '${ceremonyId}'`,
      );
    }

    // Validate ceremony nonce matches (replay protection)
    if (!this.uint8ArrayEquals(partial.ceremonyNonce, ceremony.nonce)) {
      throw new InvalidCeremonyPartialProofError(
        `Ceremony nonce mismatch for Guardian ${partial.guardianIndex} in ceremony '${ceremonyId}'`,
      );
    }

    // Validate ZK proof
    const vkIndex = partial.guardianIndex - 1; // 1-indexed to 0-indexed
    if (vkIndex < 0 || vkIndex >= this._verificationKeys.length) {
      throw new InvalidCeremonyPartialProofError(
        `Guardian index ${partial.guardianIndex} is out of range [1, ${this._verificationKeys.length}]`,
      );
    }

    const isValid = this._partialService.verifyPartial(
      partial,
      ceremony.encryptedTally,
      this._verificationKeys[vkIndex],
      this._publicKey,
    );

    if (!isValid) {
      throw new InvalidCeremonyPartialProofError(
        `ZK proof verification failed for Guardian ${partial.guardianIndex} in ceremony '${ceremonyId}'`,
      );
    }

    // Accept the partial
    ceremony.partials.set(partial.guardianIndex, partial);

    // Check if we have enough partials to combine
    if (ceremony.partials.size >= this._config.threshold) {
      this.completeCeremony(ceremony);
    }

    return true;
  }

  /**
   * Get a ceremony by ID.
   */
  getCeremony(ceremonyId: string): Ceremony<TID> | undefined {
    return this._ceremonies.get(ceremonyId);
  }

  /**
   * Get all ceremonies for a poll.
   */
  getCeremoniesForPoll(pollId: TID): readonly Ceremony<TID>[] {
    const pollKey = toKey(pollId);
    const ceremonyIds = this._pollCeremonies.get(pollKey) ?? [];
    const ceremonies: Ceremony<TID>[] = [];
    for (const id of ceremonyIds) {
      const ceremony = this._ceremonies.get(id);
      if (ceremony) {
        ceremonies.push(ceremony);
      }
    }
    return ceremonies;
  }

  /**
   * Subscribe to ceremony completion events.
   */
  onCeremonyComplete(callback: (ceremony: Ceremony<TID>) => void): void {
    this._completionListeners.push(callback);
  }

  /**
   * Complete a ceremony by combining partial decryptions.
   */
  private completeCeremony(ceremony: Ceremony<TID>): void {
    // Clear timeout timer
    const timer = this._timeoutTimers.get(ceremony.id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this._timeoutTimers.delete(ceremony.id);
    }

    try {
      const partials = Array.from(ceremony.partials.values());
      const result = this._combiner.combine(
        partials,
        ceremony.encryptedTally,
        this._publicKey,
        this._config,
      );

      ceremony.result = result;
      ceremony.status = CeremonyStatus.Completed;
      ceremony.completedAt = Date.now();

      // Notify listeners
      for (const listener of this._completionListeners) {
        listener(ceremony);
      }
    } catch {
      ceremony.status = CeremonyStatus.Failed;
      ceremony.completedAt = Date.now();
    }
  }

  /**
   * Handle ceremony timeout.
   */
  private handleTimeout(ceremonyId: string): void {
    this._timeoutTimers.delete(ceremonyId);

    const ceremony = this._ceremonies.get(ceremonyId);
    if (!ceremony || ceremony.status !== CeremonyStatus.InProgress) {
      return;
    }

    ceremony.status = CeremonyStatus.TimedOut;
    ceremony.completedAt = Date.now();
  }

  /**
   * Compare two Uint8Arrays for equality.
   */
  private uint8ArrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
