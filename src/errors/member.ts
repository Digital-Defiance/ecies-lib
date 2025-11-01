import { MemberErrorType } from '../enumerations/member-error-type';
import { buildReasonMap, HandleableErrorOptions, CoreLanguageCode, PluginI18nEngine, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

export class MemberError<TLanguage extends CoreLanguageCode = CoreLanguageCode> extends PluginTypedHandleableError<typeof MemberErrorType, EciesStringKey, TLanguage> {

  constructor(type: MemberErrorType, engine: PluginI18nEngine<TLanguage>, options?: HandleableErrorOptions, language?: TLanguage) {
    super(engine, EciesComponentId, type, buildReasonMap<typeof MemberErrorType, EciesStringKey>(MemberErrorType, ['Error', 'MemberError']), new Error(), options, language);
    this.name = 'MemberError';
  }
}
