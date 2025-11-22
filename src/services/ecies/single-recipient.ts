import { IECIESConstants } from '../../interfaces/ecies-consts';
import { Constants } from '../../constants';
import {
  EciesEncryptionType,
  EciesEncryptionTypeEnum,
} from '../../enumerations/ecies-encryption-type';
import { EciesVersionEnum } from '../../enumerations/ecies-version';
import { EciesCipherSuiteEnum } from '../../enumerations/ecies-cipher-suite';
import { IECIESConfig } from '../../interfaces/ecies-config';
import { AESGCMService } from '../aes-gcm';

import { EciesCryptoCore } from './crypto-core';
import { IDecryptionResult, ISingleEncryptedParsedHeader } from './interfaces';
import { EciesComponentId, getEciesI18nEngine } from '../../i18n-setup';
import { EciesStringKey } from '../../enumerations';

/**
 * Browser-compatible single recipient ECIES encryption/decryption
 */
export class EciesSingleRecipient {
  protected readonly cryptoCore: EciesCryptoCore;
  protected readonly config: IECIESConfig;
  protected readonly eciesConsts: IECIESConstants;

  constructor(config: IECIESConfig, eciesParams: IECIESConstants = Constants.ECIES) {
    this.config = config;
    this.eciesConsts = eciesParams;
    this.cryptoCore = new EciesCryptoCore(config, this.eciesConsts);
  }

