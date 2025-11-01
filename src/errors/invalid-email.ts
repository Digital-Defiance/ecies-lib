import { InvalidEmailErrorType } from '../enumerations/invalid-email-type';
import { buildReasonMap, HandleableErrorOptions, CoreLanguageCode, PluginI18nEngine, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class InvalidEmailError<TLanguage extends CoreLanguageCode = CoreLanguageCode> extends PluginTypedHandleableError<typeof InvalidEmailErrorType, EciesStringKey, TLanguage> {
  constructor(type: InvalidEmailErrorType, engine: PluginI18nEngine<TLanguage>, options?: HandleableErrorOptions, language?: TLanguage) {
    super(engine, EciesComponentId, type, buildReasonMap<typeof InvalidEmailErrorType, EciesStringKey>(InvalidEmailErrorType, ['Error', 'InvalidEmailError']), new Error(), options, language);
    this.name = 'InvalidEmailError';
  }
}
