import { SecureStorageErrorType } from '../enumerations/secure-storage-error-type';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { TypedHandleableError } from './typed-handleable';
import { buildReasonMap, I18nEngine, Language } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';

export class SecureStorageError extends TypedHandleableError<typeof SecureStorageErrorType, EciesStringKey> {
  constructor(type: SecureStorageErrorType, engine: I18nEngine<EciesStringKey, Language, any, any>, options?: HandleableErrorOptions, language?: Language) {
    const reasonMap = buildReasonMap<typeof SecureStorageErrorType, EciesStringKey>(SecureStorageErrorType, ['Error', 'SecureStorageError']);
    
    super(type, reasonMap, engine, language, undefined, options);
    this.name = 'SecureStorageError';
  }
}
