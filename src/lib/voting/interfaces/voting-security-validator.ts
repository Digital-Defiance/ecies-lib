import { SecurityLevel, VotingMethod } from '../enumerations';

/**
 * Voting security validator interface.
 * Validates voting methods against security requirements.
 */
export interface IVotingSecurityValidator {
  /**
   * Check if voting method is fully secure (no intermediate decryption).
   * @param method - Voting method to check
   * @returns True if method is fully homomorphic
   */
  isFullySecure(method: VotingMethod): boolean;

  /**
   * Check if voting method requires multiple rounds.
   * @param method - Voting method to check
   * @returns True if method requires intermediate decryption
   */
  requiresMultipleRounds(method: VotingMethod): boolean;

  /**
   * Get security level for voting method.
   * @param method - Voting method to check
   * @returns Security level classification
   */
  getSecurityLevel(method: VotingMethod): SecurityLevel;

  /**
   * Validate voting method against security requirements.
   * Throws error if method doesn't meet requirements.
   * @param method - Voting method to validate
   * @param options - Validation options
   * @throws Error if validation fails
   */
  validate(
    method: VotingMethod,
    options?: {
      requireFullySecure?: boolean;
      allowInsecure?: boolean;
    },
  ): void;
}
