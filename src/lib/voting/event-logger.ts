/**
 * Event Logger for Government-Grade Voting
 * Implements requirement 1.3: Comprehensive event logging with microsecond timestamps
 */
import type { IMember as _IMember } from './types';

export enum EventType {
  PollCreated = 'poll_created',
  VoteCast = 'vote_cast',
  PollClosed = 'poll_closed',
  VoteVerified = 'vote_verified',
  TallyComputed = 'tally_computed',
  AuditRequested = 'audit_requested',
}

export interface PollConfiguration {
  readonly method: string;
  readonly choices: string[];
  readonly maxWeight?: bigint;
  readonly threshold?: { numerator: number; denominator: number };
}

export interface EventLogEntry {
  /** Sequence number (monotonically increasing) */
  readonly sequence: number;
  /** Event type */
  readonly eventType: EventType;
  /** Microsecond-precision timestamp */
  readonly timestamp: number;
  /** Poll identifier */
  readonly pollId: Uint8Array;
  /** Creator/authority ID (for creation/closure events) */
  readonly creatorId?: Uint8Array;
  /** Anonymized voter token (for vote events) */
  readonly voterToken?: Uint8Array;
  /** Poll configuration (for creation events) */
  readonly configuration?: PollConfiguration;
  /** Final tally hash (for closure events) */
  readonly tallyHash?: Uint8Array;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}

export interface EventLogger {
  /** Log poll creation event */
  logPollCreated(
    pollId: Uint8Array,
    creatorId: Uint8Array,
    configuration: PollConfiguration,
  ): EventLogEntry;

  /** Log vote cast event */
  logVoteCast(
    pollId: Uint8Array,
    voterToken: Uint8Array,
    metadata?: Record<string, unknown>,
  ): EventLogEntry;

  /** Log poll closure event */
  logPollClosed(
    pollId: Uint8Array,
    tallyHash: Uint8Array,
    metadata?: Record<string, unknown>,
  ): EventLogEntry;

  /** Log generic event */
  logEvent(
    eventType: EventType,
    pollId: Uint8Array,
    data?: Partial<
      Omit<EventLogEntry, 'sequence' | 'timestamp' | 'eventType' | 'pollId'>
    >,
  ): EventLogEntry;

  /** Get all events */
  getEvents(): readonly EventLogEntry[];

  /** Get events for specific poll */
  getEventsForPoll(pollId: Uint8Array): readonly EventLogEntry[];

  /** Get events by type */
  getEventsByType(eventType: EventType): readonly EventLogEntry[];

  /** Verify sequence integrity */
  verifySequence(): boolean;

  /** Export events for archival */
  export(): Uint8Array;
}

/**
 * Comprehensive event logger with sequence tracking
 */
export class PollEventLogger implements EventLogger {
  private readonly events: EventLogEntry[] = [];
  private sequence = 0;

  logPollCreated(
    pollId: Uint8Array,
    creatorId: Uint8Array,
    configuration: PollConfiguration,
  ): EventLogEntry {
    return this.appendEvent({
      eventType: EventType.PollCreated,
      pollId,
      creatorId,
      configuration,
    });
  }

  logVoteCast(
    pollId: Uint8Array,
    voterToken: Uint8Array,
    metadata?: Record<string, unknown>,
  ): EventLogEntry {
    return this.appendEvent({
      eventType: EventType.VoteCast,
      pollId,
      voterToken,
      metadata,
    });
  }

  logPollClosed(
    pollId: Uint8Array,
    tallyHash: Uint8Array,
    metadata?: Record<string, unknown>,
  ): EventLogEntry {
    return this.appendEvent({
      eventType: EventType.PollClosed,
      pollId,
      tallyHash,
      metadata,
    });
  }

  logEvent(
    eventType: EventType,
    pollId: Uint8Array,
    data?: Partial<
      Omit<EventLogEntry, 'sequence' | 'timestamp' | 'eventType' | 'pollId'>
    >,
  ): EventLogEntry {
    return this.appendEvent({
      eventType,
      pollId,
      ...data,
    });
  }

  getEvents(): readonly EventLogEntry[] {
    return Object.freeze([...this.events]);
  }

  getEventsForPoll(pollId: Uint8Array): readonly EventLogEntry[] {
    const pollIdStr = this.toHex(pollId);
    return Object.freeze(
      this.events.filter((e) => this.toHex(e.pollId) === pollIdStr),
    );
  }

  getEventsByType(eventType: EventType): readonly EventLogEntry[] {
    return Object.freeze(this.events.filter((e) => e.eventType === eventType));
  }

  verifySequence(): boolean {
    for (let i = 0; i < this.events.length; i++) {
      if (this.events[i].sequence !== i) {
        return false;
      }
    }
    return true;
  }

  export(): Uint8Array {
    const parts: Uint8Array[] = [];

    parts.push(this.encodeNumber(this.events.length));

    for (const event of this.events) {
      parts.push(this.serializeEvent(event));
    }

    return this.concat(parts);
  }

  private appendEvent(
    partial: Omit<EventLogEntry, 'sequence' | 'timestamp'>,
  ): EventLogEntry {
    const entry: EventLogEntry = {
      sequence: this.sequence++,
      timestamp: this.getMicrosecondTimestamp(),
      ...partial,
    };

    this.events.push(entry);
    return entry;
  }

  private serializeEvent(event: EventLogEntry): Uint8Array {
    const parts: Uint8Array[] = [
      this.encodeNumber(event.sequence),
      this.encodeNumber(event.timestamp),
      this.encodeString(event.eventType),
      this.encodeNumber(event.pollId.length),
      event.pollId,
    ];

    if (event.creatorId) {
      parts.push(
        this.encodeNumber(1),
        this.encodeNumber(event.creatorId.length),
        event.creatorId,
      );
    } else {
      parts.push(this.encodeNumber(0));
    }

    if (event.voterToken) {
      parts.push(
        this.encodeNumber(1),
        this.encodeNumber(event.voterToken.length),
        event.voterToken,
      );
    } else {
      parts.push(this.encodeNumber(0));
    }

    if (event.configuration) {
      const configStr = JSON.stringify({
        method: event.configuration.method,
        choices: event.configuration.choices,
        maxWeight: event.configuration.maxWeight?.toString(),
        threshold: event.configuration.threshold,
      });
      const encoded = this.encodeString(configStr);
      parts.push(
        this.encodeNumber(1),
        this.encodeNumber(encoded.length),
        encoded,
      );
    } else {
      parts.push(this.encodeNumber(0));
    }

    if (event.tallyHash) {
      parts.push(
        this.encodeNumber(1),
        this.encodeNumber(event.tallyHash.length),
        event.tallyHash,
      );
    } else {
      parts.push(this.encodeNumber(0));
    }

    if (event.metadata) {
      const metaStr = JSON.stringify(event.metadata);
      const encoded = this.encodeString(metaStr);
      parts.push(
        this.encodeNumber(1),
        this.encodeNumber(encoded.length),
        encoded,
      );
    } else {
      parts.push(this.encodeNumber(0));
    }

    return this.concat(parts);
  }

  private getMicrosecondTimestamp(): number {
    return Math.floor(performance.now() * 1000) + Date.now() * 1000;
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

  private toHex(arr: Uint8Array): string {
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
