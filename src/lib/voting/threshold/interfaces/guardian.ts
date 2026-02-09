import type { PlatformID } from '../../../../interfaces/platform-id';
import type { GuardianStatus } from '../enumerations/guardian-status';

/**
 * A Guardian who holds a key share for threshold decryption.
 *
 * Guardians are trusted key holders who participate in decryption
 * ceremonies by providing their partial decryptions.
 */
export interface Guardian<TID extends PlatformID = Uint8Array> {
  /** Unique Guardian identifier */
  readonly id: TID;
  /** Human-readable name */
  readonly name: string;
  /** Guardian's share index (1 to n) */
  readonly shareIndex: number;
  /** Public verification key */
  readonly verificationKey: Uint8Array;
  /** Contact endpoint for ceremony notifications */
  readonly contactEndpoint?: string;
  /** Current availability status */
  status: GuardianStatus;
  /** Backup Guardian ID (if designated) */
  readonly backupGuardianId?: TID;
}
