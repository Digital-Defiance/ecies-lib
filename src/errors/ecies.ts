import { buildReasonMap, HandleableErrorOptions, TypedHandleableError } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../enumerations/ecies-error-type';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class ECIESError extends TypedHandleableError<
  typeof ECIESErrorTypeEnum,
  EciesStringKey
> {
  constructor(
    type: ECIESErrorTypeEnum,
    options?: HandleableErrorOptions,
    language?: string,
    otherVars?: Record<string, string | number>,
  ) {
    const source = options?.cause instanceof Error ? options.cause : new Error();
    super(
      EciesComponentId,
      type,
      buildReasonMap<typeof ECIESErrorTypeEnum, EciesStringKey>(
        ECIESErrorTypeEnum,
        ['Error', 'ECIESError'],
      ),
      source,
      options,
      language,
      otherVars,
    );
    this.name = 'ECIESError';
  }
}
