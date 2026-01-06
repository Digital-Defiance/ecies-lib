import { Constants } from '../../constants';
import { EciesCipherSuiteEnum } from '../../enumerations/ecies-cipher-suite';
import { EciesEncryptionTypeEnum } from '../../enumerations/ecies-encryption-type';
import { EciesStringKey } from '../../enumerations/ecies-string-key';
import { EciesVersionEnum } from '../../enumerations/ecies-version';
import { EciesComponentId, getEciesI18nEngine } from '../../i18n-setup';
import { IECIESConfig } from '../../interfaces/ecies-config';
import { IECIESConstants } from '../../interfaces/ecies-consts';
import { concatUint8Arrays } from '../../utils';
import { AESGCMService } from '../aes-gcm';
import { EciesCryptoCore } from './crypto-core';
import {
  IMultiEncryptedMessage,
  IMultiEncryptedParsedHeader,
  IMultiRecipient,
} from './interfaces';

/**
 * Browser-compatible multi-recipient ECIES encryption/decryption
 */
export class EciesMultiRecipient {
  protected readonly cryptoCore: EciesCryptoCore;
  protected readonly eciesConsts: IECIESConstants;

  constructor(
    config: IECIESConfig,
    eciesParams: IECIESConstants = Constants.ECIES,
  ) {
    this.cryptoCore = new EciesCryptoCore(config, eciesParams);
    this.eciesConsts = eciesParams;
  }

  /**
   * Get the header size for multi-recipient encryption
   */
  public getHeaderSize(recipientCount: number): number {
    return (
      this.eciesConsts.VERSION_SIZE +
      this.eciesConsts.CIPHER_SUITE_SIZE +
      this.eciesConsts.ENCRYPTION_TYPE_SIZE +
      this.eciesConsts.PUBLIC_KEY_LENGTH + // Shared ephemeral public key
      this.eciesConsts.MULTIPLE.DATA_LENGTH_SIZE +
      this.eciesConsts.MULTIPLE.RECIPIENT_COUNT_SIZE +
      recipientCount * this.eciesConsts.MULTIPLE.RECIPIENT_ID_SIZE +
      recipientCount * this.eciesConsts.MULTIPLE.ENCRYPTED_KEY_SIZE
    );
  }

