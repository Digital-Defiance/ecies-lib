import { I18nEngine, CompleteReasonMap, Language, DefaultLanguage } from '@digitaldefiance/i18n-lib';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { HandleableError } from './handleable';

export class TypedHandleableError<
  TEnum extends Record<string, string>,
  TStringKey extends string,
> extends HandleableError {
  public readonly type: TEnum[keyof TEnum];
  public readonly reasonMap: CompleteReasonMap<TEnum, TStringKey>;
  public readonly engine: I18nEngine<any, any, any, any>;
  public readonly language?: Language;
  public readonly otherVars?: Record<string, string | number>;

  constructor(
    type: TEnum[keyof TEnum],
    reasonMap: CompleteReasonMap<TEnum, TStringKey>,
    engine: I18nEngine<TStringKey, any, any, any>,
    language?: Language,
    otherVars?: Record<string, string | number>,
    options?: HandleableErrorOptions,
    source?: Error,
  ) {
    const key = reasonMap[type];
    if (!key) {
      throw new Error(`Missing translation key for type: ${type}`);
    }
    
    let message: string = String(type);
    try {
      const keyString = key as TStringKey;
      const translated = engine.translate?.(keyString, otherVars, language);
      message = String(translated || type);
    } catch (error) {
      message = String(type);
    }
    
    super(message, options, source instanceof Error ? source : undefined);
    
    this.type = type;
    this.reasonMap = reasonMap;
    this.language = language;
    this.otherVars = otherVars;
    this.engine = engine;
  }

  public toJSON(): Record<string, unknown> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      type: this.type,
      cause:
        this.cause instanceof HandleableError
          ? this.cause.toJSON()
          : this.cause?.message,
    };
  }
}
