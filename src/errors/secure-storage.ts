import { SecureStorageErrorType } from '../enumerations/secure-storage-error-type';
import { buildReasonMap, HandleableErrorOptions, PluginI18nEngine, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class SecureStorageError extends PluginTypedHandleableError<typeof SecureStorageErrorType, EciesStringKey> {
  constructor(type: SecureStorageErrorType, options?: HandleableErrorOptions, language?: string) {
    const reasonMap = buildReasonMap<typeof SecureStorageErrorType, EciesStringKey>(SecureStorageErrorType, ['Error', 'SecureStorageError']);
    
    super(EciesComponentId, type, reasonMap, new Error(), options, language);
    this.name = 'SecureStorageError';
  }
}
