import { I18nEngine, CompleteReasonMap, Language, DefaultLanguageCode, CoreStringKey, TranslationEngine } from '@digitaldefiance/i18n-lib';
import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { IHandleable } from '../interfaces/handleable';
import { HandleableError } from './handleable';

export class TypedHandleableError<
  TEnum extends Record<string, string>,
  TStringKey extends string,
> extends HandleableError implements IHandleable {
  public readonly type: TEnum[keyof TEnum];
  public readonly reasonMap: CompleteReasonMap<TEnum, TStringKey>;
  public readonly engine: TranslationEngine<TStringKey>;
  public readonly language?: Language;
  public readonly otherVars?: Record<string, string | number>;

  constructor(
    type: TEnum[keyof TEnum],
    reasonMap: CompleteReasonMap<TEnum, TStringKey>,
    engine: TranslationEngine<TStringKey>,
    language?: Language,
    otherVars?: Record<string, string | number>,
    options?: HandleableErrorOptions,
  ) {
    const key = reasonMap[type];
    if (!key) {
      const coreEngine = I18nEngine.getInstance<I18nEngine<CoreStringKey, DefaultLanguageCode, any, any, any>>();
      throw new Error(coreEngine.translate(CoreStringKey.Error_MissingTranslationKeyTemplate, {
        stringKey: key as string,
      }));
    }
    
    let message: string = String(type);
    try {
      const keyString = key as TStringKey;
      const translated = engine.translate(keyString, otherVars, language);
      message = String(translated || type);
    } catch (error) {
      message = String(type);
    }
    
    super(new Error(message), options);
    
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
    };
  }
}
