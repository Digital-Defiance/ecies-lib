import { Wallet } from '@ethereumjs/wallet';
import type { PrivateKey, PublicKey } from 'paillier-bigint';
import { EmailString } from './email-string';
import { MemberErrorType } from './enumerations/member-error-type';
import { MemberType } from './enumerations/member-type';
import { MemberError } from './errors/member';
import { PlatformID } from './interfaces';
import { IECIESConstants } from './interfaces/ecies-consts';
import { IEncryptedChunk } from './interfaces/encrypted-chunk';
import { IIdProvider } from './interfaces/id-provider';
import { IMember } from './interfaces/member';
import { IMemberStorageData } from './interfaces/member-storage';
import { SecureBuffer } from './secure-buffer';
import { SecureString } from './secure-string';
import { ECIESService } from './services/ecies/service';
import { EncryptionStream } from './services/encryption-stream';
import {
  deriveVotingKeysFromECDH,
  DeriveVotingKeysOptions,
} from './services/voting.service';
import { SignatureUint8Array } from './types';
import {
  base64ToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToHex,
} from './utils';

/**
 * Interface for a member with their mnemonic phrase.
 * Defined here to avoid circular dependency with interfaces folder.
 */
export interface IMemberWithMnemonic<TID extends PlatformID = Uint8Array> {
  /** The member instance */
  member: Member<TID>;
  /** The member's mnemonic phrase (secured) */
  mnemonic: SecureString;
}

/**
 * Represents a member with cryptographic capabilities.
 *
 * This class provides comprehensive cryptographic operations including:
 * - Digital signatures (sign/verify)
 * - Asymmetric encryption/decryption (ECIES)
 * - Streaming encryption for large data
 * - Homomorphic encryption voting keys (Paillier)
 * - Secure key management with automatic disposal
 *
 * Members can be created from:
 * - Mnemonic phrases (BIP39)
 * - Existing keys
 * - JSON serialization
 *
 * @example
 * ```typescript
 * // Create a new member
 * const { member, mnemonic } = Member.newMember(
 *   eciesService,
 *   MemberType.User,
 *   'Alice',
 *   new EmailString('alice@example.com')
 * );
 *
 * // Sign data
 * const signature = member.sign(data);
 *
 * // Encrypt for another member
 * const encrypted = await member.encryptData(data, recipientPublicKey);
 * ```
 */
export class Member<
  TID extends PlatformID = Uint8Array,
