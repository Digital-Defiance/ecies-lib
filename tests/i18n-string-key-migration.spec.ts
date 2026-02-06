/**
 * Integration tests for ECIES i18n string key migration
 *
 * These tests verify that the ECIES library's i18n-setup correctly uses
 * the new string key enum registration and translation methods.
 *
 * **Validates: Requirements 7.2, 7.3, 7.4**
 * - 7.2: THE `getEciesTranslation` function SHALL be updated to use `translateStringKey`
 * - 7.3: THE `safeEciesTranslation` function SHALL be updated to use `safeTranslateStringKey`
 * - 7.4: THE existing API signatures for `getEciesTranslation` and `safeEciesTranslation` SHALL remain backward compatible
 */

import { I18nEngine, LanguageCodes } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../src/enumerations/ecies-string-key';
import {
  EciesComponentId,
  getEciesI18nEngine,
  getEciesTranslation,
  resetEciesI18nEngine,
  safeEciesTranslation,
} from '../src/i18n-setup';

describe('ECIES i18n String Key Migration', () => {
  beforeEach(() => {
    // Reset engine state before each test
    I18nEngine.resetAll();
    resetEciesI18nEngine();
  });

  afterEach(() => {
    // Clean up after each test
    I18nEngine.resetAll();
    resetEciesI18nEngine();
  });

  describe('String Key Enum Registration', () => {
    it('should register EciesStringKey enum during engine initialization', () => {
      const engine = getEciesI18nEngine();

      // Verify the enum is registered
      expect(engine.hasStringKeyEnum(EciesStringKey)).toBe(true);
    });

    it('should extract correct component ID from EciesStringKey', () => {
      const engine = getEciesI18nEngine();

      // Get all registered string key enums
      const registeredEnums = engine.getStringKeyEnums();

      // Find the ECIES enum entry
      const eciesEntry = registeredEnums.find(
        (entry) => entry.enumObj === EciesStringKey,
      );

      expect(eciesEntry).toBeDefined();
      expect(eciesEntry?.componentId).toBe(EciesComponentId);
    });

    it('should allow idempotent registration of EciesStringKey', () => {
      const engine = getEciesI18nEngine();

      // Register again - should not throw
      expect(() => engine.registerStringKeyEnum(EciesStringKey)).not.toThrow();

      // Should still have exactly one entry for ECIES
      const registeredEnums = engine.getStringKeyEnums();
      const eciesEntries = registeredEnums.filter(
        (entry) => entry.componentId === EciesComponentId,
      );

      expect(eciesEntries.length).toBe(1);
    });
  });

  describe('getEciesTranslation - Requirement 7.2', () => {
    it('should translate string keys correctly using translateStringKey', () => {
      // Initialize engine
      getEciesI18nEngine();

      // Test translation of a known key
      const translation = getEciesTranslation(
        EciesStringKey.Error_ECIESError_DecryptionFailed,
      );

      expect(translation).toBeDefined();
      expect(translation).toBe('Decryption operation failed');
    });

    it('should translate string keys with variables', () => {
      getEciesI18nEngine();

      const translation = getEciesTranslation(
        EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate,
        { keySize: '32', encryptedKeyLength: '16' },
      );

      expect(translation).toContain('32');
      expect(translation).toContain('16');
      expect(translation).not.toContain('{keySize}');
      expect(translation).not.toContain('{encryptedKeyLength}');
    });

    it('should translate string keys with explicit language parameter', () => {
      getEciesI18nEngine();

      // Test Spanish translation
      const spanishTranslation = getEciesTranslation(
        EciesStringKey.Error_ECIESError_DecryptionFailed,
        undefined,
        LanguageCodes.ES,
      );

      expect(spanishTranslation).toBe('Falló la operación de descifrado');

      // Test French translation
      const frenchTranslation = getEciesTranslation(
        EciesStringKey.Error_ECIESError_DecryptionFailed,
        undefined,
        LanguageCodes.FR,
      );

      expect(frenchTranslation).toBe("Échec de l'opération de déchiffrement");
    });

    it('should produce same result as direct engine.translate call', () => {
      const engine = getEciesI18nEngine();
      const stringKey = EciesStringKey.Error_ECIESError_InvalidPrivateKey;

      // Using the wrapper function
      const wrapperResult = getEciesTranslation(stringKey);

      // Using direct translate call
      const directResult = engine.translate(
        EciesComponentId,
        stringKey,
        undefined,
        LanguageCodes.EN_US,
      );

      expect(wrapperResult).toBe(directResult);
    });
  });

  describe('safeEciesTranslation - Requirement 7.3', () => {
    it('should safely translate string keys using safeTranslateStringKey', () => {
      getEciesI18nEngine();

      const translation = safeEciesTranslation(
        EciesStringKey.Error_ECIESError_DecryptionFailed,
      );

      expect(translation).toBeDefined();
      expect(translation).toBe('Decryption operation failed');
    });

    it('should safely translate string keys with variables', () => {
      getEciesI18nEngine();

      const translation = safeEciesTranslation(
        EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate,
        { recipientsCount: '100' },
      );

      expect(translation).toContain('100');
      expect(translation).not.toContain('{recipientsCount}');
    });

    it('should safely translate string keys with explicit language parameter', () => {
      getEciesI18nEngine();

      const germanTranslation = safeEciesTranslation(
        EciesStringKey.Error_ECIESError_DecryptionFailed,
        undefined,
        LanguageCodes.DE,
      );

      expect(germanTranslation).toBeDefined();
      expect(germanTranslation.length).toBeGreaterThan(0);
      // German translation should be different from English
      expect(germanTranslation).not.toBe('Decryption operation failed');
    });

    it('should produce same result as direct engine.safeTranslate call', () => {
      const engine = getEciesI18nEngine();
      const stringKey = EciesStringKey.Error_MemberError_NoWallet;

      // Using the wrapper function
      const wrapperResult = safeEciesTranslation(stringKey);

      // Using direct safeTranslate call
      const directResult = engine.safeTranslate(
        EciesComponentId,
        stringKey,
        undefined,
        LanguageCodes.EN_US,
      );

      expect(wrapperResult).toBe(directResult);
    });

    it('should not throw for valid translations', () => {
      getEciesI18nEngine();

      expect(() => {
        safeEciesTranslation(EciesStringKey.Error_ECIESError_DecryptionFailed);
      }).not.toThrow();
    });
  });

  describe('Backward Compatibility - Requirement 7.4', () => {
    it('should maintain getEciesTranslation signature: (stringKey)', () => {
      getEciesI18nEngine();

      // Single argument call should work
      const result = getEciesTranslation(
        EciesStringKey.Error_ECIESError_InvalidIV,
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should maintain getEciesTranslation signature: (stringKey, variables)', () => {
      getEciesI18nEngine();

      // Two argument call should work
      const result = getEciesTranslation(
        EciesStringKey.Error_ECIESError_MessageTooLargeTemplate,
        { length: '1048576' },
      );

      expect(result).toBeDefined();
      expect(result).toContain('1048576');
    });

    it('should maintain getEciesTranslation signature: (stringKey, variables, language)', () => {
      getEciesI18nEngine();

      // Three argument call should work
      const result = getEciesTranslation(
        EciesStringKey.Error_ECIESError_DecryptionFailed,
        undefined,
        LanguageCodes.ES,
      );

      expect(result).toBeDefined();
      expect(result).toBe('Falló la operación de descifrado');
    });

    it('should maintain safeEciesTranslation signature: (stringKey)', () => {
      getEciesI18nEngine();

      // Single argument call should work
      const result = safeEciesTranslation(
        EciesStringKey.Error_ECIESError_InvalidIV,
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should maintain safeEciesTranslation signature: (stringKey, variables)', () => {
      getEciesI18nEngine();

      // Two argument call should work
      const result = safeEciesTranslation(
        EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate,
        { expectedDataLength: '256', receivedDataLength: '128' },
      );

      expect(result).toBeDefined();
      expect(result).toContain('256');
      expect(result).toContain('128');
    });

    it('should maintain safeEciesTranslation signature: (stringKey, variables, language)', () => {
      getEciesI18nEngine();

      // Three argument call should work
      const result = safeEciesTranslation(
        EciesStringKey.Error_ECIESError_DecryptionFailed,
        undefined,
        LanguageCodes.FR,
      );

      expect(result).toBeDefined();
      expect(result).toBe("Échec de l'opération de déchiffrement");
    });

    it('should accept numeric variables in both functions', () => {
      getEciesI18nEngine();

      // Test with numeric variables (common use case)
      const getResult = getEciesTranslation(
        EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate,
        { keySize: 32, encryptedKeyLength: 16 },
      );

      const safeResult = safeEciesTranslation(
        EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate,
        { keySize: 32, encryptedKeyLength: 16 },
      );

      expect(getResult).toContain('32');
      expect(getResult).toContain('16');
      expect(safeResult).toContain('32');
      expect(safeResult).toContain('16');
    });
  });

  describe('Translation Consistency', () => {
    it('should translate all ECIES string keys without errors', () => {
      getEciesI18nEngine();

      const stringKeys = Object.values(EciesStringKey);

      stringKeys.forEach((key) => {
        expect(() => {
          const translation = getEciesTranslation(key);
          expect(translation).toBeDefined();
          expect(translation.length).toBeGreaterThan(0);
        }).not.toThrow();
      });
    });

    it('should safely translate all ECIES string keys without errors', () => {
      getEciesI18nEngine();

      const stringKeys = Object.values(EciesStringKey);

      stringKeys.forEach((key) => {
        expect(() => {
          const translation = safeEciesTranslation(key);
          expect(translation).toBeDefined();
          expect(translation.length).toBeGreaterThan(0);
        }).not.toThrow();
      });
    });

    it('should translate consistently across multiple calls', () => {
      getEciesI18nEngine();

      const key = EciesStringKey.Error_ECIESError_DecryptionFailed;

      const result1 = getEciesTranslation(key);
      const result2 = getEciesTranslation(key);
      const result3 = safeEciesTranslation(key);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('Multi-Language Support', () => {
    const supportedLanguages = [
      LanguageCodes.EN_US,
      LanguageCodes.EN_GB,
      LanguageCodes.FR,
      LanguageCodes.ES,
      LanguageCodes.DE,
      LanguageCodes.ZH_CN,
      LanguageCodes.JA,
      LanguageCodes.UK,
    ];

    it('should translate using getEciesTranslation in all supported languages', () => {
      getEciesI18nEngine();

      supportedLanguages.forEach((lang) => {
        const translation = getEciesTranslation(
          EciesStringKey.Error_ECIESError_DecryptionFailed,
          undefined,
          lang,
        );

        expect(translation).toBeDefined();
        expect(translation.length).toBeGreaterThan(0);
        // Should not return the raw key
        expect(translation).not.toBe('Error_ECIESError_DecryptionFailed');
      });
    });

    it('should translate using safeEciesTranslation in all supported languages', () => {
      getEciesI18nEngine();

      supportedLanguages.forEach((lang) => {
        const translation = safeEciesTranslation(
          EciesStringKey.Error_ECIESError_DecryptionFailed,
          undefined,
          lang,
        );

        expect(translation).toBeDefined();
        expect(translation.length).toBeGreaterThan(0);
        // Should not return the raw key
        expect(translation).not.toBe('Error_ECIESError_DecryptionFailed');
      });
    });
  });
});
