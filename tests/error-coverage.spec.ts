import { withConsoleMocks } from '@digitaldefiance/express-suite-test-utils';
import { ECIESErrorTypeEnum } from '../src/enumerations/ecies-error-type';
import MemberErrorType from '../src/enumerations/member-error-type';
import { LengthErrorType } from '../src/enumerations/length-error-type';
import { Pbkdf2ErrorType } from '../src/enumerations/pbkdf2-error-type';
import { SecureStorageErrorType } from '../src/enumerations/secure-storage-error-type';
import { EciesStringKey } from '../src/enumerations/ecies-string-key';
import { getEciesI18nEngine } from '../src/i18n-setup';

describe('Error Coverage Validation', () => {
  beforeEach(() => {
    getEciesI18nEngine();
  });

  it('should have string keys for all ECIES error types', () => {
    const errorTypes = Object.values(ECIESErrorTypeEnum);
    const stringKeys = Object.values(EciesStringKey);
    
    errorTypes.forEach(errorType => {
      const expectedKey = `Error_ECIESError_${errorType}`;
      const hasKey = stringKeys.includes(expectedKey as EciesStringKey);
      expect(hasKey).toBe(true, `Missing string key for ECIES error: ${errorType}`);
    });
  });

  it('should have string keys for all Member error types', () => {
    const errorTypes = Object.values(MemberErrorType);
    const stringKeys = Object.values(EciesStringKey);
    
    errorTypes.forEach(errorType => {
      const expectedKey = `Error_MemberError_${errorType}`;
      const hasKey = stringKeys.includes(expectedKey as EciesStringKey);
      expect(hasKey).toBe(true, `Missing string key for Member error: ${errorType}`);
    });
  });

  it('should have string keys for all Length error types', () => {
    const errorTypes = Object.values(LengthErrorType);
    const stringKeys = Object.values(EciesStringKey);
    
    errorTypes.forEach(errorType => {
      const expectedKey = `Error_LengthError_${errorType}`;
      const hasKey = stringKeys.includes(expectedKey as EciesStringKey);
      expect(hasKey).toBe(true, `Missing string key for Length error: ${errorType}`);
    });
  });

  it('should have string keys for all PBKDF2 error types', () => {
    const errorTypes = Object.values(Pbkdf2ErrorType);
    const stringKeys = Object.values(EciesStringKey);
    
    errorTypes.forEach(errorType => {
      const expectedKey = `Error_Pbkdf2Error_${errorType}`;
      const hasKey = stringKeys.includes(expectedKey as EciesStringKey);
      expect(hasKey).toBe(true, `Missing string key for PBKDF2 error: ${errorType}`);
    });
  });

  it('should have string keys for all SecureStorage error types', () => {
    const errorTypes = Object.values(SecureStorageErrorType);
    const stringKeys = Object.values(EciesStringKey);
    
    errorTypes.forEach(errorType => {
      const expectedKey = `Error_SecureStorageError_${errorType}`;
      const hasKey = stringKeys.includes(expectedKey as EciesStringKey);
      expect(hasKey).toBe(true, `Missing string key for SecureStorage error: ${errorType}`);
    });
  });

  it('should validate total error count matches string key count', () => {
    withConsoleMocks({ mute: true }, () => {
        const totalErrors = 
          Object.values(ECIESErrorTypeEnum).length +
          Object.values(MemberErrorType).length +
          Object.values(LengthErrorType).length +
          Object.values(Pbkdf2ErrorType).length +
          Object.values(SecureStorageErrorType).length;
        
        // Additional errors include template variants and utility error strings
        const additionalErrors = 40;
        const expectedStringKeys = totalErrors + additionalErrors;
        
        const totalStringKeys = Object.values(EciesStringKey).length;
        
        expect(totalStringKeys).toBe(expectedStringKeys, 
          `Mismatch: ${totalErrors} error types + ${additionalErrors} additional errors = ${expectedStringKeys} expected, but got ${totalStringKeys} string keys`);
      });
    });
});