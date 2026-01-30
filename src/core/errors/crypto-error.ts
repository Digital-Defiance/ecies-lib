/**
 * Unified error class for all crypto operations.
 * Consolidates ECIESError, MemberError, Pbkdf2Error, etc.
 */

import {
  EciesStringKey,
  EciesStringKeyValue,
  EciesComponentId,
} from '../../enumerations/ecies-string-key';
import { getEciesI18nEngine } from '../../i18n-setup';

/**
 * Error codes for crypto operations.
 */
export enum CryptoErrorCode {
  // ECIES Errors
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  INVALID_KEY_SIZE = 'INVALID_KEY_SIZE',
  INVALID_ENCRYPTION_TYPE = 'INVALID_ENCRYPTION_TYPE',
  INVALID_PUBLIC_KEY = 'INVALID_PUBLIC_KEY',
  RECIPIENT_NOT_FOUND = 'RECIPIENT_NOT_FOUND',
  TOO_MANY_RECIPIENTS = 'TOO_MANY_RECIPIENTS',

  // Member Errors
  MISSING_MEMBER_NAME = 'MISSING_MEMBER_NAME',
  INVALID_EMAIL = 'INVALID_EMAIL',
  WALLET_NOT_LOADED = 'WALLET_NOT_LOADED',
  INVALID_MNEMONIC = 'INVALID_MNEMONIC',

  // PBKDF2 Errors
  INVALID_PROFILE = 'INVALID_PROFILE',
  INVALID_SALT_LENGTH = 'INVALID_SALT_LENGTH',
  INVALID_HASH_LENGTH = 'INVALID_HASH_LENGTH',

  // Storage Errors
  VALUE_IS_NULL = 'VALUE_IS_NULL',
  CHECKSUM_MISMATCH = 'CHECKSUM_MISMATCH',

  // Password Login Errors
  PASSWORD_LOGIN_NOT_SETUP = 'PASSWORD_LOGIN_NOT_SETUP',
  FAILED_TO_STORE_LOGIN_DATA = 'FAILED_TO_STORE_LOGIN_DATA',
}

/**
 * Unified error class for crypto operations with i18n support.
 */
export class CryptoError extends Error {
  /**
   * Create a new CryptoError.
   * @param code The error code
   * @param stringKey The i18n string key for the error message
   * @param metadata Optional metadata for message interpolation
   */
  constructor(
    public readonly code: CryptoErrorCode,
    public readonly stringKey: EciesStringKeyValue,
    public readonly metadata?: Record<string, string | number>,
  ) {
    const engine = getEciesI18nEngine();
    const message = engine.translate(EciesComponentId, stringKey, metadata);
    super(message);
    this.name = 'CryptoError';
    Object.setPrototypeOf(this, CryptoError.prototype);
  }

  /**
   * Create a decryption failed error.
   * @param metadata Optional metadata for message interpolation
   * @returns A CryptoError instance
   */
  static decryptionFailed(
    metadata?: Record<string, string | number>,
  ): CryptoError {
    return new CryptoError(
      CryptoErrorCode.DECRYPTION_FAILED,
      EciesStringKey.Error_ECIESError_DecryptionFailed,
      metadata,
    );
  }

  /**
   * Create an invalid profile error.
   * @param metadata Optional metadata for message interpolation
   * @returns A CryptoError instance
   */
  static invalidProfile(
    metadata?: Record<string, string | number>,
  ): CryptoError {
    return new CryptoError(
      CryptoErrorCode.INVALID_PROFILE,
      EciesStringKey.Error_Pbkdf2Error_InvalidProfile,
      metadata,
    );
  }

  /**
   * Create an invalid email error.
   * @param metadata Optional metadata for message interpolation
   * @returns A CryptoError instance
   */
  static invalidEmail(metadata?: Record<string, string | number>): CryptoError {
    return new CryptoError(
      CryptoErrorCode.INVALID_EMAIL,
      EciesStringKey.Error_MemberError_InvalidEmail,
      metadata,
    );
  }
}