  /**
   * Encrypt a message symmetric key with a public key
   * @param receiverPublicKey The public key of the receiver
   * @param messageSymmetricKey The message to encrypt
   * @param ephemeralPrivateKey The ephemeral private key to use for encryption
   * @param aad Additional Authenticated Data (optional)
   * @returns The encrypted message (IV + Tag + EncryptedKey)
   */
  public async encryptKey(
    receiverPublicKey: Uint8Array,
    messageSymmetricKey: Uint8Array,
    ephemeralPrivateKey: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    const sharedSecret = await this.cryptoCore.computeSharedSecret(
      ephemeralPrivateKey,
      receiverPublicKey,
    );

    // Use HKDF to derive the key
    const symKey = this.cryptoCore.deriveSharedKey(
      sharedSecret,
      new Uint8Array(0), // No salt
      new TextEncoder().encode('ecies-v2-key-derivation'), // Info
      this.eciesConsts.SYMMETRIC.KEY_SIZE,
    );

    const encryptResult = await AESGCMService.encrypt(
      messageSymmetricKey,
      symKey,
      true,
      this.eciesConsts,
      aad,
    );
    const { encrypted, iv } = encryptResult;
    const authTag = encryptResult.tag;

    if (!authTag) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForKeyEncryption,
        ),
      );
    }

    return concatUint8Arrays(iv, authTag, encrypted);
  }

  /**
   * Decrypts symmetric key encrypted with ECIES
   * @param privateKey The private key to decrypt the data
   * @param encryptedKey The data to decrypt
   * @param ephemeralPublicKey The ephemeral public key from the header
   * @param aad Additional Authenticated Data (optional)
   * @returns The decrypted data buffer
   */
  public async decryptKey(
    privateKey: Uint8Array,
    encryptedKey: Uint8Array,
    ephemeralPublicKey: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    if (encryptedKey.length !== this.eciesConsts.MULTIPLE.ENCRYPTED_KEY_SIZE) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate,
          {
            keySize: this.eciesConsts.MULTIPLE.ENCRYPTED_KEY_SIZE,
            encryptedKeyLength: encryptedKey.length,
          },
        ),
      );
    }

    const iv = encryptedKey.slice(0, this.eciesConsts.IV_SIZE);
    const authTag = encryptedKey.slice(
      this.eciesConsts.IV_SIZE,
      this.eciesConsts.IV_SIZE + this.eciesConsts.AUTH_TAG_SIZE,
    );
    const encrypted = encryptedKey.slice(
      this.eciesConsts.IV_SIZE + this.eciesConsts.AUTH_TAG_SIZE,
    );

    const sharedSecret = await this.cryptoCore.computeSharedSecret(
      privateKey,
      ephemeralPublicKey,
    );

    // Use HKDF to derive the key
    const symKey = this.cryptoCore.deriveSharedKey(
      sharedSecret,
      new Uint8Array(0), // No salt
      new TextEncoder().encode('ecies-v2-key-derivation'), // Info
      this.eciesConsts.SYMMETRIC.KEY_SIZE,
    );

    const encryptedWithTag = AESGCMService.combineEncryptedDataAndTag(
      encrypted,
      authTag,
    );

    try {
      const decrypted = await AESGCMService.decrypt(
        iv,
        encryptedWithTag,
        symKey,
        true,
        this.eciesConsts,
        aad,
      );
      if (decrypted.length !== this.eciesConsts.SYMMETRIC.KEY_SIZE) {
        const engine = getEciesI18nEngine();
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_ECIESError_InvalidDataLength,
          ),
        );
      }
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt key:', error);
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_FailedToDecryptKey,
        ),
      );
    }
  }

  /**
   * Encrypt a message for multiple recipients
   */
  public async encryptMultiple(
    recipients: IMultiRecipient[],
    message: Uint8Array,
    preamble: Uint8Array = new Uint8Array(0),
    senderPrivateKey?: Uint8Array,
  ): Promise<IMultiEncryptedMessage> {
    const engine = getEciesI18nEngine();
    if (recipients.length > this.eciesConsts.MULTIPLE.MAX_RECIPIENTS) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate,
          { recipientsCount: recipients.length },
        ),
      );
    }

    // Sign-then-Encrypt: If sender key provided, sign the message and prepend signature
    let messageToEncrypt = message;
    if (senderPrivateKey) {
      const signature = this.cryptoCore.sign(senderPrivateKey, message);
      messageToEncrypt = concatUint8Arrays(signature, message);
    }

    if (messageToEncrypt.length > this.eciesConsts.MAX_RAW_DATA_SIZE) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_MessageTooLargeTemplate,
          { length: messageToEncrypt.length },
        ),
      );
    }

    // Generate symmetric key
    const symmetricKey = crypto.getRandomValues(
      new Uint8Array(this.eciesConsts.SYMMETRIC.KEY_SIZE),
    );

    // Generate ONE ephemeral key pair for all recipients
    const ephemeralKeyPair = await this.cryptoCore.generateEphemeralKeyPair();

    // Encrypt symmetric key for each recipient
    const recipientIds: Uint8Array[] = [];
    const recipientKeys: Uint8Array[] = [];

    for (const recipient of recipients) {
      // Use Recipient ID bytes as AAD for key encryption to bind key to recipient
      const encryptedKey = await this.encryptKey(
        recipient.publicKey,
        symmetricKey,
        ephemeralKeyPair.privateKey,
        Constants.idProvider.toBytes(recipient.id),
      );

      recipientIds.push(recipient.id);
      recipientKeys.push(encryptedKey);
    }

    const headerSize = this.getHeaderSize(recipients.length);

    // Build the header to use as AAD for message encryption
    // We need to construct a temporary object to build the header
    const tempHeaderData: IMultiEncryptedMessage = {
      dataLength: messageToEncrypt.length,
      recipientCount: recipients.length,
      recipientIds,
      recipientKeys,
      encryptedMessage: new Uint8Array(0), // Placeholder
      headerSize,
      ephemeralPublicKey: ephemeralKeyPair.publicKey,
    };

    const headerBytes = this.buildHeader(tempHeaderData);

    // Encrypt message with symmetric key, using Header as AAD
    const encryptResult = await AESGCMService.encrypt(
      messageToEncrypt,
      symmetricKey,
      true,
      this.eciesConsts,
      headerBytes, // Bind header to ciphertext
    );
    const { encrypted, iv } = encryptResult;
    const authTag = encryptResult.tag;

    if (!authTag) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption,
        ),
      );
    }

    // Create stored message: preamble + iv + authTag + encrypted
    const storedMessage = concatUint8Arrays(preamble, iv, authTag, encrypted);

    return {
      dataLength: messageToEncrypt.length,
      recipientCount: recipients.length,
      recipientIds,
      recipientKeys,
      encryptedMessage: storedMessage,
      headerSize,
      ephemeralPublicKey: ephemeralKeyPair.publicKey,
    };
  }

  /**
   * Decrypt a multi-recipient message for a specific recipient
   */
  public async decryptMultipleForRecipient(
    encryptedData: IMultiEncryptedMessage,
    recipientId: Uint8Array,
    privateKey: Uint8Array,
    senderPublicKey?: Uint8Array,
  ): Promise<Uint8Array> {
    // Find recipient's encrypted key
    const recipientIndex = encryptedData.recipientIds.findIndex((id) =>
      this.arraysEqual(id, recipientId),
    );

    if (recipientIndex === -1) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_RecipientNotFound,
        ),
      );
    }

    const encryptedKey = encryptedData.recipientKeys[recipientIndex];

    // Decrypt the symmetric key using the shared ephemeral public key
    if (!encryptedData.ephemeralPublicKey) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_MissingEphemeralPublicKey,
        ),
      );
    }

    // Use Recipient ID bytes as AAD for key decryption
    const symmetricKey = await this.decryptKey(
      privateKey,
      encryptedKey,
      encryptedData.ephemeralPublicKey,
      recipientId,
    );

    // Rebuild header to use as AAD
    const headerBytes = this.buildHeader(encryptedData);

    // Extract components from encrypted message
    let offset = 0;
    const iv = encryptedData.encryptedMessage.slice(
      offset,
      offset + this.eciesConsts.IV_SIZE,
    );
    offset += this.eciesConsts.IV_SIZE;

    const authTag = encryptedData.encryptedMessage.slice(
      offset,
      offset + this.eciesConsts.AUTH_TAG_SIZE,
    );
    offset += this.eciesConsts.AUTH_TAG_SIZE;

    const encrypted = encryptedData.encryptedMessage.slice(offset);

    // AES-GCM provides authentication via auth tag (no separate CRC needed)

    // Decrypt with symmetric key and Header as AAD
    const encryptedWithTag = AESGCMService.combineEncryptedDataAndTag(
      encrypted,
      authTag,
    );

    const decrypted = await AESGCMService.decrypt(
      iv,
      encryptedWithTag,
      symmetricKey,
      true,
      this.eciesConsts,
      headerBytes,
    );

    // Verify length
    if (decrypted.length !== encryptedData.dataLength) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch,
        ),
      );
    }

    // If sender public key is provided, verify signature
    if (senderPublicKey) {
      // Expect [Signature (64)][Message]
      if (decrypted.length < 64) {
        throw new Error('Decrypted data too short to contain signature');
      }
      const signature = decrypted.slice(0, 64);
      const message = decrypted.slice(64);

      const isValid = this.cryptoCore.verify(
        senderPublicKey,
        message,
        signature,
      );
      if (!isValid) {
        throw new Error('Invalid sender signature');
      }

      return message;
    }

    return decrypted;
  }

  /**
   * Build header for multi-recipient message
   */
  public buildHeader(data: IMultiEncryptedMessage): Uint8Array {
    if (data.recipientIds.length !== data.recipientKeys.length) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_RecipientCountMismatch,
        ),
      );
    }

    if (
      data.dataLength < 0 ||
      data.dataLength > this.eciesConsts.MAX_RAW_DATA_SIZE
    ) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidDataLength,
        ),
      );
    }

    const versionArray = new Uint8Array([EciesVersionEnum.V1]);
    const cipherSuiteArray = new Uint8Array([
      EciesCipherSuiteEnum.Secp256k1_Aes256Gcm_Sha256,
    ]);
    const encryptionTypeArray = new Uint8Array([
      EciesEncryptionTypeEnum.Multiple,
    ]);

    if (!data.ephemeralPublicKey) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_MissingEphemeralPublicKey,
        ),
      );
    }

    // Data length (8 bytes)
    // We use the most significant byte (MSB) to store the recipient ID size
    // This allows parsing the header without knowing the configured ID provider
    // Max data size is 2^53-1, so the top byte is always 0 for valid data lengths
    const recipientIdSize = this.eciesConsts.MULTIPLE.RECIPIENT_ID_SIZE;
    if (recipientIdSize > 255) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_RecipientIdSizeTooLargeTemplate,
          { size: recipientIdSize },
        ),
      );
    }

    const dataLengthBigInt = BigInt(data.dataLength);
    const recipientIdSizeBigInt = BigInt(recipientIdSize);
    const combinedLength = (recipientIdSizeBigInt << 56n) | dataLengthBigInt;

    const dataLengthUint8Array = new Uint8Array(8);
    new DataView(dataLengthUint8Array.buffer).setBigUint64(
      0,
      combinedLength,
      false,
    );

    // Recipient count (2 bytes)
    const recipientCountUint8Array = new Uint8Array(2);
    new DataView(recipientCountUint8Array.buffer).setUint16(
      0,
      data.recipientIds.length,
      false,
    );

    // Recipient IDs
    const recipientIdsUint8Array = concatUint8Arrays(...data.recipientIds);

    // Encrypted keys
    const encryptedKeysUint8Array = concatUint8Arrays(...data.recipientKeys);

    return concatUint8Arrays(
      versionArray,
      cipherSuiteArray,
      encryptionTypeArray,
      data.ephemeralPublicKey,
      dataLengthUint8Array,
      recipientCountUint8Array,
      recipientIdsUint8Array,
      encryptedKeysUint8Array,
    );
  }

  /**
   * Parse multi-recipient header
   */
  public parseHeader(data: Uint8Array): IMultiEncryptedParsedHeader {
    const engine = getEciesI18nEngine();
    // minimum: 1 (ver) + 1 (suite) + 1 (type) + 33 (pubkey) + 8 (len) + 2 (count) = 46
    if (data.length < 46) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader,
        ),
      );
    }

    let offset = 0;
    const view = new DataView(data.buffer, data.byteOffset);

    // Read Version
    const version = data[offset];
    offset += this.eciesConsts.VERSION_SIZE;
    if (version !== EciesVersionEnum.V1) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidVersionTemplate,
          { version },
        ),
      );
    }

    // Read CipherSuite
    const cipherSuite = data[offset];
    offset += this.eciesConsts.CIPHER_SUITE_SIZE;
    if (cipherSuite !== EciesCipherSuiteEnum.Secp256k1_Aes256Gcm_Sha256) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidCipherSuiteTemplate,
          { cipherSuite },
        ),
      );
    }

    // Read Encryption Type
    const encryptionType = data[offset];
    offset += this.eciesConsts.ENCRYPTION_TYPE_SIZE;
    if (encryptionType !== EciesEncryptionTypeEnum.Multiple) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate,
          { encryptionType: encryptionType.toString(16) },
        ),
      );
    }

    // Read Ephemeral Public Key
    const ephemeralPublicKey = data.slice(
      offset,
      offset + this.eciesConsts.PUBLIC_KEY_LENGTH,
    );
    offset += this.eciesConsts.PUBLIC_KEY_LENGTH;

    // Read data length and recipient ID size
    const combinedLength = view.getBigUint64(offset, false);
    offset += 8;

    // Extract recipient ID size from MSB (top 8 bits)
    const storedRecipientIdSize = Number(combinedLength >> 56n);

    // Extract data length from lower 56 bits
    const dataLength = Number(combinedLength & 0x00ffffffffffffffn);

    if (dataLength <= 0 || dataLength > this.eciesConsts.MAX_RAW_DATA_SIZE) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidDataLength,
        ),
      );
    }

    // Use stored recipient ID size if available (non-legacy), otherwise fallback to config
    const recipientIdSize =
      storedRecipientIdSize > 0
        ? storedRecipientIdSize
        : this.eciesConsts.MULTIPLE.RECIPIENT_ID_SIZE;

    // Read recipient count
    const recipientCount = view.getUint16(offset, false);
    offset += 2;

    if (
      recipientCount <= 0 ||
      recipientCount > this.eciesConsts.MULTIPLE.MAX_RECIPIENTS
    ) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidRecipientCount,
        ),
      );
    }

    // Read recipient IDs
    const recipientIds: Uint8Array[] = [];
    for (let i = 0; i < recipientCount; i++) {
      recipientIds.push(data.slice(offset, offset + recipientIdSize));
      offset += recipientIdSize;
    }

    // Read encrypted keys
    const recipientKeys: Uint8Array[] = [];
    for (let i = 0; i < recipientCount; i++) {
      recipientKeys.push(
        data.slice(
          offset,
          offset + this.eciesConsts.MULTIPLE.ENCRYPTED_KEY_SIZE,
        ),
      );
      offset += this.eciesConsts.MULTIPLE.ENCRYPTED_KEY_SIZE;
    }

    return {
      dataLength,
      recipientCount,
      recipientIds,
      recipientKeys,
      headerSize: offset,
      ephemeralPublicKey,
    };
  }

  /**
   * Parse complete multi-recipient message
   */
  public parseMessage(data: Uint8Array): IMultiEncryptedMessage {
    const header = this.parseHeader(data);
    const encryptedMessage = data.slice(header.headerSize);

    return {
      ...header,
      encryptedMessage,
    };
  }

  /**
   * Parse multi-encrypted header (alias for parseHeader)
   */
  public parseMultiEncryptedHeader(
    data: Uint8Array,
  ): IMultiEncryptedParsedHeader {
    return this.parseHeader(data);
  }

  /**
   * Build ECIES multiple recipient header (alias for buildHeader)
   */
  public buildECIESMultipleRecipientHeader(
    data: IMultiEncryptedMessage,
  ): Uint8Array {
    return this.buildHeader(data);
  }

  /**
   * Decrypt multiple ECIE for recipient (alias for decryptMultipleForRecipient)
   */
  public async decryptMultipleECIEForRecipient(
    encryptedData: IMultiEncryptedMessage,
    recipient: { idBytes: Uint8Array; privateKey?: { value: Uint8Array } },
  ): Promise<Uint8Array> {
    const privateKey = recipient.privateKey?.value || new Uint8Array();
    return this.decryptMultipleForRecipient(
      encryptedData,
      recipient.idBytes,
      privateKey,
    );
  }

  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
