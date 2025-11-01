import { buildReasonMap, HandleableErrorOptions, CoreLanguageCode, PluginI18nEngine, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../enumerations/ecies-error-type';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId, getEciesI18nEngine } from '../i18n-setup';

export class ECIESError<TLanguage extends CoreLanguageCode = CoreLanguageCode> extends PluginTypedHandleableError<
  typeof ECIESErrorTypeEnum,
  EciesStringKey,
  TLanguage
> {
  constructor(
    type: ECIESErrorTypeEnum,
    engine?: PluginI18nEngine<TLanguage>,
    options?: HandleableErrorOptions,
    language?: TLanguage,
    otherVars?: Record<string, string | number>,
  ) {
    const pluginEngine = (engine || getEciesI18nEngine()) as PluginI18nEngine<TLanguage>;
    super(
      pluginEngine,
      EciesComponentId,
      type,
      buildReasonMap<typeof ECIESErrorTypeEnum, EciesStringKey>(
        ECIESErrorTypeEnum,
        ['Error', 'ECIESError'],
      ),
      new Error(),
      options,
      language,
      otherVars,
    );
    this.name = 'ECIESError';
  }
}
