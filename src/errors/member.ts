import { MemberErrorType } from '../enumerations/member-error-type';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { TypedHandleableError } from './typed-handleable';
import { buildReasonMap, I18nEngine, Language } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';

export class MemberError extends TypedHandleableError<typeof MemberErrorType, EciesStringKey> {

  constructor(type: MemberErrorType, engine: I18nEngine<EciesStringKey, Language, any, any>, options?: HandleableErrorOptions, language?: Language) {
    super(type, buildReasonMap<typeof MemberErrorType, EciesStringKey>(MemberErrorType, ['Error', 'MemberError']), engine, language, undefined, options);
    this.name = 'MemberError';
  }
}
