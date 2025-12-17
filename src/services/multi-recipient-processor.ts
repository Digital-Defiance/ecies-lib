import { Constants } from '../constants';
import { EciesStringKey } from '../enumerations';
import { EciesComponentId, getEciesI18nEngine } from '../i18n-setup';
import { IConstants } from '../interfaces/constants';
import {
  IMultiRecipientChunk,
  IMultiRecipientChunkHeader,
  IMultiRecipientConstants,
  IRecipientHeader,
  getMultiRecipientConstants,
} from '../interfaces/multi-recipient-chunk';
import { concatUint8Arrays } from '../utils';
import { AESGCMService } from './aes-gcm';
import { ECIESService } from './ecies/service';

/**
 * Processes multi-recipient chunks using symmetric encryption.
 * Supports dynamic recipient ID sizes based on the configured ID provider.
 */
export class MultiRecipientProcessor {
  private readonly recipientIdSize: number;
  private readonly constants: IMultiRecipientConstants;

  /**
   * Create a new multi-recipient processor.
   * @param ecies - ECIES service for key encryption
   * @param config - Configuration containing ID provider (defaults to global Constants)
   */
  constructor(
    private readonly ecies: ECIESService,
    private readonly config: IConstants = Constants,
  ) {
    this.recipientIdSize = config.idProvider.byteLength;
    this.constants = getMultiRecipientConstants(this.recipientIdSize);
  }

