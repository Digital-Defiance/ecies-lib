import { Pbkdf2ErrorType } from '../enumerations/pbkdf2-error-type';
import { buildReasonMap, HandleableErrorOptions, PluginTypedHandleableError, PluginI18nEngine } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class Pbkdf2Error extends PluginTypedHandleableError<typeof Pbkdf2ErrorType, EciesStringKey> {

  constructor(type: Pbkdf2ErrorType, options?: HandleableErrorOptions, language?: string) {
    super(EciesComponentId, type, buildReasonMap<typeof Pbkdf2ErrorType, EciesStringKey>(Pbkdf2ErrorType, ['Error', 'Pbkdf2Error']), new Error(), options, language);
    this.name = 'Pbkdf2Error';
  }
}
