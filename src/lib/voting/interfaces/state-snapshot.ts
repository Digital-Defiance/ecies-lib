import type { PlatformID } from '../../../interfaces';
import { AggregatedTally } from './aggregated-tally';
import { CheckpointMetadata } from './checkpoint-metadata';

export interface StateSnapshot<TID extends PlatformID = Uint8Array> {
  metadata: CheckpointMetadata;
  tally: AggregatedTally<TID>;
  voteLog: Uint8Array;
}
