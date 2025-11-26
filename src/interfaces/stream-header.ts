import type { EciesEncryptionTypeEnum } from '../enumerations/ecies-encryption-type';

/**
 * Stream header structure (128 bytes fixed)
 */
export interface IStreamHeader {
  /** Magic bytes: 0x45435354 ("ECST") */
  magic: number;
  /** Version: 0x0001 */
  version: number;
  /** Encryption type */
  encryptionType: EciesEncryptionTypeEnum;
  /** Chunk size in bytes */
  chunkSize: number;
  /** Total number of chunks (0 if unknown) */
  totalChunks: number;
  /** Total bytes to process (0 if unknown) */
  totalBytes: number;
  /** Timestamp when stream started */
  timestamp: number;
}

/**
 * Constants for stream header format
 */
export const STREAM_HEADER_CONSTANTS: {
  readonly MAGIC: 0x45435354;
  readonly VERSION: 0x0001;
  readonly HEADER_SIZE: 128;
} = {
  MAGIC: 0x45435354, // "ECST"
  VERSION: 0x0001,
  HEADER_SIZE: 128,
} as const;
