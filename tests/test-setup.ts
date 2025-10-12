import { PluginI18nEngine } from '@digitaldefiance/i18n-lib';
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
  try {
    // Clear the plugin instance registry
    (PluginI18nEngine as any)._instances?.clear?.();
  } catch (error) {
    // Ignore errors if the property doesn't exist
  }
  resetEciesI18nForTests();
});

// Clean up I18n engine after each test
afterEach(() => {
  try {
    // Clear the plugin instance registry
    (PluginI18nEngine as any)._instances?.clear?.();
  } catch (error) {
    // Ignore errors if the property doesn't exist
  }
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
