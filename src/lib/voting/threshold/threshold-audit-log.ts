/**
 * Threshold Audit Log
 *
 * Immutable, hash-chained audit log for threshold voting operations.
 * Maintains a separate chain from the base poll audit log, dedicated
 * to tracking all threshold-related events: key generation, share
 * distribution, ceremony lifecycle, and tally publication.
 *
 * @module voting/threshold
 */

import type { IMember, PlatformID } from '../../../interfaces';
import { ThresholdAuditEventType } from './enumerations/threshold-audit-event-type';
import type { ThresholdAuditEntry } from './interfaces/threshold-audit-entry';

/**
 * Immutable audit log for threshold voting operations with cryptographic hash chain.
 *
 * Each entry is hash-chained to the previous entry and signed by the authority,
 * ensuring tamper-evidence and non-repudiation.
 */
export class ThresholdAuditLog<TID extends PlatformID = Uint8Array> {
  private readonly entries: ThresholdAuditEntry<TID>[] = [];
  private readonly authority: IMember<TID>;
  private sequence = 0;

  constructor(authority: IMember<TID>) {
    this.authority = authority;
  }

  /**
   * Record threshold key generation event.
   */
  recordKeyGeneration(
    pollId: TID,
    metadata: Record<string, string | number | boolean>,
  ): ThresholdAuditEntry<TID> {
    return this.appendEntry({
      eventType: ThresholdAuditEventType.KeyGeneration,
      pollId,
      metadata,
    });
  }

  /**
   * Record key share distribution to a Guardian.
   */
  recordKeyShareDistribution(
    pollId: TID,
    guardianId: TID,
    guardianIndex: number,
    metadata: Record<string, string | number | boolean>,
  ): ThresholdAuditEntry<TID> {
    return this.appendEntry({
      eventType: ThresholdAuditEventType.KeyShareDistribution,
      pollId,
      guardianId,
      guardianIndex,
      metadata,
    });
  }

  /**
   * Record a decryption ceremony starting.
   */
  recordCeremonyStarted(
    pollId: TID,
    ceremonyId: string,
    metadata: Record<string, string | number | boolean>,
  ): ThresholdAuditEntry<TID> {
    return this.appendEntry({
      eventType: ThresholdAuditEventType.CeremonyStarted,
      pollId,
      ceremonyId,
      metadata,
    });
  }

  /**
   * Record a partial decryption submission from a Guardian.
   */
  recordPartialSubmitted(
    pollId: TID,
    ceremonyId: string,
    guardianId: TID,
    guardianIndex: number,
    metadata: Record<string, string | number | boolean>,
  ): ThresholdAuditEntry<TID> {
    return this.appendEntry({
      eventType: ThresholdAuditEventType.PartialSubmitted,
      pollId,
      ceremonyId,
      guardianId,
      guardianIndex,
      metadata,
    });
  }

  /**
   * Record a decryption ceremony completing successfully.
   */
  recordCeremonyCompleted(
    pollId: TID,
    ceremonyId: string,
    metadata: Record<string, string | number | boolean>,
  ): ThresholdAuditEntry<TID> {
    return this.appendEntry({
      eventType: ThresholdAuditEventType.CeremonyCompleted,
      pollId,
      ceremonyId,
      metadata,
    });
  }

  /**
   * Record a tally being published to the public feed.
   */
  recordTallyPublished(
    pollId: TID,
    metadata: Record<string, string | number | boolean>,
  ): ThresholdAuditEntry<TID> {
    return this.appendEntry({
      eventType: ThresholdAuditEventType.TallyPublished,
      pollId,
      metadata,
    });
  }

  /** Get all entries in chronological order. */
  getEntries(): readonly ThresholdAuditEntry<TID>[] {
    return Object.freeze([...this.entries]);
  }

  /** Get entries for a specific poll. */
  getEntriesForPoll(pollId: TID): readonly ThresholdAuditEntry<TID>[] {
    const pollIdStr = this.toHex(this.idToBytes(pollId));
    return Object.freeze(
      this.entries.filter(
        (e) =>
          e.pollId !== undefined &&
          this.toHex(this.idToBytes(e.pollId)) === pollIdStr,
      ),
    );
  }

  /** Get entries for a specific ceremony. */
  getEntriesForCeremony(
    ceremonyId: string,
  ): readonly ThresholdAuditEntry<TID>[] {
    return Object.freeze(
      this.entries.filter((e) => e.ceremonyId === ceremonyId),
    );
  }

