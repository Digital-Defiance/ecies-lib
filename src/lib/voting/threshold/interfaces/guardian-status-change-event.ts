import type { PlatformID } from '../../../../interfaces/platform-id';
import type { GuardianStatus } from '../enumerations/guardian-status';

/**
 * Event emitted when a Guardian's status changes.
 */
export interface GuardianStatusChangeEvent<
  TID extends PlatformID = Uint8Array,
> {
  /** Guardian whose status changed */
  readonly guardianId: TID;
  /** Previous status */
  readonly previousStatus: GuardianStatus;
  /** New status */
  readonly newStatus: GuardianStatus;
  /** Timestamp of the change */
  readonly timestamp: number;
}
