import { LengthErrorType } from '../enumerations/length-error-type';
import { buildReasonMap, HandleableErrorOptions, I18nEngine, Language, TypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';

export class LengthError extends TypedHandleableError<typeof LengthErrorType, EciesStringKey> {
  constructor(type: LengthErrorType, engine: I18nEngine<EciesStringKey, Language, any, any>, options?: HandleableErrorOptions, language?: Language) {
    super(type, buildReasonMap<typeof LengthErrorType, EciesStringKey>(LengthErrorType, ['Error', 'LengthError']), engine, language, undefined, options);
    this.name = 'LengthError';
  }
}
