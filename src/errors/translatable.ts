import { EciesStringKey } from '../enumerations';
import { getEciesTranslation } from '../i18n-setup';

export class TranslatableEciesError extends Error {
  constructor(
    public readonly error: EciesStringKey,
    public readonly params?: Record<string, string | number>,
    public readonly language?: string,
  ) {
    const message = getEciesTranslation(error, params, language);
    super(message);
    this.name = 'TranslatableEciesError';
    Object.setPrototypeOf(this, TranslatableEciesError.prototype);
  }
}
