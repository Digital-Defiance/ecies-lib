import { buildReasonMap, HandleableErrorOptions, CoreLanguageCode, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../enumerations/ecies-error-type';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class ECIESError<TLanguage extends CoreLanguageCode = CoreLanguageCode> extends PluginTypedHandleableError<
  typeof ECIESErrorTypeEnum,
  EciesStringKey
> {
  constructor(
    type: ECIESErrorTypeEnum,
    options?: HandleableErrorOptions,
    language?: TLanguage,
    otherVars?: Record<string, string | number>,
  ) {
    super(
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
