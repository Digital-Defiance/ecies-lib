/**
 * Comprehensive tests for encryption-type-utils.ts
 * Addresses critical gap: 0% function coverage, 0% branch coverage
 */

import { EciesEncryptionTypeEnum } from '../../src/enumerations/ecies-encryption-type';
import { ECIESErrorTypeEnum } from '../../src/enumerations/ecies-error-type';
import { ECIESError } from '../../src/errors/ecies';
import {
  encryptionTypeToString,
  encryptionTypeEnumToType,
  validateEciesEncryptionTypeEnum,
  ensureEciesEncryptionTypeEnum,
} from '../../src/utils/encryption-type-utils';

describe('Encryption Type Utils - Complete Coverage', () => {
  describe('encryptionTypeToString', () => {
    it('should convert valid enum values to strings', () => {
      expect(encryptionTypeToString(EciesEncryptionTypeEnum.Simple)).toBe(
        'simple',
      );
      expect(encryptionTypeToString(EciesEncryptionTypeEnum.Single)).toBe(
        'single',
      );
      expect(encryptionTypeToString(EciesEncryptionTypeEnum.Multiple)).toBe(
        'multiple',
      );
    });

    it('should convert valid string types to strings', () => {
      expect(encryptionTypeToString('simple')).toBe('simple');
      expect(encryptionTypeToString('single')).toBe('single');
      expect(encryptionTypeToString('multiple')).toBe('multiple');
    });

    it('should throw ECIESError for invalid enum values', () => {
      expect(() =>
        encryptionTypeToString(999 as EciesEncryptionTypeEnum),
      ).toThrow(ECIESError);
      expect(() =>
        encryptionTypeToString(-1 as EciesEncryptionTypeEnum),
      ).toThrow(ECIESError);
    });

    it('should throw ECIESError for invalid string types', () => {
      expect(() => encryptionTypeToString('Invalid' as any)).toThrow(
        ECIESError,
      );
      expect(() => encryptionTypeToString('' as any)).toThrow(ECIESError);
    });

    it('should throw correct error type', () => {
      try {
        encryptionTypeToString(999 as EciesEncryptionTypeEnum);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ECIESError);
        expect((error as ECIESError).type).toBe(
          ECIESErrorTypeEnum.InvalidEncryptionType,
        );
      }
    });
  });

  describe('encryptionTypeEnumToType', () => {
    it('should convert valid enum values to type strings', () => {
      expect(encryptionTypeEnumToType(EciesEncryptionTypeEnum.Simple)).toBe(
        'simple',
      );
      expect(encryptionTypeEnumToType(EciesEncryptionTypeEnum.Single)).toBe(
        'single',
      );
      expect(encryptionTypeEnumToType(EciesEncryptionTypeEnum.Multiple)).toBe(
        'multiple',
      );
    });

    it('should throw ECIESError for invalid enum values', () => {
      expect(() =>
        encryptionTypeEnumToType(999 as EciesEncryptionTypeEnum),
      ).toThrow(ECIESError);
      expect(() =>
        encryptionTypeEnumToType(-1 as EciesEncryptionTypeEnum),
      ).toThrow(ECIESError);
      expect(() =>
        encryptionTypeEnumToType(0.5 as EciesEncryptionTypeEnum),
      ).toThrow(ECIESError);
    });

    it('should throw correct error type for invalid values', () => {
      try {
        encryptionTypeEnumToType(999 as EciesEncryptionTypeEnum);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ECIESError);
        expect((error as ECIESError).type).toBe(
          ECIESErrorTypeEnum.InvalidEncryptionType,
        );
      }
    });
  });

  describe('validateEciesEncryptionTypeEnum', () => {
    it('should return true for valid enum values', () => {
      expect(
        validateEciesEncryptionTypeEnum(EciesEncryptionTypeEnum.Simple),
      ).toBe(true);
      expect(
        validateEciesEncryptionTypeEnum(EciesEncryptionTypeEnum.Single),
      ).toBe(true);
      expect(
        validateEciesEncryptionTypeEnum(EciesEncryptionTypeEnum.Multiple),
      ).toBe(true);
    });

    it('should return false for invalid enum values', () => {
      expect(
        validateEciesEncryptionTypeEnum(999 as EciesEncryptionTypeEnum),
      ).toBe(false);
      expect(
        validateEciesEncryptionTypeEnum(-1 as EciesEncryptionTypeEnum),
      ).toBe(false);
      expect(
        validateEciesEncryptionTypeEnum(0.5 as EciesEncryptionTypeEnum),
      ).toBe(false);
      expect(
        validateEciesEncryptionTypeEnum(NaN as EciesEncryptionTypeEnum),
      ).toBe(false);
      expect(
        validateEciesEncryptionTypeEnum(Infinity as EciesEncryptionTypeEnum),
      ).toBe(false);
    });
  });

  describe('ensureEciesEncryptionTypeEnum', () => {
    it('should return valid enum values unchanged', () => {
      expect(
        ensureEciesEncryptionTypeEnum(EciesEncryptionTypeEnum.Simple),
      ).toBe(EciesEncryptionTypeEnum.Simple);
      expect(
        ensureEciesEncryptionTypeEnum(EciesEncryptionTypeEnum.Single),
      ).toBe(EciesEncryptionTypeEnum.Single);
      expect(
        ensureEciesEncryptionTypeEnum(EciesEncryptionTypeEnum.Multiple),
      ).toBe(EciesEncryptionTypeEnum.Multiple);
    });

    it('should throw ECIESError for invalid enum values', () => {
      expect(() =>
        ensureEciesEncryptionTypeEnum(999 as EciesEncryptionTypeEnum),
      ).toThrow(ECIESError);
      expect(() =>
        ensureEciesEncryptionTypeEnum(-1 as EciesEncryptionTypeEnum),
      ).toThrow(ECIESError);
      expect(() =>
        ensureEciesEncryptionTypeEnum(NaN as EciesEncryptionTypeEnum),
      ).toThrow(ECIESError);
    });

    it('should throw correct error type for invalid values', () => {
      try {
        ensureEciesEncryptionTypeEnum(999 as EciesEncryptionTypeEnum);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ECIESError);
        expect((error as ECIESError).type).toBe(
          ECIESErrorTypeEnum.InvalidEncryptionType,
        );
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle boundary enum values', () => {
      // Test with actual enum values to ensure they work
      const enumValues = Object.values(EciesEncryptionTypeEnum).filter(
        (v) => typeof v === 'number',
      );
      for (const value of enumValues) {
        expect(
          validateEciesEncryptionTypeEnum(value as EciesEncryptionTypeEnum),
        ).toBe(true);
        expect(() =>
          ensureEciesEncryptionTypeEnum(value as EciesEncryptionTypeEnum),
        ).not.toThrow();
      }
    });

    it('should handle type coercion edge cases', () => {
      // Test with values that might be coerced
      expect(validateEciesEncryptionTypeEnum(null as any)).toBe(false);
      expect(validateEciesEncryptionTypeEnum(undefined as any)).toBe(false);
      expect(validateEciesEncryptionTypeEnum('' as any)).toBe(false);
      expect(validateEciesEncryptionTypeEnum('0' as any)).toBe(false);
      expect(validateEciesEncryptionTypeEnum([] as any)).toBe(false);
      expect(validateEciesEncryptionTypeEnum({} as any)).toBe(false);
    });
  });
});