> implements IMember<TID> {
  private readonly _eciesService: ECIESService<TID>;
  private readonly _id: TID;
  private readonly _idBytes: Uint8Array;
  private readonly _type: MemberType;
  private readonly _name: string;
  private readonly _email: EmailString;
  private readonly _publicKey: Uint8Array;
  private readonly _creatorId: TID;
  private readonly _creatorIdBytes: Uint8Array;
  private readonly _dateCreated: Date;
  private readonly _dateUpdated: Date;
  private _privateKey?: SecureBuffer;
  private _wallet?: Wallet;

  // Optional voting keys for homomorphic encryption voting systems
  private _votingPublicKey?: PublicKey;
  private _votingPrivateKey?: PrivateKey;

  /**
   * Creates a new Member instance.
   * @param eciesService Injected ECIES service for cryptographic operations
   * @param type Member type (Admin, System, User, Anonymous)
   * @param name Member's display name
   * @param email Member's email address
   * @param publicKey Member's public key (compressed, 33 bytes)
   * @param privateKey Optional private key (secured)
   * @param wallet Optional Ethereum wallet
   * @param id Optional member ID (generated if not provided)
   * @param dateCreated Optional creation date
   * @param dateUpdated Optional last update date
   * @param creatorId Optional ID of the member who created this member
   */
  constructor(
    // Add injected services as parameters
    eciesService: ECIESService<TID>,
    // Original parameters
    type: MemberType,
    name: string,
    email: EmailString,
    publicKey: Uint8Array,
    privateKey?: SecureBuffer,
    wallet?: Wallet,
    id?: TID,
    dateCreated?: Date,
    dateUpdated?: Date,
    creatorId?: TID,
  ) {
    // Assign injected services
    this._eciesService = eciesService;
    // Assign original parameters
    this._type = type;

    // Handle ID initialization properly:
    // - If id is provided, use it and derive bytes from it
    // - If not provided, generate bytes first, then derive native ID
    // Use the service's configured idProvider (not global Constants)
    if (id !== undefined) {
      this._id = id;
      // For provided IDs, we need to convert to bytes using the service's idProvider
      this._idBytes = this._eciesService.constants.idProvider.toBytes(this._id);
    } else {
      // Generate raw bytes first using the service's configured idProvider
      this._idBytes = this._eciesService.constants.idProvider.generate();
      // Convert to native type for storage
      this._id = this._eciesService.constants.idProvider.fromBytes(
        this._idBytes,
      ) as TID;
    }

    this._name = name;
    if (!this._name || this._name.length == 0) {
      throw new MemberError(MemberErrorType.MissingMemberName);
    }
    if (this._name.trim() != this._name) {
      throw new MemberError(MemberErrorType.InvalidMemberNameWhitespace);
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
    // Derive creatorIdBytes from creatorId, using idBytes if creator is self
    this._creatorIdBytes =
      this._creatorId === this._id
        ? this._idBytes
        : this._eciesService.constants.idProvider.toBytes(this._creatorId);
  }

  /** Gets the member's unique ID in native format */
  public get id(): TID {
    return this._id;
  }
  /** Gets the member's ID as a byte array */
  public get idBytes(): Uint8Array {
    return this._idBytes;
  }
  /** Gets the member's type */
  public get type(): MemberType {
    return this._type;
  }
  /** Gets the member's display name */
  public get name(): string {
    return this._name;
  }
  /** Gets the member's email address */
  public get email(): EmailString {
    return this._email;
  }
  /** Gets the member's public key (compressed, 33 bytes) */
  public get publicKey(): Uint8Array {
    return this._publicKey;
  }
  /** Gets the ID of the member who created this member */
  public get creatorId(): TID {
    return this._creatorId;
  }
  /** Gets the creator's ID as a byte array */
  public get creatorIdBytes(): Uint8Array {
    return this._creatorIdBytes;
  }
  /** Gets the date this member was created */
  public get dateCreated(): Date {
    return this._dateCreated;
  }
  /** Gets the date this member was last updated */
  public get dateUpdated(): Date {
    return this._dateUpdated;
  }

  /**
   * Gets the ID provider used by this member's ECIES service.
   * Useful for voting system compatibility.
   */
  public get idProvider(): IIdProvider<TID> {
    return this._eciesService.constants.idProvider as IIdProvider<TID>;
  }

  /**
   * Gets the member's private key if loaded.
   * @returns The private key or undefined if not loaded
   */
  public get privateKey(): SecureBuffer | undefined {
    return this._privateKey;
  }
  /**
   * Gets the member's wallet.
   * @throws {MemberError} If wallet is not loaded
   */
  public get wallet(): Wallet {
    if (!this._wallet) {
      throw new MemberError(MemberErrorType.NoWallet);
    }
    return this._wallet;
  }

  /**
   * Gets the member's wallet if loaded.
   * @returns The wallet or undefined if not loaded
   */
  public get walletOptional(): Wallet | undefined {
    return this._wallet;
  }

  /** Checks if the member has a private key loaded */
  public get hasPrivateKey(): boolean {
    return this._privateKey !== undefined;
  }

  /** Checks if the member has a voting private key loaded */
  public get hasVotingPrivateKey(): boolean {
    return this._votingPrivateKey !== undefined;
  }

  /** Gets the member's voting public key for homomorphic encryption */
  public get votingPublicKey(): PublicKey | undefined {
    return this._votingPublicKey;
  }

  /** Gets the member's voting private key for homomorphic encryption */
  public get votingPrivateKey(): PrivateKey | undefined {
    return this._votingPrivateKey;
  }

  /**
   * Derives Paillier voting keys from the member's ECDH keys.
   * @param options Optional key derivation options
   * @throws {MemberError} If private key is not loaded
   */
  public async deriveVotingKeys(
    options?: DeriveVotingKeysOptions,
  ): Promise<void> {
    if (!this._privateKey) {
      throw new MemberError(MemberErrorType.MissingPrivateKey);
    }

    const keyPair = await deriveVotingKeysFromECDH(
      new Uint8Array(this._privateKey.value),
      this._publicKey,
      options,
    );

    this._votingPublicKey = keyPair.publicKey;
    this._votingPrivateKey = keyPair.privateKey;
  }

  /**
   * Loads pre-generated voting keys.
   * @param publicKey The voting public key
   * @param privateKey Optional voting private key
   */
  public loadVotingKeys(publicKey: PublicKey, privateKey?: PrivateKey): void {
    this._votingPublicKey = publicKey;
    this._votingPrivateKey = privateKey;
  }

  /**
   * Unloads the voting private key from memory.
   * The public key remains loaded.
   */
  public unloadVotingPrivateKey(): void {
    this._votingPrivateKey = undefined;
  }

  /**
   * Unloads the private key from memory without disposing it.
   * The key can be reloaded later.
   */
  public unloadPrivateKey(): void {
    // Do not dispose here; tests expect the same SecureBuffer instance to remain usable
    // when reloaded into another member in the same process.
    this._privateKey = undefined;
  }

  /**
   * Unloads the wallet from memory.
   */
  public unloadWallet(): void {
    this._wallet = undefined;
  }

  /**
   * Unloads both wallet and private key from memory.
   */
  public unloadWalletAndPrivateKey(): void {
    this.unloadWallet();
    this.unloadPrivateKey();
  }

  /**
   * Loads a wallet from a mnemonic phrase.
   * Validates that the mnemonic matches the member's public key.
   * @param mnemonic The BIP39 mnemonic phrase
   * @param _eciesParams Optional ECIES parameters (deprecated)
   * @throws {MemberError} If wallet is already loaded or mnemonic is invalid
   */
  public loadWallet(
    mnemonic: SecureString,
    _eciesParams?: IECIESConstants,
  ): void {
    if (this._wallet) {
      throw new MemberError(MemberErrorType.WalletAlreadyLoaded);
    }
    const { wallet } = this._eciesService.walletAndSeedFromMnemonic(mnemonic);
    const privateKey = wallet.getPrivateKey();
    // Use service to get compressed public key
    const publicKey = this._eciesService.getPublicKey(privateKey);

    if (uint8ArrayToHex(publicKey) !== uint8ArrayToHex(this._publicKey)) {
      throw new MemberError(MemberErrorType.InvalidMnemonic);
    }
    this._wallet = wallet;
    this._privateKey?.dispose();
    this._privateKey = new SecureBuffer(privateKey);
  }

  /**
   * Loads a private key into the member.
   * @param privateKey The private key to load
   */
  public loadPrivateKey(privateKey: SecureBuffer): void {
    this._privateKey = privateKey;
  }

  /**
   * Signs data using the member's private key.
   * @param data The data to sign
   * @returns ECDSA signature (64 bytes)
   * @throws {MemberError} If private key is not loaded
   */
  public sign(data: Uint8Array): SignatureUint8Array {
    if (!this._privateKey) {
      throw new MemberError(MemberErrorType.MissingPrivateKey);
    }
    return this._eciesService.signMessage(this._privateKey.value, data);
  }

  /**
   * Signs data using the member's private key.
   * Alias for sign() method.
   * @param data The data to sign
   * @returns ECDSA signature (64 bytes)
   * @throws {MemberError} If private key is not loaded
   */
  public signData(data: Uint8Array): SignatureUint8Array {
    if (!this._privateKey) {
      throw new MemberError(MemberErrorType.MissingPrivateKey);
    }
    return this._eciesService.signMessage(
      new Uint8Array(this._privateKey.value),
      data,
    );
  }

  /**
   * Verifies a signature against data using the member's public key.
   * @param signature The signature to verify
   * @param data The data that was signed
   * @returns True if signature is valid
   */
  public verify(signature: SignatureUint8Array, data: Uint8Array): boolean {
    return this._eciesService.verifyMessage(this._publicKey, data, signature);
  }

  /**
   * Verifies a signature against data using a specified public key.
   * @param data The data that was signed
   * @param signature The signature to verify
   * @param publicKey The public key to verify against
   * @returns True if signature is valid
   */
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

  /** Maximum size for encryption operations (10MB) */
  private static readonly MAX_ENCRYPTION_SIZE = 1024 * 1024 * 10; // 10MB limit
  /** Regular expression for valid string content */
  private static readonly _VALID_STRING_REGEX = /^[\x20-\x7E\n\r\t]*$/; // Printable ASCII + common whitespace

  /**
   * Encrypts data as a stream for large files.
   * @param source Async iterable or ReadableStream of data chunks
   * @param options Encryption options
   * @returns Async generator yielding encrypted chunks
   * @throws {MemberError} If private key is not loaded and no recipient key provided
   */
  async *encryptDataStream(
    source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    options?: {
      recipientPublicKey?: Uint8Array;
      chunkSize?: number;
      onProgress?: (progress: {
        bytesProcessed: number;
        chunksProcessed: number;
      }) => void;
      signal?: AbortSignal;
    },
  ): AsyncGenerator<IEncryptedChunk, void, unknown> {
    if (!this._privateKey && !options?.recipientPublicKey) {
      throw new MemberError(MemberErrorType.MissingPrivateKey);
    }

    const targetPublicKey = options?.recipientPublicKey || this._publicKey;
    const stream = new EncryptionStream<TID>(this._eciesService);

    // Convert ReadableStream to AsyncIterable if needed
    const asyncSource =
      'getReader' in source
        ? this.readableStreamToAsyncIterable(
            source as ReadableStream<Uint8Array>,
          )
        : (source as AsyncIterable<Uint8Array>);

    let bytesProcessed = 0;
    let chunksProcessed = 0;

    for await (const chunk of stream.encryptStream(
      asyncSource,
      targetPublicKey,
      {
        signal: options?.signal,
        chunkSize: options?.chunkSize,
      },
    )) {
      bytesProcessed += chunk.metadata?.originalSize || 0;
      chunksProcessed++;

      if (options?.onProgress) {
        options.onProgress({ bytesProcessed, chunksProcessed });
      }

      yield chunk;
    }
  }

  /**
   * Decrypts a data stream.
   * @param source Async iterable or ReadableStream of encrypted chunks
   * @param options Decryption options
   * @returns Async generator yielding decrypted data
   * @throws {MemberError} If private key is not loaded
   */
  async *decryptDataStream(
    source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    options?: {
      onProgress?: (progress: {
        bytesProcessed: number;
        chunksProcessed: number;
      }) => void;
      signal?: AbortSignal;
    },
  ): AsyncGenerator<Uint8Array, void, unknown> {
    if (!this._privateKey) {
      throw new MemberError(MemberErrorType.MissingPrivateKey);
    }

    const stream = new EncryptionStream<TID>(this._eciesService);

    // Convert ReadableStream to AsyncIterable if needed
    const asyncSource =
      'getReader' in source
        ? this.readableStreamToAsyncIterable(
            source as ReadableStream<Uint8Array>,
          )
        : (source as AsyncIterable<Uint8Array>);

    let bytesProcessed = 0;
    let chunksProcessed = 0;

    for await (const chunk of stream.decryptStream(
      asyncSource,
      new Uint8Array(this._privateKey.value),
      { signal: options?.signal },
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
   * Converts a ReadableStream to an AsyncIterable.
   * @param stream The ReadableStream to convert
   * @returns AsyncIterable of Uint8Array chunks
   */
  private async *readableStreamToAsyncIterable(
    stream: ReadableStream<Uint8Array>,
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

  /**
   * Encrypts data using ECIES.
   * @param data The data to encrypt (string or Uint8Array)
   * @param recipientPublicKey Optional recipient public key (defaults to self)
   * @returns Encrypted data as Uint8Array
   * @throws {MemberError} If data is missing, too large, or contains invalid characters
   */
  public async encryptData(
    data: string | Uint8Array,
    recipientPublicKey?: Uint8Array,
  ): Promise<Uint8Array> {
    // Validate input
    if (!data) {
      throw new MemberError(MemberErrorType.MissingEncryptionData);
    }

    // Check size limit
    const arr: Uint8Array =
      data instanceof Uint8Array ? data : new TextEncoder().encode(data);
    if (arr.length > Member.MAX_ENCRYPTION_SIZE) {
      throw new MemberError(MemberErrorType.EncryptionDataTooLarge);
    }

    // Use recipient public key or self public key
    const targetPublicKey = recipientPublicKey || this._publicKey;

    return await this._eciesService.encryptSimpleOrSingle(
      false,
      targetPublicKey,
      arr,
    );
  }

  /**
   * Decrypts ECIES encrypted data.
   * @param encryptedData The encrypted data to decrypt
   * @returns Decrypted data as Uint8Array
   * @throws {MemberError} If private key is not loaded
   */
  public async decryptData(encryptedData: Uint8Array): Promise<Uint8Array> {
    if (!this._privateKey) {
      throw new MemberError(MemberErrorType.MissingPrivateKey);
    }
    // decryptSingleWithHeader now returns the Uint8Array directly
    return await this._eciesService.decryptSimpleOrSingleWithHeader(
      false,
      new Uint8Array(this._privateKey.value),
      encryptedData,
    );
  }

  /**
   * Serializes the member to JSON.
   * Only includes public data (no private keys or wallet).
   * @returns JSON string representation
   */
  public toJson(): string {
    const storage: IMemberStorageData = {
      id: this._eciesService.constants.idProvider.serialize(this._idBytes),
      type: this._type,
      name: this._name,
      email: this._email.toString(),
      publicKey: uint8ArrayToBase64(this._publicKey),
      creatorId: this._eciesService.constants.idProvider.serialize(
        this._creatorIdBytes,
      ),
      dateCreated: this._dateCreated.toISOString(),
      dateUpdated: this._dateUpdated.toISOString(),
    };
    return JSON.stringify(storage);
  }

  /**
   * Disposes the member, zeroing out all sensitive data.
   */
  public dispose(): void {
    // Ensure secret material is zeroized when disposing
    try {
      this._privateKey?.dispose();
    } finally {
      this.unloadWalletAndPrivateKey();
    }
  }

  /**
   * Deserializes a member from JSON.
   * @param json JSON string representation
   * @param eciesService Optional ECIES service (creates default if not provided)
   * @returns Deserialized member instance
   * @throws {MemberError} If JSON is invalid
   */
  public static fromJson<TID extends PlatformID = Uint8Array>(
    json: string,
    // Add injected services as parameters
    eciesService?: ECIESService<TID>,
  ): Member<TID> {
    if (!eciesService) {
      eciesService = new ECIESService<TID>();
    }
    let storage: IMemberStorageData;
    try {
      storage = JSON.parse(json) as IMemberStorageData;
    } catch (_error) {
      throw new MemberError(MemberErrorType.InvalidMemberData);
    }
    const email = new EmailString(storage.email);

    // Deserialize IDs using the service's idProvider for consistency
    // deserialize returns Uint8Array, then fromBytes converts to native type
    const idBytes = eciesService.constants.idProvider.deserialize(storage.id);
    const id = eciesService.constants.idProvider.fromBytes(idBytes) as TID;
    const creatorIdBytes = eciesService.constants.idProvider.deserialize(
      storage.creatorId,
    );
    const creatorId = eciesService.constants.idProvider.fromBytes(
      creatorIdBytes,
    ) as TID;

    // Optional validation: warn if ID length doesn't match configured idProvider
    const expectedLength = eciesService.constants.idProvider.byteLength;
    if (idBytes.length !== expectedLength) {
      console.warn(
        `Member ID length (${idBytes.length}) does not match configured idProvider length (${expectedLength}). ` +
          `This may indicate the Member was created with a different idProvider configuration.`,
      );
    }

    // Pass injected services to constructor
    const dateCreated = new Date(storage.dateCreated);
    return new Member<TID>(
      eciesService,
      storage.type,
      storage.name,
      email,
      base64ToUint8Array(storage.publicKey),
      undefined,
      undefined,
      id,
      dateCreated,
      new Date(storage.dateUpdated),
      creatorId,
    );
  }

  /**
   * Creates a member from a BIP39 mnemonic phrase.
   * @param mnemonic The BIP39 mnemonic phrase
   * @param eciesService ECIES service for cryptographic operations
   * @param __eciesParams Optional ECIES parameters (deprecated)
   * @param name Member's display name (default: 'Test User')
   * @param email Member's email (default: 'test@example.com')
   * @returns New member instance with loaded wallet and keys
   */
  public static fromMnemonic<TID extends PlatformID = Uint8Array>(
    mnemonic: SecureString,
    eciesService: ECIESService<TID>,
    __eciesParams?: IECIESConstants,
    name = 'Test User',
    email = new EmailString('test@example.com'),
  ): Member<TID> {
    const { wallet } = eciesService.walletAndSeedFromMnemonic(mnemonic);
    const privateKey = wallet.getPrivateKey();
    // Use service to get compressed public key
    const publicKey = eciesService.getPublicKey(privateKey);

    return new Member<TID>(
      eciesService,
      MemberType.User,
      name,
      email,
      publicKey,
      new SecureBuffer(privateKey),
      wallet,
    );
  }

  /**
   * Creates a new member with a generated mnemonic.
   * @param eciesService ECIES service for cryptographic operations
   * @param type Member type
   * @param name Member's display name
   * @param email Member's email address
   * @param forceMnemonic Optional specific mnemonic to use
   * @param _createdBy Optional creator ID (deprecated)
   * @param _eciesParams Optional ECIES parameters (deprecated)
   * @returns Object containing the new member and its mnemonic
   * @throws {MemberError} If name or email is invalid
   */
  public static newMember<TID extends PlatformID = Uint8Array>(
    // Add injected services as parameters
    eciesService: ECIESService<TID>,
    // Original parameters
    type: MemberType,
    name: string,
    email: EmailString,
    forceMnemonic?: SecureString,
    _createdBy?: Uint8Array,
    _eciesParams?: IECIESConstants,
  ): IMemberWithMnemonic<TID> {
    // Validate inputs first
    if (!name || name.length == 0) {
      throw new MemberError(MemberErrorType.MissingMemberName);
    }
    if (name.trim() != name) {
      throw new MemberError(MemberErrorType.InvalidMemberNameWhitespace);
    }
    if (!email || email.toString().length == 0) {
      throw new MemberError(MemberErrorType.MissingEmail);
    }
    if (email.toString().trim() != email.toString()) {
      throw new MemberError(MemberErrorType.InvalidEmailWhitespace);
    }

    // Use injected services
    const mnemonic = forceMnemonic ?? eciesService.generateNewMnemonic();
    const { wallet } = eciesService.walletAndSeedFromMnemonic(mnemonic);

    // Get private key from wallet
    const privateKey = wallet.getPrivateKey();
    // Get compressed public key
    const publicKey = eciesService.getPublicKey(privateKey);

    const dateCreated = new Date();

    // Create member without specifying ID - let constructor generate it properly
    // This ensures proper idBytes initialization
    const member = new Member<TID>(
      eciesService,
      type,
      name,
      email,
      publicKey,
      new SecureBuffer(privateKey),
      wallet,
      undefined, // Let constructor generate ID
      dateCreated,
      dateCreated,
      undefined, // creatorId will default to self
    );

    // If createdBy is provided, we need to set it on a new member
    // For now, the creator defaults to self which is the expected behavior for newMember
    return {
      member,
      mnemonic,
    };
  }
}
