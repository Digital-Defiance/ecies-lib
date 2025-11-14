import { Wallet } from '@ethereumjs/wallet';
import { ObjectId } from 'bson';
import { ECIES } from './constants';
import { EmailString } from './email-string';
import MemberErrorType from './enumerations/member-error-type';
import MemberType from './enumerations/member-type';
import { MemberError } from './errors/member';
import { getEciesI18nEngine } from './i18n-setup';
import { EncryptionStream } from './services/encryption-stream';
import { IFrontendMemberOperational } from './interfaces/frontend-member-operational';
import { IMemberStorageData } from './interfaces/member-storage';
import { IMemberWithMnemonic } from './interfaces/member-with-mnemonic';
import { IEncryptedChunk } from './interfaces/encrypted-chunk';
import { SecureBuffer } from './secure-buffer';
import { SecureString } from './secure-string';
import { ECIESService } from './services/ecies/service';
import { SignatureUint8Array } from './types';
import {
  base64ToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToHex,
} from './utils';
import { IECIESConstants } from './interfaces/ecies-consts';

/**
 * Represents a member with cryptographic capabilities.
 * This class provides methods for signing, verifying, encrypting, and decrypting data.
 * It also manages the member's keys and wallet.
 */
export class Member implements IFrontendMemberOperational {
  private readonly _eciesService: ECIESService;
  private readonly _id: ObjectId;
  private readonly _type: MemberType;
  private readonly _name: string;
  private readonly _email: EmailString;
  private readonly _publicKey: Uint8Array;
  private readonly _creatorId: ObjectId;
  private readonly _dateCreated: Date;
  private readonly _dateUpdated: Date;
  private _privateKey?: SecureBuffer;
  private _wallet?: Wallet;

  constructor(
    // Add injected services as parameters
    eciesService: ECIESService,
    // Original parameters
    type: MemberType,
    name: string,
    email: EmailString,
    publicKey: Uint8Array,
    privateKey?: SecureBuffer,
    wallet?: Wallet,
    id?: ObjectId,
    dateCreated?: Date,
    dateUpdated?: Date,
    creatorId?: ObjectId,
  ) {
    // Assign injected services
    this._eciesService = eciesService;
    // Assign original parameters
    this._type = type;
    this._id = id ?? new ObjectId();
    this._name = name;
    if (!this._name || this._name.length == 0) {
      throw new MemberError(
        MemberErrorType.MissingMemberName,
        getEciesI18nEngine() as any,
      );
    }
    if (this._name.trim() != this._name) {
      throw new MemberError(
        MemberErrorType.InvalidMemberNameWhitespace,
        getEciesI18nEngine() as any,
      );
    }
    this._email = email;
    this._publicKey = publicKey;
    this._privateKey = privateKey;
    this._wallet = wallet;

    // don't create a new date object with nearly identical values to the existing one
    let _now: null | Date = null;
    const now = function () {
      if (!_now) {
        _now = new Date();
      }
      return _now;
    };
    this._dateCreated = dateCreated ?? now();
    this._dateUpdated = dateUpdated ?? now();
    this._creatorId = creatorId ?? this._id;
  }

  // Required getters
  public get id(): ObjectId {
    return this._id;
  }
  public get type(): MemberType {
    return this._type;
  }
  public get name(): string {
    return this._name;
  }
  public get email(): EmailString {
    return this._email;
  }
  public get publicKey(): Uint8Array {
    return this._publicKey;
  }
  public get creatorId(): ObjectId {
    return this._creatorId;
  }
  public get dateCreated(): Date {
    return this._dateCreated;
  }
  public get dateUpdated(): Date {
    return this._dateUpdated;
  }

  // Optional private data getters
  public get privateKey(): SecureBuffer | undefined {
    return this._privateKey;
  }
  public get wallet(): Wallet {
    if (!this._wallet) {
      throw new MemberError(
        MemberErrorType.NoWallet,
        getEciesI18nEngine() as any,
      );
    }
    return this._wallet;
  }

