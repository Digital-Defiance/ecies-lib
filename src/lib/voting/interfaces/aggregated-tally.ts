import type { PlatformID } from '../../../interfaces';
import { JurisdictionLevel } from '../enumerations/jurisdictional-level';

export interface AggregatedTally<TID extends PlatformID = Uint8Array> {
  jurisdictionId: TID;
  level: JurisdictionLevel;
  encryptedTallies: bigint[];
  voterCount: number;
  timestamp: number;
  childJurisdictions?: TID[];
}
