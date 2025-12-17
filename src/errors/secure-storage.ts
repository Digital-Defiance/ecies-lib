import {
  buildReasonMap,
  HandleableErrorOptions,
  TypedHandleableError,
} from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { SecureStorageErrorType } from '../enumerations/secure-storage-error-type';
import { EciesComponentId } from '../i18n-setup';

export class SecureStorageError extends TypedHandleableError<
  typeof SecureStorageErrorType,
  EciesStringKey
> {
  constructor(
    type: SecureStorageErrorType,
    options?: HandleableErrorOptions,
    language?: string,
  ) {
    const source =
      options?.cause instanceof Error ? options.cause : new Error();
    const reasonMap = buildReasonMap<
      typeof SecureStorageErrorType,
      EciesStringKey
    >(SecureStorageErrorType, ['Error', 'SecureStorageError']);

    super(EciesComponentId, type, reasonMap, source, options, language);
    this.name = 'SecureStorageError';
  }
}
