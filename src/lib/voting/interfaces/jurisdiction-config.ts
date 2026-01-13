/**
 * Jurisdiction configuration structure for hierarchical voting.
 */
import type { PlatformID } from '../../../interfaces';
import { JurisdictionLevel } from '../enumerations/jurisdictional-level';

export interface JurisdictionConfig<TID extends PlatformID = Uint8Array> {
  id: TID;
  name: string;
  level: JurisdictionLevel;
  parentId?: TID;
}
