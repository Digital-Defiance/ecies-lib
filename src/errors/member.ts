import {
  buildReasonMap,
  HandleableErrorOptions,
  TypedHandleableError,
} from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { MemberErrorType } from '../enumerations/member-error-type';
import { EciesComponentId } from '../i18n-setup';

export class MemberError extends TypedHandleableError<
  typeof MemberErrorType,
  EciesStringKey
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
      buildReasonMap<typeof MemberErrorType, EciesStringKey>(MemberErrorType, [
        'Error',
        'MemberError',
      ]),
      source,
      options,
      language,
    );
    this.name = 'MemberError';
  }
}