  // State getters
  public get hasPrivateKey(): boolean {
    return this._privateKey !== undefined;
  }

  public unloadPrivateKey(): void {
    // Do not dispose here; tests expect the same SecureBuffer instance to remain usable
    // when reloaded into another member in the same process.
    this._privateKey = undefined;
  }

  public unloadWallet(): void {
    this._wallet = undefined;
  }

  public unloadWalletAndPrivateKey(): void {
    this.unloadWallet();
    this.unloadPrivateKey();
  }

  public loadWallet(mnemonic: SecureString, eciesParams?: IECIESConstants): void {
    if (this._wallet) {
      throw new MemberError(
        MemberErrorType.WalletAlreadyLoaded,
        getEciesI18nEngine() as any,
      );
    }
    const eciesConsts = eciesParams ?? ECIES;
    const { wallet } = this._eciesService.walletAndSeedFromMnemonic(mnemonic);
    const privateKey = wallet.getPrivateKey();
    const publicKey = wallet.getPublicKey();
    const publicKeyWithPrefix = new Uint8Array(publicKey.length + 1);
    publicKeyWithPrefix[0] = eciesConsts.PUBLIC_KEY_MAGIC;
    publicKeyWithPrefix.set(publicKey, 1);

    if (
      uint8ArrayToHex(publicKeyWithPrefix) !== uint8ArrayToHex(this._publicKey)
    ) {
      throw new MemberError(
        MemberErrorType.InvalidMnemonic,
        getEciesI18nEngine() as any,
      );
    }
    this._wallet = wallet;
    this._privateKey?.dispose();
    this._privateKey = new SecureBuffer(privateKey);
  }

  /**
   * Loads the private key and optionally the voting private key.
   *
   * @param privateKey The private key to load.
   * @param votingPrivateKey The voting private key to load.
   */
  public loadPrivateKey(privateKey: SecureBuffer): void {
    this._privateKey = privateKey;
  }

  public sign(data: Uint8Array): SignatureUint8Array {
    if (!this._privateKey) {
      throw new MemberError(
        MemberErrorType.MissingPrivateKey,
        getEciesI18nEngine() as any,
      );
    }
    return this._eciesService.signMessage(this._privateKey.value, data);
  }

  public signData(data: Uint8Array): SignatureUint8Array {
    if (!this._privateKey) {
      throw new MemberError(
        MemberErrorType.MissingPrivateKey,
        getEciesI18nEngine() as any,
      );
    }
    return this._eciesService.signMessage(
      new Uint8Array(this._privateKey.value),
      data,
    );
  }

  public verify(signature: SignatureUint8Array, data: Uint8Array): boolean {
    return this._eciesService.verifyMessage(this._publicKey, data, signature);
  }

  public verifySignature(
    data: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array,
  ): boolean {
    return this._eciesService.verifyMessage(
      publicKey,
      data,
      signature as SignatureUint8Array,
    );
  }

  private static readonly MAX_ENCRYPTION_SIZE = 1024 * 1024 * 10; // 10MB limit
  private static readonly VALID_STRING_REGEX = /^[\x20-\x7E\n\r\t]*$/; // Printable ASCII + common whitespace

  /**
   * Encrypt data stream (for large data)
   */
  async *encryptDataStream(
    source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    options?: {
      recipientPublicKey?: Uint8Array;
      onProgress?: (progress: { bytesProcessed: number; chunksProcessed: number }) => void;
      signal?: AbortSignal;
    }
  ): AsyncGenerator<IEncryptedChunk, void, unknown> {
    if (!this._privateKey && !options?.recipientPublicKey) {
      throw new MemberError(
        MemberErrorType.MissingPrivateKey,
        getEciesI18nEngine() as any,
      );
    }

    const targetPublicKey = options?.recipientPublicKey || this._publicKey;
    const stream = new EncryptionStream(this._eciesService);

    // Convert ReadableStream to AsyncIterable if needed
    const asyncSource = 'getReader' in source
      ? this.readableStreamToAsyncIterable(source as ReadableStream<Uint8Array>)
      : source as AsyncIterable<Uint8Array>;

    let bytesProcessed = 0;
    let chunksProcessed = 0;

    for await (const chunk of stream.encryptStream(asyncSource, targetPublicKey, {
      signal: options?.signal,
    })) {
      bytesProcessed += chunk.metadata?.originalSize || 0;
      chunksProcessed++;
      
      if (options?.onProgress) {
        options.onProgress({ bytesProcessed, chunksProcessed });
      }

      yield chunk;
    }
  }

