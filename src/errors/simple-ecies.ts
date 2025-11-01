import { buildReasonMap, HandleableErrorOptions, CoreLanguageCode, PluginI18nEngine, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum, EciesStringKey } from '../enumerations';
import { EciesComponentId } from '../i18n-setup';

export class SimpleECIESError<TLanguage extends CoreLanguageCode = CoreLanguageCode> extends PluginTypedHandleableError<typeof ECIESErrorTypeEnum, EciesStringKey, TLanguage> {
  constructor(
    type: ECIESErrorTypeEnum,
    engine: PluginI18nEngine<TLanguage>,
    options?: HandleableErrorOptions,
    language?: TLanguage,
    otherVars?: Record<string, string | number>
  ) {
    const reasonMap = buildReasonMap<typeof ECIESErrorTypeEnum, EciesStringKey>(ECIESErrorTypeEnum, ['Error', 'ECIESError']);

    super(engine, EciesComponentId, type, reasonMap, new Error(), options, language, otherVars);
    this.name = 'SimpleECIESError';
  }
}