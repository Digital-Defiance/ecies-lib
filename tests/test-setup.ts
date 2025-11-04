import { PluginI18nEngine, resetCoreI18nEngine } from '@digitaldefiance/i18n-lib';
import { webcrypto } from 'crypto';
import { resetEciesI18nEngine, getEciesI18nEngine } from '../src/i18n-setup';
import { toThrowType } from './matchers/error-matchers';
import { LocalStorageMock } from './support/localStorage-mock';

// Extend expect with custom matchers
expect.extend({ toThrowType });

jest.setTimeout(30000);

// Re-export the matcher
export { toThrowType };

// Note: Using i18n-lib 2.0 patterns
// - PluginI18nEngine.resetAll() instead of resetAllI18nEngines()
// - Runtime validation via registry
// - No generic type parameters

// Clean up I18n engine before each test (i18n 2.0 pattern)
beforeEach(() => {
  PluginI18nEngine.resetAll();
  resetCoreI18nEngine();
  resetEciesI18nEngine();
  // Force re-initialization by calling getEciesI18nEngine
  getEciesI18nEngine();
});

// Clean up I18n engine after each test (i18n 2.0 pattern)
afterEach(() => {
  PluginI18nEngine.resetAll();
  resetCoreI18nEngine();
  resetEciesI18nEngine();
});

// Polyfill Web Crypto API for Node.js test environment
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  });
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new LocalStorageMock(),
    writable: true,
    configurable: true,
  });
}
