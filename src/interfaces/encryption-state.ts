import type { EciesEncryptionTypeEnum } from '../enumerations/ecies-encryption-type';

/**
 * Serializable encryption state for resumption
 */
export interface IEncryptionState {
  version: number;
  chunkIndex: number;
  bytesProcessed: number;
  totalBytes?: number;
  publicKey: string; // hex
  encryptionType: EciesEncryptionTypeEnum;
  chunkSize: number;
  includeChecksums: boolean;
  timestamp: number;
  hmac?: string; // hex SHA-256 HMAC for integrity
}

export const ENCRYPTION_STATE_VERSION = 1;
