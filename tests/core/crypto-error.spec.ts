/**
 * CryptoError Tests - Critical Gap Coverage
 */

import {
  CryptoError,
  CryptoErrorCode,
} from '../../src/core/errors/crypto-error';
import { getEciesI18nEngine } from '../../src/i18n-setup';

describe('CryptoError', () => {
  beforeAll(() => {
    getEciesI18nEngine();
  });

  it('should create error with code and string key', () => {
    const error = CryptoError.decryptionFailed();
    expect(error.code).toBe(CryptoErrorCode.DECRYPTION_FAILED);
    expect(error).toBeInstanceOf(Error);
  });

  it('should preserve stack trace', () => {
    const error = CryptoError.decryptionFailed();
    expect(error.stack).toBeDefined();
  });

  it('should have error name', () => {
    const error = CryptoError.decryptionFailed();
    expect(error.name).toBe('CryptoError');
  });

  it('should include metadata', () => {
    const error = CryptoError.decryptionFailed({ reason: 'test' });
    expect(error.metadata).toBeDefined();
    expect(error.metadata?.reason).toBe('test');
  });

  it('should create invalid profile error', () => {
    const error = CryptoError.invalidProfile();
    expect(error.code).toBe(CryptoErrorCode.INVALID_PROFILE);
  });

  it('should create invalid email error', () => {
    const error = CryptoError.invalidEmail();
    expect(error.code).toBe(CryptoErrorCode.INVALID_EMAIL);
  });
});
