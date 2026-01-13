/**
 * Event logger interface for recording voting system events.
 */
import type { PlatformID } from '../../../interfaces';
import { EventType } from '../enumerations/event-type';
import { EventLogEntry } from './event-log-entry';
import { PollConfiguration } from './poll-configuration';

export interface EventLogger<TID extends PlatformID = Uint8Array> {
  /** Log poll creation event */
  logPollCreated(
    pollId: TID,
    creatorId: TID,
    configuration: PollConfiguration,
  ): EventLogEntry<TID>;

  /** Log vote cast event */
  logVoteCast(
    pollId: TID,
    voterToken: Uint8Array,
    metadata?: Record<string, unknown>,
  ): EventLogEntry<TID>;

  /** Log poll closure event */
  logPollClosed(
    pollId: TID,
    tallyHash: Uint8Array,
    metadata?: Record<string, unknown>,
  ): EventLogEntry<TID>;

  /** Log generic event */
  logEvent(
    eventType: EventType,
    pollId: TID,
    data?: Partial<
      Omit<
        EventLogEntry<TID>,
        'sequence' | 'timestamp' | 'eventType' | 'pollId'
      >
    >,
  ): EventLogEntry<TID>;
  /** Get all events */
  getEvents(): readonly EventLogEntry<TID>[];

  /** Get events for specific poll */
  getEventsForPoll(pollId: TID): readonly EventLogEntry<TID>[];

  /** Get events by type */
  getEventsByType(eventType: EventType): readonly EventLogEntry<TID>[];

  /** Verify sequence integrity */
  verifySequence(): boolean;

  /** Export events for archival */
  export(): Uint8Array;
}
