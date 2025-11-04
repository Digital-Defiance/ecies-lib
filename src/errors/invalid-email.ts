import { InvalidEmailErrorType } from '../enumerations/invalid-email-type';
import { buildReasonMap, HandleableErrorOptions, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class InvalidEmailError extends PluginTypedHandleableError<typeof InvalidEmailErrorType, EciesStringKey> {
  constructor(type: InvalidEmailErrorType, options?: HandleableErrorOptions, language?: string) {
    super(EciesComponentId, type, buildReasonMap<typeof InvalidEmailErrorType, EciesStringKey>(InvalidEmailErrorType, ['Error', 'InvalidEmailError']), new Error(), { statusCode: 422, ...options }, language);
    this.name = 'InvalidEmailError';
  }
}
