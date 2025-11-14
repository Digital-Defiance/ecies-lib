import { ECIESService } from './ecies/service';
import {
  IMultiRecipientChunk,
  IMultiRecipientChunkHeader,
  IRecipientHeader,
  MULTI_RECIPIENT_CONSTANTS,
} from '../interfaces/multi-recipient-chunk';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { EciesComponentId, getEciesI18nEngine } from '../i18n-setup';
import { EciesStringKey } from '../enumerations';

/**
 * Processes multi-recipient chunks using symmetric encryption
 */
export class MultiRecipientProcessor {
  constructor(private readonly ecies: ECIESService) {}

  /**
   * Encrypt chunk for multiple recipients
   */
  async encryptChunk(
    data: Uint8Array,
    recipients: Array<{ id: Uint8Array; publicKey: Uint8Array }>,
    chunkIndex: number,
    isLast: boolean,
    symmetricKey: Uint8Array
  ): Promise<IMultiRecipientChunk> {
    // Validate inputs
    const engine = getEciesI18nEngine();
    if (recipients.length === 0 || recipients.length > MULTI_RECIPIENT_CONSTANTS.MAX_RECIPIENTS) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_InvalidRecipientCountTemplate, { count: recipients.length }));
    }
    if (symmetricKey.length !== 32) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_SymmetricKeyMust32Bytes));
    }
    if (chunkIndex < 0 || chunkIndex > 0xFFFFFFFF) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_InvalidChunkIndexTemplate, { index: chunkIndex }));
    }
    if (data.length > 0x7FFFFFFF) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_DataSizeExceedsMaximumTemplate, { size: data.length }));
    }

    // Check for duplicate recipient IDs
    const seenIds = new Set<string>();
    for (const recipient of recipients) {
      const idStr = Buffer.from(recipient.id).toString('hex');
      if (seenIds.has(idStr)) {
        throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_DuplicateRecipientId));
      }
      seenIds.add(idStr);
    }

    // Encrypt data with AES-256-GCM
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', symmetricKey, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Build recipient headers
    const recipientHeaders: IRecipientHeader[] = [];
    for (const recipient of recipients) {
      if (recipient.id.length !== MULTI_RECIPIENT_CONSTANTS.RECIPIENT_ID_SIZE) {
        throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_RecipientIdMust32Bytes));
      }
      
      const encryptedKey = await this.ecies.encryptSimpleOrSingle(
        false,
        recipient.publicKey,
        symmetricKey
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
      const headerSize = MULTI_RECIPIENT_CONSTANTS.RECIPIENT_ID_SIZE + 
                        MULTI_RECIPIENT_CONSTANTS.KEY_SIZE_BYTES + h.keySize;
      if (recipientHeadersSize + headerSize < recipientHeadersSize) {
        throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_RecipientHeadersSizeOverflow));
      }
      recipientHeadersSize += headerSize;
    }

    const totalSize = MULTI_RECIPIENT_CONSTANTS.HEADER_SIZE + 
                     recipientHeadersSize + 
                     12 + // IV
                     encrypted.length + 
                     16; // Auth tag

    // Check for integer overflow (max safe: 2^31 - 1 for Uint8Array)
    if (totalSize > 0x7FFFFFFF || totalSize < 0) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_ChunkSizeOverflow));
    }

    // Build chunk
    const chunk = new Uint8Array(totalSize);
    const view = new DataView(chunk.buffer);
    let offset = 0;

    // Write header
    view.setUint32(offset, MULTI_RECIPIENT_CONSTANTS.MAGIC, false);
    offset += 4;
    view.setUint16(offset, MULTI_RECIPIENT_CONSTANTS.VERSION, false);
    offset += 2;
    view.setUint16(offset, recipients.length, false);
    offset += 2;
    view.setUint32(offset, chunkIndex, false);
    offset += 4;
    view.setUint32(offset, data.length, false);
    offset += 4;
    view.setUint32(offset, encrypted.length, false);
    offset += 4;
    view.setUint8(offset, isLast ? MULTI_RECIPIENT_CONSTANTS.FLAG_IS_LAST : 0);
    offset += 1;
    // Padding to 32 bytes
    offset = MULTI_RECIPIENT_CONSTANTS.HEADER_SIZE;

    // Write recipient headers
    for (const header of recipientHeaders) {
      chunk.set(header.id, offset);
      offset += MULTI_RECIPIENT_CONSTANTS.RECIPIENT_ID_SIZE;
      view.setUint16(offset, header.keySize, false);
      offset += MULTI_RECIPIENT_CONSTANTS.KEY_SIZE_BYTES;
      chunk.set(header.encryptedKey, offset);
      offset += header.keySize;
    }

    // Write IV
    chunk.set(iv, offset);
    offset += 12;

    // Write encrypted data
    chunk.set(encrypted, offset);
    offset += encrypted.length;

    // Write auth tag
    chunk.set(authTag, offset);

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
    privateKey: Uint8Array
  ): Promise<{ data: Uint8Array; header: IMultiRecipientChunkHeader }> {
    const engine = getEciesI18nEngine();
    if (chunkData.length < MULTI_RECIPIENT_CONSTANTS.HEADER_SIZE) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_ChunkTooSmall));
    }

    const view = new DataView(chunkData.buffer, chunkData.byteOffset);
    let offset = 0;

    // Parse header
    const magic = view.getUint32(offset, false);
    offset += 4;
    if (magic !== MULTI_RECIPIENT_CONSTANTS.MAGIC) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_InvalidChunkMagic));
    }

    const version = view.getUint16(offset, false);
    offset += 2;
    if (version !== MULTI_RECIPIENT_CONSTANTS.VERSION) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_UnsupportedVersionTemplate, { version }));
    }

    const recipientCount = view.getUint16(offset, false);
    offset += 2;
    if (recipientCount === 0 || recipientCount > MULTI_RECIPIENT_CONSTANTS.MAX_RECIPIENTS) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_InvalidRecipientCountTemplate, { count: recipientCount }));
    }
    const chunkIndex = view.getUint32(offset, false);
    offset += 4;
    const originalSize = view.getUint32(offset, false);
    offset += 4;
    const encryptedSize = view.getUint32(offset, false);
    offset += 4;
    const flags = view.getUint8(offset);
    offset = MULTI_RECIPIENT_CONSTANTS.HEADER_SIZE;

    // Validate encryptedSize against chunk size
    const minChunkSize = MULTI_RECIPIENT_CONSTANTS.HEADER_SIZE + 12 + encryptedSize + 16;
    if (chunkData.length < minChunkSize) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_ChunkTooSmallForEncryptedSize));
    }

    // Find recipient header and decrypt symmetric key
    let symmetricKey: Uint8Array | null = null;
    let tempOffset = offset;
    
    for (let i = 0; i < recipientCount; i++) {
      // Check if we have enough data for recipient ID
      if (tempOffset + MULTI_RECIPIENT_CONSTANTS.RECIPIENT_ID_SIZE > chunkData.length) {
        throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_ChunkTruncatedRecipientId));
      }
      
      const id = chunkData.slice(tempOffset, tempOffset + MULTI_RECIPIENT_CONSTANTS.RECIPIENT_ID_SIZE);
      tempOffset += MULTI_RECIPIENT_CONSTANTS.RECIPIENT_ID_SIZE;
      
      // Check if we have enough data for keySize field
      if (tempOffset + MULTI_RECIPIENT_CONSTANTS.KEY_SIZE_BYTES > chunkData.length) {
        throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_ChunkTruncatedKeySize));
      }
      
      const keySize = view.getUint16(tempOffset, false);
      tempOffset += MULTI_RECIPIENT_CONSTANTS.KEY_SIZE_BYTES;

      // Validate keySize (typical ECIES: 100-400 bytes)
      if (keySize === 0 || keySize > 1000) {
        throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_InvalidKeySizeTemplate, { size: keySize }));
      }
      
      // Check if we have enough data for the encrypted key
      if (tempOffset + keySize > chunkData.length) {
        throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_ChunkTruncatedEncryptedKey));
      }
      
      const encryptedKey = chunkData.slice(tempOffset, tempOffset + keySize);
      tempOffset += keySize;

      // Check if this is our recipient
      if (this.arraysEqual(id, recipientId)) {
        symmetricKey = await this.ecies.decryptSimpleOrSingleWithHeader(false, privateKey, encryptedKey);
        // Don't break - need to skip all recipient headers
      }
    }

    if (!symmetricKey) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_MultiRecipient_RecipientNotFoundInChunk));
    }
    
    // Update offset to after all recipient headers
    offset = tempOffset;

    // Read IV
    const iv = chunkData.slice(offset, offset + 12);
    offset += 12;

    // Read encrypted data
    const encrypted = chunkData.slice(offset, offset + encryptedSize);
    offset += encryptedSize;

    // Read auth tag
    const authTag = chunkData.slice(offset, offset + 16);

    // Decrypt
    const decipher = createDecipheriv('aes-256-gcm', symmetricKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return {
      data: new Uint8Array(decrypted),
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
