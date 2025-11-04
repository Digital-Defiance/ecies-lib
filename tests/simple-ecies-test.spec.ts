import { ECIESErrorTypeEnum } from '../src/enumerations/ecies-error-type';
import { SimpleECIESError } from '../src/errors/simple-ecies';
import { getEciesI18nEngine } from '../src/i18n-setup';

describe('Simple ECIES Error Test', () => {
  it('should translate ECIES errors correctly', () => {
    getEciesI18nEngine(); // Ensure engine is initialized
    const error = new SimpleECIESError(
      ECIESErrorTypeEnum.DecryptionFailed,
    );
    expect(error.message).toBe('Decryption operation failed');
    expect(typeof error.message).toBe('string');
  });
});
