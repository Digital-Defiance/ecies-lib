/**
 * Result interface for decryption operations.
 */
export interface IDecryptionResult {
  decrypted: Uint8Array;
  consumedBytes: number;
}
