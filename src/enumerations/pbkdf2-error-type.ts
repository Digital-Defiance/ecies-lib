/**
 * PBKDF2 error type enumeration.
 * Defines error conditions related to PBKDF2 key derivation operations.
 */
export enum Pbkdf2ErrorType {
  /** The specified PBKDF2 profile is invalid or not found */
  InvalidProfile = 'InvalidProfile',
  /** The salt length is invalid for the operation */
  InvalidSaltLength = 'InvalidSaltLength',
  /** The hash length is invalid for the operation */
  InvalidHashLength = 'InvalidHashLength',
}
