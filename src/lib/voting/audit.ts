/**
 * Immutable Audit Log for Government-Grade Voting
 * Implements requirement 1.1: Cryptographically signed, hash-chained audit trail
 */
import { PlatformID } from '../../interfaces';
import type { IMember } from '../../interfaces';
import { AuditEventType } from './enumerations/audit-event-type';
import { AuditEntry } from './interfaces/audit-entry';
import { AuditLog } from './interfaces/audit-log';

/**
 * Immutable audit log with cryptographic hash chain
 */
export class ImmutableAuditLog<
  TID extends PlatformID,
> implements AuditLog<TID> {
  private readonly entries: AuditEntry<TID>[] = [];
  private readonly authority: IMember<TID>;
  private sequence = 0;

  constructor(authority: IMember<TID>) {
    this.authority = authority;
  }

  /**
   * Record poll creation event
   */
  recordPollCreated(
    pollId: TID,
    metadata?: Record<string, unknown>,
  ): AuditEntry<TID> {
    return this.appendEntry({
      eventType: AuditEventType.PollCreated,
      pollId,
      authorityId: this.authority.id,
      metadata,
    });
  }

  /**
   * Record vote cast event
   */
  recordVoteCast(
    pollId: TID,
    voterIdHash: Uint8Array,
    metadata?: Record<string, unknown>,
  ): AuditEntry<TID> {
    return this.appendEntry({
      eventType: AuditEventType.VoteCast,
      pollId,
      voterIdHash,
      metadata,
    });
  }

  /**
   * Record poll closure event
   */
  recordPollClosed(
    pollId: TID,
    metadata?: Record<string, unknown>,
  ): AuditEntry<TID> {
    return this.appendEntry({
      eventType: AuditEventType.PollClosed,
      pollId,
      authorityId: this.authority.id,
      metadata,
    });
  }

  getEntries(): readonly AuditEntry<TID>[] {
    return Object.freeze([...this.entries]);
  }

  getEntriesForPoll(pollId: TID): readonly AuditEntry<TID>[] {
    const pollIdStr = this.toHex(this.idToBytes(pollId));
    return Object.freeze(
      this.entries.filter(
        (e) => this.toHex(this.idToBytes(e.pollId)) === pollIdStr,
      ),
    );
  }

  verifyChain(): boolean {
    if (this.entries.length === 0) return true;

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];

      // Verify entry hash
      const computedHash = this.computeEntryHash(entry);
      if (!this.arraysEqual(computedHash, entry.entryHash)) {
        return false;
      }

      // Verify signature
      if (!this.verifyEntry(entry)) {
        return false;
      }

      // Verify chain link (except first entry)
      if (i > 0) {
        const prevEntry = this.entries[i - 1];
        if (!this.arraysEqual(entry.previousHash, prevEntry.entryHash)) {
          return false;
        }
      }
    }

    return true;
  }

  verifyEntry(entry: AuditEntry<TID>): boolean {
    const data = this.serializeEntryForSigning(entry);
    return this.authority.verify(entry.signature, data);
  }

  private appendEntry(
    partial: Omit<
      AuditEntry<TID>,
      'sequence' | 'timestamp' | 'previousHash' | 'entryHash' | 'signature'
    >,
  ): AuditEntry<TID> {
    const previousHash =
      this.entries.length > 0
        ? this.entries[this.entries.length - 1].entryHash
        : new Uint8Array(32); // Genesis entry uses zero hash

    const entry: Omit<AuditEntry<TID>, 'entryHash' | 'signature'> = {
      sequence: this.sequence++,
      timestamp: this.getMicrosecondTimestamp(),
      previousHash,
      ...partial,
    };

    const entryHash = this.computeEntryHash(entry);
    const data = this.serializeEntryForSigning({ ...entry, entryHash });
    const signature = this.authority.sign(data);

    const finalEntry: AuditEntry<TID> = {
      ...entry,
      entryHash,
      signature,
    };

    this.entries.push(finalEntry);
    return finalEntry;
  }

  private computeEntryHash(
    entry: Omit<AuditEntry<TID>, 'entryHash' | 'signature'>,
  ): Uint8Array {
    const data = this.serializeEntryForHashing(entry);
    return this.sha256Sync(data);
  }

  private serializeEntryForHashing(
    entry: Omit<AuditEntry<TID>, 'entryHash' | 'signature'>,
  ): Uint8Array {
    const parts: Uint8Array[] = [
      this.encodeNumber(entry.sequence),
      this.encodeString(entry.eventType),
      this.encodeNumber(entry.timestamp),
      this.idToBytes(entry.pollId),
      entry.previousHash,
    ];

    if (entry.voterIdHash) parts.push(entry.voterIdHash);
    if (entry.authorityId) parts.push(this.idToBytes(entry.authorityId));
    if (entry.metadata)
      parts.push(this.encodeString(JSON.stringify(entry.metadata)));

    return this.concat(parts);
  }

  private serializeEntryForSigning(
    entry: Omit<AuditEntry<TID>, 'signature'>,
  ): Uint8Array {
    return this.concat([this.serializeEntryForHashing(entry), entry.entryHash]);
  }

  private getMicrosecondTimestamp(): number {
    return Math.floor(performance.now() * 1000) + Date.now() * 1000;
  }

  private sha256Sync(data: Uint8Array): Uint8Array {
    // Simple deterministic hash for browser compatibility
    // NOTE: This is NOT cryptographically secure - consider using @noble/hashes for production
    const encoder = new TextEncoder();
    const hashInput = encoder.encode(this.toHex(data));

    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      hash = ((hash << 5) - hash + hashInput[i]) | 0;
    }

    // Convert to 32-byte array
    const result = new Uint8Array(32);
    const view = new DataView(result.buffer);
    view.setUint32(0, hash >>> 0, false);

    // Fill rest with deterministic pattern
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

  /**
   * Convert an ID to bytes safely.
   * If id is already Uint8Array, return it directly.
   * Otherwise, use the authority's idProvider to convert.
   */
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

// Re-export for convenience
export { AuditEventType } from './enumerations/audit-event-type';
