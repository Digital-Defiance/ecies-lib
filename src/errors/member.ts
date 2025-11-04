import { MemberErrorType } from '../enumerations/member-error-type';
import { buildReasonMap, HandleableErrorOptions, PluginI18nEngine, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class MemberError extends PluginTypedHandleableError<typeof MemberErrorType, EciesStringKey> {

  constructor(type: MemberErrorType, options?: HandleableErrorOptions, language?: string) {
    super(EciesComponentId, type, buildReasonMap<typeof MemberErrorType, EciesStringKey>(MemberErrorType, ['Error', 'MemberError']), new Error(), options, language);
    this.name = 'MemberError';
  }
}
