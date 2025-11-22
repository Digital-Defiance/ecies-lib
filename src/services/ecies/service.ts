import { IECIESConstants } from '../../interfaces/ecies-consts';
import { Constants } from '../../constants';
import {
  EciesEncryptionType,
  EciesEncryptionTypeEnum,
} from '../../enumerations/ecies-encryption-type';
import { IECIESConfig } from '../../interfaces/ecies-config';
import { SecureString } from '../../secure-string';
import { SignatureString, SignatureUint8Array } from '../../types';
import { EciesCryptoCore } from './crypto-core';
import { IMultiEncryptedMessage, IMultiRecipient, ISimpleKeyPair, IWalletSeed } from './interfaces';
import { EciesSignature } from './signature';
import { EciesSingleRecipient } from './single-recipient';
import { getEciesI18nEngine, EciesComponentId } from '../../i18n-setup';
import { EciesStringKey } from '../../enumerations/ecies-string-key';
import { EciesMultiRecipient } from './multi-recipient';

/**
 * Browser-compatible ECIES service that mirrors the server-side functionality
 * Uses Web Crypto API and @scure/@noble libraries for browser compatibility
 */
export class ECIESService {
  protected readonly _config: IECIESConfig;
  protected readonly cryptoCore: EciesCryptoCore;
  protected readonly signature: EciesSignature;
  protected readonly singleRecipient: EciesSingleRecipient;
  protected readonly multiRecipient: EciesMultiRecipient;
  protected readonly eciesConsts: IECIESConstants;

  constructor(config?: Partial<IECIESConfig>, eciesParams: IECIESConstants = Constants.ECIES) {
    this.eciesConsts = eciesParams;
    this._config = {
      curveName: this.eciesConsts.CURVE_NAME,
      primaryKeyDerivationPath: this.eciesConsts.PRIMARY_KEY_DERIVATION_PATH,
      mnemonicStrength: this.eciesConsts.MNEMONIC_STRENGTH,
      symmetricAlgorithm: this.eciesConsts.SYMMETRIC.ALGORITHM,
      symmetricKeyBits: this.eciesConsts.SYMMETRIC.KEY_BITS,
      symmetricKeyMode: this.eciesConsts.SYMMETRIC.MODE,
      ...config,
    };

    // Initialize components
    this.cryptoCore = new EciesCryptoCore(this._config, this.eciesConsts);
    this.signature = new EciesSignature(this.cryptoCore);
    this.singleRecipient = new EciesSingleRecipient(this._config, this.eciesConsts);
    this.multiRecipient = new EciesMultiRecipient(this._config, this.eciesConsts);
  }

  public get core(): EciesCryptoCore {
    return this.cryptoCore;
  }

  public get config(): IECIESConfig {
    return this._config;
  }

  public get curveName(): string {
    return this._config.curveName;
  }

  // === Key Management Methods ===

  /**
   * Generate a new mnemonic
   */
  public generateNewMnemonic(): SecureString {
    return this.cryptoCore.generateNewMnemonic();
  }

  /**
   * Generate wallet and seed from mnemonic
   */
  public walletAndSeedFromMnemonic(mnemonic: SecureString): IWalletSeed {
    return this.cryptoCore.walletAndSeedFromMnemonic(mnemonic);
  }

  /**
   * Create simple key pair from seed
   */
  public seedToSimpleKeyPair(seed: Uint8Array): ISimpleKeyPair {
    return this.cryptoCore.seedToSimpleKeyPair(seed);
  }

  /**
   * Create simple key pair from mnemonic
   */
  public mnemonicToSimpleKeyPair(mnemonic: SecureString): ISimpleKeyPair {
    return this.cryptoCore.mnemonicToSimpleKeyPair(mnemonic);
  }

  /**
   * Get public key from private key
   */
  public getPublicKey(privateKey: Uint8Array): Uint8Array {
    return this.cryptoCore.getPublicKey(privateKey);
  }

  // === Core Encryption/Decryption Methods ===

  /**
   * Encrypt for single recipient (simple or single mode)
   */
  public async encryptSimpleOrSingle(
    encryptSimple: boolean,
    receiverPublicKey: Uint8Array,
    message: Uint8Array,
    preamble: Uint8Array = new Uint8Array(0),
  ): Promise<Uint8Array> {
    return this.singleRecipient.encrypt(
      encryptSimple,
      receiverPublicKey,
      message,
      preamble,
    );
  }

  /**
   * Parse single encrypted header
   */
  public parseSingleEncryptedHeader(
    encryptionType: EciesEncryptionTypeEnum,
    data: Uint8Array,
    preambleSize: number = 0,
    options?: { dataLength?: number },
  ) {
    const { header } = this.singleRecipient.parseEncryptedMessage(
      encryptionType,
      data,
      preambleSize,
      options,
    );
    return header;
  }

  /**
   * Decrypt with header
   */
  public async decryptSimpleOrSingleWithHeader(
    decryptSimple: boolean,
    privateKey: Uint8Array,
    encryptedData: Uint8Array,
    preambleSize: number = 0,
    options?: { dataLength?: number },
  ): Promise<Uint8Array> {
    return await this.singleRecipient.decryptWithHeader(
      decryptSimple
        ? EciesEncryptionTypeEnum.Simple
        : EciesEncryptionTypeEnum.Single,
      privateKey,
      encryptedData,
      preambleSize,
      options,
    );
  }

