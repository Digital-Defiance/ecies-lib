/**
 * Simple ECIES error class for ECIES library.
 * General-purpose error for ECIES operations.
 */
import {
  buildReasonMap,
  HandleableErrorOptions,
  TypedHandleableError,
} from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../enumerations/ecies-error-type';
import {
  EciesStringKeyValue,
  EciesComponentId,
} from '../enumerations/ecies-string-key';

export class SimpleECIESError extends TypedHandleableError<
  typeof ECIESErrorTypeEnum,
  EciesStringKeyValue
> {
  constructor(
    type: ECIESErrorTypeEnum,
    options?: HandleableErrorOptions,
    language?: string,
    otherVars?: Record<string, string | number>,
  ) {
    const source =
      options?.cause instanceof Error ? options.cause : new Error();
    const reasonMap = buildReasonMap<
      typeof ECIESErrorTypeEnum,
      EciesStringKeyValue
    >(ECIESErrorTypeEnum, ['Error', 'ECIESError']);

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
