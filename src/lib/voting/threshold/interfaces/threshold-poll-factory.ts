import type { IMember } from '../../../../interfaces';
import type { PlatformID } from '../../../../interfaces/platform-id';
import type { VotingMethod } from '../../enumerations';
import type { IPoll } from '../../interfaces/poll';
import type { IThresholdPoll } from './threshold-poll';
import type { ThresholdPollConfig } from './threshold-poll-config';

/**
 * Interface for creating threshold-enabled polls.
 */
export interface IThresholdPollFactory<TID extends PlatformID = Uint8Array> {
  /** Create a threshold-enabled poll */
  createThresholdPoll(
    choices: string[],
    method: VotingMethod,
    authority: IMember<TID>,
    thresholdConfig: ThresholdPollConfig<TID>,
  ): IThresholdPoll<TID>;

  /** Create a standard poll (backward compatible) */
  createStandardPoll(
    choices: string[],
    method: VotingMethod,
    authority: IMember<TID>,
  ): IPoll<TID>;
}
