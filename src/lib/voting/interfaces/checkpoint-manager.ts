import type { PlatformID } from '../../../interfaces';
import { AggregatedTally } from './aggregated-tally';

export interface ICheckpointManager<TID extends PlatformID = Uint8Array> {
  saveCheckpoint(tally: AggregatedTally<TID>): Promise<void>;
  loadLatestCheckpoint(): Promise<unknown | null>;
  listCheckpoints(): Promise<unknown[]>;
}
