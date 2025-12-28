import { Wallet } from '@ethereumjs/wallet';
import { faker } from '@faker-js/faker';
import { ObjectId } from 'bson';
import {
  EmailString,
  MemberType,
  SecureBuffer,
  SecureString,
} from '@digitaldefiance/ecies-lib';
import type { IFrontendMemberOperational } from '../interfaces/frontend-member-operational';
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

export class MockFrontendMember implements IFrontendMemberOperational<ObjectId> {
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

  get id(): ObjectId {
    return this._id;
  }
  get type(): MemberType {
    return this._type;
  }
  get name(): string {
    return this._name;
  }
  get email(): EmailString {
    return this._email;
  }
  get publicKey(): Uint8Array {
    return this._publicKey;
  }
  get creatorId(): ObjectId {
    return this._creatorId;
  }
  get dateCreated(): Date {
    return this._dateCreated;
  }
  get dateUpdated(): Date {
    return this._dateUpdated;
  }
  get privateKey(): SecureBuffer | undefined {
    return this._privateKey;
  }
  get wallet(): Wallet | undefined {
    return this._wallet;
  }
  get hasPrivateKey(): boolean {
    return this._hasPrivateKey;
  }

  unloadPrivateKey(): void {}

  unloadWallet(): void {}

  unloadWalletAndPrivateKey(): void {}

  loadWallet(_mnemonic: SecureString): void {}

  loadPrivateKey(_privateKey: SecureBuffer): void {}

  sign(_data: Uint8Array): SignatureUint8Array {
    return hexToUint8Array(
      faker.string.hexadecimal({ length: 128 }),
    ) as SignatureUint8Array;
  }

  verify(_signature: SignatureUint8Array, _data: Uint8Array): boolean {
    return true;
  }

  async encryptData(_data: string | Uint8Array): Promise<Uint8Array> {
    return hexToUint8Array(faker.string.hexadecimal({ length: 256 }));
  }

  async decryptData(_encryptedData: Uint8Array): Promise<Uint8Array> {
    const text = faker.lorem.paragraph();
    return new TextEncoder().encode(text);
  }

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

  dispose(): void {}

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

  static createMultiple(count: number): MockFrontendMember[] {
    return Array.from({ length: count }, () => this.create());
  }

  static createWithPrivateKey(): MockFrontendMember {
    return new MockFrontendMember({
      privateKey: new SecureBuffer(
        hexToUint8Array(faker.string.hexadecimal({ length: 64 })),
      ),
      hasPrivateKey: true,
    });
  }

  static createWithoutPrivateKey(): MockFrontendMember {
    return new MockFrontendMember({
      privateKey: undefined,
      hasPrivateKey: false,
    });
  }
}
