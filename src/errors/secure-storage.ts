import { SecureStorageErrorType } from '../enumerations/secure-storage-error-type';
import { buildReasonMap, HandleableErrorOptions, CoreLanguageCode, PluginI18nEngine, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class SecureStorageError<TLanguage extends CoreLanguageCode = CoreLanguageCode> extends PluginTypedHandleableError<typeof SecureStorageErrorType, EciesStringKey, TLanguage> {
  constructor(type: SecureStorageErrorType, engine: PluginI18nEngine<TLanguage>, options?: HandleableErrorOptions, language?: TLanguage) {
    const reasonMap = buildReasonMap<typeof SecureStorageErrorType, EciesStringKey>(SecureStorageErrorType, ['Error', 'SecureStorageError']);
    
    super(engine, EciesComponentId, type, reasonMap, new Error(), options, language);
    this.name = 'SecureStorageError';
  }
}
