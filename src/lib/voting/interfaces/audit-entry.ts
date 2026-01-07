import type { PlatformID } from '../../../interfaces';
import { AuditEventType } from '../enumerations/audit-event-type';

export interface AuditEntry<TID extends PlatformID> {
  /** Sequence number (monotonically increasing) */
  readonly sequence: number;
  /** Event type */
  readonly eventType: AuditEventType;
  /** Microsecond-precision timestamp */
  readonly timestamp: number;
  /** Poll identifier */
  readonly pollId: TID;
  /** Hash of voter ID (for vote events) */
  readonly voterIdHash?: Uint8Array;
  /** Authority/creator ID (for creation/closure events) */
  readonly authorityId?: TID;
  /** Hash of previous entry (chain integrity) */
  readonly previousHash: Uint8Array;
  /** Hash of this entry's data */
  readonly entryHash: Uint8Array;
  /** Cryptographic signature from authority */
  readonly signature: Uint8Array;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}
