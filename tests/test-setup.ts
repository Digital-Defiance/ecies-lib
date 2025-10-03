import { webcrypto } from 'crypto';
import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { toThrowType } from './matchers/error-matchers';
import { LocalStorageMock } from './support/localStorage-mock';
import { EciesI18nEngineKey, resetEciesI18nEngine } from '../src/i18n-setup';

// Extend expect with custom matchers
expect.extend({ toThrowType });

// Re-export the matcher to ensure it's loaded
export { toThrowType };

// Clean up I18n engine before each test
beforeEach(() => {
  I18nEngine.removeInstance(EciesI18nEngineKey);
  resetEciesI18nEngine();
});

// Clean up I18n engine after each test
afterEach(() => {
  I18nEngine.removeInstance(EciesI18nEngineKey);
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
