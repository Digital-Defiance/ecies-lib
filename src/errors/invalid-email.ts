import { InvalidEmailErrorType } from '../enumerations/invalid-email-type';
import { buildReasonMap, HandleableErrorOptions, Language, TranslationEngine, TypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';

export class InvalidEmailError extends TypedHandleableError<typeof InvalidEmailErrorType, EciesStringKey> {
  constructor(type: InvalidEmailErrorType, engine: TranslationEngine<EciesStringKey>, options?: HandleableErrorOptions, language?: Language) {
    super(type, buildReasonMap<typeof InvalidEmailErrorType, EciesStringKey>(InvalidEmailErrorType, ['Error', 'InvalidEmailError']), engine, language, undefined, options);
    this.name = 'InvalidEmailError';
  }
}
