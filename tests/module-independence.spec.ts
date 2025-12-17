/**
 * Module Independence Tests
 * Tests that verify modules can be imported without triggering circular dependencies
 * or loading forbidden modules.
 *
 * Requirements: 2.1, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2, 5.4
 */

describe('Module Independence Tests', () => {
  describe('9.1 Enumeration Import Test', () => {
    /**
     * Test that importing enumerations doesn't trigger other module loads
     * Requirements: 2.1, 2.3
     */
    it('should import EciesStringKey without loading translations, i18n, errors, or constants', () => {
      // Clear module cache to start fresh
      jest.resetModules();

      // Track which modules get loaded
      const loadedModules = new Set<string>();
      const originalRequire = module.constructor.prototype.require;

      // Mock require to track module loads
      module.constructor.prototype.require = function (
        modulePath: string,
        ...args: unknown[]
      ) {
        loadedModules.add(modulePath);
        return originalRequire.apply(this, [modulePath, ...args]);
      };

      try {
        // Import the enumeration
        require('../src/enumerations/ecies-string-key');

        // Check that no forbidden modules were loaded
        const forbiddenPatterns = [
          /translations\//,
          /i18n-setup/,
          /errors\//,
          /constants/,
        ];

        const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
          forbiddenPatterns.some((pattern) => pattern.test(mod)),
        );

        expect(forbiddenLoads).toHaveLength(0);
      } finally {
        // Restore original require
        module.constructor.prototype.require = originalRequire;
      }
    });

    it('should import EciesEncryptionType without loading errors or i18n', () => {
      // Clear module cache
      jest.resetModules();

      // Track loaded modules
      const loadedModules = new Set<string>();
      const originalRequire = module.constructor.prototype.require;

      module.constructor.prototype.require = function (
        modulePath: string,
        ...args: unknown[]
      ) {
        loadedModules.add(modulePath);
        return originalRequire.apply(this, [modulePath, ...args]);
      };

      try {
        // Import the enumeration
        require('../src/enumerations/ecies-encryption-type');

        // Check that no forbidden modules were loaded
        const forbiddenPatterns = [/errors\//, /i18n-setup/, /constants/];

        const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
          forbiddenPatterns.some((pattern) => pattern.test(mod)),
        );

        expect(forbiddenLoads).toHaveLength(0);
      } finally {
        module.constructor.prototype.require = originalRequire;
      }
    });

    it('should import EciesErrorType without loading i18n or constants', () => {
      // Clear module cache
      jest.resetModules();

      // Track loaded modules
      const loadedModules = new Set<string>();
      const originalRequire = module.constructor.prototype.require;

      module.constructor.prototype.require = function (
        modulePath: string,
        ...args: unknown[]
      ) {
        loadedModules.add(modulePath);
        return originalRequire.apply(this, [modulePath, ...args]);
      };

      try {
        // Import the enumeration
        require('../src/enumerations/ecies-error-type');

        // Check that no forbidden modules were loaded
        const forbiddenPatterns = [/i18n-setup/, /constants/];

        const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
          forbiddenPatterns.some((pattern) => pattern.test(mod)),
        );

        expect(forbiddenLoads).toHaveLength(0);
      } finally {
        module.constructor.prototype.require = originalRequire;
      }
    });

    it('should verify all enum values are defined after import', () => {
      // Import fresh
      jest.resetModules();
      const {
        EciesStringKey,
      } = require('../src/enumerations/ecies-string-key');

      // Check that enum values are defined
      expect(EciesStringKey).toBeDefined();
      expect(
        EciesStringKey.Error_ECIESError_InvalidEncryptionType,
      ).toBeDefined();
      expect(EciesStringKey.Error_ECIESError_InvalidEncryptionType).not.toBe(
        undefined,
      );
    });
  });

  describe('9.2 Translation Import Test', () => {
    /**
     * Test that importing translations only loads enumerations
     * Verify no i18n or error modules are loaded
     * Requirements: 3.1, 3.2
     */
    it('should import translations without loading i18n or error modules', () => {
      // Clear module cache
      jest.resetModules();

      // Track loaded modules
      const loadedModules = new Set<string>();
      const originalRequire = module.constructor.prototype.require;

      module.constructor.prototype.require = function (
        modulePath: string,
        ...args: unknown[]
      ) {
        loadedModules.add(modulePath);
        return originalRequire.apply(this, [modulePath, ...args]);
      };

      try {
        // Import the translation file
        require('../src/translations/en-US');

        // Check that no forbidden modules were loaded
        // Translations should only load enumerations, not i18n-setup or errors
        const forbiddenPatterns = [/i18n-setup/, /errors\//, /constants/];

        const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
          forbiddenPatterns.some((pattern) => pattern.test(mod)),
        );

        expect(forbiddenLoads).toHaveLength(0);
      } finally {
        module.constructor.prototype.require = originalRequire;
      }
    });

    it('should verify translation keys correspond to defined enum values', () => {
      // Import fresh
      jest.resetModules();
      const {
        EciesStringKey,
      } = require('../src/enumerations/ecies-string-key');
      const { englishTranslations } = require('../src/translations/en-US');

      // Check that translation keys are valid enum values
      const translationKeys = Object.keys(englishTranslations);
      expect(translationKeys.length).toBeGreaterThan(0);

      // Sample a few keys to verify they're valid enum values
      const sampleKeys = translationKeys.slice(0, 10);
      for (const key of sampleKeys) {
        expect(
          EciesStringKey[key as keyof typeof EciesStringKey],
        ).toBeDefined();
        expect(EciesStringKey[key as keyof typeof EciesStringKey]).not.toBe(
          undefined,
        );
      }
    });

    it('should verify enum values are not undefined when used in translations', () => {
      // Import fresh
      jest.resetModules();
      const {
        EciesStringKey,
      } = require('../src/enumerations/ecies-string-key');
      const { englishTranslations } = require('../src/translations/en-US');

      // Verify that the enum value used as a key is defined
      const testKey = EciesStringKey.Error_ECIESError_InvalidEncryptionType;
      expect(testKey).toBeDefined();
      expect(testKey).not.toBe(undefined);

      // Verify the translation exists for this key
      expect(englishTranslations[testKey]).toBeDefined();
      expect(typeof englishTranslations[testKey]).toBe('string');
    });

    it('should import all translation files without errors', () => {
      // Clear module cache
      jest.resetModules();

      // Import all translation files
      const translationFiles = [
        '../src/translations/en-US',
        '../src/translations/de',
        '../src/translations/es',
        '../src/translations/fr',
        '../src/translations/ja',
        '../src/translations/uk',
        '../src/translations/zh-cn',
      ];

      for (const file of translationFiles) {
        expect(() => require(file)).not.toThrow();
      }
    });
  });

  describe('9.3 Error Creation Test', () => {
    /**
     * Test that errors can be created during module initialization
     * Test that error messages are accessible
     * Requirements: 4.1, 4.2, 4.3
     */
    it('should create ECIESError without triggering circular dependencies', () => {
      // Clear module cache
      jest.resetModules();

      // Import error class
      const { ECIESError } = require('../src/errors/ecies');
      const {
        ECIESErrorTypeEnum,
      } = require('../src/enumerations/ecies-error-type');

      // Create an error instance
      const error = new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType);

      // Verify error is created successfully
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ECIESError);
      expect(error.name).toBe('ECIESError');
      expect(error.type).toBe(ECIESErrorTypeEnum.InvalidEncryptionType);
    });

    it('should access error message without circular dependency issues', () => {
      // Clear module cache
      jest.resetModules();

      // Import error class
      const { ECIESError } = require('../src/errors/ecies');
      const {
        ECIESErrorTypeEnum,
      } = require('../src/enumerations/ecies-error-type');

      // Create an error instance
      const error = new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType);

      // Access message - should not throw
      expect(() => error.message).not.toThrow();
      expect(typeof error.message).toBe('string');
      expect(error.message.length).toBeGreaterThan(0);
    });

    it('should create errors with different types', () => {
      // Import without resetting modules (i18n already initialized from previous tests)
      const { ECIESError } = require('../src/errors/ecies');
      const {
        ECIESErrorTypeEnum,
      } = require('../src/enumerations/ecies-error-type');

      // Test multiple error types
      const errorTypes = [
        ECIESErrorTypeEnum.InvalidEncryptionType,
        ECIESErrorTypeEnum.InvalidIVLength,
        ECIESErrorTypeEnum.InvalidAuthTagLength,
      ];

      for (const errorType of errorTypes) {
        const error = new ECIESError(errorType);
        expect(error).toBeInstanceOf(ECIESError);
        expect(error.type).toBe(errorType);
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
      }
    });

    it('should create errors with context information', () => {
      // Clear module cache
      jest.resetModules();

      // Import error class
      const { ECIESError } = require('../src/errors/ecies');
      const {
        ECIESErrorTypeEnum,
      } = require('../src/enumerations/ecies-error-type');

      // Create error with context
      const context = {
        operation: 'testOperation',
        stackTrace: 'test stack',
        timestamp: new Date(),
        metadata: { testKey: 'testValue' },
      };

      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidEncryptionType,
        undefined,
        undefined,
        undefined,
        context,
      );

      // Verify context is captured
      expect(error.context).toBeDefined();
      expect(error.context?.operation).toBe('testOperation');
      expect(error.context?.metadata).toEqual({ testKey: 'testValue' });
    });

    it('should serialize error to JSON without circular references', () => {
      // Clear module cache
      jest.resetModules();

      // Import error class
      const { ECIESError } = require('../src/errors/ecies');
      const {
        ECIESErrorTypeEnum,
      } = require('../src/enumerations/ecies-error-type');

      // Create an error instance
      const error = new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType);

      // Serialize to JSON - should not throw
      expect(() => error.toJSON()).not.toThrow();
      const json = error.toJSON();

      expect(json).toBeDefined();
      expect(json.name).toBe('ECIESError');
      expect(json.type).toBe(ECIESErrorTypeEnum.InvalidEncryptionType);
    });

    it('should get detailed error report', () => {
      // Clear module cache
      jest.resetModules();

      // Import error class
      const { ECIESError } = require('../src/errors/ecies');
      const {
        ECIESErrorTypeEnum,
      } = require('../src/enumerations/ecies-error-type');

      // Create error with context
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidEncryptionType,
        undefined,
        undefined,
        undefined,
        {
          operation: 'testOp',
          stackTrace: 'test',
          timestamp: new Date(),
        },
      );

      // Get detailed report - should not throw
      expect(() => error.getDetailedReport()).not.toThrow();
      const report = error.getDetailedReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('ECIESError');
      expect(report).toContain('testOp');
    });
  });

  describe('9.4 Constants Validation Test', () => {
    /**
     * Test that constants validate successfully
     * Test that validation errors are meaningful
     * Test that validation works during module initialization
     * Requirements: 5.1, 5.2, 5.4
     */
    it('should load constants without circular dependencies', () => {
      // Import constants - should not throw
      expect(() => require('../src/constants')).not.toThrow();

      const { Constants } = require('../src/constants');

      // Verify constants are defined
      expect(Constants).toBeDefined();
      expect(Constants.CHECKSUM).toBeDefined();
      expect(Constants.ECIES).toBeDefined();
      expect(Constants.PBKDF2).toBeDefined();
    });

    it('should validate constants successfully', () => {
      const { Constants } = require('../src/constants');

      // Verify checksum constants
      expect(Constants.CHECKSUM.SHA3_DEFAULT_HASH_BITS).toBe(512);
      expect(Constants.CHECKSUM.SHA3_BUFFER_LENGTH).toBe(64);
      expect(Constants.CHECKSUM.SHA3_BUFFER_LENGTH).toBe(
        Constants.CHECKSUM.SHA3_DEFAULT_HASH_BITS / 8,
      );

      // Verify ECIES constants
      expect(Constants.ECIES.PUBLIC_KEY_LENGTH).toBe(
        Constants.ECIES.RAW_PUBLIC_KEY_LENGTH + 1,
      );
      expect(Constants.ECIES.MULTIPLE.RECIPIENT_COUNT_SIZE).toBe(2);
      expect(Constants.ECIES.MULTIPLE.DATA_LENGTH_SIZE).toBe(8);
    });

    it('should have valid ID provider configuration', () => {
      const { Constants } = require('../src/constants');

      // Verify ID provider is present
      expect(Constants.idProvider).toBeDefined();
      expect(typeof Constants.idProvider.byteLength).toBe('number');
      expect(Constants.idProvider.byteLength).toBeGreaterThan(0);
      expect(Constants.idProvider.byteLength).toBeLessThanOrEqual(255);

      // Verify MEMBER_ID_LENGTH matches ID provider
      expect(Constants.MEMBER_ID_LENGTH).toBe(Constants.idProvider.byteLength);

      // Verify RECIPIENT_ID_SIZE matches ID provider
      expect(Constants.ECIES.MULTIPLE.RECIPIENT_ID_SIZE).toBe(
        Constants.idProvider.byteLength,
      );
    });

    it('should create runtime configuration without circular dependencies', () => {
      const {
        createRuntimeConfiguration,
        Constants,
      } = require('../src/constants');

      // Create runtime config with overrides - should not throw
      expect(() =>
        createRuntimeConfiguration({
          BcryptRounds: 12,
        }),
      ).not.toThrow();

      const customConfig = createRuntimeConfiguration({
        BcryptRounds: 12,
      });

      expect(customConfig.BcryptRounds).toBe(12);
      expect(customConfig.CHECKSUM).toEqual(Constants.CHECKSUM);
    });

    it('should register and retrieve runtime configurations', () => {
      const {
        ConstantsRegistry,
        registerRuntimeConfiguration,
        getRuntimeConfiguration,
      } = require('../src/constants');

      // Register a custom configuration
      const testKey = 'test-config';
      const customConfig = registerRuntimeConfiguration(testKey, {
        BcryptRounds: 15,
      });

      expect(customConfig.BcryptRounds).toBe(15);

      // Retrieve the configuration
      const retrieved = getRuntimeConfiguration(testKey);
      expect(retrieved.BcryptRounds).toBe(15);

      // Clean up
      ConstantsRegistry.unregister(testKey);
    });

    it('should validate constants during module initialization', () => {
      // Constants are validated when the module loads
      // If we got here without errors, validation passed
      const { Constants } = require('../src/constants');

      // Verify the constants object is frozen (immutable)
      expect(Object.isFrozen(Constants)).toBe(true);
      expect(Object.isFrozen(Constants.CHECKSUM)).toBe(true);
      expect(Object.isFrozen(Constants.ECIES)).toBe(true);
    });

    it('should throw meaningful errors for invalid configurations', () => {
      const {
        createRuntimeConfiguration,
        Constants,
      } = require('../src/constants');

      // Try to create config with invalid checksum constants
      expect(() =>
        createRuntimeConfiguration({
          CHECKSUM: {
            ...Constants.CHECKSUM,
            SHA3_BUFFER_LENGTH: 32, // Wrong value
          },
        }),
      ).toThrow();
    });

    it('should prevent overwriting default configuration', () => {
      const { ConstantsRegistry } = require('../src/constants');

      // Try to register with default key - should throw
      expect(() =>
        ConstantsRegistry.register(ConstantsRegistry.DEFAULT_KEY, {}),
      ).toThrow();
    });
  });
});
