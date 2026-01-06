/**
 * Poll Factory - Convenient poll creation
 * Browser compatible
 */
import { Constants } from '../../constants';
import { PlatformID } from '../../interfaces';
import { Member } from '../../member';
import { Poll } from './poll-core';
import { VotingMethod } from './types';

export class PollFactory {
  /**
   * Create a new poll with specified method
   */
  static create<TID extends PlatformID>(
    choices: string[],
    method: VotingMethod,
    authority: Member<TID>,
    options?: {
      maxWeight?: bigint;
    },
  ): Poll<TID> {
    if (!authority.votingPublicKey) {
      throw new Error('Authority must have voting public key');
    }

    // Generate poll ID
    const id = Constants.idProvider.generate() as TID;

    return new Poll<TID>(
      id,
      choices,
      method,
      authority,
      authority.votingPublicKey,
      options?.maxWeight,
    );
  }

  /**
   * Create a plurality poll (simple majority)
   */
  static createPlurality<TID extends PlatformID>(
    choices: string[],
    authority: Member<TID>,
  ): Poll<TID> {
    return this.create(choices, VotingMethod.Plurality, authority);
  }

  /**
   * Create an approval voting poll
   */
  static createApproval<TID extends PlatformID>(
    choices: string[],
    authority: Member<TID>,
  ): Poll<TID> {
    return this.create(choices, VotingMethod.Approval, authority);
  }

  /**
   * Create a weighted voting poll
   */
  static createWeighted<TID extends PlatformID>(
    choices: string[],
    authority: Member<TID>,
    maxWeight: bigint,
  ): Poll<TID> {
    return this.create(choices, VotingMethod.Weighted, authority, {
      maxWeight,
    });
  }

  /**
   * Create a Borda count poll
   */
  static createBorda<TID extends PlatformID>(
    choices: string[],
    authority: Member<TID>,
  ): Poll<TID> {
    return this.create(choices, VotingMethod.Borda, authority);
  }

  /**
   * Create a ranked choice (IRV) poll
   */
  static createRankedChoice<TID extends PlatformID>(
    choices: string[],
    authority: Member<TID>,
  ): Poll<TID> {
    return this.create(choices, VotingMethod.RankedChoice, authority);
  }
}
