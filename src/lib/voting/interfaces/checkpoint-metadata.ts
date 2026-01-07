import { JurisdictionLevel } from '../enumerations';

export interface CheckpointMetadata {
  jurisdictionId: string;
  level: JurisdictionLevel;
  voterCount: number;
  timestamp: number;
  checkpointNumber: number;
}
