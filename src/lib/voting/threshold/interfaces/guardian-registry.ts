import type { PlatformID } from '../../../../interfaces/platform-id';
import type { GuardianStatus } from '../enumerations/guardian-status';
import type { Guardian } from './guardian';
import type { GuardianStatusChangeEvent } from './guardian-status-change-event';

/**
 * Interface for Guardian registration and management.
 */
export interface IGuardianRegistry<TID extends PlatformID = Uint8Array> {
  /** Register a new Guardian */
  register(guardian: Guardian<TID>): void;

  /** Get Guardian by ID */
  getGuardian(id: TID): Guardian<TID> | undefined;

  /** Get Guardian by share index */
  getGuardianByIndex(index: number): Guardian<TID> | undefined;

  /** Get all registered Guardians */
  getAllGuardians(): readonly Guardian<TID>[];

  /** Get online Guardians */
  getOnlineGuardians(): readonly Guardian<TID>[];

  /** Update Guardian status */
  updateStatus(id: TID, status: GuardianStatus): void;

  /** Designate backup Guardian */
  designateBackup(guardianId: TID, backupId: TID): void;

  /** Subscribe to status change events */
  onStatusChange(
    callback: (event: GuardianStatusChangeEvent<TID>) => void,
  ): void;

  /** Get total registered count */
  readonly count: number;
}
