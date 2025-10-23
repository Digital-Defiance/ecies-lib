import { HandleableError } from '../../src/errors/handleable';
import { TypedHandleableError } from '../../src/errors/typed-handleable';
import { EciesI18nEngineKey } from '../../src/i18n-setup';
import { HandleableErrorOptions } from '../../src/interfaces/handleable-error-options';
import { LanguageCodes, CompleteReasonMap, I18nEngine, I18nConfig, Timezone, CurrencyCode } from '@digitaldefiance/i18n-lib';

type TestLanguageCode = typeof LanguageCodes.EN_US | typeof LanguageCodes.EN_GB | typeof LanguageCodes.FR | typeof LanguageCodes.ES | typeof LanguageCodes.ZH_CN | typeof LanguageCodes.UK;

enum TestErrorType {
  Simple = 'Simple',
  Templated = 'Templated',
}

enum TestStringKeys {
  Common_Test = 'Common_Test',
  Error_MissingTranslationTemplate = 'Error_MissingTranslationTemplate',
}

const testReasonMap: CompleteReasonMap<typeof TestErrorType, TestStringKeys> = {
  [TestErrorType.Simple]: TestStringKeys.Common_Test,
  [TestErrorType.Templated]: TestStringKeys.Error_MissingTranslationTemplate,
};

class TestTypedError extends TypedHandleableError<typeof TestErrorType, TestStringKeys> {
  constructor(
    type: TestErrorType,
    language?: TestLanguageCode,
    otherVars?: Record<string, string | number>,
    options?: HandleableErrorOptions
  ) {
    let engine: I18nEngine<TestStringKeys, TestLanguageCode, any, any>;
    try {
    engine = I18nEngine.getInstance<I18nEngine<TestStringKeys, TestLanguageCode, any, any>>('testEngine');
    }
    catch {
      const config: I18nConfig<TestStringKeys, TestLanguageCode, any, any> = {
        stringNames: 
          [TestStringKeys.Common_Test, TestStringKeys.Error_MissingTranslationTemplate],
          strings: {
            [LanguageCodes.EN_US]: {
              [TestStringKeys.Common_Test]: 'This is a test error message.',
              [TestStringKeys.Error_MissingTranslationTemplate]: 'Missing template variable: {key} in language {language}.',
            }, [LanguageCodes.EN_GB]: {
              [TestStringKeys.Common_Test]: 'This is a test error message (UK).',
              [TestStringKeys.Error_MissingTranslationTemplate]: 'Missing template variable: {key} in language {language} (UK).',
            }, [LanguageCodes.FR]: {
              [TestStringKeys.Common_Test]: "Ceci est un message d'erreur de test.",
              [TestStringKeys.Error_MissingTranslationTemplate]: 'Variable de modèle manquante : {key} dans la langue {language}.',
            }, [LanguageCodes.ES]: {
              [TestStringKeys.Common_Test]: "Este es un mensaje de error de prueba.",
              [TestStringKeys.Error_MissingTranslationTemplate]: 'Falta la variable de plantilla: {key} en el idioma {language}.',
            }, [LanguageCodes.ZH_CN]: {
              [TestStringKeys.Common_Test]: "这是一个测试错误消息。",
              [TestStringKeys.Error_MissingTranslationTemplate]: '缺少模板变量：{key} 在语言 {language} 中。',
            }, [LanguageCodes.UK]: {
              [TestStringKeys.Common_Test]: "Це тестове повідомлення про помилку.",
              [TestStringKeys.Error_MissingTranslationTemplate]: 'Відсутня змінна шаблону: {key} мовою {language}.',
            },
            
          },
          defaultLanguage: LanguageCodes.EN_US,
          adminTimezone: new Timezone('UTC'),
          timezone: new Timezone('UTC'),
          defaultCurrencyCode: new CurrencyCode('USD'),
          defaultTranslationContext: {},
          languageCodes: {
            [LanguageCodes.EN_US]: 'en-US',
            [LanguageCodes.EN_GB]: 'en-GB',
            [LanguageCodes.FR]: 'fr',
            [LanguageCodes.ZH_CN]: 'zh-CN',
            [LanguageCodes.ES]: 'es',
            [LanguageCodes.UK]: 'uk',
          },
          languages: [LanguageCodes.EN_US, LanguageCodes.EN_GB, LanguageCodes.FR, LanguageCodes.ES, LanguageCodes.ZH_CN, LanguageCodes.UK],
          enumName: 'TestStringKeys',
          constants: {},
      }
      engine = new I18nEngine<TestStringKeys, TestLanguageCode, any, any>(config, 'testEngine');
    }
    super(type, testReasonMap, engine, language, otherVars, options);
    this.name = 'TestTypedError';
  }
}

