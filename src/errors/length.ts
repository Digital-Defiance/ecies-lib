import { LengthErrorType } from '../enumerations/length-error-type';
import { buildReasonMap, HandleableErrorOptions, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class LengthError extends PluginTypedHandleableError<typeof LengthErrorType, EciesStringKey> {
  constructor(type: LengthErrorType, options?: HandleableErrorOptions, language?: string) {
    super(EciesComponentId, type, buildReasonMap<typeof LengthErrorType, EciesStringKey>(LengthErrorType, ['Error', 'LengthError']), new Error(), options, language);
    this.name = 'LengthError';
  }
}