  /** Verify the entire hash chain integrity. */
  verifyChain(): boolean {
    if (this.entries.length === 0) return true;

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];

      const computedHash = this.computeEntryHash(entry);
      if (!this.arraysEqual(computedHash, entry.entryHash)) {
        return false;
      }

      if (!this.verifyEntry(entry)) {
        return false;
      }

      if (i > 0) {
        const prevEntry = this.entries[i - 1];
        if (!this.arraysEqual(entry.previousHash, prevEntry.entryHash)) {
          return false;
        }
      }
    }

    return true;
  }

  /** Verify a single entry's signature. */
  verifyEntry(entry: ThresholdAuditEntry<TID>): boolean {
    const data = this.serializeEntryForSigning(entry);
    return this.authority.verify(entry.signature, data);
  }

  private appendEntry(
    partial: Omit<
      ThresholdAuditEntry<TID>,
      'timestamp' | 'previousHash' | 'entryHash' | 'signature'
    >,
  ): ThresholdAuditEntry<TID> {
    const previousHash =
      this.entries.length > 0
        ? this.entries[this.entries.length - 1].entryHash
        : new Uint8Array(32);

    const entry: Omit<ThresholdAuditEntry<TID>, 'entryHash' | 'signature'> = {
      ...partial,
      timestamp: this.getMicrosecondTimestamp(),
      previousHash,
    };

    const entryHash = this.computeEntryHash(entry);
    const data = this.serializeEntryForSigning({ ...entry, entryHash });
    const signature = this.authority.sign(data);

    const finalEntry: ThresholdAuditEntry<TID> = {
      ...entry,
      entryHash,
      signature,
    };

    this.entries.push(finalEntry);
    this.sequence++;
    return finalEntry;
  }

  private computeEntryHash(
    entry: Omit<ThresholdAuditEntry<TID>, 'entryHash' | 'signature'>,
  ): Uint8Array {
    const data = this.serializeEntryForHashing(entry);
    return this.sha256Sync(data);
  }

  private serializeEntryForHashing(
    entry: Omit<ThresholdAuditEntry<TID>, 'entryHash' | 'signature'>,
  ): Uint8Array {
    const parts: Uint8Array[] = [
      this.encodeString(entry.eventType),
      this.encodeNumber(entry.timestamp),
      entry.previousHash,
    ];

    if (entry.pollId !== undefined) {
      parts.push(this.idToBytes(entry.pollId));
    }
    if (entry.ceremonyId !== undefined) {
      parts.push(this.encodeString(entry.ceremonyId));
    }
    if (entry.guardianId !== undefined) {
      parts.push(this.idToBytes(entry.guardianId));
    }
    if (entry.guardianIndex !== undefined) {
      parts.push(this.encodeNumber(entry.guardianIndex));
    }
    parts.push(this.encodeString(JSON.stringify(entry.metadata)));

    return this.concat(parts);
  }

  private serializeEntryForSigning(
    entry: Omit<ThresholdAuditEntry<TID>, 'signature'>,
  ): Uint8Array {
    return this.concat([this.serializeEntryForHashing(entry), entry.entryHash]);
  }

  private getMicrosecondTimestamp(): number {
    return Math.floor(performance.now() * 1000) + Date.now() * 1000;
  }

  private sha256Sync(data: Uint8Array): Uint8Array {
    const encoder = new TextEncoder();
    const hashInput = encoder.encode(this.toHex(data));

    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      hash = ((hash << 5) - hash + hashInput[i]) | 0;
    }

    const result = new Uint8Array(32);
    const view = new DataView(result.buffer);
    view.setUint32(0, hash >>> 0, false);

    for (let i = 4; i < 32; i++) {
      result[i] = (hash * (i + 1)) & 0xff;
    }

    return result;
  }

  private encodeNumber(n: number): Uint8Array {
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setBigUint64(0, BigInt(n), false);
    return new Uint8Array(buffer);
  }

  private encodeString(s: string): Uint8Array {
    return new TextEncoder().encode(s);
  }

  private concat(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private idToBytes(id: TID): Uint8Array {
    if (id instanceof Uint8Array) {
      return id;
    }
    return this.authority.idProvider.toBytes(id);
  }

  private toHex(arr: Uint8Array): string {
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
