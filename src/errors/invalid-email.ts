/**
 * Invalid email error class for ECIES library.
 * Thrown when email validation fails.
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
import { InvalidEmailErrorType } from '../enumerations/invalid-email-type';

export class InvalidEmailError extends TypedHandleableError<
  typeof InvalidEmailErrorType,
  EciesStringKeyValue
> {
  public readonly email?: string;
  constructor(
    type: InvalidEmailErrorType,
    email?: string,
    options?: HandleableErrorOptions,
    language?: string,
  ) {
    const source =
      options?.cause instanceof Error ? options.cause : new Error();
    super(
      EciesComponentId,
      type,
      buildReasonMap<typeof InvalidEmailErrorType, EciesStringKeyValue>(
        InvalidEmailErrorType,
        ['Error', 'InvalidEmailError'],
      ),
      source,
      { statusCode: 422, ...options },
      language,
      {
        email: email ?? '',
      },
    );
    this.email = email;
    this.name = 'InvalidEmailError';
  }
}
