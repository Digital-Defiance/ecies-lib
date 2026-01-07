import type { PlatformID } from '../../../interfaces';
import { EventType } from '../enumerations/event-type';
import { PollConfiguration } from './poll-configuration';

export interface EventLogEntry<TID extends PlatformID = Uint8Array> {
  /** Sequence number (monotonically increasing) */
  readonly sequence: number;
  /** Event type */
  readonly eventType: EventType;
  /** Microsecond-precision timestamp */
  readonly timestamp: number;
  /** Poll identifier */
  readonly pollId: TID;
  /** Creator/authority ID (for creation/closure events) */
  readonly creatorId?: TID;
  /** Anonymized voter token (for vote events) */
  readonly voterToken?: Uint8Array;
  /** Poll configuration (for creation events) */
  readonly configuration?: PollConfiguration;
  /** Final tally hash (for closure events) */
  readonly tallyHash?: Uint8Array;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}
