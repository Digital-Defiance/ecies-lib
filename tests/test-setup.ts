/* eslint-disable import/order */
import {
  LocalStorageMock,
  toThrowType,
} from '@digitaldefiance/express-suite-test-utils';
import {
  PluginI18nEngine,
  resetCoreI18nEngine,
} from '@digitaldefiance/i18n-lib';
import { webcrypto } from 'crypto';
/* eslint-enable import/order */
import { Constants } from '../src/constants';
import { getEciesI18nEngine, resetEciesI18nEngine } from '../src/i18n-setup';

// Extend expect with custom matchers
// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
expect.extend({ toThrowType });

// Add BigInt serialization support for Jest
// @ts-expect-error - Adding toJSON method to BigInt prototype for Jest serialization
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
jest.setTimeout(30000);

// Enable garbage collection for memory-intensive tests
if (typeof global.gc === 'undefined') {
  try {
    // Try to enable gc if --expose-gc flag is available
    global.gc = require('vm').runInNewContext('gc');
  } catch {
    // gc not available, continue without it
  }
}

// Global test logging
// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
beforeEach(() => {
  if (!process.env.VERBOSE_TESTS) return;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const testName = expect.getState().currentTestName;
  if (testName) {
    const msg = `\n▶ ${testName}\n`;
    process.stderr.write(msg);
    // @ts-expect-error - Force flush
    if (
      process.stderr._handle &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      typeof process.stderr._handle.setBlocking === 'function'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      process.stderr._handle.setBlocking(true);
    }
  }
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
afterEach(() => {
  if (!process.env.VERBOSE_TESTS) return;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const testName = expect.getState().currentTestName;
  if (testName) {
    process.stderr.write(`✓ ${testName}\n`);
  }
});

// Re-export the matcher
export { toThrowType };

// Initialize i18n engine once before all tests
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
beforeAll(() => {
  getEciesI18nEngine({ constants: Constants });
});

// Clean up I18n engine after all tests
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
