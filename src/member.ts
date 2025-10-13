import { Wallet } from '@ethereumjs/wallet';
import { ECIES } from './defaults';
import { EmailString } from './email-string';
import MemberErrorType from './enumerations/member-error-type';
import MemberType from './enumerations/member-type';
import { MemberError } from './errors/member';
import { GuidV4 } from './guid';
import { getCompatibleEciesEngine } from './i18n-setup';
import { IMemberOperational } from './interfaces/member-operational';
import { IMemberStorageData } from './interfaces/member-storage';
import { IMemberWithMnemonic } from './interfaces/member-with-mnemonic';
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
export class Member implements IMemberOperational {
  private readonly _eciesService: ECIESService;
  private readonly _id: GuidV4;
  private readonly _type: MemberType;
  private readonly _name: string;
  private readonly _email: EmailString;
  private readonly _publicKey: Uint8Array;
  private readonly _creatorId: GuidV4;
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
    id?: GuidV4,
    dateCreated?: Date,
    dateUpdated?: Date,
    creatorId?: GuidV4,
  ) {
    // Assign injected services
    this._eciesService = eciesService;
    // Assign original parameters
    this._type = type;
    this._id = id ?? GuidV4.new();
    this._name = name;
    if (!this._name || this._name.length == 0) {
      throw new MemberError(
        MemberErrorType.MissingMemberName,
        getCompatibleEciesEngine() as any,
      );
    }
    if (this._name.trim() != this._name) {
      throw new MemberError(
        MemberErrorType.InvalidMemberNameWhitespace,
        getCompatibleEciesEngine() as any,
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
  public get id(): GuidV4 {
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
  public get creatorId(): GuidV4 {
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
        getCompatibleEciesEngine() as any,
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
        getCompatibleEciesEngine() as any,
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
        getCompatibleEciesEngine() as any,
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
        getCompatibleEciesEngine() as any,
      );
    }
    return this._eciesService.signMessage(this._privateKey.value, data);
  }

  public signData(data: Uint8Array): SignatureUint8Array {
    if (!this._privateKey) {
      throw new MemberError(
        MemberErrorType.MissingPrivateKey,
        getCompatibleEciesEngine() as any,
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

  public async encryptData(
    data: string | Uint8Array,
    recipientPublicKey?: Uint8Array,
  ): Promise<Uint8Array> {
    // Validate input
    if (!data) {
      throw new MemberError(
        MemberErrorType.MissingEncryptionData,
        getCompatibleEciesEngine() as any,
      );
    }

    // Check size limit
    const arr: Uint8Array =
      data instanceof Uint8Array ? data : new TextEncoder().encode(data);
    if (arr.length > Member.MAX_ENCRYPTION_SIZE) {
      throw new MemberError(
        MemberErrorType.EncryptionDataTooLarge,
        getCompatibleEciesEngine() as any,
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
        getCompatibleEciesEngine() as any,
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
      id: this._id.toString(),
      type: this._type,
      name: this._name,
      email: this._email.toString(),
      publicKey: uint8ArrayToBase64(this._publicKey),
      creatorId: this._creatorId.toString(),
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
        getCompatibleEciesEngine() as any,
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
      new GuidV4(storage.id),
      dateCreated,
      new Date(storage.dateUpdated),
      new GuidV4(storage.creatorId),
    );
  }

  public static fromMnemonic(
    mnemonic: SecureString,
    eciesService: ECIESService,
    eciesParams?: IECIESConstants,
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
      'Test User',
      new EmailString('test@example.com'),
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
    createdBy?: GuidV4,
    eciesParams?: IECIESConstants,
  ): IMemberWithMnemonic {
    // Validate inputs first
    if (!name || name.length == 0) {
      throw new MemberError(
        MemberErrorType.MissingMemberName,
        getCompatibleEciesEngine() as any,
      );
    }
    if (name.trim() != name) {
      throw new MemberError(
        MemberErrorType.InvalidMemberNameWhitespace,
        getCompatibleEciesEngine() as any,
      );
    }
    if (!email || email.toString().length == 0) {
      throw new MemberError(
        MemberErrorType.MissingEmail,
        getCompatibleEciesEngine() as any,
      );
    }
    if (email.toString().trim() != email.toString()) {
      throw new MemberError(
        MemberErrorType.InvalidEmailWhitespace,
        getCompatibleEciesEngine() as any,
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

    const newId = GuidV4.new();
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
