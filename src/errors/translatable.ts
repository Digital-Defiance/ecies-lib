import { I18nEngine, Language } from '@digitaldefiance/i18n-lib';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { HandleableError } from './handleable';
import { EciesStringKey } from '../enumerations/ecies-string-key';

export class TranslatableError extends HandleableError {
  public readonly StringName: string;
  constructor(
    string: EciesStringKey,
    engine: I18nEngine<EciesStringKey, Language, any, any>,
    otherVars?: Record<string, string | number>,
    language?: Language,
    options?: HandleableErrorOptions,
  ) {
    super(engine.translate(string, otherVars, language), options);
    this.name = 'TranslatableError';
    this.StringName = string;
  }
}
