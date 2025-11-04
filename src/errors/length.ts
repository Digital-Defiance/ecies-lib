import { LengthErrorType } from '../enumerations/length-error-type';
import { buildReasonMap, HandleableErrorOptions, TypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class LengthError extends TypedHandleableError<typeof LengthErrorType, EciesStringKey> {
  constructor(type: LengthErrorType, options?: HandleableErrorOptions, language?: string) {
    const source = options?.cause instanceof Error ? options.cause : new Error();
    super(
      EciesComponentId,
      type,
      buildReasonMap<typeof LengthErrorType, EciesStringKey>(LengthErrorType, ['Error', 'LengthError']),
      source,
      options,
      language
    );
    this.name = 'LengthError';
  }
}
