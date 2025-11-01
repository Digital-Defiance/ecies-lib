import { buildReasonMap, HandleableErrorOptions, Language, TranslationEngine, TypedHandleableError } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../enumerations/ecies-error-type';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { getCompatibleEciesEngine } from '../i18n-setup';

export class ECIESError extends TypedHandleableError<
  typeof ECIESErrorTypeEnum,
  EciesStringKey
> {
  constructor(
    type: ECIESErrorTypeEnum,
    engine?: TranslationEngine<EciesStringKey>,
    options?: HandleableErrorOptions,
    language?: Language,
    otherVars?: Record<string, string | number>,
  ) {
    const engineAdapter = engine || getCompatibleEciesEngine();
    super(
      type,
      buildReasonMap<typeof ECIESErrorTypeEnum, EciesStringKey>(
        ECIESErrorTypeEnum,
        ['Error', 'ECIESError'],
      ),
      engineAdapter,
      language,
      otherVars,
      options,
    );
    this.name = 'ECIESError';
  }
}
