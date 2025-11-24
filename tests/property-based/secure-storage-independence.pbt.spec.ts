/**
 * Property-Based Test: Secure Storage Independence
 *
 * Feature: fix-business-logic-circular-dependencies, Property 3: Secure storage classes are independent of constants
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * This test verifies that SecureBuffer and SecureString can be instantiated
 * without requiring the constants module to be fully initialized.
 */

import * as fc from 'fast-check';

describe('Property-Based Test: Secure Storage Independence', () => {
  /**
   * Property 3: Secure storage classes are independent of constants
   *
   * For any instantiation of SecureBuffer or SecureString, the system should not
   * require the constants module to be fully initialized.
   */
  it('should create SecureBuffer without loading constants module', () => {
    fc.assert(
      fc.property(
        // Generate random byte arrays of varying lengths
        fc.uint8Array({ minLength: 0, maxLength: 1024 }),
        (data) => {
          // Clear module cache to start fresh
          jest.resetModules();

          // Track which modules get loaded
          const loadedModules = new Set<string>();
          const Module = require('module');
          const originalRequire = Module.prototype.require;

          Module.prototype.require = function (id: string) {
            loadedModules.add(id);
            return originalRequire.apply(this, arguments);
          };

          try {
            // Import SecureBuffer and ID provider
            const { SecureBuffer } = require('../../src/secure-buffer');
            const {
              ObjectIdProvider,
            } = require('../../src/lib/id-providers/objectid-provider');

            // Create ID provider
            const provider = new ObjectIdProvider();

            // Create SecureBuffer with generated data
            const buffer = new SecureBuffer(data, provider);

            // Verify buffer was created successfully
            expect(buffer).toBeDefined();
            expect(buffer.length).toBe(data.length);
            expect(buffer.id).toBeDefined();

            // Verify constants module was not loaded
            const constantsLoaded = Array.from(loadedModules).some(
              (mod) =>
                (mod.includes('constants') || mod.includes('/constants.')) &&
                !mod.includes('ecies-consts') &&
                !mod.includes('checksum-consts') &&
                !mod.includes('pbkdf2-consts'),
            );

            expect(constantsLoaded).toBe(false);

            // If constants were loaded, provide detailed error
            if (constantsLoaded) {
              const constantsModules = Array.from(loadedModules).filter(
                (mod) =>
                  (mod.includes('constants') || mod.includes('/constants.')) &&
                  !mod.includes('ecies-consts') &&
                  !mod.includes('checksum-consts') &&
                  !mod.includes('pbkdf2-consts'),
              );
              throw new Error(
                `Constants module loaded during SecureBuffer creation: ${constantsModules.join(
                  ', ',
                )}`,
              );
            }

            // Cleanup
            buffer.dispose();
          } finally {
            // Restore original require
            Module.prototype.require = originalRequire;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: SecureString can be created without loading constants
   */
  it('should create SecureString without loading constants module', () => {
    fc.assert(
      fc.property(
        // Generate random strings of varying lengths
        fc.string({ minLength: 0, maxLength: 1024 }),
        (str) => {
          // Clear module cache
          jest.resetModules();

          // Track module loads
          const loadedModules = new Set<string>();
          const Module = require('module');
          const originalRequire = Module.prototype.require;

          Module.prototype.require = function (id: string) {
            loadedModules.add(id);
            return originalRequire.apply(this, arguments);
          };

          try {
            // Import SecureString and ID provider
            const { SecureString } = require('../../src/secure-string');
            const {
              ObjectIdProvider,
            } = require('../../src/lib/id-providers/objectid-provider');

            // Create ID provider
            const provider = new ObjectIdProvider();

            // Create SecureString with generated data
            const secureStr = new SecureString(str, provider);

            // Verify SecureString was created successfully
            expect(secureStr).toBeDefined();
            expect(secureStr.value).toBe(str);
            expect(secureStr.id).toBeDefined();

            // Verify constants module was not loaded
            const constantsLoaded = Array.from(loadedModules).some(
              (mod) =>
                (mod.includes('constants') || mod.includes('/constants.')) &&
                !mod.includes('ecies-consts') &&
                !mod.includes('checksum-consts') &&
                !mod.includes('pbkdf2-consts'),
            );

            expect(constantsLoaded).toBe(false);

            // Cleanup
            secureStr.dispose();
          } finally {
            Module.prototype.require = originalRequire;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Secure storage operations work without constants
   */
  it('should perform secure storage operations without constants', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 1, maxLength: 256 }),
        fc.string({ minLength: 1, maxLength: 256 }),
        (bufferData, stringData) => {
          // Clear module cache
          jest.resetModules();

          // Track module loads
          const loadedModules = new Set<string>();
          const Module = require('module');
          const originalRequire = Module.prototype.require;

          Module.prototype.require = function (id: string) {
            loadedModules.add(id);
            return originalRequire.apply(this, arguments);
          };

          try {
            // Import secure storage classes
            const { SecureBuffer } = require('../../src/secure-buffer');
            const { SecureString } = require('../../src/secure-string');
            const {
              ObjectIdProvider,
            } = require('../../src/lib/id-providers/objectid-provider');

            const provider = new ObjectIdProvider();

            // Create instances
            const buffer = new SecureBuffer(bufferData, provider);
            const secureStr = new SecureString(stringData, provider);

            // Perform operations
            const bufferLength = buffer.length;
            const stringValue = secureStr.value;

            // Verify operations worked
            expect(bufferLength).toBe(bufferData.length);
            expect(stringValue).toBe(stringData);

            // Verify constants not loaded
            const constantsLoaded = Array.from(loadedModules).some(
              (mod) =>
                (mod.includes('constants') || mod.includes('/constants.')) &&
                !mod.includes('ecies-consts') &&
                !mod.includes('checksum-consts') &&
                !mod.includes('pbkdf2-consts'),
            );

            expect(constantsLoaded).toBe(false);

            // Cleanup
            buffer.dispose();
            secureStr.dispose();
          } finally {
            Module.prototype.require = originalRequire;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: ID provider can be used independently
   */
  it('should use ID provider without loading constants', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (iteration) => {
        // Clear module cache
        jest.resetModules();

        // Track module loads
        const loadedModules = new Set<string>();
        const Module = require('module');
        const originalRequire = Module.prototype.require;

        Module.prototype.require = function (id: string) {
          loadedModules.add(id);
          return originalRequire.apply(this, arguments);
        };

        try {
          // Import ID provider
          const {
            ObjectIdProvider,
          } = require('../../src/lib/id-providers/objectid-provider');

          // Create and use provider
          const provider = new ObjectIdProvider();
          const id = provider.generate();

          // Verify ID was generated
          expect(id).toBeDefined();
          expect(id.length).toBe(provider.byteLength);

          // Verify constants not loaded
          const constantsLoaded = Array.from(loadedModules).some(
            (mod) =>
              (mod.includes('constants') || mod.includes('/constants.')) &&
              !mod.includes('ecies-consts') &&
              !mod.includes('checksum-consts') &&
              !mod.includes('pbkdf2-consts'),
          );

          expect(constantsLoaded).toBe(false);
        } finally {
          Module.prototype.require = originalRequire;
        }
      }),
      { numRuns: 100 },
    );
  });
});
