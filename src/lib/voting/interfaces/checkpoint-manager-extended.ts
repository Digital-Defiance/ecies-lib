import type { PlatformID } from '../../../interfaces';
import { AggregatedTally } from './aggregated-tally';
import { ICheckpointManager } from './checkpoint-manager';
import { CheckpointMetadata } from './checkpoint-metadata';
import { StateSnapshot } from './state-snapshot';

/**
 * Checkpoint manager interface - implemented in node-ecies-lib
 */
export interface ICheckpointManagerExtended<
  TID extends PlatformID = Uint8Array,
> extends ICheckpointManager<TID> {
  saveCheckpoint(tally: AggregatedTally<TID>): Promise<void>;
  loadLatestCheckpoint(): Promise<StateSnapshot<TID> | null>;
  listCheckpoints(): Promise<CheckpointMetadata[]>;
}
