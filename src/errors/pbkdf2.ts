import { Pbkdf2ErrorType } from '../enumerations/pbkdf2-error-type';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { buildReasonMap, I18nEngine, Language } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { TypedHandleableError } from './typed-handleable';

export class Pbkdf2Error extends TypedHandleableError<typeof Pbkdf2ErrorType, EciesStringKey> {

  constructor(type: Pbkdf2ErrorType, engine: I18nEngine<EciesStringKey, Language, any, any>, options?: HandleableErrorOptions, language?: Language) {
    super(type, buildReasonMap<typeof Pbkdf2ErrorType, EciesStringKey>(Pbkdf2ErrorType, ['Error', 'Pbkdf2Error']), engine, language, undefined, options);
    this.name = 'Pbkdf2Error';
  }
}
