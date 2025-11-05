/**
 * Unified error class for all crypto operations
 * Consolidates ECIESError, MemberError, Pbkdf2Error, etc.
 */

import { getEciesI18nEngine, EciesComponentId } from '../../i18n-setup';
import { EciesStringKey } from '../../enumerations/ecies-string-key';

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

export class CryptoError extends Error {
  constructor(
    public readonly code: CryptoErrorCode,
    public readonly stringKey: EciesStringKey,
    public readonly metadata?: Record<string, string | number>
  ) {
    const engine = getEciesI18nEngine();
    const message = engine.translate(EciesComponentId, stringKey, metadata);
    super(message);
    this.name = 'CryptoError';
    Object.setPrototypeOf(this, CryptoError.prototype);
  }

  static decryptionFailed(metadata?: Record<string, string | number>): CryptoError {
    return new CryptoError(
      CryptoErrorCode.DECRYPTION_FAILED,
      EciesStringKey.Error_ECIESError_DecryptionFailed,
      metadata
    );
  }

  static invalidProfile(metadata?: Record<string, string | number>): CryptoError {
    return new CryptoError(
      CryptoErrorCode.INVALID_PROFILE,
      EciesStringKey.Error_Pbkdf2Error_InvalidProfile,
      metadata
    );
  }

  static invalidEmail(metadata?: Record<string, string | number>): CryptoError {
    return new CryptoError(
      CryptoErrorCode.INVALID_EMAIL,
      EciesStringKey.Error_MemberError_InvalidEmail,
      metadata
    );
  }
}
