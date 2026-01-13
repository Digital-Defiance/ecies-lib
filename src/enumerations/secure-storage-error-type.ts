/**
 * Secure storage error type enumeration.
 * Defines error conditions related to SecureBuffer and SecureString operations.
 */
export enum SecureStorageErrorType {
  /** The decrypted value length doesn't match the expected length */
  DecryptedValueLengthMismatch = 'DecryptedValueLengthMismatch',
  /** The decrypted value checksum doesn't match, indicating data corruption */
  DecryptedValueChecksumMismatch = 'DecryptedValueChecksumMismatch',
  /** Attempted to access a null value */
  ValueIsNull = 'ValueIsNull',
}
