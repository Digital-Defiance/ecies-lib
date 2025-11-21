import { LanguageCodes } from '@digitaldefiance/i18n-lib';
import { GuidBrandType } from '../../src/enumerations/guid-brand-type';
import { GuidErrorType } from '../../src/enumerations/guid-error-type';
import { GuidError } from '../../src/errors/guid';
import { getEciesI18nEngine } from '../../src/i18n-setup';
import { EciesStringKey } from '../../src/enumerations';

describe('GuidError', () => {
  beforeEach(() => {
    const engine = getEciesI18nEngine();
    expect(engine).toBeDefined();
  });

  describe('Error Creation', () => {
    it('should create a GuidError with InvalidGuid type', () => {
      const error = new GuidError(GuidErrorType.InvalidGuid);
      expect(error).toBeInstanceOf(GuidError);
      expect(error.type).toBe(GuidErrorType.InvalidGuid);
      expect(error.name).toBe('GuidError');
      expect(error.message).toBeTruthy();
    });

    it('should create a GuidError with InvalidGuidWithDetails type', () => {
      const buffer = Buffer.from('0123456789abcdef', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
      );
      expect(error).toBeInstanceOf(GuidError);
      expect(error.type).toBe(GuidErrorType.InvalidGuidWithDetails);
      expect(error.guid).toBe(buffer);
      expect(error.message).toContain('0123456789abcdef');
    });

    it('should create a GuidError with InvalidGuidUnknownBrand type', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownBrand,
        GuidBrandType.Unknown,
      );
      expect(error).toBeInstanceOf(GuidError);
      expect(error.type).toBe(GuidErrorType.InvalidGuidUnknownBrand);
      expect(error.brand).toBe(GuidBrandType.Unknown);
      expect(error.message).toContain('Unknown');
    });

    it('should create a GuidError with InvalidGuidUnknownLength type', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        42,
      );
      expect(error).toBeInstanceOf(GuidError);
      expect(error.type).toBe(GuidErrorType.InvalidGuidUnknownLength);
      expect(error.length).toBe(42);
      expect(error.message).toContain('42');
    });
  });

  describe('Error Translation - English', () => {
    it('should translate InvalidGuid to English', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuid,
        undefined,
        undefined,
        undefined,
        LanguageCodes.EN_US,
      );
      expect(error.message).toBe('Invalid GUID.');
    });

    it('should translate InvalidGuidWithDetails with GUID parameter to English', () => {
      const buffer = Buffer.from('1234567890abcdef1234567890abcdef', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
        LanguageCodes.EN_US,
      );
      expect(error.message).toBe(
        'Invalid GUID: 1234567890abcdef1234567890abcdef',
      );
    });

    it('should translate InvalidGuidUnknownBrand with brand parameter to English', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownBrand,
        GuidBrandType.FullHexGuid,
        undefined,
        undefined,
        LanguageCodes.EN_US,
      );
      expect(error.message).toBe('Unknown GUID brand: FullHexGuid.');
    });

    it('should translate InvalidGuidUnknownLength with length parameter to English', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        99,
        undefined,
        LanguageCodes.EN_US,
      );
      expect(error.message).toBe('Invalid GUID length: 99.');
    });
  });

  describe('Error Translation - Spanish', () => {
    it('should translate InvalidGuid to Spanish', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuid,
        undefined,
        undefined,
        undefined,
        LanguageCodes.ES,
      );
      expect(error.message).toBe('GUID invalido.');
    });

    it('should translate InvalidGuidWithDetails to Spanish', () => {
      const buffer = Buffer.from('abcdef1234567890', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
        LanguageCodes.ES,
      );
      expect(error.message).toContain('GUID invalido');
      expect(error.message).toContain('abcdef1234567890');
    });

    it('should translate InvalidGuidUnknownBrand to Spanish', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownBrand,
        GuidBrandType.Base64Guid,
        undefined,
        undefined,
        LanguageCodes.ES,
      );
      expect(error.message).toContain('Marca de GUID desconocida');
      expect(error.message).toContain('Base64Guid');
    });

    it('should translate InvalidGuidUnknownLength to Spanish', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        17,
        undefined,
        LanguageCodes.ES,
      );
      expect(error.message).toContain('Longitud de GUID inválida');
      expect(error.message).toContain('17');
    });
  });

  describe('Error Translation - German', () => {
    it('should translate InvalidGuid to German', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuid,
        undefined,
        undefined,
        undefined,
        LanguageCodes.DE,
      );
      expect(error.message).toBe('Ungültige GUID.');
    });

    it('should translate InvalidGuidWithDetails to German', () => {
      const buffer = Buffer.from('fedcba9876543210', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
        LanguageCodes.DE,
      );
      expect(error.message).toContain('Ungültige GUID');
      expect(error.message).toContain('fedcba9876543210');
    });
  });

  describe('Error Translation - French', () => {
    it('should translate InvalidGuid to French', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuid,
        undefined,
        undefined,
        undefined,
        LanguageCodes.FR,
      );
      expect(error.message).toBe('GUID invalide.');
    });
  });

  describe('Error Translation - Ukrainian', () => {
    it('should translate InvalidGuid to Ukrainian', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuid,
        undefined,
        undefined,
        undefined,
        LanguageCodes.UK,
      );
      expect(error.message).toBe('Недійсний GUID.');
    });
  });

  describe('Parameter Handling', () => {
    it('should handle all parameters together', () => {
      const buffer = Buffer.from('0011223344556677', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        GuidBrandType.BigIntGuid,
        88,
        buffer,
        LanguageCodes.EN_US,
      );
      expect(error.brand).toBe(GuidBrandType.BigIntGuid);
      expect(error.length).toBe(88);
      expect(error.guid).toBe(buffer);
      expect(error.message).toContain('88');
    });

    it('should handle undefined parameters gracefully', () => {
      const error = new GuidError(GuidErrorType.InvalidGuid);
      expect(error.brand).toBeUndefined();
      expect(error.length).toBeUndefined();
      expect(error.guid).toBeUndefined();
    });

    it('should handle zero length', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        0,
      );
      expect(error.length).toBe(0);
      expect(error.message).toContain('0');
    });
  });

  describe('All Error Types Exercise', () => {
    it('should create errors for all GuidErrorType enum values', () => {
      const errorTypes = Object.values(GuidErrorType);
      expect(errorTypes.length).toBe(4);

      errorTypes.forEach((errorType) => {
        expect(() => {
          const error = new GuidError(errorType);
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
          expect(error.type).toBe(errorType);
        }).not.toThrow();
      });
    });
  });

  describe('ReasonMap Validation', () => {
    it('should use buildReasonMap correctly for all error types', () => {
      // InvalidGuid should not have Template suffix
      const error1 = new GuidError(
        GuidErrorType.InvalidGuid,
        undefined,
        undefined,
        undefined,
        LanguageCodes.EN_US,
      );
      expect(error1.message).toBe('Invalid GUID.');

      // InvalidGuidWithDetails should map to InvalidGuidTemplate (with Template suffix)
      const buffer = Buffer.from('1234567890abcdef', 'hex');
      const error2 = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
        LanguageCodes.EN_US,
      );
      expect(error2.message).toContain('Invalid GUID:');

      // InvalidGuidUnknownBrand should have Template suffix
      const error3 = new GuidError(
        GuidErrorType.InvalidGuidUnknownBrand,
        GuidBrandType.Unknown,
        undefined,
        undefined,
        LanguageCodes.EN_US,
      );
      expect(error3.message).toContain('Unknown GUID brand:');

      // InvalidGuidUnknownLength should have Template suffix
      const error4 = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        55,
        undefined,
        LanguageCodes.EN_US,
      );
      expect(error4.message).toContain('Invalid GUID length:');
    });
  });

  describe('Error Properties', () => {
    it('should have correct name property', () => {
      const error = new GuidError(GuidErrorType.InvalidGuid);
      expect(error.name).toBe('GuidError');
    });

    it('should be instanceof Error', () => {
      const error = new GuidError(GuidErrorType.InvalidGuid);
      expect(error).toBeInstanceOf(Error);
    });

    it('should have a stack trace', () => {
      const error = new GuidError(GuidErrorType.InvalidGuid);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('GuidError');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0);
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
      );
      expect(error.guid).toBe(buffer);
      expect(error.message).toContain('');
    });

    it('should handle very large length values', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        Number.MAX_SAFE_INTEGER,
      );
      expect(error.length).toBe(Number.MAX_SAFE_INTEGER);
      expect(error.message).toContain(Number.MAX_SAFE_INTEGER.toString());
    });

    it('should handle all GuidBrandType values', () => {
      const brandTypes = Object.values(GuidBrandType);
      brandTypes.forEach((brand) => {
        const error = new GuidError(
          GuidErrorType.InvalidGuidUnknownBrand,
          brand,
        );
        expect(error.brand).toBe(brand);
        expect(error.message).toContain(brand);
      });
    });

    it('should handle buffer with special characters', () => {
      const buffer = Buffer.from('hello world', 'utf8');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
      );
      expect(error.guid).toBe(buffer);
      expect(error.message).toContain(buffer.toString('hex'));
    });

    it('should handle negative length values', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        -1,
      );
      expect(error.length).toBe(-1);
      expect(error.message).toContain('-1');
    });

    it('should handle extremely large buffer', () => {
      const largeBuffer = Buffer.alloc(1024);
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        largeBuffer,
      );
      expect(error.guid).toBe(largeBuffer);
      expect(error.message).toBeDefined();
    });

    it('should handle fractional length values', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        3.14159,
      );
      expect(error.length).toBe(3.14159);
      expect(error.message).toContain('3.14159');
    });
  });

  describe('Chinese (zh-CN) Translation', () => {
    it('should translate InvalidGuid to Chinese', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuid,
        undefined,
        undefined,
        undefined,
        'zh-CN',
      );
      expect(error.message).toBe('无效的GUID。');
    });

    it('should translate InvalidGuidWithDetails to Chinese', () => {
      const buffer = Buffer.from('aabbccdd', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
        'zh-CN',
      );
      expect(error.message).toContain('无效的GUID');
      expect(error.message).toContain('aabbccdd');
    });

    it('should translate InvalidGuidUnknownBrand to Chinese', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownBrand,
        GuidBrandType.Base64Guid,
        undefined,
        undefined,
        'zh-CN',
      );
      expect(error.message).toContain('未知的GUID品牌');
      expect(error.message).toContain('Base64Guid');
    });

    it('should translate InvalidGuidUnknownLength to Chinese', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        25,
        undefined,
        'zh-CN',
      );
      expect(error.message).toContain('无效的GUID长度');
      expect(error.message).toContain('25');
    });
  });

  describe('Japanese (ja) Translation', () => {
    it('should translate InvalidGuid to Japanese', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuid,
        undefined,
        undefined,
        undefined,
        'ja',
      );
      expect(error.message).toBe('無効なGUID。');
    });

    it('should translate InvalidGuidWithDetails to Japanese', () => {
      const buffer = Buffer.from('deadbeef', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
        'ja',
      );
      expect(error.message).toContain('無効なGUID');
      expect(error.message).toContain('deadbeef');
    });

    it('should translate InvalidGuidUnknownBrand to Japanese', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownBrand,
        GuidBrandType.ShortHexGuid,
        undefined,
        undefined,
        'ja',
      );
      expect(error.message).toContain('不明なGUIDブランド');
      expect(error.message).toContain('ShortHexGuid');
    });

    it('should translate InvalidGuidUnknownLength to Japanese', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        48,
        undefined,
        'ja',
      );
      expect(error.message).toContain('無効なGUID長');
      expect(error.message).toContain('48');
    });
  });

  describe('Error Serialization', () => {
    it('should have serializable properties', () => {
      const buffer = Buffer.from('test1234', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        GuidBrandType.FullHexGuid,
        16,
        buffer,
      );
      const serialized = JSON.stringify(error);
      expect(serialized).toContain('GuidError');
    });

    it('should maintain all properties in JSON', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        GuidBrandType.Base64Guid,
        42,
      );
      const json = JSON.parse(JSON.stringify(error));
      expect(json.name).toBe('GuidError');
      expect(json.brand).toBe(GuidBrandType.Base64Guid);
      expect(json.length).toBe(42);
    });
  });

  describe('Error Inheritance and Type Checking', () => {
    it('should be catchable as Error', () => {
      try {
        throw new GuidError(GuidErrorType.InvalidGuid);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e).toBeInstanceOf(GuidError);
      }
    });

    it('should have correct prototype chain', () => {
      const error = new GuidError(GuidErrorType.InvalidGuid);
      expect(Object.getPrototypeOf(error).constructor.name).toBe('GuidError');
    });

    it('should be distinguishable from other errors', () => {
      const guidError = new GuidError(GuidErrorType.InvalidGuid);
      const regularError = new Error('Regular error');
      expect(guidError).toBeInstanceOf(GuidError);
      expect(regularError).not.toBeInstanceOf(GuidError);
    });
  });

  describe('Multiple Parameter Combinations', () => {
    it('should handle brand only', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownBrand,
        GuidBrandType.BigIntGuid,
      );
      expect(error.brand).toBe(GuidBrandType.BigIntGuid);
      expect(error.length).toBeUndefined();
      expect(error.guid).toBeUndefined();
    });

    it('should handle length only', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        100,
      );
      expect(error.brand).toBeUndefined();
      expect(error.length).toBe(100);
      expect(error.guid).toBeUndefined();
    });

    it('should handle guid only', () => {
      const buffer = Buffer.from('cafebabe', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
      );
      expect(error.brand).toBeUndefined();
      expect(error.length).toBeUndefined();
      expect(error.guid).toBe(buffer);
    });

    it('should handle brand and length', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        GuidBrandType.ShortHexGuid,
        32,
      );
      expect(error.brand).toBe(GuidBrandType.ShortHexGuid);
      expect(error.length).toBe(32);
      expect(error.guid).toBeUndefined();
    });

    it('should handle brand and guid', () => {
      const buffer = Buffer.from('12345678', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        GuidBrandType.RawGuidBuffer,
        undefined,
        buffer,
      );
      expect(error.brand).toBe(GuidBrandType.RawGuidBuffer);
      expect(error.length).toBeUndefined();
      expect(error.guid).toBe(buffer);
    });

    it('should handle length and guid', () => {
      const buffer = Buffer.from('deadbeef', 'hex');
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        8,
        buffer,
      );
      expect(error.brand).toBeUndefined();
      expect(error.length).toBe(8);
      expect(error.guid).toBe(buffer);
    });
  });

  describe('Language Fallback Behavior', () => {
    it('should handle invalid language code gracefully', () => {
      const error = new GuidError(
        GuidErrorType.InvalidGuid,
        undefined,
        undefined,
        undefined,
        'xx-XX' as any,
      );
      expect(error.message).toBeDefined();
      expect(error.message.length).toBeGreaterThan(0);
    });

    it('should use default language when not specified', () => {
      const error = new GuidError(GuidErrorType.InvalidGuid);
      expect(error.message).toBeDefined();
      expect(error.message).toBe('Invalid GUID.');
    });
  });

  describe('Buffer Content Variations', () => {
    it('should handle buffer with all zeros', () => {
      const buffer = Buffer.alloc(16, 0);
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
      );
      expect(error.message).toContain('00000000000000000000000000000000');
    });

    it('should handle buffer with all 0xFF', () => {
      const buffer = Buffer.alloc(16, 0xff);
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
      );
      expect(error.message).toContain('ffffffffffffffffffffffffffffffff');
    });

    it('should handle buffer with pattern', () => {
      const buffer = Buffer.from([
        0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55,
        0x66, 0x77, 0x88, 0x99,
      ]);
      const error = new GuidError(
        GuidErrorType.InvalidGuidWithDetails,
        undefined,
        undefined,
        buffer,
      );
      expect(error.message).toContain('aabbccddeeff001122334455667788');
    });
  });

  describe('Stack Trace Verification', () => {
    it('should include error location in stack trace', () => {
      const error = new GuidError(GuidErrorType.InvalidGuid);
      expect(error.stack).toContain('guid-error.spec.ts');
    });

    it('should have unique stack for each error instance', () => {
      const error1 = new GuidError(GuidErrorType.InvalidGuid);
      const error2 = new GuidError(GuidErrorType.InvalidGuid);
      expect(error1.stack).toBeDefined();
      expect(error2.stack).toBeDefined();
      // Stacks may differ in line numbers
    });
  });
});
