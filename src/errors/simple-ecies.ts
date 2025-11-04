import { buildReasonMap, HandleableErrorOptions, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum, EciesStringKey } from '../enumerations';
import { EciesComponentId } from '../i18n-setup';

export class SimpleECIESError extends PluginTypedHandleableError<typeof ECIESErrorTypeEnum, EciesStringKey> {
  constructor(
    type: ECIESErrorTypeEnum,
    options?: HandleableErrorOptions,
    language?: string,
    otherVars?: Record<string, string | number>
  ) {
    const reasonMap = buildReasonMap<typeof ECIESErrorTypeEnum, EciesStringKey>(ECIESErrorTypeEnum, ['Error', 'ECIESError']);

    super(EciesComponentId, type, reasonMap, new Error(), options, language, otherVars);
    this.name = 'SimpleECIESError';
  }
}