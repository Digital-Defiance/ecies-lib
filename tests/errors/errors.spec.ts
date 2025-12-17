import {
  ECIESErrorTypeEnum,
  InvalidEmailErrorType,
  MemberErrorType,
  Pbkdf2ErrorType,
  SecureStorageErrorType,
} from '../../src/enumerations';
import { LengthErrorType } from '../../src/enumerations/length-error-type';
import { DisposedError } from '../../src/errors/disposed';
import { ECIESError } from '../../src/errors/ecies';
import { InvalidEmailError } from '../../src/errors/invalid-email';
import { LengthError } from '../../src/errors/length';
import { MemberError } from '../../src/errors/member';
import { Pbkdf2Error } from '../../src/errors/pbkdf2';
import { SecureStorageError } from '../../src/errors/secure-storage';
import { getEciesI18nEngine } from '../../src/i18n-setup';

describe('Custom Errors', () => {
  beforeEach(() => {
    const engine = getEciesI18nEngine(); // Ensure engine is initialized
    // Verify engine is properly registered
    expect(engine).toBeDefined();
  });

  it('should create a DisposedError', () => {
    const error = new DisposedError();
    expect(error).toBeInstanceOf(DisposedError);
    // TranslatableGenericError returns the string key when translation fails
    expect(error.message).toContain('Error_DisposedError_ObjectDisposed');
    expect(error.name).toBe('DisposedError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create an ECIESError', () => {
    const error = new ECIESError(ECIESErrorTypeEnum.DecryptionFailed);
    expect(error).toBeInstanceOf(ECIESError);
    expect(error.type).toBe(ECIESErrorTypeEnum.DecryptionFailed);
    // Message should be either translated or the enum key
    expect(['Decryption operation failed', 'DecryptionFailed']).toContain(
      error.message,
    );
    expect(error.name).toBe('ECIESError');
  });

  it('should create an InvalidEmailError', () => {
    const error = new InvalidEmailError(InvalidEmailErrorType.Invalid);
    expect(error).toBeInstanceOf(InvalidEmailError);
    expect(error.type).toBe(InvalidEmailErrorType.Invalid);
    expect(['Invalid email address.', 'Invalid']).toContain(error.message);
    expect(error.name).toBe('InvalidEmailError');
  });

  it('should create a LengthError', () => {
    const error = new LengthError(LengthErrorType.LengthIsTooShort);
    expect(error).toBeInstanceOf(LengthError);
    expect(error.type).toBe(LengthErrorType.LengthIsTooShort);
    expect(['Length is too short.', 'LengthIsTooShort']).toContain(
      error.message,
    );
  });

  it('should create a MemberError', () => {
    const error = new MemberError(MemberErrorType.MissingMemberName);
    expect(error).toBeInstanceOf(MemberError);
    expect(error.type).toBe(MemberErrorType.MissingMemberName);
    expect(['Member name is required', 'MissingMemberName']).toContain(
      error.message,
    );
    expect(error.name).toBe('MemberError');
  });

  it('should create a PBKDF2Error', () => {
    const error = new Pbkdf2Error(Pbkdf2ErrorType.InvalidHashLength);
    expect(error).toBeInstanceOf(Pbkdf2Error);
    expect(error.type).toBe(Pbkdf2ErrorType.InvalidHashLength);
    expect([
      'Hash length does not match expected length',
      'InvalidHashLength',
    ]).toContain(error.message);
    expect(error.name).toBe('Pbkdf2Error');
  });

  it('should create a SecureStorageError', () => {
    const error = new SecureStorageError(SecureStorageErrorType.ValueIsNull);
    expect(error).toBeInstanceOf(SecureStorageError);
    expect(error.type).toBe(SecureStorageErrorType.ValueIsNull);
    expect(['Secure storage value is null', 'ValueIsNull']).toContain(
      error.message,
    );
    expect(error.name).toBe('SecureStorageError');
  });
});
