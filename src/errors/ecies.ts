import { buildReasonMap, Language } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../enumerations/ecies-error-type';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { getCompatibleEciesEngine } from '../i18n-setup';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { TypedHandleableError } from './typed-handleable';

export class ECIESError extends TypedHandleableError<
  typeof ECIESErrorTypeEnum,
  EciesStringKey
> {
  constructor(
    type: ECIESErrorTypeEnum,
    engine?: any,
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
      engineAdapter as any,
      language,
      otherVars,
      options,
    );
    this.name = 'ECIESError';
  }
}
