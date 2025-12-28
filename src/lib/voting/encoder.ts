/**
 * Vote Encoder - Encrypts votes using Paillier homomorphic encryption
 * Browser compatible
 */
import type { PublicKey } from 'paillier-bigint';
import { VotingMethod, type EncryptedVote } from './types';

export class VoteEncoder {
  constructor(private readonly votingPublicKey: PublicKey) {}

  /**
   * Encode a plurality vote (single choice)
   */
  encodePlurality(choiceIndex: number, choiceCount: number): EncryptedVote {
    const encrypted: bigint[] = [];

    for (let i = 0; i < choiceCount; i++) {
      // Only encrypt 1 for selected choice, 0 for others
      encrypted.push(
        i === choiceIndex
          ? this.votingPublicKey.encrypt(1n)
          : this.votingPublicKey.encrypt(0n),
      );
    }

    return {
      choiceIndex,
      encrypted,
    };
  }

  /**
   * Encode an approval vote (multiple choices)
   */
  encodeApproval(choices: number[], choiceCount: number): EncryptedVote {
    const choiceSet = new Set(choices);
    const encrypted: bigint[] = [];

    for (let i = 0; i < choiceCount; i++) {
      encrypted.push(
        choiceSet.has(i)
          ? this.votingPublicKey.encrypt(1n)
          : this.votingPublicKey.encrypt(0n),
      );
    }

    return {
      choices,
      encrypted,
    };
  }

  /**
   * Encode a weighted vote
   */
  encodeWeighted(
    choiceIndex: number,
    weight: bigint,
    choiceCount: number,
  ): EncryptedVote {
    const encrypted: bigint[] = [];

    for (let i = 0; i < choiceCount; i++) {
      encrypted.push(
        i === choiceIndex
          ? this.votingPublicKey.encrypt(weight)
          : this.votingPublicKey.encrypt(0n),
      );
    }

    return {
      choiceIndex,
      weight,
      encrypted,
    };
  }

  /**
   * Encode a Borda count vote (ranked with points)
   * First choice gets N points, second gets N-1, etc.
   */
  encodeBorda(rankings: number[], choiceCount: number): EncryptedVote {
    const encrypted: bigint[] = new Array(choiceCount) as bigint[];
    const points = BigInt(rankings.length);

    // Initialize all to 0
    for (let i = 0; i < choiceCount; i++) {
      encrypted[i] = this.votingPublicKey.encrypt(0n) as bigint;
    }

    // Assign points based on ranking
    for (let rank = 0; rank < rankings.length; rank++) {
      const choiceIndex = rankings[rank];
      const choicePoints = points - BigInt(rank);
      encrypted[choiceIndex] = this.votingPublicKey.encrypt(
        choicePoints,
      ) as bigint;
    }

    return {
      rankings,
      encrypted,
    };
  }

  /**
   * Encode a ranked choice vote (for IRV/STV)
   * Stores ranking order, not points
   */
  encodeRankedChoice(rankings: number[], choiceCount: number): EncryptedVote {
    const encrypted: bigint[] = new Array(choiceCount) as bigint[];

    // Initialize all to 0 (not ranked)
    for (let i = 0; i < choiceCount; i++) {
      encrypted[i] = this.votingPublicKey.encrypt(0n) as bigint;
    }

    // Store rank position (1-indexed, 0 means not ranked)
    for (let rank = 0; rank < rankings.length; rank++) {
      const choiceIndex = rankings[rank];
      encrypted[choiceIndex] = this.votingPublicKey.encrypt(
        BigInt(rank + 1),
      ) as bigint;
    }

    return {
      rankings,
      encrypted,
    };
  }

  /**
   * Encode vote based on method
   */
  encode(
    method: VotingMethod,
    data: {
      choiceIndex?: number;
      choices?: number[];
      rankings?: number[];
      weight?: bigint;
    },
    choiceCount: number,
  ): EncryptedVote {
    switch (method) {
      case VotingMethod.Plurality:
        if (data.choiceIndex === undefined) throw new Error('Choice required');
        return this.encodePlurality(data.choiceIndex, choiceCount);

      case VotingMethod.Approval:
        if (!data.choices) throw new Error('Choices required');
        return this.encodeApproval(data.choices, choiceCount);

      case VotingMethod.Weighted:
        if (data.choiceIndex === undefined || !data.weight) {
          throw new Error('Choice and weight required');
        }
        return this.encodeWeighted(data.choiceIndex, data.weight, choiceCount);

      case VotingMethod.Borda:
        if (!data.rankings) throw new Error('Rankings required');
        return this.encodeBorda(data.rankings, choiceCount);

      case VotingMethod.RankedChoice:
        if (!data.rankings) throw new Error('Rankings required');
        return this.encodeRankedChoice(data.rankings, choiceCount);

      case VotingMethod.Quadratic:
        if (data.choiceIndex === undefined || !data.weight) {
          throw new Error('Choice and weight required');
        }
        return this.encodeWeighted(data.choiceIndex, data.weight, choiceCount);

      case VotingMethod.Consensus:
        if (data.choiceIndex === undefined) throw new Error('Choice required');
        return this.encodePlurality(data.choiceIndex, choiceCount);

      case VotingMethod.ConsentBased: {
        if (data.choiceIndex === undefined) throw new Error('Choice required');
        // Encode: 1 = support, 0 = neutral, -1 = strong objection
        const encrypted: bigint[] = [];
        for (let i = 0; i < choiceCount; i++) {
          encrypted.push(
            i === data.choiceIndex
              ? this.votingPublicKey.encrypt(data.weight || 1n)
              : this.votingPublicKey.encrypt(0n),
          );
        }
        return {
          choiceIndex: data.choiceIndex,
          weight: data.weight,
          encrypted,
        };
      }

      default:
        throw new Error('Unknown voting method');
    }
  }
}
