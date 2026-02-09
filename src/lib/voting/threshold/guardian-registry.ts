/**
 * Guardian Registry
 *
 * Manages Guardian registration, status tracking, and backup designation
 * for threshold voting. Guardians are trusted key holders who possess
 * shares of the threshold decryption key.
 *
 * @module voting/threshold
 */

import type { PlatformID } from '../../../interfaces/platform-id';
import { GuardianStatus } from './enumerations/guardian-status';
import type { Guardian } from './interfaces/guardian';
import type { IGuardianRegistry } from './interfaces/guardian-registry';
import type { GuardianStatusChangeEvent } from './interfaces/guardian-status-change-event';

/**
 * Error thrown when attempting to register a Guardian with a duplicate ID.
 */
export class GuardianAlreadyRegisteredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardianAlreadyRegisteredError';
  }
}

/**
 * Error thrown when a Guardian is not found.
 */
export class GuardianNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardianNotFoundError';
  }
}

/**
 * Error thrown when a share index is invalid or already taken.
 */
export class InvalidShareIndexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidShareIndexError';
  }
}

/**
 * Error thrown when the registry is full (n Guardians already registered).
 */
export class RegistryFullError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryFullError';
  }
}

/**
 * Converts a PlatformID to a string key for Map lookups.
 * Handles Uint8Array (hex encoding), string, and objects with toString().
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
 * Registry for managing Guardians in a threshold voting system.
 *
 * Enforces that:
 * - Total registered Guardians equals n (totalShares)
 * - Each Guardian has a unique ID and share index in [1, n]
 * - Status changes emit events for monitoring
 * - Backup Guardians can be designated for unavailable Guardians
 *
 * @example
 * ```typescript
 * const registry = new GuardianRegistry(5); // 5 total shares
 * registry.register({
 *   id: new Uint8Array([1]),
 *   name: 'Guardian 1',
 *   shareIndex: 1,
 *   verificationKey: vk1,
 *   status: GuardianStatus.Registered,
 * });
 * ```
 */
export class GuardianRegistry<
  TID extends PlatformID = Uint8Array,
> implements IGuardianRegistry<TID> {
  private readonly _guardians: Map<string, Guardian<TID>> = new Map();
  private readonly _indexMap: Map<number, string> = new Map();
  private readonly _statusListeners: Array<
    (event: GuardianStatusChangeEvent<TID>) => void
  > = [];
  private readonly _totalShares: number;

  /**
   * Create a new GuardianRegistry.
   * @param totalShares The total number of key shares (n). The registry
   *   enforces that exactly n Guardians can be registered.
   */
  constructor(totalShares: number) {
    if (totalShares < 2 || !Number.isInteger(totalShares)) {
      throw new Error(
        `totalShares must be an integer >= 2, got ${totalShares}`,
      );
    }
    this._totalShares = totalShares;
  }

  /** Total number of shares this registry manages */
  get totalShares(): number {
    return this._totalShares;
  }

  /** Number of currently registered Guardians */
  get count(): number {
    return this._guardians.size;
  }

  /**
   * Register a new Guardian.
   *
   * Validates:
   * - Registry is not full (count < n)
   * - Guardian ID is unique
   * - Share index is in range [1, n] and not already taken
   */
  register(guardian: Guardian<TID>): void {
    const key = toKey(guardian.id);

    if (this._guardians.size >= this._totalShares) {
      throw new RegistryFullError(
        `Registry is full: ${this._guardians.size}/${this._totalShares} Guardians registered`,
      );
    }

    if (this._guardians.has(key)) {
      throw new GuardianAlreadyRegisteredError(
        `Guardian with ID '${key}' is already registered`,
      );
    }

    if (
      guardian.shareIndex < 1 ||
      guardian.shareIndex > this._totalShares ||
      !Number.isInteger(guardian.shareIndex)
    ) {
      throw new InvalidShareIndexError(
        `Share index must be an integer in [1, ${this._totalShares}], got ${guardian.shareIndex}`,
      );
    }

    if (this._indexMap.has(guardian.shareIndex)) {
      throw new InvalidShareIndexError(
        `Share index ${guardian.shareIndex} is already assigned to another Guardian`,
      );
    }

    // Store a shallow copy to avoid external mutation of internal state
    const stored: Guardian<TID> = { ...guardian };
    this._guardians.set(key, stored);
    this._indexMap.set(guardian.shareIndex, key);
  }

  /**
   * Get a Guardian by ID.
   */
  getGuardian(id: TID): Guardian<TID> | undefined {
    return this._guardians.get(toKey(id));
  }

  /**
   * Get a Guardian by share index.
   */
  getGuardianByIndex(index: number): Guardian<TID> | undefined {
    const key = this._indexMap.get(index);
    if (key === undefined) return undefined;
    return this._guardians.get(key);
  }

  /**
   * Get all registered Guardians.
   */
  getAllGuardians(): readonly Guardian<TID>[] {
    return Array.from(this._guardians.values());
  }

  /**
   * Get all Guardians with Online status.
   */
  getOnlineGuardians(): readonly Guardian<TID>[] {
    return Array.from(this._guardians.values()).filter(
      (g) => g.status === GuardianStatus.Online,
    );
  }

  /**
   * Update a Guardian's status and emit a status change event.
   *
   * @throws GuardianNotFoundError if the Guardian is not registered
   */
  updateStatus(id: TID, status: GuardianStatus): void {
    const key = toKey(id);
    const guardian = this._guardians.get(key);
    if (!guardian) {
      throw new GuardianNotFoundError(
        `Guardian with ID '${key}' is not registered`,
      );
    }

    const previousStatus = guardian.status;
    if (previousStatus === status) return;

    guardian.status = status;

    const event: GuardianStatusChangeEvent<TID> = {
      guardianId: guardian.id,
      previousStatus,
      newStatus: status,
      timestamp: Date.now(),
    };

    for (const listener of this._statusListeners) {
      listener(event);
    }
  }

  /**
   * Designate a backup Guardian for a primary Guardian.
   *
   * The backup Guardian must already be registered. This creates a
   * one-way link from the primary to the backup.
   *
   * @throws GuardianNotFoundError if either Guardian is not registered
   */
  designateBackup(guardianId: TID, backupId: TID): void {
    const primaryKey = toKey(guardianId);
    const backupKey = toKey(backupId);

    const primary = this._guardians.get(primaryKey);
    if (!primary) {
      throw new GuardianNotFoundError(
        `Primary Guardian with ID '${primaryKey}' is not registered`,
      );
    }

    const backup = this._guardians.get(backupKey);
    if (!backup) {
      throw new GuardianNotFoundError(
        `Backup Guardian with ID '${backupKey}' is not registered`,
      );
    }

    // Replace the guardian entry with updated backupGuardianId
    // Using object spread to create a new object with the readonly property set
    const updated: Guardian<TID> = {
      ...primary,
      backupGuardianId: backupId,
    };
    this._guardians.set(primaryKey, updated);
  }

  /**
   * Subscribe to Guardian status change events.
   */
  onStatusChange(
    callback: (event: GuardianStatusChangeEvent<TID>) => void,
  ): void {
    this._statusListeners.push(callback);
  }
}
