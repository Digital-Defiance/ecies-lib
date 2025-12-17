/**
 * Property-Based Test: Constants Module Independence
 *
 * Feature: fix-business-logic-circular-dependencies, Property 1: Constants module has no runtime dependencies on Member or services
 * Validates: Requirements 1.1, 1.2, 1.3
 *
 * This test verifies that importing the constants module doesn't trigger imports
 * of Member, SecureBuffer, SecureString, or any service classes.
 */

import * as fc from 'fast-check';

describe('Property-Based Test: Constants Module Independence', () => {
  /**
   * Property 1: Constants module has no runtime dependencies on Member or services
   *
   * For any import of the constants module, the system should not trigger imports
   * of Member, SecureBuffer, SecureString, or any service classes.
   */
  it('should not load forbidden modules when importing constants', () => {
    fc.assert(
      fc.property(
        // Generate 100 test runs with different module cache states
        fc.integer({ min: 1, max: 100 }),
        (_iteration) => {
          // Clear module cache to start fresh for each iteration
          jest.resetModules();

          // Track which modules get loaded
          const loadedModules = new Set<string>();
          const Module = require('module');
          const originalRequire = Module.prototype.require;

          Module.prototype.require = function (id: string, ...args: unknown[]) {
            loadedModules.add(id);
            return originalRequire.apply(this, [id, ...args]);
          };

          try {
            // Import constants module
            const { Constants } = require('../../src/constants');

            // Verify constants loaded successfully
            expect(Constants).toBeDefined();
            expect(Constants.CHECKSUM).toBeDefined();
            expect(Constants.ECIES).toBeDefined();

            // Define forbidden module patterns
            const forbiddenPatterns = [
              /\/member\.ts$/,
              /\/member\.js$/,
              /\/secure-buffer\.ts$/,
              /\/secure-buffer\.js$/,
              /\/secure-string\.ts$/,
              /\/secure-string\.js$/,
              /\/services\//,
            ];

            // Check for forbidden module loads
            const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
              forbiddenPatterns.some((pattern) => pattern.test(mod)),
            );

            // Assert no forbidden modules were loaded
            expect(forbiddenLoads).toHaveLength(0);

            // If forbidden modules were loaded, provide detailed error
            if (forbiddenLoads.length > 0) {
              throw new Error(
                `Forbidden modules loaded during constants import (iteration ${iteration}): ${forbiddenLoads.join(
                  ', ',
                )}`,
              );
            }
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
   * Additional property: Constants can be validated without loading Member
   */
  it('should validate constants without loading Member or services', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (_iteration) => {
        // Clear module cache
        jest.resetModules();

        // Track module loads
        const loadedModules = new Set<string>();
        const Module = require('module');
        const originalRequire = Module.prototype.require;

        Module.prototype.require = function (id: string, ...args: unknown[]) {
          loadedModules.add(id);
          return originalRequire.apply(this, [id, ...args]);
        };

        try {
          // Import and use constants
          const {
            Constants,
            createRuntimeConfiguration,
          } = require('../../src/constants');

          // Perform validation operations
          expect(Constants.CHECKSUM.SHA3_BUFFER_LENGTH).toBe(
            Constants.CHECKSUM.SHA3_DEFAULT_HASH_BITS / 8,
          );
          expect(Constants.ECIES.PUBLIC_KEY_LENGTH).toBe(
            Constants.ECIES.RAW_PUBLIC_KEY_LENGTH + 1,
          );

          // Create runtime configuration (validation happens here)
          const config = createRuntimeConfiguration({
            BcryptRounds: 12,
          });
          expect(config.BcryptRounds).toBe(12);

          // Verify no forbidden modules loaded during validation
          const forbiddenPatterns = [
            /\/member\.ts$/,
            /\/member\.js$/,
            /\/services\//,
          ];

          const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
            forbiddenPatterns.some((pattern) => pattern.test(mod)),
          );

          expect(forbiddenLoads).toHaveLength(0);
        } finally {
          Module.prototype.require = originalRequire;
        }
      }),
      { numRuns: 100 },
    );
  });
});
