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

// Clean up I18n engine before each test
beforeEach(() => {
  PluginI18nEngine.resetAll();
  resetCoreI18nEngine();
  resetEciesI18nEngine();
});

// Clean up I18n engine after each test
afterEach(() => {
  resetEciesI18nEngine();
  resetCoreI18nEngine();
  PluginI18nEngine.resetAll();
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
