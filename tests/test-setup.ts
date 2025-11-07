import { PluginI18nEngine, resetCoreI18nEngine } from '@digitaldefiance/i18n-lib';
import { webcrypto } from 'crypto';
import { resetEciesI18nEngine, getEciesI18nEngine } from '../src/i18n-setup';
import { toThrowType, LocalStorageMock } from '@digitaldefiance/express-suite-test-utils';

// Extend expect with custom matchers
expect.extend({ toThrowType });

jest.setTimeout(30000);

// Re-export the matcher
export { toThrowType };

// Initialize i18n engine once before all tests
beforeAll(() => {
  getEciesI18nEngine();
});

// Clean up I18n engine after all tests
afterAll(() => {
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