  /**
   * Decrypt data stream (for large data)
   */
  async *decryptDataStream(
    source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    options?: {
      onProgress?: (progress: { bytesProcessed: number; chunksProcessed: number }) => void;
      signal?: AbortSignal;
    }
  ): AsyncGenerator<Uint8Array, void, unknown> {
    if (!this._privateKey) {
      throw new MemberError(
        MemberErrorType.MissingPrivateKey,
        getEciesI18nEngine() as any,
      );
    }

    const stream = new EncryptionStream(this._eciesService);

    // Convert ReadableStream to AsyncIterable if needed
    const asyncSource = 'getReader' in source
      ? this.readableStreamToAsyncIterable(source as ReadableStream<Uint8Array>)
      : source as AsyncIterable<Uint8Array>;

    let bytesProcessed = 0;
    let chunksProcessed = 0;

    for await (const chunk of stream.decryptStream(
      asyncSource,
      new Uint8Array(this._privateKey.value),
      { signal: options?.signal }
    )) {
      bytesProcessed += chunk.length;
      chunksProcessed++;
      
      if (options?.onProgress) {
        options.onProgress({ bytesProcessed, chunksProcessed });
      }

      yield chunk;
    }
  }

  /**
   * Convert ReadableStream to AsyncIterable
   */
  private async *readableStreamToAsyncIterable(
    stream: ReadableStream<Uint8Array>
  ): AsyncIterable<Uint8Array> {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }

  public async encryptData(
    data: string | Uint8Array,
    recipientPublicKey?: Uint8Array,
  ): Promise<Uint8Array> {
    // Validate input
    if (!data) {
      throw new MemberError(
        MemberErrorType.MissingEncryptionData,
        getEciesI18nEngine() as any,
      );
    }

    // Check size limit
    const arr: Uint8Array =
      data instanceof Uint8Array ? data : new TextEncoder().encode(data);
    if (arr.length > Member.MAX_ENCRYPTION_SIZE) {
      throw new MemberError(
        MemberErrorType.EncryptionDataTooLarge,
        getEciesI18nEngine() as any,
      );
    }

    // Use recipient public key or self public key
    const targetPublicKey = recipientPublicKey || this._publicKey;

    return await this._eciesService.encryptSimpleOrSingle(
      false,
      targetPublicKey,
      arr,
    );
  }

  public async decryptData(encryptedData: Uint8Array): Promise<Uint8Array> {
    if (!this._privateKey) {
      throw new MemberError(
        MemberErrorType.MissingPrivateKey,
        getEciesI18nEngine() as any,
      );
    }
    // decryptSingleWithHeader now returns the Uint8Array directly
    return await this._eciesService.decryptSimpleOrSingleWithHeader(
      false,
      new Uint8Array(this._privateKey.value),
      encryptedData,
    );
  }

  public toJson(): string {
    const storage: IMemberStorageData = {
      id: this._id.toHexString(),
      type: this._type,
      name: this._name,
      email: this._email.toString(),
      publicKey: uint8ArrayToBase64(this._publicKey),
      creatorId: this._creatorId.toHexString(),
      dateCreated: this._dateCreated.toISOString(),
      dateUpdated: this._dateUpdated.toISOString(),
    };
    return JSON.stringify(storage);
  }

