/**
 * Tally proof structure for cryptographic verification of vote counts.
 */
import type { PlatformID } from '../../../interfaces';
export interface TallyProof<TID extends PlatformID = Uint8Array> {
  /** Poll identifier */
  readonly pollId: TID;
  /** Final tallies */
  readonly tallies: bigint[];
  /** Choice names */
  readonly choices: string[];
  /** Timestamp of tally */
  readonly timestamp: number;
  /** Hash of all encrypted votes */
  readonly votesHash: Uint8Array;
  /** Cryptographic proof of correct decryption */
  readonly decryptionProof: Uint8Array;
  /** Authority signature */
  readonly signature: Uint8Array;
}
