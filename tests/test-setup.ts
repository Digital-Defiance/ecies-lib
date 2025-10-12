import { PluginI18nEngine, resetAllI18nEngines } from '@digitaldefiance/i18n-lib';
import { webcrypto } from 'crypto';
import { resetEciesI18nForTests } from '../src/i18n-setup';
import { toThrowType } from './matchers/error-matchers';
import { LocalStorageMock } from './support/localStorage-mock';

// Extend expect with custom matchers
expect.extend({ toThrowType });

// Re-export the matcher to ensure it's loaded
export { toThrowType };

// Clean up I18n engine before each test
beforeEach(() => {
  // Use the new cleanup mechanism from @digitaldefiance/i18n-lib v1.1.2
  resetAllI18nEngines();
  resetEciesI18nForTests();
});

// Clean up I18n engine after each test
afterEach(() => {
  // Use the new cleanup mechanism from @digitaldefiance/i18n-lib v1.1.2
  resetAllI18nEngines();
  resetEciesI18nForTests();
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
