import type { PlatformID } from '../../../interfaces';
import { VotingMethod } from '../enumerations';
import { EncryptedVote } from './encrypted-vote';

/**
 * Vote encoder interface for encrypting votes.
 * Converts vote choices into encrypted Paillier ciphertexts.
 */
export interface IVoteEncoder<TID extends PlatformID = Uint8Array> {
  /**
   * Encode a plurality vote (single choice).
   * @param choiceIndex - Index of chosen option
   * @param choiceCount - Total number of choices
   * @returns Encrypted vote
   */
  encodePlurality(choiceIndex: number, choiceCount: number): EncryptedVote<TID>;
  /**
   * Encode an approval vote (multiple choices).
   * @param choices - Indices of approved options
   * @param choiceCount - Total number of choices
   * @returns Encrypted vote
   */
  encodeApproval(choices: number[], choiceCount: number): EncryptedVote<TID>;
  /**
   * Encode a weighted vote.
   * @param choiceIndex - Index of chosen option
   * @param weight - Vote weight (must be positive)
   * @param choiceCount - Total number of choices
   * @returns Encrypted vote
   */
  encodeWeighted(
    choiceIndex: number,
    weight: bigint,
    choiceCount: number,
  ): EncryptedVote<TID>;
  /**
   * Encode a Borda count vote (ranked with points).
   * @param rankings - Indices in preference order
   * @param choiceCount - Total number of choices
   * @returns Encrypted vote
   */
  encodeBorda(rankings: number[], choiceCount: number): EncryptedVote<TID>;
  /**
   * Encode a ranked choice vote (for IRV).
   * @param rankings - Indices in preference order
   * @param choiceCount - Total number of choices
   * @returns Encrypted vote
   */
  encodeRankedChoice(
    rankings: number[],
    choiceCount: number,
  ): EncryptedVote<TID>;
  /**
   * Encode vote based on method.
   * @param method - Voting method
   * @param data - Vote data
   * @param choiceCount - Total number of choices
   * @returns Encrypted vote
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
  ): EncryptedVote<TID>;
}
