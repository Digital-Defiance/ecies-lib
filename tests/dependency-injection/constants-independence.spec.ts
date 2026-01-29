/**
 * Constants Module Independence Tests
 * Tests that importing constants doesn't trigger Member/service imports
 * Validates Requirements 1.1, 1.2, 1.3
 */

import { resetRegistry } from '@digitaldefiance/branded-enum';

describe('Constants Module Independence', () => {
  describe('10.1 Constants module has no runtime dependencies on Member or services', () => {
    it('should import constants without triggering Member imports', () => {
      // Clear module cache to start fresh
      jest.resetModules();
      resetRegistry();

      // Track which modules get loaded
      const loadedModules = new Set<string>();
      const Module = require('module');
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function (id: string, ...args: unknown[]) {
        loadedModules.add(id);
        return originalRequire.apply(this, [id, ...args]);
      };

      try {
        // Import constants
        require('../../src/constants');

        // Verify no forbidden modules were loaded
        const forbiddenPatterns = [/member\.ts$/, /member\.js$/, /\/member$/];

        const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
          forbiddenPatterns.some((pattern) => pattern.test(mod)),
        );

        expect(forbiddenLoads).toHaveLength(0);
      } finally {
        // Restore original require
        Module.prototype.require = originalRequire;
      }
    });

    it('should import constants without triggering SecureBuffer imports', () => {
      // Clear module cache
      jest.resetModules();
      resetRegistry();

      // Track loaded modules
      const loadedModules = new Set<string>();
      const Module = require('module');
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function (id: string, ...args: unknown[]) {
        loadedModules.add(id);
        return originalRequire.apply(this, [id, ...args]);
      };

      try {
        // Import constants
        require('../../src/constants');

        // Verify SecureBuffer was not loaded
        const forbiddenPatterns = [
          /secure-buffer\.ts$/,
          /secure-buffer\.js$/,
          /\/secure-buffer$/,
        ];

        const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
          forbiddenPatterns.some((pattern) => pattern.test(mod)),
        );

        expect(forbiddenLoads).toHaveLength(0);
      } finally {
        Module.prototype.require = originalRequire;
      }
    });

    it('should import constants without triggering SecureString imports', () => {
      // Clear module cache
      jest.resetModules();
      resetRegistry();

      // Track loaded modules
      const loadedModules = new Set<string>();
      const Module = require('module');
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function (id: string, ...args: unknown[]) {
        loadedModules.add(id);
        return originalRequire.apply(this, [id, ...args]);
      };

      try {
        // Import constants
        require('../../src/constants');

        // Verify SecureString was not loaded
        const forbiddenPatterns = [
          /secure-string\.ts$/,
          /secure-string\.js$/,
          /\/secure-string$/,
        ];

        const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
          forbiddenPatterns.some((pattern) => pattern.test(mod)),
        );

        expect(forbiddenLoads).toHaveLength(0);
      } finally {
        Module.prototype.require = originalRequire;
      }
    });

    it('should import constants without triggering service imports', () => {
      // Clear module cache
      jest.resetModules();
      resetRegistry();

      // Track loaded modules
      const loadedModules = new Set<string>();
      const Module = require('module');
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function (id: string, ...args: unknown[]) {
        loadedModules.add(id);
        return originalRequire.apply(this, [id, ...args]);
      };

      try {
        // Import constants
        require('../../src/constants');

        // Verify no service modules were loaded
        const forbiddenPatterns = [
          /services\/ecies\/service\.ts$/,
          /services\/ecies\/service\.js$/,
          /services\/encryption-stream/,
          /services\/multi-recipient/,
        ];

        const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
          forbiddenPatterns.some((pattern) => pattern.test(mod)),
        );

        expect(forbiddenLoads).toHaveLength(0);
      } finally {
        Module.prototype.require = originalRequire;
      }
    });

    it('should verify constants are fully initialized after import', () => {
      // Clear module cache
      jest.resetModules();
      resetRegistry();

      // Import constants
      const { Constants } = require('../../src/constants');

      // Verify all required properties are defined
      expect(Constants).toBeDefined();
      expect(Constants.CHECKSUM).toBeDefined();
      expect(Constants.ECIES).toBeDefined();
      expect(Constants.PBKDF2).toBeDefined();
      expect(Constants.PBKDF2_PROFILES).toBeDefined();
      expect(Constants.idProvider).toBeDefined();
      expect(Constants.MEMBER_ID_LENGTH).toBeDefined();

      // Verify constants are frozen (immutable)
      expect(Object.isFrozen(Constants)).toBe(true);
    });

    it('should validate constants without requiring Member class', () => {
      // Clear module cache
      jest.resetModules();
      resetRegistry();

      // Import constants - validation happens during import
      const { Constants } = require('../../src/constants');

      // If we got here, validation passed without needing Member
      expect(Constants.MEMBER_ID_LENGTH).toBe(Constants.idProvider.byteLength);
      expect(Constants.ECIES.MULTIPLE.RECIPIENT_ID_SIZE).toBe(
        Constants.idProvider.byteLength,
      );
    });

    it('should create runtime configuration without Member dependencies', () => {
      // Clear module cache
      jest.resetModules();
      resetRegistry();

      const { createRuntimeConfiguration } = require('../../src/constants');

      // Create custom config - should not require Member
      const customConfig = createRuntimeConfiguration({
        BcryptRounds: 12,
      });

      expect(customConfig).toBeDefined();
      expect(customConfig.BcryptRounds).toBe(12);
      expect(Object.isFrozen(customConfig)).toBe(true);
    });

    it('should register configuration without triggering Member imports', () => {
      // Clear module cache
      jest.resetModules();
      resetRegistry();

      // Track loaded modules
      const loadedModules = new Set<string>();
      const Module = require('module');
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function (id: string, ...args: unknown[]) {
        loadedModules.add(id);
        return originalRequire.apply(this, [id, ...args]);
      };

      try {
        const {
          registerRuntimeConfiguration,
          ConstantsRegistry,
        } = require('../../src/constants');

        // Register a custom configuration
        const testKey = 'test-config-independence';
        registerRuntimeConfiguration(testKey, {
          BcryptRounds: 15,
        });

        // Verify no Member module was loaded
        const memberLoaded = Array.from(loadedModules).some(
          (mod) =>
            mod.includes('member') &&
            !mod.includes('frontend-member') &&
            !mod.includes('member-with-mnemonic') &&
            !mod.includes('member-storage') &&
            !mod.includes('member-error-type'),
        );

        expect(memberLoaded).toBe(false);

        // Clean up
        ConstantsRegistry.unregister(testKey);
      } finally {
        Module.prototype.require = originalRequire;
      }
    });
  });
});
