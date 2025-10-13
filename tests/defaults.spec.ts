import {
  Defaults,
  DefaultsRegistry,
  createRuntimeConfiguration,
  getRuntimeConfiguration,
  registerRuntimeConfiguration,
} from '../src/defaults';

describe('ECIES Runtime Configuration Registry', () => {
  it('should return the default configuration', () => {
    const config = getRuntimeConfiguration();
    expect(config).toBeDefined();
    expect(config.ECIES).toBeDefined();
    expect(config.PBKDF2).toBeDefined();
    expect(config.PBKDF2.ALGORITHM).toBe('SHA-256');
  });

  it('should allow registering and retrieving a custom configuration', () => {
    registerRuntimeConfiguration('custom-ecies-config', { PBKDF2: { ALGORITHM: 'SHA-512' } });
    const customConfig = getRuntimeConfiguration('custom-ecies-config');
    expect(customConfig.PBKDF2.ALGORITHM).toBe('SHA-512');
  });

  it('should deeply freeze the configuration objects', () => {
    const config = getRuntimeConfiguration();
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.ECIES)).toBe(true);
    expect(Object.isFrozen(config.PBKDF2)).toBe(true);
  });

  it('should apply overrides correctly', () => {
    const overrides = { PBKDF2: { ALGORITHM: 'SHA-1' } };
    const config = createRuntimeConfiguration(overrides);
    expect(config.PBKDF2.ALGORITHM).toBe('SHA-1');
  });
});
