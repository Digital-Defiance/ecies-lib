import { InvalidEmailErrorType } from '../enumerations/invalid-email-type';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { TypedHandleableError } from './typed-handleable';
import { buildReasonMap, Language, TranslationEngine } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';

export class InvalidEmailError extends TypedHandleableError<typeof InvalidEmailErrorType, EciesStringKey> {
  constructor(type: InvalidEmailErrorType, engine: TranslationEngine<EciesStringKey>, options?: HandleableErrorOptions, language?: Language) {
    super(type, buildReasonMap<typeof InvalidEmailErrorType, EciesStringKey>(InvalidEmailErrorType, ['Error', 'InvalidEmailError']), engine, language, undefined, options);
    this.name = 'InvalidEmailError';
  }
}
