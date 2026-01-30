/**
 * Length validation error class for ECIES library.
 * Thrown when data length constraints are violated.
 */
import {
  buildReasonMap,
  HandleableErrorOptions,
  TypedHandleableError,
} from '@digitaldefiance/i18n-lib';
import {
  EciesStringKeyValue,
  EciesComponentId,
} from '../enumerations/ecies-string-key';
import { LengthErrorType } from '../enumerations/length-error-type';

export class LengthError extends TypedHandleableError<
  typeof LengthErrorType,
  EciesStringKeyValue
> {
  constructor(
    type: LengthErrorType,
    options?: HandleableErrorOptions,
    language?: string,
  ) {
    const source =
      options?.cause instanceof Error ? options.cause : new Error();
    super(
      EciesComponentId,
      type,
      buildReasonMap<typeof LengthErrorType, EciesStringKeyValue>(
        LengthErrorType,
        ['Error', 'LengthError'],
      ),
      source,
      options,
      language,
    );
    this.name = 'LengthError';
  }
}
