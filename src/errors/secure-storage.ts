/**
 * Secure storage error class for ECIES library.
 * Thrown when secure storage operations fail.
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
import { SecureStorageErrorType } from '../enumerations/secure-storage-error-type';

export class SecureStorageError extends TypedHandleableError<
  typeof SecureStorageErrorType,
  EciesStringKeyValue
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
      EciesStringKeyValue
    >(SecureStorageErrorType, ['Error', 'SecureStorageError']);

    super(EciesComponentId, type, reasonMap, source, options, language);
    this.name = 'SecureStorageError';
  }
}
