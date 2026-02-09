import type { PlatformID } from '../../../../interfaces/platform-id';
import type { ThresholdAuditEventType } from '../enumerations/threshold-audit-event-type';

/**
 * Audit log entry for threshold operations.
 */
export interface ThresholdAuditEntry<TID extends PlatformID = Uint8Array> {
  /** Event type */
  readonly eventType: ThresholdAuditEventType;
  /** Timestamp of the event */
  readonly timestamp: number;
  /** Associated poll ID (if applicable) */
  readonly pollId?: TID;
  /** Associated ceremony ID (if applicable) */
  readonly ceremonyId?: string;
  /** Associated Guardian ID (if applicable) */
  readonly guardianId?: TID;
  /** Guardian share index (if applicable) */
  readonly guardianIndex?: number;
  /** Additional metadata */
  readonly metadata: Record<string, string | number | boolean>;
  /** Hash of the previous entry (for chain integrity) */
  readonly previousHash: Uint8Array;
  /** Hash of this entry */
  readonly entryHash: Uint8Array;
  /** Signature of this entry */
  readonly signature: Uint8Array;
}
