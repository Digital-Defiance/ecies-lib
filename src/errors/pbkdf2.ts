import { Pbkdf2ErrorType } from '../enumerations/pbkdf2-error-type';
import { buildReasonMap, HandleableErrorOptions, PluginTypedHandleableError, PluginI18nEngine, CoreLanguageCode } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class Pbkdf2Error<TLanguage extends CoreLanguageCode = CoreLanguageCode> extends PluginTypedHandleableError<typeof Pbkdf2ErrorType, EciesStringKey, TLanguage> {

  constructor(type: Pbkdf2ErrorType, engine: PluginI18nEngine<TLanguage>, options?: HandleableErrorOptions, language?: TLanguage) {
    super(engine, EciesComponentId, type, buildReasonMap<typeof Pbkdf2ErrorType, EciesStringKey>(Pbkdf2ErrorType, ['Error', 'Pbkdf2Error']), new Error(), options, language);
    this.name = 'Pbkdf2Error';
  }
}
