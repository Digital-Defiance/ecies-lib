import { buildReasonMap, I18nEngine, Language } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum, EciesStringKey } from '../enumerations';
import { TypedHandleableError } from './typed-handleable';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';

export class SimpleECIESError extends TypedHandleableError<typeof ECIESErrorTypeEnum, EciesStringKey> {
  constructor(
    type: ECIESErrorTypeEnum,
    engine: I18nEngine<EciesStringKey, Language, any, any>,
    language?: any,
    otherVars?: Record<string, string | number>,
    options?: HandleableErrorOptions
  ) {
    const reasonMap = buildReasonMap<typeof ECIESErrorTypeEnum, EciesStringKey>(ECIESErrorTypeEnum, ['Error', 'ECIESError']);

    super(type, reasonMap, engine, language, otherVars, options);
    this.name = 'SimpleECIESError';
  }
}