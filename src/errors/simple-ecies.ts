import {
  buildReasonMap,
  HandleableErrorOptions,
  TypedHandleableError,
} from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum, EciesStringKey } from '../enumerations';
import { EciesComponentId } from '../i18n-setup';

export class SimpleECIESError extends TypedHandleableError<
  typeof ECIESErrorTypeEnum,
  EciesStringKey
> {
  constructor(
    type: ECIESErrorTypeEnum,
    options?: HandleableErrorOptions,
    language?: string,
    otherVars?: Record<string, string | number>,
  ) {
    const source =
      options?.cause instanceof Error ? options.cause : new Error();
    const reasonMap = buildReasonMap<typeof ECIESErrorTypeEnum, EciesStringKey>(
      ECIESErrorTypeEnum,
      ['Error', 'ECIESError'],
    );

    super(
      EciesComponentId,
      type,
      reasonMap,
      source,
      options,
      language,
      otherVars,
    );
    this.name = 'SimpleECIESError';
  }
}
