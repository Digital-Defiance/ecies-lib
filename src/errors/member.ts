import { MemberErrorType } from '../enumerations/member-error-type';
import { buildReasonMap, HandleableErrorOptions, I18nEngine, Language, TypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';

export class MemberError extends TypedHandleableError<typeof MemberErrorType, EciesStringKey> {

  constructor(type: MemberErrorType, engine: I18nEngine<EciesStringKey, Language, any, any>, options?: HandleableErrorOptions, language?: Language) {
    super(type, buildReasonMap<typeof MemberErrorType, EciesStringKey>(MemberErrorType, ['Error', 'MemberError']), engine, language, undefined, options);
    this.name = 'MemberError';
  }
}
