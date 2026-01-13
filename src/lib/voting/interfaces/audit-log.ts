/**
 * Audit log interface for voting system audit operations.
 */
import type { PlatformID } from '../../../interfaces';
import { AuditEntry } from './audit-entry';

export interface AuditLog<TID extends PlatformID> {
  /** Get all entries in chronological order */
  getEntries(): readonly AuditEntry<TID>[];
  /** Get entries for a specific poll */
  getEntriesForPoll(pollId: TID): readonly AuditEntry<TID>[];
  /** Verify the entire chain integrity */
  verifyChain(): boolean;
  /** Verify a specific entry's signature */
  verifyEntry(entry: AuditEntry<TID>): boolean;
}
