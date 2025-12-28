/**
 * Poll Factory - Convenient poll creation
 * Browser compatible
 */
import { Poll } from './poll-core';
import { VotingMethod, type IMember } from './types';

export class PollFactory {
  /**
   * Create a new poll with specified method
   */
  static create(
    choices: string[],
    method: VotingMethod,
    authority: IMember,
    options?: {
      maxWeight?: bigint;
    },
  ): Poll {
    if (!authority.votingPublicKey) {
      throw new Error('Authority must have voting public key');
    }

    // Generate poll ID
    const id = new Uint8Array(16);
    crypto.getRandomValues(id);

    return new Poll(
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
  static createPlurality(choices: string[], authority: IMember): Poll {
    return this.create(choices, VotingMethod.Plurality, authority);
  }

  /**
   * Create an approval voting poll
   */
  static createApproval(choices: string[], authority: IMember): Poll {
    return this.create(choices, VotingMethod.Approval, authority);
  }

  /**
   * Create a weighted voting poll
   */
  static createWeighted(
    choices: string[],
    authority: IMember,
    maxWeight: bigint,
  ): Poll {
    return this.create(choices, VotingMethod.Weighted, authority, {
      maxWeight,
    });
  }

  /**
   * Create a Borda count poll
   */
  static createBorda(choices: string[], authority: IMember): Poll {
    return this.create(choices, VotingMethod.Borda, authority);
  }

  /**
   * Create a ranked choice (IRV) poll
   */
  static createRankedChoice(choices: string[], authority: IMember): Poll {
    return this.create(choices, VotingMethod.RankedChoice, authority);
  }
}