  public dispose(): void {
    // Ensure secret material is zeroized when disposing
    try {
      this._privateKey?.dispose();
    } finally {
      this.unloadWalletAndPrivateKey();
    }
  }

  public static fromJson(
    json: string,
    // Add injected services as parameters
    eciesService: ECIESService,
  ): Member {
    let storage: IMemberStorageData;
    try {
      storage = JSON.parse(json);
    } catch (error) {
      throw new MemberError(
        MemberErrorType.InvalidMemberData,
        getEciesI18nEngine() as any,
      );
    }
    const email = new EmailString(storage.email);

    // Pass injected services to constructor
    const dateCreated = new Date(storage.dateCreated);
    return new Member(
      eciesService,
      storage.type,
      storage.name,
      email,
      base64ToUint8Array(storage.publicKey),
      undefined,
      undefined,
      new ObjectId(storage.id),
      dateCreated,
      new Date(storage.dateUpdated),
      new ObjectId(storage.creatorId),
    );
  }

  public static fromMnemonic(
    mnemonic: SecureString,
    eciesService: ECIESService,
    eciesParams?: IECIESConstants,
    name = 'Test User',
    email = new EmailString('test@example.com'),
  ): Member {
    const eciesConsts = eciesParams ?? ECIES;
    const { wallet } = eciesService.walletAndSeedFromMnemonic(mnemonic);
    const privateKey = wallet.getPrivateKey();
    const publicKey = wallet.getPublicKey();
    const publicKeyWithPrefix = new Uint8Array(publicKey.length + 1);
    publicKeyWithPrefix[0] = eciesConsts.PUBLIC_KEY_MAGIC;
    publicKeyWithPrefix.set(publicKey, 1);

    return new Member(
      eciesService,
      MemberType.User,
      name,
      email,
      publicKeyWithPrefix,
      new SecureBuffer(privateKey),
      wallet,
    );
  }

  public static newMember(
    // Add injected services as parameters
    eciesService: ECIESService,
    // Original parameters
    type: MemberType,
    name: string,
    email: EmailString,
    forceMnemonic?: SecureString,
    createdBy?: ObjectId,
    eciesParams?: IECIESConstants,
  ): IMemberWithMnemonic {
    // Validate inputs first
    if (!name || name.length == 0) {
      throw new MemberError(
        MemberErrorType.MissingMemberName,
        getEciesI18nEngine() as any,
      );
    }
    if (name.trim() != name) {
      throw new MemberError(
        MemberErrorType.InvalidMemberNameWhitespace,
        getEciesI18nEngine() as any,
      );
    }
    if (!email || email.toString().length == 0) {
      throw new MemberError(
        MemberErrorType.MissingEmail,
        getEciesI18nEngine() as any,
      );
    }
    if (email.toString().trim() != email.toString()) {
      throw new MemberError(
        MemberErrorType.InvalidEmailWhitespace,
        getEciesI18nEngine() as any,
      );
    }

    const eciesConsts = eciesParams ?? ECIES;
    // Use injected services
    const mnemonic = forceMnemonic ?? eciesService.generateNewMnemonic();
    const { wallet } = eciesService.walletAndSeedFromMnemonic(mnemonic);

    // Get private key from wallet
    const privateKey = wallet.getPrivateKey();
    // Get public key with 0x04 prefix
    const publicKey = wallet.getPublicKey();
    const publicKeyWithPrefix = new Uint8Array(publicKey.length + 1);
    publicKeyWithPrefix[0] = eciesConsts.PUBLIC_KEY_MAGIC;
    publicKeyWithPrefix.set(publicKey, 1);

    const newId = new ObjectId();
    const dateCreated = new Date();
    return {
      // Pass injected services to constructor
      member: new Member(
        eciesService,
        type,
        name,
        email,
        publicKeyWithPrefix,
        new SecureBuffer(privateKey),
        wallet,
        newId,
        dateCreated,
        dateCreated,
        createdBy ?? newId,
      ),
      mnemonic,
    };
  }
}