  /**
   * Encrypt chunk for multiple recipients
   */
  async encryptChunk(
    data: Uint8Array,
    recipients: Array<{ id: Uint8Array; publicKey: Uint8Array }>,
    chunkIndex: number,
    isLast: boolean,
    symmetricKey: Uint8Array,
    senderPrivateKey?: Uint8Array,
  ): Promise<IMultiRecipientChunk> {
    // Validate inputs
    const engine = getEciesI18nEngine();
    if (
      recipients.length === 0 ||
      recipients.length > this.constants.MAX_RECIPIENTS
    ) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_InvalidRecipientCountTemplate,
          { count: recipients.length },
        ),
      );
    }
    if (symmetricKey.length !== 32) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_SymmetricKeyMust32Bytes,
        ),
      );
    }
    if (chunkIndex < 0 || chunkIndex > 0xffffffff) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_InvalidChunkIndexTemplate,
          { index: chunkIndex },
        ),
      );
    }

    // Sign-then-Encrypt
    let dataToEncrypt = data;
    if (senderPrivateKey) {
      const signature = this.ecies.core.sign(senderPrivateKey, data);
      dataToEncrypt = concatUint8Arrays(signature, data);
    }

    if (dataToEncrypt.length > 0x7fffffff) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_DataSizeExceedsMaximumTemplate,
          { size: dataToEncrypt.length },
        ),
      );
    }

    // Check for duplicate recipient IDs
    const seenIds = new Set<string>();
    for (const recipient of recipients) {
      const idStr = Buffer.from(recipient.id).toString('hex');
      if (seenIds.has(idStr)) {
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_MultiRecipient_DuplicateRecipientId,
          ),
        );
      }
      seenIds.add(idStr);
    }

    // Generate ONE ephemeral key pair for all recipients
    const ephemeralKeyPair = await this.ecies.core.generateEphemeralKeyPair();

    // Build recipient headers
    const recipientHeaders: IRecipientHeader[] = [];
    for (const recipient of recipients) {
      if (recipient.id.length !== this.recipientIdSize) {
        throw new Error(
          `Recipient ID must be ${this.recipientIdSize} bytes (configured by ID provider), got ${recipient.id.length} bytes`,
        );
      }

      // Use Recipient ID as AAD for key encryption
      const encryptedKey = await this.ecies.encryptKey(
        recipient.publicKey,
        symmetricKey,
        ephemeralKeyPair.privateKey,
        recipient.id,
      );

      recipientHeaders.push({
        id: recipient.id,
        keySize: encryptedKey.length,
        encryptedKey,
      });
    }

    // Calculate sizes with overflow check
    let recipientHeadersSize = 0;
    for (const h of recipientHeaders) {
      const headerSize =
        this.recipientIdSize + this.constants.KEY_SIZE_BYTES + h.keySize;
      if (recipientHeadersSize + headerSize < recipientHeadersSize) {
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_MultiRecipient_RecipientHeadersSizeOverflow,
          ),
        );
      }
      recipientHeadersSize += headerSize;
    }

    // Calculate encrypted size (Data + Tag)
    // AES-GCM tag is 16 bytes
    const encryptedSize = dataToEncrypt.length + 16;

    const totalSize =
      this.constants.HEADER_SIZE +
      recipientHeadersSize +
      Constants.ECIES.IV_SIZE + // IV
      encryptedSize;

    // Check for integer overflow (max safe: 2^31 - 1 for Uint8Array)
    if (totalSize > 0x7fffffff || totalSize < 0) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_ChunkSizeOverflow,
        ),
      );
    }

    // Build chunk buffer
    const chunk = new Uint8Array(totalSize);
    const view = new DataView(chunk.buffer);
    let offset = 0;

    // Write header
    view.setUint32(offset, this.constants.MAGIC, false);
    offset += 4;
    view.setUint16(offset, this.constants.VERSION, false);
    offset += 2;
    view.setUint16(offset, recipients.length, false);
    offset += 2;
    view.setUint32(offset, chunkIndex, false);
    offset += 4;
    view.setUint32(offset, dataToEncrypt.length, false); // Original Size (includes signature if present)
    offset += 4;
    view.setUint32(offset, encryptedSize, false);
    offset += 4;
    view.setUint8(offset, isLast ? this.constants.FLAG_IS_LAST : 0);
    offset += 1;

    // Write Ephemeral Public Key (33 bytes)
    chunk.set(ephemeralKeyPair.publicKey, offset);
    offset += 33;

    // Padding to HEADER_SIZE (64 bytes)
    offset = this.constants.HEADER_SIZE;

    // Write recipient headers
    for (const header of recipientHeaders) {
      chunk.set(header.id, offset);
      offset += this.recipientIdSize;
      view.setUint16(offset, header.keySize, false);
      offset += this.constants.KEY_SIZE_BYTES;
      chunk.set(header.encryptedKey, offset);
      offset += header.keySize;
    }

    // Extract the full header (including recipient headers) to use as AAD
    const headerBytes = chunk.slice(0, offset);

    // Encrypt data with AES-256-GCM using Header as AAD
    const encryptResult = await AESGCMService.encrypt(
      dataToEncrypt,
      symmetricKey,
      true, // Return tag separately
      Constants.ECIES,
      headerBytes, // AAD
    );

    // Write IV
    chunk.set(encryptResult.iv, offset);
    offset += Constants.ECIES.IV_SIZE;

    // Write encrypted data
    chunk.set(encryptResult.encrypted, offset);
    offset += encryptResult.encrypted.length;

    // Write auth tag
    if (encryptResult.tag) {
      chunk.set(encryptResult.tag, offset);
    }

    return {
      index: chunkIndex,
      data: chunk,
      isLast,
      recipientCount: recipients.length,
    };
  }

  /**
   * Decrypt chunk for specific recipient
   */
  async decryptChunk(
    chunkData: Uint8Array,
    recipientId: Uint8Array,
    privateKey: Uint8Array,
    senderPublicKey?: Uint8Array,
  ): Promise<{ data: Uint8Array; header: IMultiRecipientChunkHeader }> {
    const engine = getEciesI18nEngine();
    if (chunkData.length < this.constants.HEADER_SIZE) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_ChunkTooSmall,
        ),
      );
    }

    const view = new DataView(chunkData.buffer, chunkData.byteOffset);
    let offset = 0;

    // Parse header
    const magic = view.getUint32(offset, false);
    offset += 4;
    if (magic !== this.constants.MAGIC) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_InvalidChunkMagic,
        ),
      );
    }

    const version = view.getUint16(offset, false);
    offset += 2;
    if (version !== this.constants.VERSION) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_UnsupportedVersionTemplate,
          { version },
        ),
      );
    }

    const recipientCount = view.getUint16(offset, false);
    offset += 2;
    if (
      recipientCount === 0 ||
      recipientCount > this.constants.MAX_RECIPIENTS
    ) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_InvalidRecipientCountTemplate,
          { count: recipientCount },
        ),
      );
    }
    const chunkIndex = view.getUint32(offset, false);
    offset += 4;
    const originalSize = view.getUint32(offset, false);
    offset += 4;
    const encryptedSize = view.getUint32(offset, false);
    offset += 4;
    const flags = view.getUint8(offset);
    offset += 1;

    // Read Ephemeral Public Key (33 bytes)
    const ephemeralPublicKey = chunkData.slice(offset, offset + 33);
    offset += 33;

    offset = this.constants.HEADER_SIZE;

    // Validate encryptedSize against chunk size
    // We know it must be at least HEADER + IV + EncryptedSize (which includes tag)
    const minChunkSize =
      this.constants.HEADER_SIZE + Constants.ECIES.IV_SIZE + encryptedSize;
    if (chunkData.length < minChunkSize) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_ChunkTooSmallForEncryptedSize,
        ),
      );
    }

    // Find recipient header and decrypt symmetric key
    let symmetricKey: Uint8Array | null = null;
    let tempOffset = offset;

    for (let i = 0; i < recipientCount; i++) {
      // Check if we have enough data for recipient ID
      if (tempOffset + this.recipientIdSize > chunkData.length) {
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_MultiRecipient_ChunkTruncatedRecipientId,
          ),
        );
      }

      const id = chunkData.slice(tempOffset, tempOffset + this.recipientIdSize);
      tempOffset += this.recipientIdSize;

      // Check if we have enough data for keySize field
      if (tempOffset + this.constants.KEY_SIZE_BYTES > chunkData.length) {
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_MultiRecipient_ChunkTruncatedKeySize,
          ),
        );
      }

      const keySize = view.getUint16(tempOffset, false);
      tempOffset += this.constants.KEY_SIZE_BYTES;

      // Validate keySize (typical ECIES: 100-400 bytes)
      if (keySize === 0 || keySize > 1000) {
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_MultiRecipient_InvalidKeySizeTemplate,
            { size: keySize },
          ),
        );
      }

      // Check if we have enough data for the encrypted key
      if (tempOffset + keySize > chunkData.length) {
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_MultiRecipient_ChunkTruncatedEncryptedKey,
          ),
        );
      }

      const encryptedKey = chunkData.slice(tempOffset, tempOffset + keySize);
      tempOffset += keySize;

      // Check if this is our recipient
      if (this.arraysEqual(id, recipientId)) {
        // Use Recipient ID as AAD for key decryption
        symmetricKey = await this.ecies.decryptKey(
          privateKey,
          encryptedKey,
          ephemeralPublicKey,
          id,
        );
        // Don't break - need to skip all recipient headers
      }
    }

    if (!symmetricKey) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_RecipientNotFoundInChunk,
        ),
      );
    }

    // Update offset to after all recipient headers
    offset = tempOffset;

    // Extract header bytes for AAD
    const headerBytes = chunkData.slice(0, offset);

    // Read IV
    if (offset + Constants.ECIES.IV_SIZE > chunkData.length) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_ChunkTooSmall,
        ),
      );
    }
    const iv = chunkData.slice(offset, offset + Constants.ECIES.IV_SIZE);
    offset += Constants.ECIES.IV_SIZE;

    // Read encrypted data (includes auth tag)
    if (offset + encryptedSize > chunkData.length) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_MultiRecipient_ChunkTooSmall,
        ),
      );
    }
    const encryptedWithTag = chunkData.slice(offset, offset + encryptedSize);
    offset += encryptedSize;

    // Decrypt with AAD
    const decrypted = await AESGCMService.decrypt(
      iv,
      encryptedWithTag,
      symmetricKey,
      true,
      Constants.ECIES,
      headerBytes,
    );

    // Verify signature if sender public key provided
    let finalData = decrypted;
    if (senderPublicKey) {
      if (decrypted.length < 64) {
        throw new Error('Decrypted chunk too short to contain signature');
      }
      const signature = decrypted.slice(0, 64);
      const message = decrypted.slice(64);

      const isValid = this.ecies.core.verify(
        senderPublicKey,
        message,
        signature,
      );
      if (!isValid) {
        throw new Error('Invalid sender signature in chunk');
      }
      finalData = message;
    }

    return {
      data: finalData,
      header: {
        magic,
        version,
        recipientCount,
        chunkIndex,
        originalSize,
        encryptedSize,
        flags,
      },
    };
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
