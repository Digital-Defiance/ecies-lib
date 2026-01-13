import { Wallet } from '@ethereumjs/wallet';
import { faker } from '@faker-js/faker';
import { ObjectId } from 'bson';
import {
  EmailString,
  IMember,
  MemberType,
  SecureBuffer,
  SecureString,
} from '@digitaldefiance/ecies-lib';
import { Constants } from '../constants';
import { IIdProvider } from '../interfaces/id-provider';
import { SignatureUint8Array } from '../types';

const hexToUint8Array = (hex: string): Uint8Array => {
  const clean = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
};

const createMockWallet = (): Wallet =>
  ({
    getPrivateKey: () =>
      hexToUint8Array(faker.string.hexadecimal({ length: 64 })),
    getPublicKey: () =>
      hexToUint8Array(faker.string.hexadecimal({ length: 128 })),
    getAddress: () => hexToUint8Array(faker.string.hexadecimal({ length: 40 })),
    sign: () => hexToUint8Array(faker.string.hexadecimal({ length: 128 })),
  }) as unknown as Wallet;

/**
 * Mock implementation of IMember for frontend testing.
 * Generates fake member data using faker.js.
 */
export class MockFrontendMember implements IMember<ObjectId> {
  private _id: ObjectId;
  private _type: MemberType;
  private _name: string;
  private _email: EmailString;
  private _publicKey: Uint8Array;
  private _creatorId: ObjectId;
  private _dateCreated: Date;
  private _dateUpdated: Date;
  private _privateKey?: SecureBuffer;
  private _wallet?: Wallet;
  private _hasPrivateKey: boolean;

  /**
   * Create a new mock frontend member.
   * @param data Optional partial data to override defaults
   */
  constructor(
    data: Partial<{
      id: ObjectId;
      type: MemberType;
      name: string;
      email: EmailString;
      publicKey: Uint8Array;
      privateKey: SecureBuffer;
      wallet: Wallet;
      creatorId: ObjectId;
      dateCreated: Date;
      dateUpdated: Date;
      hasPrivateKey: boolean;
    }> = {},
  ) {
    this._id = data.id || new ObjectId();
    this._type = data.type || faker.helpers.enumValue(MemberType);
    this._name = data.name || faker.person.fullName();
    this._email = data.email || new EmailString(faker.internet.email());
    this._publicKey =
      data.publicKey ||
      hexToUint8Array(faker.string.hexadecimal({ length: 130 }));
    this._creatorId = data.creatorId || this._id;
    this._dateCreated = data.dateCreated || faker.date.past();
    this._dateUpdated =
      data.dateUpdated ||
      faker.date.between({ from: this._dateCreated, to: new Date() });
    this._privateKey = data.privateKey;
    this._wallet =
      data.wallet ||
      (data.hasPrivateKey !== false ? createMockWallet() : undefined);
    this._hasPrivateKey = data.hasPrivateKey ?? !!this._privateKey;
  }

  /** Get member ID */
  get id(): ObjectId {
    return this._id;
  }
  /** Get member ID as bytes */
  get idBytes(): Uint8Array {
    return new Uint8Array(
      this._id
        .toHexString()
        .match(/.{1,2}/g)!
        .map((byte) => parseInt(byte, 16)),
    );
  }
  /** Get member type */
  get type(): MemberType {
    return this._type;
  }
  /** Get member name */
  get name(): string {
    return this._name;
  }
  /** Get member email */
  get email(): EmailString {
    return this._email;
  }
  /** Get public key */
  get publicKey(): Uint8Array {
    return this._publicKey;
  }
  /** Get creator ID */
  get creatorId(): ObjectId {
    return this._creatorId;
  }
  /** Get creation date */
  get dateCreated(): Date {
    return this._dateCreated;
  }
  /** Get last update date */
  get dateUpdated(): Date {
    return this._dateUpdated;
  }
  /** Get private key (if loaded) */
  get privateKey(): SecureBuffer | undefined {
    return this._privateKey;
  }
  /** Get wallet (throws if not available) */
  get wallet(): Wallet {
    if (!this._wallet) {
      throw new Error('Wallet not available');
    }
    return this._wallet;
  }

  /** Get wallet (returns undefined if not available) */
  get walletOptional(): Wallet | undefined {
    return this._wallet;
  }
  /** Check if private key is loaded */
  get hasPrivateKey(): boolean {
    return this._hasPrivateKey;
  }
  /** Check if voting private key is loaded (always false for mock) */
  get hasVotingPrivateKey(): boolean {
    return false; // Mock doesn't support voting keys
  }
  /** Get voting public key (always undefined for mock) */
  get votingPublicKey(): undefined {
    return undefined;
  }
  /** Get voting private key (always undefined for mock) */
  get votingPrivateKey(): undefined {
    return undefined;
  }
  /** Get ID provider */
  get idProvider(): IIdProvider<ObjectId> {
    return Constants.idProvider as IIdProvider<ObjectId>;
  }

  /** Unload private key (no-op for mock) */
  unloadPrivateKey(): void {}

  /** Unload wallet (no-op for mock) */
  unloadWallet(): void {}

  /** Unload wallet and private key (no-op for mock) */
  unloadWalletAndPrivateKey(): void {}

  /** Load wallet from mnemonic (no-op for mock) */
  loadWallet(_mnemonic: SecureString): void {}

