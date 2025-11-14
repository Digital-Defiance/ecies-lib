import { LanguageCodes } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../src/enumerations/ecies-error-type';
import MemberErrorType from '../src/enumerations/member-error-type';
import { EciesStringKey } from '../src/enumerations/ecies-string-key';
import { ECIESError } from '../src/errors/ecies';
import { MemberError } from '../src/errors/member';
import { getEciesI18nEngine, EciesComponentId } from '../src/i18n-setup';

describe('ECIES i18n Comprehensive Tests', () => {
  const allLanguages = [
    LanguageCodes.EN_US,
    LanguageCodes.EN_GB,
    LanguageCodes.FR,
    LanguageCodes.ES,
    LanguageCodes.DE,
    LanguageCodes.ZH_CN,
    LanguageCodes.JA,
    LanguageCodes.UK,
  ];

  describe('Translation Completeness', () => {
    it('should have translations for all ECIES error types in all languages', () => {
      const engine = getEciesI18nEngine();
      const errorTypes = Object.values(ECIESErrorTypeEnum);

      allLanguages.forEach((lang) => {
        errorTypes.forEach((errorType) => {
          const error = new ECIESError(errorType, undefined, lang);
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
          expect(error.message).not.toContain('Error_ECIESError_');
        });
      });
    });

    it('should have translations for all Member error types in all languages', () => {
      const errorTypes = Object.values(MemberErrorType);

      allLanguages.forEach((lang) => {
        errorTypes.forEach((errorType) => {
          const error = new MemberError(errorType, undefined, lang);
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
          expect(error.message).not.toContain('Error_MemberError_');
        });
      });
    });

    it('should have all string keys defined in all languages', () => {
      const engine = getEciesI18nEngine();
      const stringKeys = Object.values(EciesStringKey);

      allLanguages.forEach((lang) => {
        stringKeys.forEach((key) => {
          const translation = engine.translate(EciesComponentId, key, undefined, lang);
          expect(translation).toBeDefined();
          expect(translation).not.toBe(key);
        });
      });
    });
  });

  describe('Template Variable Substitution', () => {
    it('should substitute variables in InvalidEncryptedKeyLengthTemplate', () => {
      allLanguages.forEach((lang) => {
        const translation = getEciesI18nEngine().translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate,
          { keySize: '32', encryptedKeyLength: '16' },
          lang
        );
        expect(translation).toContain('32');
        expect(translation).toContain('16');
        expect(translation).not.toContain('{keySize}');
        expect(translation).not.toContain('{encryptedKeyLength}');
      });
    });

    it('should substitute variables in TooManyRecipientsTemplate', () => {
      allLanguages.forEach((lang) => {
        const translation = getEciesI18nEngine().translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate,
          { recipientsCount: '100' },
          lang
        );
        expect(translation).toContain('100');
        expect(translation).not.toContain('{recipientsCount}');
      });
    });

    it('should substitute variables in MessageTooLargeTemplate', () => {
      allLanguages.forEach((lang) => {
        const translation = getEciesI18nEngine().translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_MessageTooLargeTemplate,
          { length: '1048576' },
          lang
        );
        expect(translation).toContain('1048576');
        expect(translation).not.toContain('{length}');
      });
    });

    it('should substitute variables in PhoneNumber_InvalidTemplate', () => {
      allLanguages.forEach((lang) => {
        const translation = getEciesI18nEngine().translate(
          EciesComponentId,
          EciesStringKey.Error_PhoneNumber_InvalidTemplate,
          { phoneNumber: '+1-555-0123' },
          lang
        );
        expect(translation).toContain('+1-555-0123');
        expect(translation).not.toContain('{phoneNumber}');
      });
    });
  });

  describe('Error Message Consistency', () => {
    it('should have consistent error messages across English variants', () => {
      const errorTypes = Object.values(ECIESErrorTypeEnum);

      errorTypes.forEach((errorType) => {
        const errorUS = new ECIESError(errorType, undefined, LanguageCodes.EN_US);
        const errorGB = new ECIESError(errorType, undefined, LanguageCodes.EN_GB);
        expect(errorUS.message).toBe(errorGB.message);
      });
    });

    it('should have different translations for non-English languages', () => {
      const testKey = EciesStringKey.Error_ECIESError_DecryptionFailed;
      const engine = getEciesI18nEngine();

      const english = engine.translate(EciesComponentId, testKey, undefined, LanguageCodes.EN_US);
      const french = engine.translate(EciesComponentId, testKey, undefined, LanguageCodes.FR);
      const spanish = engine.translate(EciesComponentId, testKey, undefined, LanguageCodes.ES);

      expect(french).not.toBe(english);
      expect(spanish).not.toBe(english);
      expect(french).not.toBe(spanish);
    });

    it('should not contain placeholder text in any language', () => {
      const stringKeys = Object.values(EciesStringKey);
      const placeholders = ['TODO', 'FIXME', 'XXX', 'TBD'];

      allLanguages.forEach((lang) => {
        stringKeys.forEach((key) => {
          const translation = getEciesI18nEngine().translate(EciesComponentId, key, undefined, lang);
          placeholders.forEach((placeholder) => {
            expect(translation.toUpperCase()).not.toContain(placeholder);
          });
        });
      });
    });
  });

  describe('Error Type Coverage', () => {
    it('should cover all ECIESErrorTypeEnum values', () => {
      const errorTypes = Object.values(ECIESErrorTypeEnum);
      expect(errorTypes.length).toBeGreaterThan(0);

      errorTypes.forEach((errorType) => {
        expect(() => new ECIESError(errorType)).not.toThrow();
      });
    });

    it('should cover all MemberErrorType values', () => {
      const errorTypes = Object.values(MemberErrorType);
      expect(errorTypes.length).toBeGreaterThan(0);

      errorTypes.forEach((errorType) => {
        expect(() => new MemberError(errorType)).not.toThrow();
      });
    });

    it('should have string keys for all error enums', () => {
      const eciesErrors = Object.values(ECIESErrorTypeEnum);
      const memberErrors = Object.values(MemberErrorType);
      const stringKeys = Object.values(EciesStringKey);

      eciesErrors.forEach((errorType) => {
        const expectedKey = `Error_ECIESError_${errorType}`;
        expect(stringKeys).toContain(expectedKey);
      });

      memberErrors.forEach((errorType) => {
        const expectedKey = `Error_MemberError_${errorType}`;
        expect(stringKeys).toContain(expectedKey);
      });
    });
  });

  describe('Language-Specific Formatting', () => {
    it('should have appropriate punctuation for each language', () => {
      const testKey = EciesStringKey.Error_MemberError_MissingMemberName;
      const engine = getEciesI18nEngine();

      allLanguages.forEach((lang) => {
        const translation = engine.translate(EciesComponentId, testKey, undefined, lang);
        expect(translation.trim()).toBe(translation);
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    it('should handle special characters in Chinese translations', () => {
      const translation = getEciesI18nEngine().translate(
        EciesComponentId,
        EciesStringKey.Error_ECIESError_DecryptionFailed,
        undefined,
        LanguageCodes.ZH_CN
      );
      expect(translation).toBeDefined();
      expect(translation.length).toBeGreaterThan(0);
    });

    it('should handle special characters in Japanese translations', () => {
      const translation = getEciesI18nEngine().translate(
        EciesComponentId,
        EciesStringKey.Error_ECIESError_DecryptionFailed,
        undefined,
        LanguageCodes.JA
      );
      expect(translation).toBeDefined();
      expect(translation.length).toBeGreaterThan(0);
    });

    it('should handle Cyrillic characters in Ukrainian translations', () => {
      const translation = getEciesI18nEngine().translate(
        EciesComponentId,
        EciesStringKey.Error_ECIESError_DecryptionFailed,
        undefined,
        LanguageCodes.UK
      );
      expect(translation).toBeDefined();
      expect(translation.length).toBeGreaterThan(0);
    });
  });

  describe('Real-World Error Scenarios', () => {
    it('should produce localized error messages in encryption failures', () => {
      allLanguages.forEach((lang) => {
        const error = new ECIESError(ECIESErrorTypeEnum.DecryptionFailed, undefined, lang);
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(10);
      });
    });

    it('should produce localized error messages for invalid keys', () => {
      allLanguages.forEach((lang) => {
        const error = new ECIESError(ECIESErrorTypeEnum.InvalidRecipientPublicKey, undefined, lang);
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(10);
      });
    });

    it('should produce localized error messages for member operations', () => {
      allLanguages.forEach((lang) => {
        const error = new MemberError(MemberErrorType.NoWallet, undefined, lang);
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(5);
      });
    });

    it('should handle template errors with real values', () => {
      allLanguages.forEach((lang) => {
        const translation = getEciesI18nEngine().translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate,
          { expectedDataLength: '256', receivedDataLength: '128' },
          lang
        );
        expect(translation).toContain('256');
        expect(translation).toContain('128');
      });
    });
  });

  describe('Translation Quality', () => {
    it('should have reasonable length translations', () => {
      const stringKeys = Object.values(EciesStringKey);

      allLanguages.forEach((lang) => {
        stringKeys.forEach((key) => {
          const translation = getEciesI18nEngine().translate(EciesComponentId, key, undefined, lang);
          expect(translation.length).toBeGreaterThanOrEqual(3);
          expect(translation.length).toBeLessThan(500);
        });
      });
    });

    it('should not have untranslated English in non-English languages', () => {
      const commonEnglishWords = ['error', 'invalid', 'failed', 'missing'];
      const nonEnglishLanguages = allLanguages.filter(
        (lang) => lang !== LanguageCodes.EN_US && lang !== LanguageCodes.EN_GB
      );

      nonEnglishLanguages.forEach((lang) => {
        const translation = getEciesI18nEngine().translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_DecryptionFailed,
          undefined,
          lang
        );

        const lowerTranslation = translation.toLowerCase();
        const hasEnglishWords = commonEnglishWords.some((word) => lowerTranslation.includes(word));
        expect(hasEnglishWords).toBe(false);
      });
    });
  });

  describe('Component Registration', () => {
    it('should have ECIES component registered', () => {
      const engine = getEciesI18nEngine();
      expect(engine.hasComponent(EciesComponentId)).toBe(true);
    });

    it('should have all languages registered', () => {
      const engine = getEciesI18nEngine();
      allLanguages.forEach((lang) => {
        expect(engine.hasLanguage(lang)).toBe(true);
      });
    });

    it('should retrieve component configuration', () => {
      const engine = getEciesI18nEngine();
      const components = engine.getComponents();
      const eciesComponent = components.find((c) => c.id === EciesComponentId);
      expect(eciesComponent).toBeDefined();
      expect(eciesComponent?.strings).toBeDefined();
    });
  });
});
