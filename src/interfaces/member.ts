import type { Wallet } from '@ethereumjs/wallet';
import type { EmailString } from '../email-string';
import type { MemberType } from '../enumerations/member-type';
import type { SecureBuffer } from '../secure-buffer';
import type { SecureString } from '../secure-string';
import type { SignatureUint8Array } from '../types';
import type { IECIESConstants } from './ecies-consts';
import type { IEncryptedChunk } from './encrypted-chunk';

/**
 * Interface representing a member with cryptographic capabilities.
 * This interface defines the contract for member operations without
 * referencing concrete class implementations.
 */
export interface IMember {
  // Required properties
  readonly id: Uint8Array;
  readonly type: MemberType;
  readonly name: string;
  readonly email: EmailString;
  readonly publicKey: Uint8Array;
  readonly creatorId: Uint8Array;
  readonly dateCreated: Date;
  readonly dateUpdated: Date;

  // Optional private data properties
  readonly privateKey: SecureBuffer | undefined;
  readonly wallet: Wallet;

  // State properties
  readonly hasPrivateKey: boolean;

  // Key management methods
  unloadPrivateKey(): void;
  unloadWallet(): void;
  unloadWalletAndPrivateKey(): void;
  loadWallet(mnemonic: SecureString, eciesParams?: IECIESConstants): void;
  loadPrivateKey(privateKey: SecureBuffer): void;

  // Cryptographic methods
  sign(data: Uint8Array): SignatureUint8Array;
  signData(data: Uint8Array): SignatureUint8Array;
  verify(signature: SignatureUint8Array, data: Uint8Array): boolean;
  verifySignature(
    data: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array,
  ): boolean;

  // Encryption/Decryption methods
  encryptDataStream(
    source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    options?: {
      recipientPublicKey?: Uint8Array;
      onProgress?: (progress: {
        bytesProcessed: number;
        chunksProcessed: number;
      }) => void;
      signal?: AbortSignal;
    },
  ): AsyncGenerator<IEncryptedChunk, void, unknown>;

  decryptDataStream(
    source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    options?: {
      onProgress?: (progress: {
        bytesProcessed: number;
        chunksProcessed: number;
      }) => void;
      signal?: AbortSignal;
    },
  ): AsyncGenerator<Uint8Array, void, unknown>;

  encryptData(
    data: string | Uint8Array,
    recipientPublicKey?: Uint8Array,
  ): Promise<Uint8Array>;

  decryptData(encryptedData: Uint8Array): Promise<Uint8Array>;

  // Serialization methods
  toJson(): string;
  dispose(): void;
}
