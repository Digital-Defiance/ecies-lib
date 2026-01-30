import { EciesStringKeyValue } from '../enumerations/ecies-string-key';
import { getEciesTranslation } from '../i18n-setup';

export class TranslatableEciesError extends Error {
  constructor(
    public readonly error: EciesStringKeyValue,
    public readonly params?: Record<string, string | number>,
    public readonly language?: string,
  ) {
    const message = getEciesTranslation(error, params, language);
    super(message);
    this.name = 'TranslatableEciesError';
    Object.setPrototypeOf(this, TranslatableEciesError.prototype);
  }
}
