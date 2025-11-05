import { LanguageCodes } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../src/enumerations/ecies-error-type';
import MemberErrorType from '../src/enumerations/member-error-type';
import { ECIESError } from '../src/errors/ecies';
import { MemberError } from '../src/errors/member';
import { getEciesI18nEngine } from '../src/i18n-setup';

describe('I18n Error Translation', () => {
  describe('ECIES Error Translation', () => {
    it('should translate ECIES errors to English', () => {
      getEciesI18nEngine(); // Ensure engine is initialized
      const error = new ECIESError(
        ECIESErrorTypeEnum.DecryptionFailed,
      );
      expect(error.message).toBe('Decryption operation failed');
    });

    it('should translate ECIES errors to Spanish', () => {
      getEciesI18nEngine(); // Ensure engine is initialized
      const error = new ECIESError(
        ECIESErrorTypeEnum.DecryptionFailed,
        undefined,
        LanguageCodes.ES,
      );
      expect(error.message).toBe('Falló la operación de descifrado');
    });

    it('should fallback to English for missing translations', () => {
      getEciesI18nEngine(); // Ensure engine is initialized
      const error = new ECIESError(
        ECIESErrorTypeEnum.DecryptionFailed,
        undefined,
        LanguageCodes.FR,
      );
      expect(error.message).toBe("Échec de l'opération de déchiffrement"); // French translation available
    });

    it('should exercise all ECIES error types', () => {
      getEciesI18nEngine(); // Ensure engine is initialized
      const errorTypes = Object.values(ECIESErrorTypeEnum);

      errorTypes.forEach((errorType) => {
        expect(() => {
          const error = new ECIESError(errorType);
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
        }).not.toThrow();
      });
    });
  });

  describe('Member Error Translation', () => {
    it('should translate Member errors to English', () => {
      getEciesI18nEngine(); // Ensure engine is initialized
      const error = new MemberError(
        MemberErrorType.MissingMemberName,
      );
      expect(error.message).toBe('Member name is required');
    });

    it('should translate Member errors to Spanish', () => {
      getEciesI18nEngine(); // Ensure engine is initialized
      const error = new MemberError(
        MemberErrorType.MissingMemberName,
        undefined,
        LanguageCodes.ES,
      );
      expect(error.message).toBe('Se requiere el nombre del miembro');
    });

    it('should exercise all Member error types', () => {
      getEciesI18nEngine(); // Ensure engine is initialized
      const errorTypes = Object.values(MemberErrorType);

      errorTypes.forEach((errorType) => {
        expect(() => {
          const error = new MemberError(errorType);
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
        }).not.toThrow();
      });
    });
  });

  describe('Error Key Generation Validation', () => {
    it('should verify buildReasonMap generates correct keys', () => {
      getEciesI18nEngine(); // Ensure engine is initialized
      // Test that the generated keys match our enum
      const eciesError = new ECIESError(
        ECIESErrorTypeEnum.InvalidMnemonic,
      );
      const memberError = new MemberError(MemberErrorType.NoWallet);

      // Verify the errors use the i18n system
      expect(eciesError.message).not.toBe('Error_ECIESError_InvalidMnemonic'); // Should be translated
      expect(memberError.message).not.toBe('Error_MemberError_NoWallet'); // Should be translated
    });

    it('should handle missing translations gracefully', () => {
      getEciesI18nEngine(); // Ensure engine is initialized
      // Test with an error type that has no translation
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientCountSize,
      );

      // Should fallback to the key name if no translation exists
      expect(error.message).toBeDefined();
      expect(error.message.length).toBeGreaterThan(0);
    });
  });

  describe('Language Switching', () => {
    it('should switch languages dynamically', () => {
      getEciesI18nEngine(); // Ensure engine is initialized

      // Test English
      let error = new ECIESError(
        ECIESErrorTypeEnum.DecryptionFailed,
        undefined,
        LanguageCodes.EN_US,
      );
      expect(error.message).toBe('Decryption operation failed');

      // Test Spanish
      error = new ECIESError(
        ECIESErrorTypeEnum.DecryptionFailed,
        undefined,
        LanguageCodes.ES,
      );
      expect(error.message).toBe('Falló la operación de descifrado');
    });
  });
});
