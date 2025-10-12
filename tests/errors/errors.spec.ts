import { DisposedError } from '../../src/errors/disposed';
import { ECIESError } from '../../src/errors/ecies';
import { GuidError } from '../../src/errors/guid';
import { InvalidEmailError } from '../../src/errors/invalid-email';
import { LengthError } from '../../src/errors/length';
import { MemberError } from '../../src/errors/member';
import { Pbkdf2Error } from '../../src/errors/pbkdf2';
import { SecureStorageError } from '../../src/errors/secure-storage';

import {
  ECIESErrorTypeEnum,
  GuidErrorType,
  InvalidEmailErrorType,
  MemberErrorType,
  Pbkdf2ErrorType,
  SecureStorageErrorType,
} from '../../src/enumerations';
import { GuidBrandType } from '../../src/enumerations/guid-brand-type';
import { LengthErrorType } from '../../src/enumerations/length-error-type';
import { getCompatibleEciesEngine } from '../../src/i18n-setup';

describe('Custom Errors', () => {
  it('should create a DisposedError', () => {
    const error = new DisposedError();
    expect(error).toBeInstanceOf(DisposedError);
    expect(error.message).toBe('Object has been disposed');
    expect(error.name).toBe('DisposedError');
  });

  it('should create an ECIESError', () => {
    const error = new ECIESError(
      ECIESErrorTypeEnum.DecryptionFailed,
      getCompatibleEciesEngine(),
    );
    expect(error).toBeInstanceOf(ECIESError);
    expect(error.type).toBe(ECIESErrorTypeEnum.DecryptionFailed);
    expect(error.message).toBe('Decryption operation failed');
    expect(error.name).toBe('ECIESError');
  });

  it('should create a GuidError', () => {
    const error = new GuidError(
      GuidErrorType.UnknownBrand,
      getCompatibleEciesEngine(),
      GuidBrandType.Unknown,
    );
    expect(error).toBeInstanceOf(GuidError);
    expect(error.type).toBe(GuidErrorType.UnknownBrand);
    expect(error.message).toContain('Unknown GUID brand: Unknown');
    expect(error.name).toBe('GuidError');
  });

  it('should create an InvalidEmailError', () => {
    const error = new InvalidEmailError(
      InvalidEmailErrorType.Invalid,
      getCompatibleEciesEngine(),
    );
    expect(error).toBeInstanceOf(InvalidEmailError);
    expect(error.type).toBe(InvalidEmailErrorType.Invalid);
    expect(error.message).toBe('Invalid email address.');
    expect(error.name).toBe('InvalidEmailError');
  });

  it('should create a LengthError', () => {
    const error = new LengthError(
      LengthErrorType.LengthIsTooShort,
      getCompatibleEciesEngine(),
    );
    expect(error).toBeInstanceOf(LengthError);
    expect(error.type).toBe(LengthErrorType.LengthIsTooShort);
    expect(error.message).toBe('Length is too short.');
  });

  it('should create a MemberError', () => {
    const error = new MemberError(
      MemberErrorType.MissingMemberName,
      getCompatibleEciesEngine(),
    );
    expect(error).toBeInstanceOf(MemberError);
    expect(error.type).toBe(MemberErrorType.MissingMemberName);
    expect(error.message).toBe('Member name is required');
    expect(error.name).toBe('MemberError');
  });

  it('should create a PBKDF2Error', () => {
    const error = new Pbkdf2Error(
      Pbkdf2ErrorType.InvalidHashLength,
      getCompatibleEciesEngine(),
    );
    expect(error).toBeInstanceOf(Pbkdf2Error);
    expect(error.type).toBe(Pbkdf2ErrorType.InvalidHashLength);
    expect(error.message).toBe('Hash length does not match expected length');
    expect(error.name).toBe('Pbkdf2Error');
  });

  it('should create a SecureStorageError', () => {
    const error = new SecureStorageError(
      SecureStorageErrorType.ValueIsNull,
      getCompatibleEciesEngine(),
    );
    expect(error).toBeInstanceOf(SecureStorageError);
    expect(error.type).toBe(SecureStorageErrorType.ValueIsNull);
    expect(error.message).toBe('Secure storage value is null');
    expect(error.name).toBe('SecureStorageError');
  });
});
