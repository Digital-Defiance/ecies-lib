import type { Wallet } from '@ethereumjs/wallet';
import type { PrivateKey, PublicKey } from 'paillier-bigint';
import type { EmailString } from '../email-string';
import type { MemberType } from '../enumerations/member-type';
import type { SecureBuffer } from '../secure-buffer';
import type { SecureString } from '../secure-string';
import type { IECIESConstants } from './ecies-consts';
import type { IEncryptedChunk } from './encrypted-chunk';
import type { PlatformBuffer } from './platform-buffer';

/**
 * Generic interface representing a member with cryptographic capabilities.
 * This interface defines the contract for member operations across both
 * ecies-lib (Uint8Array) and node-ecies-lib (Buffer) implementations.
 *
 * @template TBuffer - The buffer type (Uint8Array for browser, Buffer for Node.js)
 * @template TID - The ID type (Uint8Array for browser, Buffer/string/ObjectId for Node.js)
 * @template TSignature - The signature type (SignatureUint8Array for browser, SignatureBuffer for Node.js)
 */
export interface IMember<
  TBuffer extends PlatformBuffer = Uint8Array,
  TID extends string | TBuffer = TBuffer,
  TSignature extends TBuffer = TBuffer,
> {
  // Required properties
  readonly id: TID;
  readonly type: MemberType;
  readonly name: string;
  readonly email: EmailString;
  readonly publicKey: TBuffer;
  readonly creatorId: TID;
  readonly dateCreated: Date;
  readonly dateUpdated: Date;

  // Optional private data properties
  readonly privateKey: SecureBuffer | undefined;
  readonly wallet: Wallet;

  // Optional voting keys (for homomorphic encryption voting systems)
  readonly votingPublicKey?: PublicKey;
  readonly votingPrivateKey?: PrivateKey;

  // State properties
  readonly hasPrivateKey: boolean;
  readonly hasVotingPrivateKey: boolean;

  // Key management methods
  unloadPrivateKey(): void;
  unloadWallet(): void;
  unloadWalletAndPrivateKey(): void;
  loadWallet(mnemonic: SecureString, eciesParams?: IECIESConstants): void;
  loadPrivateKey(privateKey: SecureBuffer): void;

  // Voting key management methods (optional, for systems that need voting)
  loadVotingKeys(
    votingPublicKey: PublicKey,
    votingPrivateKey?: PrivateKey,
  ): void;
  deriveVotingKeys(options?: Record<string, unknown>): Promise<void>;
  unloadVotingPrivateKey(): void;

  // Cryptographic methods
  sign(data: TBuffer): TSignature;
  signData(data: TBuffer): TSignature;
  verify(signature: TSignature, data: TBuffer): boolean;
  verifySignature(
    data: TBuffer,
    signature: TBuffer,
    publicKey: TBuffer,
  ): boolean;

  // Encryption/Decryption methods
  encryptDataStream(
    source: AsyncIterable<TBuffer> | ReadableStream<TBuffer>,
    options?: {
      recipientPublicKey?: TBuffer;
      onProgress?: (progress: {
        bytesProcessed: number;
        chunksProcessed: number;
      }) => void;
      signal?: AbortSignal;
    },
  ): AsyncGenerator<IEncryptedChunk, void, unknown>;

  decryptDataStream(
    source: AsyncIterable<TBuffer> | ReadableStream<TBuffer>,
    options?: {
      onProgress?: (progress: {
        bytesProcessed: number;
        chunksProcessed: number;
      }) => void;
      signal?: AbortSignal;
    },
  ): AsyncGenerator<TBuffer, void, unknown>;

  encryptData(
    data: string | TBuffer,
    recipientPublicKey?: TBuffer,
  ): Promise<TBuffer> | TBuffer;

  decryptData(encryptedData: TBuffer): Promise<TBuffer> | TBuffer;

  // Serialization methods
  toJson(): string;
  dispose(): void;
}
