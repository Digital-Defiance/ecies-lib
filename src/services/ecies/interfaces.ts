/**
 * Browser-compatible ECIES interfaces
 */

import { Wallet } from '@ethereumjs/wallet';
import { EciesEncryptionTypeEnum } from '../../enumerations/ecies-encryption-type';
import type { PlatformID } from '../../interfaces';

export interface ISimpleKeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

export interface IWalletSeed {
  wallet: Wallet;
  seed: Uint8Array;
}

export interface ISingleEncryptedParsedHeader {
  preamble?: Uint8Array;
  encryptionType: EciesEncryptionTypeEnum;
  ephemeralPublicKey: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
  dataLength: number;
  headerSize: number;
}

export interface IEncryptionResult<TID extends PlatformID = Uint8Array> {
  encryptedData: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  iv: TID;
  authTag: Uint8Array;
}

export interface IDecryptionResult {
  decrypted: Uint8Array;
  consumedBytes: number;
}

export interface IMultiRecipient<TID extends PlatformID = Uint8Array> {
  id: TID;
  publicKey: Uint8Array;
}

export interface IMultiEncryptedMessage<TID extends PlatformID = Uint8Array> {
  dataLength: number;
  recipientCount: number;
  recipientIds: TID[];
  recipientKeys: Uint8Array[];
  encryptedMessage: Uint8Array;
  headerSize: number;
  ephemeralPublicKey?: Uint8Array; // Added for shared ephemeral key optimization
}

export interface IMultiEncryptedParsedHeader<TID> {
  dataLength: number;
  recipientCount: number;
  recipientIds: TID[];
  recipientKeys: Uint8Array[];
  headerSize: number;
  ephemeralPublicKey?: Uint8Array; // Added for shared ephemeral key optimization
}
