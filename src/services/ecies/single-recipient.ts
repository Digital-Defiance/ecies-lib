import { IECIESConstants } from '../../interfaces/ecies-consts';
import { ECIES } from '../../constants';
import {
  EciesEncryptionType,
  EciesEncryptionTypeEnum,
} from '../../enumerations/ecies-encryption-type';
import { IECIESConfig } from '../../interfaces/ecies-config';
import { AESGCMService } from '../aes-gcm';

import { EciesCryptoCore } from './crypto-core';
import { IDecryptionResult, ISingleEncryptedParsedHeader } from './interfaces';

/**
 * Browser-compatible single recipient ECIES encryption/decryption
 */
export class EciesSingleRecipient {
  protected readonly cryptoCore: EciesCryptoCore;
  protected readonly config: IECIESConfig;
  protected readonly eciesConsts: IECIESConstants;

  constructor(config: IECIESConfig, eciesParams?: IECIESConstants) {
    this.config = config;
    this.eciesConsts = eciesParams ?? ECIES;
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

    if (message.length > this.eciesConsts.MAX_RAW_DATA_SIZE) {
      throw new Error(
        `Message length exceeds maximum allowed size: ${message.length}`,
      );
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

    // Use first 32 bytes as symmetric key
    const symKey = sharedSecret.slice(0, this.eciesConsts.SYMMETRIC.KEY_SIZE);

    // Encrypt using AES-GCM
    const encryptResult = await AESGCMService.encrypt(message, symKey, true, this.eciesConsts);
    const { encrypted, iv } = encryptResult;
    const authTag = encryptResult.tag;

    if (!authTag) {
      throw new Error('Authentication tag is required for ECIES encryption');
    }

    // Add length prefix for single mode
    const lengthArray =
      encryptionType === 'simple' ? new Uint8Array(0) : new Uint8Array(8);

    if (encryptionType === 'single') {
      const view = new DataView(lengthArray.buffer);
      view.setBigUint64(0, BigInt(message.length), false); // big-endian
    }

    // Format: [preamble] | type (1) | ephemeralPublicKey (65) | iv (16) | authTag (16) | length (8) | encryptedData
    const result = new Uint8Array(
      preamble.length +
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
    // Read encryption type from first byte after preamble
    const actualEncryptionTypeByte = data[preambleSize];
    let actualEncryptionType: EciesEncryptionTypeEnum;

    switch (actualEncryptionTypeByte) {
      case this.eciesConsts.ENCRYPTION_TYPE.SIMPLE:
        actualEncryptionType = EciesEncryptionTypeEnum.Simple;
        break;
      case this.eciesConsts.ENCRYPTION_TYPE.SINGLE:
        actualEncryptionType = EciesEncryptionTypeEnum.Single;
        break;
      case this.eciesConsts.ENCRYPTION_TYPE.MULTIPLE:
        throw new Error(
          'Multiple encryption type not supported in single recipient mode',
        );
      default:
        throw new Error(`Invalid encryption type: ${actualEncryptionTypeByte}`);
    }

    if (
      encryptionType !== undefined &&
      actualEncryptionType !== encryptionType
    ) {
      throw new Error(
        `Encryption type mismatch: expected ${encryptionType}, got ${actualEncryptionType}`,
      );
    }

    const includeLengthAndCrc =
      actualEncryptionType === EciesEncryptionTypeEnum.Single;
    const requiredSize = includeLengthAndCrc
      ? this.eciesConsts.SINGLE.FIXED_OVERHEAD_SIZE
      : this.eciesConsts.SIMPLE.FIXED_OVERHEAD_SIZE;

    if (data.length < requiredSize) {
      throw new Error(
        `Data too short: required ${requiredSize}, got ${data.length}`,
      );
    }

    let offset = preambleSize;
    const preamble = data.slice(0, preambleSize);

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

    if (
      includeLengthAndCrc &&
      options?.dataLength !== undefined &&
      dataLength !== options.dataLength
    ) {
      throw new Error(
        `Data length mismatch: expected ${dataLength}, got ${options.dataLength}`,
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

    const decrypted = await this.decryptWithComponents(
      privateKey,
      header.ephemeralPublicKey,
      header.iv,
      header.authTag,
      data,
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
  ): Promise<Uint8Array> {
    // Normalize ephemeral public key
    const normalizedEphemeralKey =
      this.cryptoCore.normalizePublicKey(ephemeralPublicKey);

    // Compute shared secret
    const sharedSecret = this.cryptoCore.computeSharedSecret(
      privateKey,
      normalizedEphemeralKey,
    );

    // Use first 32 bytes as symmetric key
    const symKey = sharedSecret.slice(0, this.eciesConsts.SYMMETRIC.KEY_SIZE);

    // Combine encrypted data with auth tag for AES-GCM
    const encryptedWithTag = AESGCMService.combineEncryptedDataAndTag(
      encrypted,
      authTag,
    );

    // Decrypt
    return await AESGCMService.decrypt(iv, encryptedWithTag, symKey, true, this.eciesConsts);
  }

  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
