import type { PlatformID } from '../../../../interfaces/platform-id';
import type { CeremonyStatus } from '../enumerations/ceremony-status';
import type { CombinedDecryption } from './combined-decryption';
import type { PartialDecryption } from './partial-decryption';

/**
 * A threshold decryption ceremony.
 *
 * Coordinates the collection of partial decryptions from Guardians
 * to reveal an aggregate tally.
 */
export interface Ceremony<TID extends PlatformID = Uint8Array> {
  /** Unique ceremony identifier */
  readonly id: string;
  /** Associated poll ID */
  readonly pollId: TID;
  /** Interval number */
  readonly intervalNumber: number;
  /** Ceremony-specific nonce */
  readonly nonce: Uint8Array;
  /** Encrypted tally to decrypt */
  readonly encryptedTally: bigint[];
  /** Current status */
  status: CeremonyStatus;
  /** Collected partial decryptions (keyed by Guardian index) */
  readonly partials: Map<number, PartialDecryption>;
  /** Start timestamp */
  readonly startedAt: number;
  /** Completion timestamp */
  completedAt?: number;
  /** Result (if completed) */
  result?: CombinedDecryption;
}
