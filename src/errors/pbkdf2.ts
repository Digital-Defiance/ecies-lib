/**
 * PBKDF2 operation error class for ECIES library.
 * Thrown when password-based key derivation fails.
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
import { Pbkdf2ErrorType } from '../enumerations/pbkdf2-error-type';

export class Pbkdf2Error extends TypedHandleableError<
  typeof Pbkdf2ErrorType,
  EciesStringKeyValue
> {
  constructor(
    type: Pbkdf2ErrorType,
    options?: HandleableErrorOptions,
    language?: string,
  ) {
    const source =
      options?.cause instanceof Error ? options.cause : new Error();
    super(
      EciesComponentId,
      type,
      buildReasonMap<typeof Pbkdf2ErrorType, EciesStringKeyValue>(
        Pbkdf2ErrorType,
        ['Error', 'Pbkdf2Error'],
      ),
      source,
      options,
      language,
    );
    this.name = 'Pbkdf2Error';
  }
}
