import { ECIESErrorTypeEnum } from '../enumerations/ecies-error-type';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { TypedHandleableError } from './typed-handleable';
import { buildReasonMap, I18nEngine, Language } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';

export class ECIESError extends TypedHandleableError<typeof ECIESErrorTypeEnum, EciesStringKey> {
  constructor(type: ECIESErrorTypeEnum, engine: I18nEngine<EciesStringKey, Language, any, any>, options?: HandleableErrorOptions, language?: Language, otherVars?: Record<string, string | number>) {
    super(type, buildReasonMap<typeof ECIESErrorTypeEnum, EciesStringKey>(ECIESErrorTypeEnum, ['Error', 'ECIESError']), engine, language, otherVars, options);
    this.name = 'ECIESError';
  }
}
