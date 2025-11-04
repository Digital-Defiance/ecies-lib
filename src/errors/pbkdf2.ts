import { Pbkdf2ErrorType } from '../enumerations/pbkdf2-error-type';
import { buildReasonMap, HandleableErrorOptions, TypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class Pbkdf2Error extends TypedHandleableError<typeof Pbkdf2ErrorType, EciesStringKey> {

  constructor(type: Pbkdf2ErrorType, options?: HandleableErrorOptions, language?: string) {
    const source = options?.cause instanceof Error ? options.cause : new Error();
    super(
      EciesComponentId,
      type,
      buildReasonMap<typeof Pbkdf2ErrorType, EciesStringKey>(Pbkdf2ErrorType, ['Error', 'Pbkdf2Error']),
      source,
      options,
      language
    );
    this.name = 'Pbkdf2Error';
  }
}
