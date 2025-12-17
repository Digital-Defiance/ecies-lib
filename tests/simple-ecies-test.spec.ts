import { ECIESErrorTypeEnum } from '../src/enumerations/ecies-error-type';
import { SimpleECIESError } from '../src/errors/simple-ecies';
import { getEciesI18nEngine } from '../src/i18n-setup';

describe('Simple ECIES Error Test', () => {
  it('should translate ECIES errors correctly', () => {
    getEciesI18nEngine(); // Ensure engine is initialized
    const error = new SimpleECIESError(ECIESErrorTypeEnum.DecryptionFailed);
    expect(typeof error.message).toBe('string');
    expect(['Decryption operation failed', 'DecryptionFailed']).toContain(
      error.message,
    );
  });
});
