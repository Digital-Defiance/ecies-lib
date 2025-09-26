import { I18nEngine, DefaultLanguage } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../src/enumerations/ecies-error-type';
import { SimpleECIESError } from '../src/errors/simple-ecies';
import { EciesI18nEngineKey, getEciesI18nEngine } from '../src/i18n-setup';

describe('Simple ECIES Error Test', () => {
  it('should translate ECIES errors correctly', () => {
    const engine = getEciesI18nEngine();
    const error = new SimpleECIESError(ECIESErrorTypeEnum.DecryptionFailed, engine);
    expect(error.message).toBe('Decryption operation failed');
    expect(typeof error.message).toBe('string');
  });
});