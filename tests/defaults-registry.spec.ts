import {
  Defaults,
  DefaultsRegistry,
  createRuntimeConfiguration,
  getRuntimeConfiguration,
  registerRuntimeConfiguration,
  unregisterRuntimeConfiguration,
  clearRuntimeConfigurations,
  ConfigurationKey,
} from '../src/defaults';
import { ECIESError } from '../src/errors/ecies';

describe('DefaultsRegistry', () => {
  const performanceKey: ConfigurationKey = 'performance-profile';
  const securityKey: ConfigurationKey = 'security-profile';

  afterEach(() => {
    clearRuntimeConfigurations();
  });

  it('registers a configuration override and retrieves it', () => {
    const result = registerRuntimeConfiguration(performanceKey, {
      PBKDF2: {
        ITERATIONS_PER_SECOND: 1000,
      },
    });

    expect(result.PBKDF2.ITERATIONS_PER_SECOND).toBe(1000);
    expect(getRuntimeConfiguration(performanceKey)).toBe(result);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.PBKDF2)).toBe(true);
  });

  it('creates configurations that inherit from other registrations', () => {
    registerRuntimeConfiguration(securityKey, {
      PBKDF2: {
        ITERATIONS_PER_SECOND: Defaults.PBKDF2.ITERATIONS_PER_SECOND * 2,
      },
    });

    const inherited = DefaultsRegistry.register(
      performanceKey,
      {
        PBKDF2: {
          ITERATIONS_PER_SECOND: Defaults.PBKDF2.ITERATIONS_PER_SECOND / 2,
        },
      },
      { baseKey: securityKey },
    );

    expect(inherited.PBKDF2.ITERATIONS_PER_SECOND).toBe(
      Defaults.PBKDF2.ITERATIONS_PER_SECOND / 2,
    );
    expect(inherited.PBKDF2.ALGORITHM).toBe(
      getRuntimeConfiguration(securityKey).PBKDF2.ALGORITHM,
    );
  });

  it('does not allow overwriting the default configuration key', () => {
    expect(() =>
      registerRuntimeConfiguration(DefaultsRegistry.DEFAULT_KEY, {
        BcryptRounds: 4,
      } as any),
    ).toThrow('Cannot overwrite the default configuration');
  });

  it('validates overrides when creating configurations', () => {
    expect(() =>
      createRuntimeConfiguration({
        ECIES: {
          MULTIPLE: {
            ENCRYPTED_KEY_SIZE: 0,
          },
        },
      }),
    ).toThrow(ECIESError);
  });

  it('removes custom configurations when unregistering', () => {
    registerRuntimeConfiguration(performanceKey, {
      PBKDF2: {
        ITERATIONS_PER_SECOND: 12345,
      },
    });

    expect(unregisterRuntimeConfiguration(performanceKey)).toBe(true);
    expect(getRuntimeConfiguration(performanceKey)).toBe(Defaults);
  });
});
