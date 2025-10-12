import {
  DefaultLanguage,
  I18nEngine,
  Language,
} from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../../src/enumerations';
import { TranslatableError } from '../../src/errors/translatable';
import { getCompatibleEciesEngine } from '../../src/i18n-setup';
import { HandleableErrorOptions } from '../../src/interfaces/handleable-error-options';

// Mock the getCompatibleEciesEngine function
jest.mock('../../src/i18n-setup', () => ({
  getCompatibleEciesEngine: jest.fn(() => ({
    translate: jest.fn(
      (
        key: string,
        vars?: Record<string, string | number>,
        language?: string,
      ) => {
        if (vars && language) {
          return `${key}[${language}]:${JSON.stringify(vars)}`;
        }
        if (vars) {
          return `${key}:${JSON.stringify(vars)}`;
        }
        if (language) {
          return `${key}[${language}]`;
        }
        return key;
      },
    ),
  })),
  EciesI18nEngineKey: 'EciesI18nEngine',
}));

describe('TranslatableError', () => {
  let engine: I18nEngine<EciesStringKey, DefaultLanguage, any, any>;

  beforeEach(() => {
    // Mock is already set up, just get the mocked engine
    engine = getCompatibleEciesEngine();
  });
  it('should create error with string key only', () => {
    const error = new TranslatableError('ERROR_KEY' as EciesStringKey, engine);

    expect(error.StringName).toBe('ERROR_KEY');
    expect(error.message).toBe('ERROR_KEY');
    expect(error.name).toBe('TranslatableError');
  });

  it('should create error with variables', () => {
    const error = new TranslatableError('ERROR_KEY' as EciesStringKey, engine, {
      userId: 123,
      action: 'login',
    });

    expect(error.StringName).toBe('ERROR_KEY');
    expect(error.message).toBe('ERROR_KEY:{"userId":123,"action":"login"}');
  });

  it('should create error with language', () => {
    const error = new TranslatableError(
      'ERROR_KEY' as EciesStringKey,
      engine,
      undefined,
      'es' as Language,
    );

    expect(error.StringName).toBe('ERROR_KEY');
    expect(error.message).toBe('ERROR_KEY[es]');
  });

  it('should create error with variables and language', () => {
    const error = new TranslatableError(
      'ERROR_KEY' as EciesStringKey,
      engine,
      { count: 5 },
      'fr' as Language,
    );

    expect(error.StringName).toBe('ERROR_KEY');
    expect(error.message).toBe('ERROR_KEY[fr]:{"count":5}');
  });

  it('should create error with options', () => {
    const cause = new Error('Original error');
    const options: HandleableErrorOptions = {
      cause,
      statusCode: 400,
      handled: true,
    };

    const error = new TranslatableError(
      'ERROR_KEY' as EciesStringKey,
      engine,
      undefined,
      undefined,
      options,
    );

    expect(error.StringName).toBe('ERROR_KEY');
    expect(error.statusCode).toBe(400);
    expect(error.handled).toBe(true);
    expect(error.cause).toBe(cause);
  });

  it('should inherit from HandleableError', () => {
    const error = new TranslatableError('ERROR_KEY' as EciesStringKey, engine);

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(500); // default from HandleableError
    expect(error.handled).toBe(false); // default from HandleableError
  });
});
