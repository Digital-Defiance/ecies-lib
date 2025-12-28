/**
 * Voting Security Validator
 * Enforces cryptographic security requirements
 */
import { VotingMethod } from './types';

export enum SecurityLevel {
  FullyHomomorphic = 'fully-homomorphic', // No intermediate decryption
  MultiRound = 'multi-round', // Requires intermediate decryption
  Insecure = 'insecure', // Cannot be made secure with Paillier
}

export const VOTING_SECURITY: Record<VotingMethod, SecurityLevel> = {
  [VotingMethod.Plurality]: SecurityLevel.FullyHomomorphic,
  [VotingMethod.Approval]: SecurityLevel.FullyHomomorphic,
  [VotingMethod.Weighted]: SecurityLevel.FullyHomomorphic,
  [VotingMethod.Borda]: SecurityLevel.FullyHomomorphic,
  [VotingMethod.Score]: SecurityLevel.FullyHomomorphic,
  [VotingMethod.YesNo]: SecurityLevel.FullyHomomorphic,
  [VotingMethod.YesNoAbstain]: SecurityLevel.FullyHomomorphic,
  [VotingMethod.Supermajority]: SecurityLevel.FullyHomomorphic,
  [VotingMethod.RankedChoice]: SecurityLevel.MultiRound,
  [VotingMethod.TwoRound]: SecurityLevel.MultiRound,
  [VotingMethod.STAR]: SecurityLevel.MultiRound,
  [VotingMethod.STV]: SecurityLevel.MultiRound,
  [VotingMethod.Quadratic]: SecurityLevel.Insecure,
  [VotingMethod.Consensus]: SecurityLevel.Insecure,
  [VotingMethod.ConsentBased]: SecurityLevel.Insecure,
};

export class VotingSecurityValidator {
  /**
   * Check if voting method is fully secure (no intermediate decryption)
   */
  static isFullySecure(method: VotingMethod): boolean {
    return VOTING_SECURITY[method] === SecurityLevel.FullyHomomorphic;
  }

  /**
   * Check if voting method requires multiple rounds
   */
  static requiresMultipleRounds(method: VotingMethod): boolean {
    return VOTING_SECURITY[method] === SecurityLevel.MultiRound;
  }

  /**
   * Get security level for method
   */
  static getSecurityLevel(method: VotingMethod): SecurityLevel {
    return VOTING_SECURITY[method];
  }

  /**
   * Validate method is supported and secure
   */
  static validate(
    method: VotingMethod,
    options?: {
      requireFullySecure?: boolean;
      allowInsecure?: boolean;
    },
  ): void {
    const level = VOTING_SECURITY[method];

    if (level === SecurityLevel.Insecure && !options?.allowInsecure) {
      throw new Error(
        `Voting method ${method} is not cryptographically secure with Paillier. ` +
          `Set allowInsecure: true to use anyway (NOT RECOMMENDED).`,
      );
    }

    if (
      options?.requireFullySecure &&
      level !== SecurityLevel.FullyHomomorphic
    ) {
      throw new Error(
        `Voting method ${method} requires intermediate decryption. ` +
          `Use a fully homomorphic method for maximum security.`,
      );
    }
  }
}
