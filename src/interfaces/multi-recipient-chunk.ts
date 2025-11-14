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
  /** Recipient ID (32 bytes) */
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
 * Constants for multi-recipient format
 */
export const MULTI_RECIPIENT_CONSTANTS = {
  MAGIC: 0x4D524543, // "MREC"
  VERSION: 0x0001,
  HEADER_SIZE: 32,
  RECIPIENT_ID_SIZE: 32,
  KEY_SIZE_BYTES: 2,
  FLAG_IS_LAST: 0x01,
  FLAG_HAS_CHECKSUM: 0x02,
  MAX_RECIPIENTS: 65535,
} as const;
