import type { Wallet } from '@ethereumjs/wallet';
import type { PrivateKey, PublicKey } from 'paillier-bigint';
import type { EmailString } from '../email-string';
import type { MemberType } from '../enumerations/member-type';
import type { SecureBuffer } from '../secure-buffer';
import type { SecureString } from '../secure-string';
import type { IECIESConstants } from './ecies-consts';
import type { IEncryptedChunk } from './encrypted-chunk';
import type { PlatformID } from './platform-id';

/**
 * Generic interface representing a member with cryptographic capabilities.
 * This interface defines the contract for member operations across both
 * ecies-lib (Uint8Array) and node-ecies-lib (Uint8Array) implementations.
 *
 * @template Uint8Array - The Uint8Array type (Uint8Array for browser, Uint8Array for Node.js)
 * @template TID - The ID type (Uint8Array for browser, Uint8Array/string/ObjectId for Node.js)
 * @template TSignature - The signature type (SignatureUint8Array for browser, SignatureUint8Array for Node.js)
 */
export interface IMember<
  TID extends PlatformID = Uint8Array,
  TSignature extends Uint8Array = Uint8Array,
> {
  // Required properties
  readonly id: TID;
  readonly idBytes: Uint8Array; // Canonical storage format for crypto operations
  readonly type: MemberType;
  readonly name: string;
  readonly email: EmailString;
  readonly publicKey: Uint8Array;
  readonly creatorId: TID;
  readonly dateCreated: Date;
  readonly dateUpdated: Date;

  // Optional private data properties
  readonly privateKey: SecureBuffer | undefined;
  readonly wallet: Wallet;
  
  // Optional wallet getter for compatibility
  get walletOptional(): Wallet | undefined;

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
  sign(data: Uint8Array): TSignature;
  signData(data: Uint8Array): TSignature;
  verify(signature: TSignature, data: Uint8Array): boolean;
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
  ): Promise<Uint8Array> | Uint8Array;

  decryptData(encryptedData: Uint8Array): Promise<Uint8Array> | Uint8Array;

  // Serialization methods
  toJson(): string;
  dispose(): void;
}
