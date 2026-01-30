/**
 * Member operation error class for ECIES library.
 * Thrown when Member class operations fail.
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
import { MemberErrorType } from '../enumerations/member-error-type';

export class MemberError extends TypedHandleableError<
  typeof MemberErrorType,
  EciesStringKeyValue
> {
  constructor(
    type: MemberErrorType,
    options?: HandleableErrorOptions,
    language?: string,
  ) {
    const source =
      options?.cause instanceof Error ? options.cause : new Error();
    super(
      EciesComponentId,
      type,
      buildReasonMap<typeof MemberErrorType, EciesStringKeyValue>(
        MemberErrorType,
        ['Error', 'MemberError'],
      ),
      source,
      options,
      language,
    );
    this.name = 'MemberError';
  }
}
