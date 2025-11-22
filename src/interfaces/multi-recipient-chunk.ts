/**
 * Multi-recipient encrypted chunk format
 * 
 * Structure:
 * - Header (32 bytes): magic, version, recipientCount, chunkIndex, etc.
 * - Recipient headers (variable): encrypted symmetric keys for each recipient
 * - Encrypted data (variable): data encrypted with symmetric key
 */

/**
 * Multi-recipient chunk header (32 bytes)
 */
export interface IMultiRecipientChunkHeader {
  /** Magic bytes: 0x4D524543 ("MREC") */
  magic: number;
  /** Version: 0x0001 */
  version: number;
  /** Number of recipients */
  recipientCount: number;
  /** Chunk index */
  chunkIndex: number;
  /** Original data size */
  originalSize: number;
  /** Encrypted data size */
  encryptedSize: number;
  /** Flags (bit 0: isLast, bit 1: hasChecksum) */
  flags: number;
}

/**
 * Recipient header (variable size)
 */
export interface IRecipientHeader {
  /** Recipient ID (size determined by ID provider) */
  id: Uint8Array;
  /** Encrypted symmetric key size (2 bytes) */
  keySize: number;
  /** Encrypted symmetric key (variable) */
  encryptedKey: Uint8Array;
}

/**
 * Multi-recipient encrypted chunk
 */
export interface IMultiRecipientChunk {
  /** Chunk index */
  index: number;
  /** Complete chunk data (header + recipient headers + encrypted data) */
  data: Uint8Array;
  /** Whether this is the last chunk */
  isLast: boolean;
  /** Number of recipients */
  recipientCount: number;
}

/**
 * Multi-recipient format constants structure
 */
export interface IMultiRecipientConstants {
  readonly MAGIC: number;
  readonly VERSION: number;
  readonly HEADER_SIZE: number;
  readonly RECIPIENT_ID_SIZE: number;
  readonly KEY_SIZE_BYTES: number;
  readonly FLAG_IS_LAST: number;
  readonly FLAG_HAS_CHECKSUM: number;
  readonly MAX_RECIPIENTS: number;
}

/**
 * Get multi-recipient constants for a specific recipient ID size.
 * This allows the format to adapt to different ID providers.
 * 
 * @param recipientIdSize - The byte length of recipient IDs (from ID provider)
 * @returns Frozen constants object for the multi-recipient format
 * 
 * @example
 * ```typescript
 * // For ObjectID (12 bytes)
 * const constants = getMultiRecipientConstants(12);
 * 
 * // For GUID (16 bytes)
 * const constants = getMultiRecipientConstants(16);
 * ```
 */
export function getMultiRecipientConstants(
  recipientIdSize: number
): IMultiRecipientConstants {
  if (!Number.isInteger(recipientIdSize) || recipientIdSize < 1 || recipientIdSize > 255) {
    throw new Error(
      `Invalid recipientIdSize: ${recipientIdSize}. Must be an integer between 1 and 255.`
    );
  }

  return Object.freeze({
    MAGIC: 0x4D524543, // "MREC"
    VERSION: 0x0002, // Updated to 0x0002 for Shared Ephemeral Key support
    HEADER_SIZE: 64, // Increased to 64 bytes to accommodate Ephemeral Public Key (33 bytes)
    RECIPIENT_ID_SIZE: recipientIdSize,
    KEY_SIZE_BYTES: 2,
    FLAG_IS_LAST: 0x01,
    FLAG_HAS_CHECKSUM: 0x02,
    MAX_RECIPIENTS: 65535,
  });
}

/**
 * Default multi-recipient constants using ObjectID size (12 bytes).
 * 
 * @deprecated Use getMultiRecipientConstants(config.idProvider.byteLength) instead
 * for dynamic ID size support. This constant is provided for backward compatibility only.
 */
export const MULTI_RECIPIENT_CONSTANTS = getMultiRecipientConstants(12);
