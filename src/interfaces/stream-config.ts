/**
 * Configuration for streaming encryption operations
 */
export interface IStreamConfig {
  /** Chunk size in bytes (default: 1MB) */
  chunkSize: number;
  /** Whether to include checksums for each chunk */
  includeChecksums: boolean;
}

/**
 * Default streaming configuration
 */
export const DEFAULT_STREAM_CONFIG: IStreamConfig = {
  chunkSize: 1024 * 1024, // 1MB
  includeChecksums: false,
};