  /**
   * Extended decrypt with header
   */
  public async decryptSimpleOrSingleWithHeaderEx(
    encryptionType: EciesEncryptionTypeEnum,
    privateKey: Uint8Array,
    encryptedData: Uint8Array,
    preambleSize: number = 0,
    options?: { dataLength?: number },
  ) {
    return this.singleRecipient.decryptWithHeaderEx(
      encryptionType,
      privateKey,
      encryptedData,
      preambleSize,
      options,
    );
  }

  /**
   * Decrypt with individual components
   */
  public async decryptSingleWithComponents(
    privateKey: Uint8Array,
    ephemeralPublicKey: Uint8Array,
    iv: Uint8Array,
    authTag: Uint8Array,
    encrypted: Uint8Array,
  ): Promise<{ decrypted: Uint8Array; ciphertextLength?: number }> {
    const decrypted = await this.singleRecipient.decryptWithComponents(
      privateKey,
      ephemeralPublicKey,
      iv,
      authTag,
      encrypted,
    );

    return { decrypted, ciphertextLength: encrypted.length };
  }

  // === Signature Methods ===

  /**
   * Sign a message
   */
  public signMessage(
    privateKey: Uint8Array,
    data: Uint8Array,
  ): SignatureUint8Array {
    return this.signature.signMessage(privateKey, data);
  }

  /**
   * Verify a message signature
   */
  public verifyMessage(
    publicKey: Uint8Array,
    data: Uint8Array,
    signature: SignatureUint8Array,
  ): boolean {
    return this.signature.verifyMessage(publicKey, data, signature);
  }

  /**
   * Convert signature string to buffer
   */
  public signatureStringToSignatureUint8Array(
    signatureString: SignatureString,
  ): SignatureUint8Array {
    return this.signature.signatureStringToSignatureUint8Array(signatureString);
  }

  /**
   * Convert signature buffer to string
   */
  public signatureUint8ArrayToSignatureString(
    signatureArray: SignatureUint8Array,
  ): string {
    return this.signature.signatureUint8ArrayToSignatureString(signatureArray);
  }

  // === Utility Methods ===

  /**
   * Compute encrypted length from data length
   */
  public computeEncryptedLengthFromDataLength(
    dataLength: number,
    encryptionMode: EciesEncryptionType,
    recipientCount?: number,
  ): number {
    if (dataLength < 0) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_Service_InvalidDataLength));
    }

    switch (encryptionMode) {
      case 'simple':
        return dataLength + this.eciesConsts.SIMPLE.FIXED_OVERHEAD_SIZE;
      case 'single':
        return dataLength + this.eciesConsts.SINGLE.FIXED_OVERHEAD_SIZE;
      case 'multiple':
        // Basic calculation for multiple recipients
        return (
          dataLength +
          this.eciesConsts.MULTIPLE.FIXED_OVERHEAD_SIZE +
          (recipientCount ?? 1) * this.eciesConsts.MULTIPLE.ENCRYPTED_KEY_SIZE
        );
      default:
        const engine = getEciesI18nEngine();
        throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_Service_InvalidEncryptionType));
    }
  }

  /**
   * Compute decrypted length from encrypted data length
   */
  public computeDecryptedLengthFromEncryptedDataLength(
    encryptedDataLength: number,
    padding?: number,
  ): number {
    if (encryptedDataLength < 0) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_Service_InvalidEncryptedDataLength));
    }

  const overhead = this.eciesConsts.SINGLE.FIXED_OVERHEAD_SIZE;
    const actualPadding = padding !== undefined ? padding : 0;
    const decryptedLength = encryptedDataLength - overhead - actualPadding;

    if (decryptedLength < 0) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_Service_ComputedDecryptedLengthNegative));
    }

    return decryptedLength;
  }

  /**
   * Generic encrypt method
   */
  public async encrypt(
    encryptionType: EciesEncryptionTypeEnum,
    recipientPublicKey: Uint8Array,
    message: Uint8Array,
    preamble?: Uint8Array,
  ): Promise<Uint8Array> {
    if (encryptionType === EciesEncryptionTypeEnum.Multiple) {
      throw new Error(
        getEciesI18nEngine().translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode,
        ),
      );
    }
    return this.singleRecipient.encrypt(
      encryptionType === EciesEncryptionTypeEnum.Simple,
      recipientPublicKey,
      message,
      preamble,
    );
  }
  /**
   * Encrypt for multiple recipients
   * @param recipients 
   * @param message 
   * @param preamble 
   * @returns 
   */
  public async encryptMultiple(
    recipients: Array<IMultiRecipient>,
    message: Uint8Array,
    preamble?: Uint8Array,
  ): Promise<IMultiEncryptedMessage> {
      return this.multiRecipient.encryptMultiple(
        recipients,
        message,
        preamble,
      );
    }

    /**
   * Encrypt a symmetric key for a recipient using an ephemeral private key
   */
  public async encryptKey(
    receiverPublicKey: Uint8Array,
    messageSymmetricKey: Uint8Array,
    ephemeralPrivateKey: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    return this.multiRecipient.encryptKey(
      receiverPublicKey,
      messageSymmetricKey,
      ephemeralPrivateKey,
      aad,
    );
  }

  /**
   * Decrypt a symmetric key using an ephemeral public key
   */
  public async decryptKey(
    privateKey: Uint8Array,
    encryptedKey: Uint8Array,
    ephemeralPublicKey: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    return this.multiRecipient.decryptKey(
      privateKey,
      encryptedKey,
      ephemeralPublicKey,
      aad,
    );
  }
  }
