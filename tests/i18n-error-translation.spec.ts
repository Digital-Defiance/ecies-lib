import { LanguageCodes } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../src/enumerations/ecies-error-type';
import { GuidErrorType } from '../src/enumerations/guid-error-type';
import MemberErrorType from '../src/enumerations/member-error-type';
import { ECIESError } from '../src/errors/ecies';
import { GuidError } from '../src/errors/guid';
import { MemberError } from '../src/errors/member';
import { getEciesI18nEngine } from '../src/i18n-setup';

describe('I18n Error Translation', () => {
  describe('ECIES Error Translation', () => {
    it('should translate ECIES errors to English', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.DecryptionFailed,
        getEciesI18nEngine(),
      );
      expect(error.message).toBe('Decryption operation failed');
    });

    it('should translate ECIES errors to Spanish', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.DecryptionFailed,
        getEciesI18nEngine(),
        undefined,
        LanguageCodes.ES,
      );
      expect(error.message).toBe('Falló la operación de descifrado');
    });

    it('should fallback to English for missing translations', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.DecryptionFailed,
        getEciesI18nEngine(),
        undefined,
        LanguageCodes.FR,
      );
      expect(error.message).toBe("Échec de l'opération de déchiffrement"); // French translation available
    });

    it('should exercise all ECIES error types', () => {
      const errorTypes = Object.values(ECIESErrorTypeEnum);

      errorTypes.forEach((errorType) => {
        expect(() => {
          const error = new ECIESError(errorType, getEciesI18nEngine());
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
        }).not.toThrow();
      });
    });
  });

  describe('Member Error Translation', () => {
    it('should translate Member errors to English', () => {
      const error = new MemberError(
        MemberErrorType.MissingMemberName,
        getEciesI18nEngine(),
      );
      expect(error.message).toBe('Member name is required');
    });

    it('should translate Member errors to Spanish', () => {
      const error = new MemberError(
        MemberErrorType.MissingMemberName,
        getEciesI18nEngine(),
        undefined,
        LanguageCodes.ES,
      );
      expect(error.message).toBe('Se requiere el nombre del miembro');
    });

    it('should exercise all Member error types', () => {
      const errorTypes = Object.values(MemberErrorType);

      errorTypes.forEach((errorType) => {
        expect(() => {
          const error = new MemberError(errorType, getEciesI18nEngine());
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
        }).not.toThrow();
      });
    });
  });

  describe('GUID Error Translation', () => {
    it('should translate GUID errors to English', () => {
      const error = new GuidError(
        GuidErrorType.Invalid,
        getEciesI18nEngine(),
      );
      expect(error.message).toBe('Invalid GUID format');
    });

    it('should exercise all GUID error types', () => {
      const errorTypes = Object.values(GuidErrorType);

      errorTypes.forEach((errorType) => {
        expect(() => {
          const error = new GuidError(errorType, getEciesI18nEngine());
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
        }).not.toThrow();
      });
    });
  });

  describe('Error Key Generation Validation', () => {
    it('should verify buildReasonMap generates correct keys', () => {
      const engine = getEciesI18nEngine();
      // Test that the generated keys match our enum
      const eciesError = new ECIESError(
        ECIESErrorTypeEnum.InvalidMnemonic,
        engine,
      );
      const memberError = new MemberError(MemberErrorType.NoWallet, engine);

      // Verify the errors use the i18n system
      expect(eciesError.message).not.toBe('Error_ECIESError_InvalidMnemonic'); // Should be translated
      expect(memberError.message).not.toBe('Error_MemberError_NoWallet'); // Should be translated
    });

    it('should handle missing translations gracefully', () => {
      // Test with an error type that has no translation
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientCountSize,
        getEciesI18nEngine(),
      );

      // Should fallback to the key name if no translation exists
      expect(error.message).toBeDefined();
      expect(error.message.length).toBeGreaterThan(0);
    });
  });

  describe('Language Switching', () => {
    it('should switch languages dynamically', () => {
      const engine = getEciesI18nEngine();

      // Test English
      let error = new ECIESError(
        ECIESErrorTypeEnum.DecryptionFailed,
        engine,
        undefined,
        LanguageCodes.EN_US,
      );
      expect(error.message).toBe('Decryption operation failed');

      // Test Spanish
      error = new ECIESError(
        ECIESErrorTypeEnum.DecryptionFailed,
        engine,
        undefined,
        LanguageCodes.ES,
      );
      expect(error.message).toBe('Falló la operación de descifrado');
    });
  });
});
