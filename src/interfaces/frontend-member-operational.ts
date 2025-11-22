import { Wallet } from '@ethereumjs/wallet';
import { EmailString } from '../email-string';
import MemberType from '../enumerations/member-type';
import { SecureBuffer } from '../secure-buffer';
import { SecureString } from '../secure-string';
import { SignatureUint8Array } from '../types';
import { IECIESConstants } from './ecies-consts';
import { IEncryptedChunk } from './encrypted-chunk';
import { ProgressCallback } from './stream-progress';

/**
 * Operational interface for member - defines getters and methods
 */
export interface IFrontendMemberOperational<
  TID = Uint8Array,
  TData = Uint8Array,
  TSignature = SignatureUint8Array,
> {
  // Required getters
  get id(): TID;
  get type(): MemberType;
  get name(): string;
  get email(): EmailString;
  get publicKey(): Uint8Array;
  get creatorId(): TID;
  get dateCreated(): Date;
  get dateUpdated(): Date;

  // Optional private data getters
  get privateKey(): SecureBuffer | undefined;
  get wallet(): Wallet | undefined;

  // State getters
  get hasPrivateKey(): boolean;

  // Methods
  sign(data: TData): TSignature;
  verify(signature: TSignature, data: TData): boolean;
  encryptData(data: string | TData, recipientPublicKey?: Uint8Array): Promise<TData>;
  decryptData(encryptedData: TData): Promise<TData>;
  toJson(): string;
  dispose(): void;

  // Streaming methods
  encryptDataStream(
    source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    options?: {
      recipientPublicKey?: Uint8Array;
      onProgress?: ProgressCallback;
      signal?: AbortSignal;
    }
  ): AsyncGenerator<IEncryptedChunk, void, unknown>;

  decryptDataStream(
    source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    options?: {
      onProgress?: ProgressCallback;
      signal?: AbortSignal;
    }
  ): AsyncGenerator<Uint8Array, void, unknown>;

  // Private key management
  loadWallet(mnemonic: SecureString, eciesParams?: IECIESConstants): void;
  unloadPrivateKey(): void;
  unloadWallet(): void;
  unloadWalletAndPrivateKey(): void;
}

/**
 * Extended operational interface for test members
 */
export interface ITestMemberOperational extends IFrontendMemberOperational {
  get mnemonic(): SecureString | undefined;
}
