import { ECIESErrorTypeEnum } from '../src/enumerations/ecies-error-type';
import { ECIESError } from '../src/errors/ecies';
import { getCompatibleEciesEngine } from '../src/i18n-setup';

describe('Final Test', () => {
  it('should create error with correct message', () => {
    const error = new ECIESError(ECIESErrorTypeEnum.DecryptionFailed, getCompatibleEciesEngine());
    
    expect(typeof error.message).toBe('string');
    expect(error.message).toBe('Decryption operation failed');
  });
});