import type { PublicKey } from 'paillier-bigint';
import type { KeyShare } from './key-share';
import type { PartialDecryption } from './partial-decryption';

/**
 * Interface for computing and verifying partial decryptions.
 */
export interface IPartialDecryptionService {
  /** Compute partial decryption for an encrypted tally */
  computePartial(
    encryptedTally: bigint[],
    keyShare: KeyShare,
    ceremonyNonce: Uint8Array,
  ): PartialDecryption;

  /** Verify a partial decryption's ZK proof */
  verifyPartial(
    partial: PartialDecryption,
    encryptedTally: bigint[],
    verificationKey: Uint8Array,
    publicKey: PublicKey,
  ): boolean;

  /** Serialize partial decryption for transmission */
  serialize(partial: PartialDecryption): Uint8Array;

  /** Deserialize partial decryption */
  deserialize(data: Uint8Array): PartialDecryption;
}