  /**
   * Encrypt a message for a single recipient
   */
  public async encrypt(
    encryptSimple: boolean,
    receiverPublicKey: Uint8Array,
    message: Uint8Array,
    preamble: Uint8Array = new Uint8Array(0),
  ): Promise<Uint8Array> {
    const encryptionType: EciesEncryptionType = encryptSimple
      ? 'simple'
      : 'single';
    const encryptionTypeArray = new Uint8Array([
      encryptionType === 'simple'
        ? this.eciesConsts.ENCRYPTION_TYPE.SIMPLE
        : this.eciesConsts.ENCRYPTION_TYPE.SINGLE,
    ]);

    const versionArray = new Uint8Array([EciesVersionEnum.V1]);
    const cipherSuiteArray = new Uint8Array([EciesCipherSuiteEnum.Secp256k1_Aes256Gcm_Sha256]);

    if (message.length > this.eciesConsts.MAX_RAW_DATA_SIZE) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate, {messageLength: message.length }));
    }

    // Generate ephemeral key pair
    const ephemeralPrivateKey = this.cryptoCore.generatePrivateKey();
    const ephemeralPublicKey =
      this.cryptoCore.getPublicKey(ephemeralPrivateKey);

    // Compute shared secret
    const normalizedReceiverPublicKey =
      this.cryptoCore.normalizePublicKey(receiverPublicKey);
    const sharedSecret = this.cryptoCore.computeSharedSecret(
      ephemeralPrivateKey,
      normalizedReceiverPublicKey,
    );

    // Use HKDF to derive the key
    const symKey = this.cryptoCore.deriveSharedKey(
      sharedSecret,
      new Uint8Array(0), // No salt
      new TextEncoder().encode('ecies-v2-key-derivation'), // Info
      this.eciesConsts.SYMMETRIC.KEY_SIZE
    );

    // Construct AAD
    const aad = new Uint8Array(
      preamble.length +
      versionArray.length +
      cipherSuiteArray.length +
      encryptionTypeArray.length +
      ephemeralPublicKey.length
    );
    
    let aadOffset = 0;
    aad.set(preamble, aadOffset); aadOffset += preamble.length;
    aad.set(versionArray, aadOffset); aadOffset += versionArray.length;
    aad.set(cipherSuiteArray, aadOffset); aadOffset += cipherSuiteArray.length;
    aad.set(encryptionTypeArray, aadOffset); aadOffset += encryptionTypeArray.length;
    aad.set(ephemeralPublicKey, aadOffset);

    // Encrypt using AES-GCM
    const encryptResult = await AESGCMService.encrypt(message, symKey, true, this.eciesConsts, aad);
    const { encrypted, iv } = encryptResult;
    const authTag = encryptResult.tag;

    if (!authTag) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption));
    }

    // Validate encrypted size is reasonable
    const maxEncryptedSize = message.length + 1024; // Allow overhead for encryption
    if (encrypted.length > maxEncryptedSize) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_EncryptedSizeExceedsExpected));
    }

    // Add length prefix for single mode
    const lengthArray =
      encryptionType === 'simple' ? new Uint8Array(0) : new Uint8Array(8);

    if (encryptionType === 'single') {
      const view = new DataView(lengthArray.buffer);
      view.setBigUint64(0, BigInt(message.length), false); // big-endian
    }

    // Format: [preamble] | version (1) | cipherSuite (1) | type (1) | ephemeralPublicKey (65) | iv (16) | authTag (16) | length (8) | encryptedData
    const result = new Uint8Array(
      preamble.length +
        versionArray.length +
        cipherSuiteArray.length +
        encryptionTypeArray.length +
        ephemeralPublicKey.length +
        iv.length +
        authTag.length +
        lengthArray.length +
        encrypted.length,
    );

    let offset = 0;
    result.set(preamble, offset);
    offset += preamble.length;
    result.set(versionArray, offset);
    offset += versionArray.length;
    result.set(cipherSuiteArray, offset);
    offset += cipherSuiteArray.length;
    result.set(encryptionTypeArray, offset);
    offset += encryptionTypeArray.length;
    result.set(ephemeralPublicKey, offset);
    offset += ephemeralPublicKey.length;
    result.set(iv, offset);
    offset += iv.length;
    result.set(authTag, offset);
    offset += authTag.length;
    result.set(lengthArray, offset);
    offset += lengthArray.length;
    result.set(encrypted, offset);

    return result;
  }

  /**
   * Parse encrypted message header
   */
  public parseEncryptedMessage(
    encryptionType: EciesEncryptionTypeEnum | undefined,
    data: Uint8Array,
    preambleSize: number = 0,
    options?: { dataLength?: number },
  ): {
    header: ISingleEncryptedParsedHeader;
    data: Uint8Array;
    remainder: Uint8Array;
  } {
    const engine = getEciesI18nEngine();
    let offset = preambleSize;
    const preamble = data.slice(0, preambleSize);

    // Read Version
    const version = data[offset];
    offset += this.eciesConsts.VERSION_SIZE;
    if (version !== EciesVersionEnum.V1) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_InvalidVersionTemplate, { version }));
    }

    // Read CipherSuite
    const cipherSuite = data[offset];
    offset += this.eciesConsts.CIPHER_SUITE_SIZE;
    if (cipherSuite !== EciesCipherSuiteEnum.Secp256k1_Aes256Gcm_Sha256) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_InvalidCipherSuiteTemplate, { cipherSuite }));
    }

    // Read encryption type from first byte after preamble and version/suite
    const actualEncryptionTypeByte = data[offset];
    let actualEncryptionType: EciesEncryptionTypeEnum;

    switch (actualEncryptionTypeByte) {
      case this.eciesConsts.ENCRYPTION_TYPE.SIMPLE:
        actualEncryptionType = EciesEncryptionTypeEnum.Simple;
        break;
      case this.eciesConsts.ENCRYPTION_TYPE.SINGLE:
        actualEncryptionType = EciesEncryptionTypeEnum.Single;
        break;
      case this.eciesConsts.ENCRYPTION_TYPE.MULTIPLE:
        throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode));
      default:
        // convert the encryption type byte to hex
        const encryptionTypeHex = actualEncryptionTypeByte.toString(16).padStart(2, '0');
        throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate, { encryptionType: encryptionTypeHex }));
    }

    if (
      encryptionType !== undefined &&
      actualEncryptionType !== encryptionType
    ) {
      throw new Error(
        engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate, { encryptionType, actualEncryptionType }),
      );
    }

    const includeLengthAndCrc =
      actualEncryptionType === EciesEncryptionTypeEnum.Single;
    const requiredSize = includeLengthAndCrc
      ? this.eciesConsts.SINGLE.FIXED_OVERHEAD_SIZE
      : this.eciesConsts.SIMPLE.FIXED_OVERHEAD_SIZE;

    if (data.length < requiredSize) {
      throw new Error(
        engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_DataTooShortTemplate, { requiredSize, dataLength: data.length }),
      );
    }

    // Skip encryption type byte
    offset += 1;

    // Extract header components
    const ephemeralPublicKey = data.slice(
      offset,
      offset + this.eciesConsts.PUBLIC_KEY_LENGTH,
    );
    offset += this.eciesConsts.PUBLIC_KEY_LENGTH;

    const normalizedKey =
      this.cryptoCore.normalizePublicKey(ephemeralPublicKey);

    const iv = data.slice(offset, offset + this.eciesConsts.IV_SIZE);
    offset += this.eciesConsts.IV_SIZE;

    const authTag = data.slice(offset, offset + this.eciesConsts.AUTH_TAG_SIZE);
    offset += this.eciesConsts.AUTH_TAG_SIZE;
    // Extract length for single mode
    const dataLengthArray = includeLengthAndCrc
      ? data.slice(offset, offset + this.eciesConsts.SINGLE.DATA_LENGTH_SIZE)
      : new Uint8Array(0);

    if (includeLengthAndCrc) {
      offset += this.eciesConsts.SINGLE.DATA_LENGTH_SIZE;
    }

    const dataLength = includeLengthAndCrc
      ? Number(
          new DataView(
            dataLengthArray.buffer,
            dataLengthArray.byteOffset,
            dataLengthArray.byteLength,
          ).getBigUint64(0, false),
        )
      : options?.dataLength ?? -1;

    // Validate data length is reasonable
    if (includeLengthAndCrc && (dataLength < 0 || dataLength > this.eciesConsts.MAX_RAW_DATA_SIZE)) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_InvalidDataLength));
    }

    if (
      includeLengthAndCrc &&
      options?.dataLength !== undefined &&
      dataLength !== options.dataLength
    ) {
      throw new Error(
        engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate, { expectedDataLength: dataLength, receivedDataLength: options.dataLength }),
      );
    }

    // No CRC in Single encryption (AES-GCM provides authentication)

    // For single mode, read all remaining data as encrypted data
    // The dataLength represents the original message length, not encrypted length
    const encryptedData = data.slice(offset);

    const remainder = new Uint8Array(0);

    // No CRC validation needed (AES-GCM provides authentication)

    return {
      header: {
        preamble,
        encryptionType: actualEncryptionType,
        ephemeralPublicKey: normalizedKey,
        iv,
        authTag,
        dataLength,
        headerSize: includeLengthAndCrc
          ? this.eciesConsts.SINGLE.FIXED_OVERHEAD_SIZE
          : this.eciesConsts.SIMPLE.FIXED_OVERHEAD_SIZE,
      },
      data: encryptedData,
      remainder,
    };
  }

  /**
   * Decrypt with header
   */
  public async decryptWithHeader(
    encryptionType: EciesEncryptionTypeEnum | undefined,
    privateKey: Uint8Array,
    encryptedData: Uint8Array,
    preambleSize: number = 0,
    options?: { dataLength?: number },
  ): Promise<Uint8Array> {
    const result = await this.decryptWithHeaderEx(
      encryptionType,
      privateKey,
      encryptedData,
      preambleSize,
      options,
    );
    return result.decrypted;
  }

  /**
   * Extended decrypt with header that returns additional info
   */
  public async decryptWithHeaderEx(
    encryptionType: EciesEncryptionTypeEnum | undefined,
    privateKey: Uint8Array,
    encryptedData: Uint8Array,
    preambleSize: number = 0,
    options?: { dataLength?: number },
  ): Promise<IDecryptionResult> {
    const { data, header } = this.parseEncryptedMessage(
      encryptionType,
      encryptedData,
      preambleSize,
      options,
    );

    // Construct AAD
    const versionArray = new Uint8Array([EciesVersionEnum.V1]);
    const cipherSuiteArray = new Uint8Array([EciesCipherSuiteEnum.Secp256k1_Aes256Gcm_Sha256]);
    const encryptionTypeArray = new Uint8Array([
      header.encryptionType === EciesEncryptionTypeEnum.Simple
        ? this.eciesConsts.ENCRYPTION_TYPE.SIMPLE
        : this.eciesConsts.ENCRYPTION_TYPE.SINGLE,
    ]);

    const preamble = header.preamble ?? new Uint8Array(preambleSize);

    const aad = new Uint8Array(
      preamble.length +
      versionArray.length +
      cipherSuiteArray.length +
      encryptionTypeArray.length +
      header.ephemeralPublicKey.length
    );
    
    let offset = 0;
    aad.set(preamble, offset); offset += preamble.length;
    aad.set(versionArray, offset); offset += versionArray.length;
    aad.set(cipherSuiteArray, offset); offset += cipherSuiteArray.length;
    aad.set(encryptionTypeArray, offset); offset += encryptionTypeArray.length;
    aad.set(header.ephemeralPublicKey, offset);

    const decrypted = await this.decryptWithComponents(
      privateKey,
      header.ephemeralPublicKey,
      header.iv,
      header.authTag,
      data,
      aad
    );

    return {
      decrypted,
      consumedBytes: preambleSize + header.headerSize + data.length,
    };
  }

  /**
   * Decrypt with individual components
   */
  public async decryptWithComponents(
    privateKey: Uint8Array,
    ephemeralPublicKey: Uint8Array,
    iv: Uint8Array,
    authTag: Uint8Array,
    encrypted: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    // Validate private key
    if (!privateKey || privateKey.length !== 32) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_InvalidPrivateKey));
    }
    
    // Check for all-zero private key
    let allZeros = true;
    for (let i = 0; i < privateKey.length; i++) {
      if (privateKey[i] !== 0) {
        allZeros = false;
        break;
      }
    }
    if (allZeros) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_InvalidPrivateKey));
    }

    // Validate IV
    if (!iv || iv.length !== this.eciesConsts.IV_SIZE) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_InvalidIV));
    }

    // Validate auth tag
    if (!authTag || authTag.length !== this.eciesConsts.AUTH_TAG_SIZE) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_InvalidAuthTag));
    }

    // Normalize ephemeral public key (this validates it's a valid key)
    const normalizedEphemeralKey =
      this.cryptoCore.normalizePublicKey(ephemeralPublicKey);

    // Compute shared secret
    const sharedSecret = this.cryptoCore.computeSharedSecret(
      privateKey,
      normalizedEphemeralKey,
    );

    // Validate shared secret is not all zeros
    let sharedSecretAllZeros = true;
    for (let i = 0; i < sharedSecret.length; i++) {
      if (sharedSecret[i] !== 0) {
        sharedSecretAllZeros = false;
        break;
      }
    }
    if (sharedSecretAllZeros) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_InvalidSharedSecret));
    }

    // Use HKDF to derive the key
    const symKey = this.cryptoCore.deriveSharedKey(
      sharedSecret,
      new Uint8Array(0), // No salt
      new TextEncoder().encode('ecies-v2-key-derivation'), // Info
      this.eciesConsts.SYMMETRIC.KEY_SIZE
    );

    // Combine encrypted data with auth tag for AES-GCM
    const encryptedWithTag = AESGCMService.combineEncryptedDataAndTag(
      encrypted,
      authTag,
    );

    // Decrypt
    return await AESGCMService.decrypt(iv, encryptedWithTag, symKey, true, this.eciesConsts, aad);
  }

  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    
    // Constant-time comparison to prevent timing attacks
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
  }
}
