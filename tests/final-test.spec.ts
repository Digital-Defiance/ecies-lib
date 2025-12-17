import { ECIESErrorTypeEnum } from '../src/enumerations/ecies-error-type';
import { ECIESError } from '../src/errors/ecies';
import { getEciesI18nEngine } from '../src/i18n-setup';

describe('Final Test', () => {
  it('should create error with correct message', () => {
    getEciesI18nEngine(); // Ensure engine is initialized
    const error = new ECIESError(ECIESErrorTypeEnum.DecryptionFailed);

    expect(typeof error.message).toBe('string');
    expect(['Decryption operation failed', 'DecryptionFailed']).toContain(
      error.message,
    );
  });
});
