/**
 * Event Logger for Government-Grade Voting
 * Implements requirement 1.3: Comprehensive event logging with microsecond timestamps
 */
import type { IMember, PlatformID } from '../../interfaces';
import { IIdProvider } from '../../interfaces/id-provider';
import { EventType } from './enumerations/event-type';
import { EventLogEntry } from './interfaces/event-log-entry';
import { EventLogger } from './interfaces/event-logger';
import { PollConfiguration } from './interfaces/poll-configuration';

/**
 * Comprehensive event logger with sequence tracking
 */
export class PollEventLogger<
  TID extends PlatformID = Uint8Array,
> implements EventLogger<TID> {
  private readonly events: EventLogEntry<TID>[] = [];
  private readonly idProvider: IIdProvider<TID>;
  private sequence = 0;

  constructor(idProvider: IIdProvider<TID>) {
    if (!idProvider) {
      throw new Error('PollEventLogger requires an idProvider');
    }
    this.idProvider = idProvider;
  }

  /**
   * Create a PollEventLogger from a Member (uses the member's idProvider)
   */
  static fromMember<TID extends PlatformID>(
    member: IMember<TID>,
  ): PollEventLogger<TID> {
    return new PollEventLogger(member.idProvider);
  }

  logPollCreated(
    pollId: TID,
    creatorId: TID,
    configuration: PollConfiguration,
  ): EventLogEntry<TID> {
    return this.appendEvent({
      eventType: EventType.PollCreated,
      pollId,
      creatorId,
      configuration,
    });
  }

  logVoteCast(
    pollId: TID,
    voterToken: Uint8Array,
    metadata?: Record<string, unknown>,
  ): EventLogEntry<TID> {
    return this.appendEvent({
      eventType: EventType.VoteCast,
      pollId,
      voterToken,
      metadata,
    });
  }

  logPollClosed(
    pollId: TID,
    tallyHash: Uint8Array,
    metadata?: Record<string, unknown>,
  ): EventLogEntry<TID> {
    return this.appendEvent({
      eventType: EventType.PollClosed,
      pollId,
      tallyHash,
      metadata,
    });
  }

  logEvent(
    eventType: EventType,
    pollId: TID,
    data?: Partial<
      Omit<
        EventLogEntry<TID>,
        'sequence' | 'timestamp' | 'eventType' | 'pollId'
      >
    >,
  ): EventLogEntry<TID> {
    return this.appendEvent({
      eventType,
      pollId,
      ...data,
    });
  }

  getEvents(): readonly EventLogEntry<TID>[] {
    return Object.freeze([...this.events]);
  }

  getEventsForPoll(pollId: TID): readonly EventLogEntry<TID>[] {
    const pollIdBytes =
      pollId instanceof Uint8Array ? pollId : this.idProvider.toBytes(pollId);
    const pollIdStr = this.toHex(pollIdBytes);
    return Object.freeze(
      this.events.filter((e) => {
        const eventPollIdBytes =
          e.pollId instanceof Uint8Array
            ? e.pollId
            : this.idProvider.toBytes(e.pollId);
        return this.toHex(eventPollIdBytes) === pollIdStr;
      }),
    );
  }

  getEventsByType(eventType: EventType): readonly EventLogEntry<TID>[] {
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
    partial: Omit<EventLogEntry<TID>, 'sequence' | 'timestamp'>,
  ): EventLogEntry<TID> {
    const entry: EventLogEntry<TID> = {
      sequence: this.sequence++,
      timestamp: this.getMicrosecondTimestamp(),
      ...partial,
    };

    this.events.push(entry);
    return entry;
  }

  private serializeEvent(event: EventLogEntry<TID>): Uint8Array {
    const pollIdBytes = this.idProvider.toBytes(event.pollId);
    const creatorIdBytes = event.creatorId
      ? this.idProvider.toBytes(event.creatorId)
      : undefined;
    const parts: Uint8Array[] = [
      this.encodeNumber(event.sequence),
      this.encodeNumber(event.timestamp),
      this.encodeString(event.eventType),
      this.encodeNumber(pollIdBytes.length),
      pollIdBytes,
    ];

    if (creatorIdBytes) {
      parts.push(
        this.encodeNumber(1),
        this.encodeNumber(creatorIdBytes.length),
        creatorIdBytes,
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
    // Get milliseconds since epoch and convert to microseconds
    // performance.now() is relative to process start, not epoch, so we only use Date.now()
    const now = Date.now();
    return now * 1000;
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

// Re-export for convenience
export { EventType } from './enumerations/event-type';
