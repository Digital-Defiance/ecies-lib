import { LengthErrorType } from '../enumerations/length-error-type';
import { buildReasonMap, HandleableErrorOptions, CoreLanguageCode, PluginI18nEngine, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class LengthError<TLanguage extends CoreLanguageCode = CoreLanguageCode> extends PluginTypedHandleableError<typeof LengthErrorType, EciesStringKey, TLanguage> {
  constructor(type: LengthErrorType, engine: PluginI18nEngine<TLanguage>, options?: HandleableErrorOptions, language?: TLanguage) {
    super(engine, EciesComponentId, type, buildReasonMap<typeof LengthErrorType, EciesStringKey>(LengthErrorType, ['Error', 'LengthError']), new Error(), options, language);
    this.name = 'LengthError';
  }
}
