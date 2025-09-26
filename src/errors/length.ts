import { LengthErrorType } from '../enumerations/length-error-type';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { buildReasonMap, I18nEngine, Language } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { TypedHandleableError } from './typed-handleable';

export class LengthError extends TypedHandleableError<typeof LengthErrorType, EciesStringKey> {
  constructor(type: LengthErrorType, engine: I18nEngine<EciesStringKey, Language, any, any>, options?: HandleableErrorOptions, language?: Language) {
    super(type, buildReasonMap<typeof LengthErrorType, EciesStringKey>(LengthErrorType, ['Error', 'LengthError']), engine, language, undefined, options);
    this.name = 'LengthError';
  }
}
