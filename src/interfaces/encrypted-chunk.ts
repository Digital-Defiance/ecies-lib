/**
 * Metadata for an encrypted chunk
 */
export interface IChunkMetadata {
  /** Original size before encryption */
  originalSize: number;
  /** Size after encryption */
  encryptedSize: number;
  /** Timestamp when chunk was encrypted */
  timestamp: number;
  /** Optional SHA-256 checksum of original data */
  checksum?: Uint8Array;
}

/**
 * Represents a single encrypted chunk in a stream
 */
export interface IEncryptedChunk {
  /** Chunk sequence number (0-based) */
  index: number;
  /** Encrypted chunk data */
  data: Uint8Array;
  /** Whether this is the final chunk */
  isLast: boolean;
  /** Chunk metadata */
  metadata?: IChunkMetadata;
}

/**
 * Chunk header structure (32 bytes fixed)
 */
export interface IChunkHeader {
  /** Magic bytes: 0x45434945 ("ECIE") */
  magic: number;
  /** Version: 0x0001 */
  version: number;
  /** Chunk index */
  index: number;
  /** Original size */
  originalSize: number;
  /** Encrypted size */
  encryptedSize: number;
  /** Flags (bit 0: isLast, bit 1: hasChecksum) */
  flags: number;
}

/**
 * Constants for chunk format
 */
export const CHUNK_CONSTANTS = {
  MAGIC: 0x45434945, // "ECIE"
  VERSION: 0x0001,
  HEADER_SIZE: 32,
  FLAG_IS_LAST: 0x01,
  FLAG_HAS_CHECKSUM: 0x02,
  CHECKSUM_SIZE: 32, // SHA-256
} as const;
