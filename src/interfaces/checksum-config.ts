/**
 * Configuration interface for checksum algorithms.
 */
export interface IChecksumConfig {
  algorithm: string;
  encoding: 'hex' | 'base64';
}