describe('TypedError', () => {
  beforeEach(() => {
    // Clear singleton instances before each test
    I18nEngine.removeInstance(EciesI18nEngineKey);
  });
  it('should create typed error with simple translation', () => {
    const error = new TestTypedError(TestErrorType.Simple);
    
    expect(error.type).toBe(TestErrorType.Simple);
    expect(error.name).toBe('TestTypedError');
    expect(error.statusCode).toBe(500);
    expect(error.handled).toBe(false);
  });

  it('should create typed error with templated translation', () => {
    const error = new TestTypedError(
      TestErrorType.Templated,
      LanguageCodes.EN_US,
      { key: 'testKey', language: 'English' }
    );
    
    expect(error.type).toBe(TestErrorType.Templated);
  });

  it('should create typed error with handleable options', () => {
    const cause = new Error('Original error');
    const options: HandleableErrorOptions = {
      cause,
      statusCode: 400,
      handled: true,
      sourceData: { test: 'data' }
    };
    
    const error = new TestTypedError(TestErrorType.Simple, undefined, undefined, options);
    
    expect(error.statusCode).toBe(400); // StatusCode from options
    expect(error.handled).toBe(true);
    expect(error.cause).toBe(cause);
    expect(error.sourceData).toEqual({ test: 'data' });
  });

  it('should be instanceof HandleableError', () => {
    const error = new TestTypedError(TestErrorType.Simple);
    
    expect(error instanceof HandleableError).toBe(true);
    expect(error instanceof TypedHandleableError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should serialize to JSON with typed error properties', () => {
    const error = new TestTypedError(
      TestErrorType.Simple,
      undefined,
      undefined,
      { statusCode: 404, handled: true, sourceData: { key: 'value' } }
    );
    
    const json = error.toJSON();
    
    expect(json.name).toBe('TestTypedError');
    expect(json.statusCode).toBe(404); // StatusCode from options
    expect(json.handled).toBe(true);
    expect(json.sourceData).toEqual({ key: 'value' });
  });

  it('should handle nested TypedError cause in JSON', () => {
    const nestedError = new TestTypedError(TestErrorType.Simple);
    const error = new TestTypedError(
      TestErrorType.Templated,
      LanguageCodes.EN_US,
      { key: 'test', language: 'English' },
      { cause: nestedError }
    );
    
    const json = error.toJSON();
    expect(json.cause).toBeDefined();
  });



  it('should create error in different language', () => {
    const error = new TestTypedError(TestErrorType.Simple, LanguageCodes.FR);
    expect(error.type).toBe(TestErrorType.Simple);
  });

  it('should allow setting handled property', () => {
    const error = new TestTypedError(TestErrorType.Simple);
    expect(error.handled).toBe(false);
    
    error.handled = true;
    expect(error.handled).toBe(true);
  });

  it('should append cause stack to error stack', () => {
    const cause = new Error('Cause error');
    const error = new TestTypedError(
      TestErrorType.Simple,
      undefined,
      undefined,
      { cause }
    );
    
    expect(error.stack).toBeDefined();
    expect(error.cause).toBe(cause);
  });
});