  /** Load private key (no-op for mock) */
  loadPrivateKey(_privateKey: SecureBuffer): void {}

  /** Load voting keys (no-op for mock) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadVotingKeys(_votingPublicKey: any, _votingPrivateKey?: any): void {}

  /** Derive voting keys (no-op for mock) */
  async deriveVotingKeys(_options?: Record<string, unknown>): Promise<void> {}

  /** Unload voting private key (no-op for mock) */
  unloadVotingPrivateKey(): void {}

  /**
   * Sign data.
   * @param data Data to sign
   * @returns Mock signature
   */
  signData(data: Uint8Array): SignatureUint8Array {
    return this.sign(data);
  }

  /**
   * Verify signature (always returns true for mock).
   * @returns Always true
   */
  verifySignature(
    _data: Uint8Array,
    _signature: Uint8Array,
    _publicKey: Uint8Array,
  ): boolean {
    return true;
  }

  /**
   * Sign data.
   * @returns Mock signature
   */
  sign(_data: Uint8Array): SignatureUint8Array {
    return hexToUint8Array(
      faker.string.hexadecimal({ length: 128 }),
    ) as SignatureUint8Array;
  }

  /**
   * Verify signature (always returns true for mock).
   * @returns Always true
   */
  verify(_signature: SignatureUint8Array, _data: Uint8Array): boolean {
    return true;
  }

  /**
   * Encrypt data.
   * @returns Mock encrypted data
   */
  async encryptData(_data: string | Uint8Array): Promise<Uint8Array> {
    return hexToUint8Array(faker.string.hexadecimal({ length: 256 }));
  }

  /**
   * Decrypt data.
   * @returns Mock decrypted data
   */
  async decryptData(_encryptedData: Uint8Array): Promise<Uint8Array> {
    const text = faker.lorem.paragraph();
    return new TextEncoder().encode(text);
  }

  /**
   * Encrypt data stream.
   * @param source Source data stream
   * @returns Mock encrypted chunks
   */
  async *encryptDataStream(
    source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    _options?: {
      recipientPublicKey?: Uint8Array;
      onProgress?: (progress: {
        bytesProcessed: number;
        chunksProcessed: number;
      }) => void;
      signal?: AbortSignal;
    },
  ): AsyncGenerator<
    import('../interfaces/encrypted-chunk').IEncryptedChunk,
    void,
    unknown
  > {
    // Mock implementation
    const chunks = [];
    if ('getReader' in source) {
      const reader = (source as ReadableStream<Uint8Array>).getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      for await (const chunk of source as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
    }
    let index = 0;
    for (const chunk of chunks) {
      yield {
        index: index++,
        data: hexToUint8Array(
          faker.string.hexadecimal({ length: chunk.length * 2 }),
        ),
        isLast: index === chunks.length,
        metadata: {
          originalSize: chunk.length,
          encryptedSize: chunk.length * 2,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Decrypt data stream.
   * @param source Source encrypted stream
   * @returns Mock decrypted chunks
   */
  async *decryptDataStream(
    source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    _options?: {
      onProgress?: (progress: {
        bytesProcessed: number;
        chunksProcessed: number;
      }) => void;
      signal?: AbortSignal;
    },
  ): AsyncGenerator<Uint8Array, void, unknown> {
    // Mock implementation
    if ('getReader' in source) {
      const reader = (source as ReadableStream<Uint8Array>).getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      for await (const chunk of source as AsyncIterable<Uint8Array>) {
        yield chunk;
      }
    }
  }

  /**
   * Convert member to JSON string.
   * @returns JSON representation
   */
  toJson(): string {
    return JSON.stringify({
      id: this._id.toString(),
      type: this._type,
      name: this._name,
      email: this._email.toString(),
      publicKey: btoa(String.fromCharCode(...this._publicKey)),
      creatorId: this._creatorId.toString(),
      dateCreated: this._dateCreated.toISOString(),
      dateUpdated: this._dateUpdated.toISOString(),
    });
  }

  /** Dispose resources (no-op for mock) */
  dispose(): void {}

  /**
   * Create a mock member with optional overrides.
   * @param overrides Optional property overrides
   * @returns New mock member
   */
  static create(
    overrides: Partial<{
      id: ObjectId;
      type: MemberType;
      name: string;
      email: EmailString;
      publicKey: Uint8Array;
      privateKey: SecureBuffer;
      wallet: Wallet;
      creatorId: ObjectId;
      dateCreated: Date;
      dateUpdated: Date;
      hasPrivateKey: boolean;
    }> = {},
  ): MockFrontendMember {
    return new MockFrontendMember(overrides);
  }

  /**
   * Create multiple mock members.
   * @param count Number of members to create
   * @returns Array of mock members
   */
  static createMultiple(count: number): MockFrontendMember[] {
    return Array.from({ length: count }, () => this.create());
  }

  /**
   * Create a mock member with private key loaded.
   * @returns Mock member with private key
   */
  static createWithPrivateKey(): MockFrontendMember {
    return new MockFrontendMember({
      privateKey: new SecureBuffer(
        hexToUint8Array(faker.string.hexadecimal({ length: 64 })),
      ),
      hasPrivateKey: true,
    });
  }

  /**
   * Create a mock member without private key.
   * @returns Mock member without private key
   */
  static createWithoutPrivateKey(): MockFrontendMember {
    return new MockFrontendMember({
      privateKey: undefined,
      hasPrivateKey: false,
    });
  }
}
