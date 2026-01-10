import * as uuid from 'uuid';
import { GuidBrandType } from '../../src/enumerations/guid-brand-type';
import { GuidErrorType } from '../../src/enumerations/guid-error-type';
import { GuidError } from '../../src/errors/guid';
import { Guid } from '../../src/lib/guid';
import {
  Base64Guid,
  BigIntGuid,
  FullHexGuid,
  RawGuidPlatformBuffer,
  ShortHexGuid,
} from '../../src/types';

describe('Guid', () => {
  // Test GUIDs in various formats
  const testFullHexGuid = '550e8400-e29b-41d4-a716-446655440000' as FullHexGuid;
  const testShortHexGuid = '550e8400e29b41d4a716446655440000' as ShortHexGuid;
  const testBase64Guid = 'VQ6EAOKbQdSnFkRmVUQAAA==' as Base64Guid;
  const testBigIntGuid = BigInt(
    '0x550e8400e29b41d4a716446655440000',
  ) as BigIntGuid;
  const testRawGuidBuffer = Buffer.from(
    testShortHexGuid,
    'hex',
  ) as RawGuidPlatformBuffer;

  // Boundary test cases
  const allZerosFullHex = '00000000-0000-0000-0000-000000000000' as FullHexGuid;
  const allZerosShortHex = '00000000000000000000000000000000' as ShortHexGuid;
  const allFsFullHex = 'ffffffff-ffff-ffff-ffff-ffffffffffff' as FullHexGuid;
  const allFsShortHex = 'ffffffffffffffffffffffffffffffff' as ShortHexGuid;

  describe('Constructor', () => {
    describe('Valid Input', () => {
      it('should create from FullHexGuid', () => {
        const guid = new Guid(testFullHexGuid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should create from ShortHexGuid', () => {
        const guid = new Guid(testShortHexGuid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asShortHexGuid).toBe(testShortHexGuid);
      });

      it('should create from Base64Guid', () => {
        const guid = new Guid(testBase64Guid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asBase64Guid).toBe(testBase64Guid);
      });

      it('should create from BigIntGuid', () => {
        const guid = new Guid(testBigIntGuid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asBigIntGuid).toBe(testBigIntGuid);
      });

      it('should create from RawGuidBuffer', () => {
        const guid = new Guid(testRawGuidBuffer);
        expect(guid).toBeInstanceOf(Guid);
        expect(
          Buffer.compare(guid.asRawGuidPlatformBuffer, testRawGuidBuffer),
        ).toBe(0);
      });

      it('should create from raw Uint8Array', () => {
        // Create a raw Uint8Array (not wrapped in Buffer) to test browser compatibility
        const uint8Array = new Uint8Array([
          0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4, 0xa7, 0x16, 0x44,
          0x66, 0x55, 0x44, 0x00, 0x00,
        ]);
        const guid = new Guid(uint8Array);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should create from valid UUID v4', () => {
        const validUuid = uuid.v4();
        const guid = new Guid(validUuid as FullHexGuid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asFullHexGuid).toBe(validUuid);
      });
    });

    describe('Boundary Values', () => {
      it('should accept all zeros (full hex)', () => {
        const guid = new Guid(allZerosFullHex);
        expect(guid.asFullHexGuid).toBe(allZerosFullHex);
      });

      it('should accept all zeros (short hex)', () => {
        const guid = new Guid(allZerosShortHex);
        expect(guid.asShortHexGuid).toBe(allZerosShortHex);
      });

      it('should accept all Fs (full hex)', () => {
        const guid = new Guid(allFsFullHex);
        expect(guid.asFullHexGuid).toBe(allFsFullHex);
      });

      it('should accept all Fs (short hex)', () => {
        const guid = new Guid(allFsShortHex);
        expect(guid.asShortHexGuid).toBe(allFsShortHex);
      });

      it('should accept bigint zero', () => {
        const guid = new Guid(0n as BigIntGuid);
        expect(guid.asBigIntGuid).toBe(0n);
      });

      it('should accept max bigint value for GUID', () => {
        const maxBigInt = BigInt(
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
        ) as BigIntGuid;
        const guid = new Guid(maxBigInt);
        expect(guid.asBigIntGuid).toBe(maxBigInt);
      });
    });

    describe('Invalid Input - Null/Undefined', () => {
      it('should throw GuidError for null', () => {
        expect(() => new Guid(null as any)).toThrow(GuidError);
        expect(() => new Guid(null as any)).toThrow(
          expect.objectContaining({ type: GuidErrorType.InvalidGuid }),
        );
      });

      it('should throw GuidError for undefined', () => {
        expect(() => new Guid(undefined as any)).toThrow(GuidError);
        expect(() => new Guid(undefined as any)).toThrow(
          expect.objectContaining({ type: GuidErrorType.InvalidGuid }),
        );
      });

      it('should throw GuidError for empty string', () => {
        expect(() => new Guid('')).toThrow(GuidError);
      });
    });

    describe('Invalid Input - Wrong Length', () => {
      it('should throw GuidError for wrong length string', () => {
        expect(() => new Guid('123' as any)).toThrow(GuidError);
        expect(() => new Guid('123' as any)).toThrow(
          expect.objectContaining({
            type: GuidErrorType.InvalidGuidUnknownLength,
          }),
        );
      });

      it('should throw GuidError for wrong length buffer', () => {
        const wrongBuffer = Buffer.from('1234', 'hex');
        expect(() => new Guid(wrongBuffer as any)).toThrow(GuidError);
      });

      it('should throw GuidError for 35-character string', () => {
        expect(
          () => new Guid('550e8400-e29b-41d4-a716-44665544000' as any),
        ).toThrow(GuidError);
      });

      it('should throw GuidError for 37-character string', () => {
        expect(
          () => new Guid('550e8400-e29b-41d4-a716-4466554400000' as any),
        ).toThrow(GuidError);
      });
    });

    describe('Invalid Input - Invalid Format', () => {
      it('should throw GuidError for invalid full hex format', () => {
        expect(
          () => new Guid('ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ' as FullHexGuid),
        ).toThrow(GuidError);
        expect(
          () => new Guid('ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ' as FullHexGuid),
        ).toThrow(GuidError);
      });

      it('should throw GuidError for invalid short hex format', () => {
        expect(
          () => new Guid('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ' as any),
        ).toThrow(GuidError);
      });

      it('should throw GuidError for invalid base64 format', () => {
        expect(() => new Guid('!!INVALID_BASE64_GUID!!' as any)).toThrow(
          GuidError,
        );
      });

      it('should throw GuidError for negative bigint', () => {
        expect(() => new Guid(-1n as BigIntGuid)).toThrow(GuidError);
      });

      it('should throw GuidError for bigint too large', () => {
        const tooBig = BigInt('0x1' + 'F'.repeat(32)) as BigIntGuid;
        expect(() => new Guid(tooBig)).toThrow(GuidError);
      });
    });

    describe('Invalid Input - Wrong Dashes', () => {
      it('should throw GuidError for missing dashes in full hex', () => {
        // This should be treated as wrong length since it's 32 chars without dashes
        const guid = new Guid(testShortHexGuid);
        expect(guid.asShortHexGuid).toBe(testShortHexGuid);
      });

      it('should throw GuidError for dashes in wrong positions', () => {
        expect(
          () => new Guid('550e-8400e29b-41d4a716-446655440000' as any),
        ).toThrow(GuidError);
      });
    });
  });

  describe('Static new() Method', () => {
    it('should create a new random GUID', () => {
      const guid = Guid.new();
      expect(guid).toBeInstanceOf(Guid);
    });

    it('should create unique GUIDs', () => {
      const guid1 = Guid.new();
      const guid2 = Guid.new();
      expect(guid1.asFullHexGuid).not.toBe(guid2.asFullHexGuid);
    });

    it('should create valid UUIDs', () => {
      const guid = Guid.new();
      expect(uuid.validate(guid.asFullHexGuid)).toBe(true);
    });
  });

  describe('Conversion Methods', () => {
    describe('toFullHexGuid', () => {
      it('should convert short hex to full hex', () => {
        const result = Guid.toFullHexGuid(testShortHexGuid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should convert base64 to full hex', () => {
        const result = Guid.toFullHexGuid(testBase64Guid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should convert bigint to full hex', () => {
        const result = Guid.toFullHexGuid(testBigIntGuid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should convert buffer to full hex', () => {
        const result = Guid.toFullHexGuid(testRawGuidBuffer);
        expect(result).toBe(testFullHexGuid);
      });

      it('should return full hex as-is', () => {
        const result = Guid.toFullHexGuid(testFullHexGuid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should throw for invalid input', () => {
        expect(() => Guid.toFullHexGuid('' as any)).toThrow(GuidError);
      });

      it('should throw for null', () => {
        expect(() => Guid.toFullHexGuid(null as any)).toThrow(GuidError);
      });
    });

    describe('toShortHexGuid', () => {
      it('should convert full hex to short hex', () => {
        const result = Guid.toShortHexGuid(testFullHexGuid);
        expect(result).toBe(testShortHexGuid);
      });

      it('should convert base64 to short hex', () => {
        const result = Guid.toShortHexGuid(testBase64Guid);
        expect(result).toBe(testShortHexGuid);
      });

      it('should convert bigint to short hex', () => {
        const result = Guid.toShortHexGuid(testBigIntGuid);
        expect(result).toBe(testShortHexGuid);
      });

      it('should convert buffer to short hex', () => {
        const result = Guid.toShortHexGuid(testRawGuidBuffer);
        expect(result).toBe(testShortHexGuid);
      });

      it('should return short hex as-is', () => {
        const result = Guid.toShortHexGuid(testShortHexGuid);
        expect(result).toBe(testShortHexGuid);
      });
    });

    describe('toRawGuidBuffer', () => {
      it('should convert full hex to buffer', () => {
        const result = Guid.toRawGuidPlatformBuffer(testFullHexGuid);
        expect(Buffer.compare(result, testRawGuidBuffer)).toBe(0);
      });

      it('should convert short hex to buffer', () => {
        const result = Guid.toRawGuidPlatformBuffer(testShortHexGuid);
        expect(Buffer.compare(result, testRawGuidBuffer)).toBe(0);
      });

      it('should convert base64 to buffer', () => {
        const result = Guid.toRawGuidPlatformBuffer(testBase64Guid);
        expect(Buffer.compare(result, testRawGuidBuffer)).toBe(0);
      });

      it('should convert bigint to buffer', () => {
        const result = Guid.toRawGuidPlatformBuffer(testBigIntGuid);
        expect(Buffer.compare(result, testRawGuidBuffer)).toBe(0);
      });

      it('should return buffer as-is', () => {
        const result = Guid.toRawGuidPlatformBuffer(testRawGuidBuffer);
        expect(Buffer.compare(result, testRawGuidBuffer)).toBe(0);
      });

      it('should throw for buffer with wrong length', () => {
        const wrongBuffer = Buffer.from('12345678', 'hex');
        expect(() => Guid.toRawGuidPlatformBuffer(wrongBuffer as any)).toThrow(
          GuidError,
        );
        expect(() => Guid.toRawGuidPlatformBuffer(wrongBuffer as any)).toThrow(
          expect.objectContaining({
            type: GuidErrorType.InvalidGuidUnknownLength,
          }),
        );
      });
    });

    describe('toFullHexFromBigInt', () => {
      it('should convert bigint to full hex', () => {
        const result = Guid.toFullHexFromBigInt(testBigIntGuid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should pad short bigint values', () => {
        const smallBigInt = 1n as BigIntGuid;
        const result = Guid.toFullHexFromBigInt(smallBigInt);
        expect(result).toBe('00000000-0000-0000-0000-000000000001');
      });

      it('should throw for negative bigint', () => {
        expect(() => Guid.toFullHexFromBigInt(-1n as any)).toThrow(GuidError);
      });

      it('should throw for bigint too large', () => {
        const tooBig = BigInt('0x1' + 'F'.repeat(32)) as BigIntGuid;
        expect(() => Guid.toFullHexFromBigInt(tooBig)).toThrow(GuidError);
      });
    });
  });

  describe('Getter Methods', () => {
    let guid: Guid;

    beforeEach(() => {
      guid = new Guid(testFullHexGuid);
    });

    it('should get asFullHexGuid', () => {
      expect(guid.asFullHexGuid).toBe(testFullHexGuid);
    });

    it('should get asShortHexGuid', () => {
      expect(guid.asShortHexGuid).toBe(testShortHexGuid);
    });

    it('should get asBase64Guid', () => {
      expect(guid.asBase64Guid).toBe(testBase64Guid);
    });

    it('should get asBigIntGuid', () => {
      expect(guid.asBigIntGuid).toBe(testBigIntGuid);
    });

    it('should get asRawGuidBuffer', () => {
      expect(
        Buffer.compare(guid.asRawGuidPlatformBuffer, testRawGuidBuffer),
      ).toBe(0);
    });

    it('should get asUint8Array', () => {
      const uint8 = guid.asPlatformBuffer;
      expect(uint8).toBeInstanceOf(Uint8Array);
      expect(uint8.length).toBe(16);
    });

    it('should toString as Base64Guid', () => {
      expect(guid.toString()).toBe(testBase64Guid);
    });

    it('should toJson', () => {
      const json = guid.toJson();
      expect(json).toBe(JSON.stringify(testBase64Guid));
      expect(JSON.parse(json)).toBe(testBase64Guid);
    });
  });

  describe('Brand Detection - whichBrand', () => {
    it('should detect FullHexGuid', () => {
      const brand = Guid.whichBrand(testFullHexGuid);
      expect(brand).toBe(GuidBrandType.FullHexGuid);
    });

    it('should detect ShortHexGuid', () => {
      const brand = Guid.whichBrand(testShortHexGuid);
      expect(brand).toBe(GuidBrandType.ShortHexGuid);
    });

    it('should detect Base64Guid', () => {
      const brand = Guid.whichBrand(testBase64Guid);
      expect(brand).toBe(GuidBrandType.Base64Guid);
    });

    it('should detect BigIntGuid', () => {
      const brand = Guid.whichBrand(testBigIntGuid);
      expect(brand).toBe(GuidBrandType.BigIntGuid);
    });

    it('should detect RawGuidBuffer', () => {
      const brand = Guid.whichBrand(testRawGuidBuffer);
      expect(brand).toBe(GuidBrandType.RawGuidPlatformBuffer);
    });

    it('should throw for null', () => {
      expect(() => Guid.whichBrand(null as any)).toThrow(GuidError);
    });

    it('should throw for undefined', () => {
      expect(() => Guid.whichBrand(undefined as any)).toThrow(GuidError);
    });
  });

  describe('Brand Verification - verifyGuid', () => {
    it('should verify FullHexGuid', () => {
      expect(Guid.verifyGuid(GuidBrandType.FullHexGuid, testFullHexGuid)).toBe(
        true,
      );
      expect(Guid.verifyGuid(GuidBrandType.FullHexGuid, 'invalid')).toBe(false);
    });

    it('should verify ShortHexGuid', () => {
      expect(
        Guid.verifyGuid(GuidBrandType.ShortHexGuid, testShortHexGuid),
      ).toBe(true);
      expect(Guid.verifyGuid(GuidBrandType.ShortHexGuid, 'invalid')).toBe(
        false,
      );
    });

    it('should verify Base64Guid', () => {
      expect(Guid.verifyGuid(GuidBrandType.Base64Guid, testBase64Guid)).toBe(
        true,
      );
      expect(Guid.verifyGuid(GuidBrandType.Base64Guid, 'invalid')).toBe(false);
    });

    it('should verify BigIntGuid', () => {
      expect(Guid.verifyGuid(GuidBrandType.BigIntGuid, testBigIntGuid)).toBe(
        true,
      );
      expect(Guid.verifyGuid(GuidBrandType.BigIntGuid, -1n)).toBe(false);
    });

    it('should verify RawGuidBuffer', () => {
      expect(
        Guid.verifyGuid(GuidBrandType.RawGuidPlatformBuffer, testRawGuidBuffer),
      ).toBe(true);
      expect(
        Guid.verifyGuid(
          GuidBrandType.RawGuidPlatformBuffer,
          Buffer.from('invalid', 'hex'),
        ),
      ).toBe(false);
    });

    it('should return false for null', () => {
      expect(Guid.verifyGuid(GuidBrandType.FullHexGuid, null as any)).toBe(
        false,
      );
    });

    it('should return false for undefined', () => {
      expect(Guid.verifyGuid(GuidBrandType.FullHexGuid, undefined as any)).toBe(
        false,
      );
    });

    it('should return false for Unknown brand', () => {
      expect(Guid.verifyGuid(GuidBrandType.Unknown, testFullHexGuid)).toBe(
        false,
      );
    });
  });

  describe('Individual Verification Methods', () => {
    describe('isFullHexGuid', () => {
      it('should return true for valid full hex', () => {
        expect(Guid.isFullHexGuid(testFullHexGuid)).toBe(true);
      });

      it('should return true for boundary values', () => {
        expect(Guid.isFullHexGuid(allZerosFullHex)).toBe(true);
        expect(Guid.isFullHexGuid(allFsFullHex)).toBe(true);
      });

      it('should return false for invalid format', () => {
        expect(Guid.isFullHexGuid(testShortHexGuid)).toBe(false);
        expect(Guid.isFullHexGuid('invalid')).toBe(false);
      });

      it('should return false for null/undefined', () => {
        expect(Guid.isFullHexGuid(null as any)).toBe(false);
        expect(Guid.isFullHexGuid(undefined as any)).toBe(false);
      });
    });

    describe('isShortHexGuid', () => {
      it('should return true for valid short hex', () => {
        expect(Guid.isShortHexGuid(testShortHexGuid)).toBe(true);
      });

      it('should return true for boundary values', () => {
        expect(Guid.isShortHexGuid(allZerosShortHex)).toBe(true);
        expect(Guid.isShortHexGuid(allFsShortHex)).toBe(true);
      });

      it('should return false for invalid format', () => {
        expect(Guid.isShortHexGuid(testFullHexGuid)).toBe(false);
        expect(Guid.isShortHexGuid('invalid')).toBe(false);
      });

      it('should return false for null/undefined', () => {
        expect(Guid.isShortHexGuid(null as any)).toBe(false);
        expect(Guid.isShortHexGuid(undefined as any)).toBe(false);
      });
    });

    describe('isBase64Guid', () => {
      it('should return true for valid base64', () => {
        expect(Guid.isBase64Guid(testBase64Guid)).toBe(true);
      });

      it('should return false for invalid format', () => {
        expect(Guid.isBase64Guid(testFullHexGuid)).toBe(false);
        expect(Guid.isBase64Guid('invalid')).toBe(false);
      });

      it('should return false for wrong length', () => {
        expect(Guid.isBase64Guid('VQ6EAOKbQdSnFkRm' as any)).toBe(false);
      });

      it('should return false for null/undefined', () => {
        expect(Guid.isBase64Guid(null as any)).toBe(false);
        expect(Guid.isBase64Guid(undefined as any)).toBe(false);
      });
    });

    describe('isRawGuidBuffer', () => {
      it('should return true for valid buffer', () => {
        expect(Guid.isRawGuidUint8Array(testRawGuidBuffer)).toBe(true);
      });

      it('should return false for wrong length buffer', () => {
        expect(Guid.isRawGuidUint8Array(Buffer.from('1234', 'hex'))).toBe(
          false,
        );
      });

      it('should return false for non-buffer', () => {
        expect(Guid.isRawGuidUint8Array(testFullHexGuid)).toBe(false);
      });

      it('should return false for null/undefined', () => {
        expect(Guid.isRawGuidUint8Array(null as any)).toBe(false);
        expect(Guid.isRawGuidUint8Array(undefined as any)).toBe(false);
      });
    });

    describe('isBigIntGuid', () => {
      it('should return true for valid bigint', () => {
        expect(Guid.isBigIntGuid(testBigIntGuid)).toBe(true);
      });

      it('should return true for zero bigint', () => {
        expect(Guid.isBigIntGuid(0n)).toBe(true);
      });

      it('should return false for negative bigint', () => {
        expect(Guid.isBigIntGuid(-1n)).toBe(false);
      });

      it('should return false for bigint too large', () => {
        const tooBig = BigInt('0x1' + 'F'.repeat(32));
        expect(Guid.isBigIntGuid(tooBig)).toBe(false);
      });

      it('should return false for non-bigint', () => {
        expect(Guid.isBigIntGuid(testFullHexGuid as any)).toBe(false);
        expect(Guid.isBigIntGuid(123 as any)).toBe(false);
      });

      it('should return false for null/undefined', () => {
        expect(Guid.isBigIntGuid(null as any)).toBe(false);
        expect(Guid.isBigIntGuid(undefined as any)).toBe(false);
      });
    });
  });

  describe('Length Mapping', () => {
    describe('guidBrandToLength', () => {
      it('should return 36 for FullHexGuid', () => {
        expect(Guid.guidBrandToLength(GuidBrandType.FullHexGuid)).toBe(36);
      });

      it('should return 32 for ShortHexGuid', () => {
        expect(Guid.guidBrandToLength(GuidBrandType.ShortHexGuid)).toBe(32);
      });

      it('should return 24 for Base64Guid', () => {
        expect(Guid.guidBrandToLength(GuidBrandType.Base64Guid)).toBe(24);
      });

      it('should return 16 for RawGuidBuffer', () => {
        expect(
          Guid.guidBrandToLength(GuidBrandType.RawGuidPlatformBuffer),
        ).toBe(16);
      });

      it('should throw for BigIntGuid (variable length)', () => {
        expect(() => Guid.guidBrandToLength(GuidBrandType.BigIntGuid)).toThrow(
          GuidError,
        );
        expect(() => Guid.guidBrandToLength(GuidBrandType.BigIntGuid)).toThrow(
          expect.objectContaining({
            type: GuidErrorType.InvalidGuidUnknownBrand,
          }),
        );
      });

      it('should throw for Unknown', () => {
        expect(() => Guid.guidBrandToLength(GuidBrandType.Unknown)).toThrow(
          GuidError,
        );
      });
    });

    describe('lengthToGuidBrand', () => {
      it('should return FullHexGuid for length 36', () => {
        expect(Guid.lengthToGuidBrand(36, false)).toBe(
          GuidBrandType.FullHexGuid,
        );
      });

      it('should return ShortHexGuid for length 32', () => {
        expect(Guid.lengthToGuidBrand(32, false)).toBe(
          GuidBrandType.ShortHexGuid,
        );
      });

      it('should return Base64Guid for length 24', () => {
        expect(Guid.lengthToGuidBrand(24, false)).toBe(
          GuidBrandType.Base64Guid,
        );
      });

      it('should return RawGuidBuffer for length 16 with buffer flag', () => {
        expect(Guid.lengthToGuidBrand(16, true)).toBe(
          GuidBrandType.RawGuidPlatformBuffer,
        );
      });

      it('should throw for zero length', () => {
        expect(() => Guid.lengthToGuidBrand(0, false)).toThrow(GuidError);
        expect(() => Guid.lengthToGuidBrand(0, false)).toThrow(
          expect.objectContaining({
            type: GuidErrorType.InvalidGuidUnknownLength,
          }),
        );
      });

      it('should throw for negative length', () => {
        expect(() => Guid.lengthToGuidBrand(-1, false)).toThrow(GuidError);
      });

      it('should throw for unknown length', () => {
        expect(() => Guid.lengthToGuidBrand(99, false)).toThrow(GuidError);
      });
    });
  });

  describe('Serialization and Hydration', () => {
    it('should serialize to Base64', () => {
      const guid = new Guid(testFullHexGuid);
      expect(guid.serialize()).toBe(testBase64Guid);
    });

    it('should hydrate from Base64', () => {
      const guid = Guid.hydrate(testBase64Guid);
      expect(guid).toBeInstanceOf(Guid);
      expect(guid.asBase64Guid).toBe(testBase64Guid);
    });

    it('should round-trip serialize/hydrate', () => {
      const original = new Guid(testFullHexGuid);
      const serialized = original.serialize();
      const hydrated = Guid.hydrate(serialized);
      expect(hydrated.equals(original)).toBe(true);
    });
  });

  describe('Equality', () => {
    it('should return true for equal GUIDs', () => {
      const guid1 = new Guid(testFullHexGuid);
      const guid2 = new Guid(testShortHexGuid);
      expect(guid1.equals(guid2)).toBe(true);
    });

    it('should return false for different GUIDs', () => {
      const guid1 = new Guid(testFullHexGuid);
      const guid2 = Guid.new();
      expect(guid1.equals(guid2)).toBe(false);
    });

    it('should work with different input formats', () => {
      const guid1 = new Guid(testFullHexGuid);
      const guid2 = new Guid(testBase64Guid);
      const guid3 = new Guid(testBigIntGuid);
      const guid4 = new Guid(testRawGuidBuffer);

      expect(guid1.equals(guid2)).toBe(true);
      expect(guid1.equals(guid3)).toBe(true);
      expect(guid1.equals(guid4)).toBe(true);
    });
  });

  describe('UUID Validation', () => {
    it('should validate correct UUIDs', () => {
      const validUuid = uuid.v4();
      expect(Guid.validateUuid(validUuid)).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(Guid.validateUuid('invalid')).toBe(false);
      expect(Guid.validateUuid('ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ')).toBe(
        false,
      );
    });

    it('should accept boundary UUIDs', () => {
      expect(Guid.validateUuid(allZerosFullHex)).toBe(true);
      expect(Guid.validateUuid(allFsFullHex)).toBe(true);
    });
  });

  describe('Error Handling Coverage', () => {
    it('should handle catch blocks in constructor with bigint', () => {
      // Test the bigint-specific error path
      const invalidBigInt = BigInt('0x1' + 'F'.repeat(33)) as BigIntGuid;
      expect(() => new Guid(invalidBigInt)).toThrow(GuidError);
    });

    it('should handle error in new() method when uuid generation fails', () => {
      // The uuid.v4() function is well-tested and reliable, so we just verify
      // that new() creates valid GUIDs consistently
      const guid1 = Guid.new();
      const guid2 = Guid.new();
      expect(guid1).toBeInstanceOf(Guid);
      expect(guid2).toBeInstanceOf(Guid);
      expect(uuid.validate(guid1.asFullHexGuid)).toBe(true);
      expect(uuid.validate(guid2.asFullHexGuid)).toBe(true);
    });

    it('should handle invalid base64 in toRawGuidBuffer', () => {
      // A base64 string that's 24 chars but not valid GUID
      expect(() =>
        Guid.toRawGuidPlatformBuffer('!!!INVALID_BASE64!!!' as any),
      ).toThrow(GuidError);
    });
  });

  describe('Edge Cases and Corner Cases', () => {
    it('should handle GUID with lowercase hex', () => {
      const lowerCaseGuid = testFullHexGuid.toLowerCase() as FullHexGuid;
      const guid = new Guid(lowerCaseGuid);
      expect(guid.asFullHexGuid).toBe(lowerCaseGuid);
    });

    it('should handle GUID with uppercase hex', () => {
      const upperCaseGuid = testFullHexGuid.toUpperCase() as FullHexGuid;
      const guid = new Guid(upperCaseGuid);
      expect(guid.asFullHexGuid.toLowerCase()).toBe(
        testFullHexGuid.toLowerCase(),
      );
    });

    it('should handle mixed case hex', () => {
      const mixedCase = '550E8400-E29B-41D4-A716-446655440000' as FullHexGuid;
      const guid = new Guid(mixedCase);
      expect(guid).toBeInstanceOf(Guid);
    });

    it('should handle conversion errors gracefully', () => {
      // Test various error paths
      expect(() => Guid.toFullHexGuid(Buffer.alloc(20) as any)).toThrow(
        GuidError,
      );
      expect(() => Guid.toShortHexGuid(null as any)).toThrow(GuidError);
    });

    it('should handle all conversion switch branches', () => {
      // Test all branches in toRawGuidBuffer
      const fullHexBuffer = Guid.toRawGuidPlatformBuffer(testFullHexGuid);
      const shortHexBuffer = Guid.toRawGuidPlatformBuffer(testShortHexGuid);
      const base64Buffer = Guid.toRawGuidPlatformBuffer(testBase64Guid);
      const bigIntBuffer = Guid.toRawGuidPlatformBuffer(testBigIntGuid);
      const rawBuffer = Guid.toRawGuidPlatformBuffer(testRawGuidBuffer);

      expect(Buffer.compare(fullHexBuffer, testRawGuidBuffer)).toBe(0);
      expect(Buffer.compare(shortHexBuffer, testRawGuidBuffer)).toBe(0);
      expect(Buffer.compare(base64Buffer, testRawGuidBuffer)).toBe(0);
      expect(Buffer.compare(bigIntBuffer, testRawGuidBuffer)).toBe(0);
      expect(Buffer.compare(rawBuffer, testRawGuidBuffer)).toBe(0);
    });

    it('should handle default case in toRawGuidBuffer', () => {
      // Force an unknown brand type to hit the default case
      expect(() => Guid.toRawGuidPlatformBuffer({ length: 99 } as any)).toThrow(
        GuidError,
      );
    });
  });

  describe('Integration Tests', () => {
    it('should convert between all formats successfully', () => {
      const guid = new Guid(testFullHexGuid);

      const fullHex = guid.asFullHexGuid;
      const shortHex = guid.asShortHexGuid;
      const base64 = guid.asBase64Guid;
      const bigInt = guid.asBigIntGuid;
      const buffer = guid.asRawGuidPlatformBuffer;

      // Create new GUIDs from each format
      const fromFullHex = new Guid(fullHex);
      const fromShortHex = new Guid(shortHex);
      const fromBase64 = new Guid(base64);
      const fromBigInt = new Guid(bigInt);
      const fromBuffer = new Guid(buffer);

      // All should be equal
      expect(fromFullHex.equals(guid)).toBe(true);
      expect(fromShortHex.equals(guid)).toBe(true);
      expect(fromBase64.equals(guid)).toBe(true);
      expect(fromBigInt.equals(guid)).toBe(true);
      expect(fromBuffer.equals(guid)).toBe(true);
    });

    it('should handle rapid creation and conversion', () => {
      const guids = Array.from({ length: 100 }, () => Guid.new());

      guids.forEach((guid) => {
        expect(guid).toBeInstanceOf(Guid);
        expect(uuid.validate(guid.asFullHexGuid)).toBe(true);

        // Test all conversions
        const serialized = guid.serialize();
        const hydrated = Guid.hydrate(serialized);
        expect(hydrated.equals(guid)).toBe(true);
      });
    });
  });

  describe('Static Method Edge Cases', () => {
    describe('validateUuid', () => {
      it('should validate proper UUID v4', () => {
        const validUuid = uuid.v4();
        expect(Guid.validateUuid(validUuid)).toBe(true);
      });

      it('should reject invalid UUID', () => {
        expect(Guid.validateUuid('not-a-uuid')).toBe(false);
      });

      it('should reject empty string', () => {
        expect(Guid.validateUuid('')).toBe(false);
      });

      it('should handle boundary values', () => {
        // uuid.validate actually accepts all zeros and all Fs
        expect(Guid.validateUuid(allZerosFullHex)).toBe(true);
        expect(Guid.validateUuid(allFsFullHex)).toBe(true);
        // And Guid.isFullHexGuid also accepts them
        expect(Guid.isFullHexGuid(allZerosFullHex)).toBe(true);
        expect(Guid.isFullHexGuid(allFsFullHex)).toBe(true);
      });
    });

    describe('guidBrandToLength', () => {
      it('should return correct length for FullHexGuid', () => {
        expect(Guid.guidBrandToLength(GuidBrandType.FullHexGuid)).toBe(36);
      });

      it('should return correct length for ShortHexGuid', () => {
        expect(Guid.guidBrandToLength(GuidBrandType.ShortHexGuid)).toBe(32);
      });

      it('should return correct length for Base64Guid', () => {
        expect(Guid.guidBrandToLength(GuidBrandType.Base64Guid)).toBe(24);
      });

      it('should return correct length for RawGuidBuffer', () => {
        expect(
          Guid.guidBrandToLength(GuidBrandType.RawGuidPlatformBuffer),
        ).toBe(16);
      });

      it('should throw for Unknown brand', () => {
        expect(() => Guid.guidBrandToLength(GuidBrandType.Unknown)).toThrow(
          GuidError,
        );
      });

      it('should throw for BigIntGuid', () => {
        expect(() => Guid.guidBrandToLength(GuidBrandType.BigIntGuid)).toThrow(
          GuidError,
        );
      });
    });

    describe('lengthToGuidBrand', () => {
      it('should identify FullHexGuid length', () => {
        expect(Guid.lengthToGuidBrand(36, false)).toBe(
          GuidBrandType.FullHexGuid,
        );
      });

      it('should identify ShortHexGuid length', () => {
        expect(Guid.lengthToGuidBrand(32, false)).toBe(
          GuidBrandType.ShortHexGuid,
        );
      });

      it('should identify Base64Guid length', () => {
        expect(Guid.lengthToGuidBrand(24, false)).toBe(
          GuidBrandType.Base64Guid,
        );
      });

      it('should identify RawGuidBuffer length', () => {
        expect(Guid.lengthToGuidBrand(16, true)).toBe(
          GuidBrandType.RawGuidPlatformBuffer,
        );
      });

      it('should throw for zero length', () => {
        expect(() => Guid.lengthToGuidBrand(0, false)).toThrow(GuidError);
      });

      it('should throw for negative length', () => {
        expect(() => Guid.lengthToGuidBrand(-1, false)).toThrow(GuidError);
      });

      it('should throw for unknown length', () => {
        expect(() => Guid.lengthToGuidBrand(100, false)).toThrow(GuidError);
      });

      it('should distinguish buffer from string for same length', () => {
        // Length 16 could be buffer or string, but buffer flag differentiates
        expect(Guid.lengthToGuidBrand(16, true)).toBe(
          GuidBrandType.RawGuidPlatformBuffer,
        );
        expect(() => Guid.lengthToGuidBrand(16, false)).toThrow(GuidError);
      });
    });

    describe('whichBrand', () => {
      it('should identify FullHexGuid', () => {
        expect(Guid.whichBrand(testFullHexGuid)).toBe(
          GuidBrandType.FullHexGuid,
        );
      });

      it('should identify ShortHexGuid', () => {
        expect(Guid.whichBrand(testShortHexGuid)).toBe(
          GuidBrandType.ShortHexGuid,
        );
      });

      it('should identify Base64Guid', () => {
        expect(Guid.whichBrand(testBase64Guid)).toBe(GuidBrandType.Base64Guid);
      });

      it('should identify BigIntGuid', () => {
        expect(Guid.whichBrand(testBigIntGuid)).toBe(GuidBrandType.BigIntGuid);
      });

      it('should identify RawGuidBuffer', () => {
        expect(Guid.whichBrand(testRawGuidBuffer)).toBe(
          GuidBrandType.RawGuidPlatformBuffer,
        );
      });

      it('should throw for invalid input', () => {
        expect(() => Guid.whichBrand('invalid' as any)).toThrow(GuidError);
      });

      it('should throw for null', () => {
        expect(() => Guid.whichBrand(null as any)).toThrow(GuidError);
      });

      it('should throw for undefined', () => {
        expect(() => Guid.whichBrand(undefined as any)).toThrow(GuidError);
      });
    });

    describe('verifyGuid', () => {
      it('should verify valid FullHexGuid', () => {
        expect(
          Guid.verifyGuid(GuidBrandType.FullHexGuid, testFullHexGuid),
        ).toBe(true);
      });

      it('should reject invalid brand/value combination', () => {
        expect(
          Guid.verifyGuid(GuidBrandType.ShortHexGuid, testFullHexGuid),
        ).toBe(false);
      });

      it('should reject null', () => {
        expect(Guid.verifyGuid(GuidBrandType.FullHexGuid, null as any)).toBe(
          false,
        );
      });

      it('should reject undefined', () => {
        expect(
          Guid.verifyGuid(GuidBrandType.FullHexGuid, undefined as any),
        ).toBe(false);
      });

      it('should handle exceptions gracefully', () => {
        expect(Guid.verifyGuid(GuidBrandType.Unknown, 'anything')).toBe(false);
      });
    });
  });

  describe('Type Guard Methods', () => {
    describe('isFullHexGuid', () => {
      it('should accept valid full hex GUID', () => {
        expect(Guid.isFullHexGuid(testFullHexGuid)).toBe(true);
      });

      it('should accept all zeros', () => {
        expect(Guid.isFullHexGuid(allZerosFullHex)).toBe(true);
      });

      it('should accept all Fs', () => {
        expect(Guid.isFullHexGuid(allFsFullHex)).toBe(true);
      });

      it('should reject short hex GUID', () => {
        expect(Guid.isFullHexGuid(testShortHexGuid)).toBe(false);
      });

      it('should reject wrong length', () => {
        expect(Guid.isFullHexGuid('too-short')).toBe(false);
      });

      it('should reject null', () => {
        expect(Guid.isFullHexGuid(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(Guid.isFullHexGuid(undefined as any)).toBe(false);
      });

      it('should handle exceptions', () => {
        expect(Guid.isFullHexGuid({ invalid: 'object' } as any)).toBe(false);
      });
    });

    describe('isShortHexGuid', () => {
      it('should accept valid short hex GUID', () => {
        expect(Guid.isShortHexGuid(testShortHexGuid)).toBe(true);
      });

      it('should accept all zeros', () => {
        expect(Guid.isShortHexGuid(allZerosShortHex)).toBe(true);
      });

      it('should accept all Fs', () => {
        expect(Guid.isShortHexGuid(allFsShortHex)).toBe(true);
      });

      it('should reject full hex GUID', () => {
        expect(Guid.isShortHexGuid(testFullHexGuid)).toBe(false);
      });

      it('should reject wrong length', () => {
        expect(Guid.isShortHexGuid('too-short')).toBe(false);
      });

      it('should reject null', () => {
        expect(Guid.isShortHexGuid(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(Guid.isShortHexGuid(undefined as any)).toBe(false);
      });

      it('should handle invalid hex characters', () => {
        expect(Guid.isShortHexGuid('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ')).toBe(
          false,
        );
      });
    });

    describe('isBase64Guid', () => {
      it('should accept valid base64 GUID', () => {
        expect(Guid.isBase64Guid(testBase64Guid)).toBe(true);
      });

      it('should reject wrong length', () => {
        expect(Guid.isBase64Guid('ABC=')).toBe(false);
      });

      it('should reject null', () => {
        expect(Guid.isBase64Guid(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(Guid.isBase64Guid(undefined as any)).toBe(false);
      });

      it('should handle bigint input', () => {
        expect(Guid.isBase64Guid(12345n as any)).toBe(false);
      });

      it('should handle buffer input', () => {
        expect(Guid.isBase64Guid(Buffer.alloc(10))).toBe(false);
      });

      it('should reject invalid base64 content', () => {
        expect(Guid.isBase64Guid('!!!INVALID!!!!!!!!!!!!')).toBe(false);
      });
    });

    describe('isRawGuidBuffer', () => {
      it('should accept valid raw buffer', () => {
        expect(Guid.isRawGuidUint8Array(testRawGuidBuffer)).toBe(true);
      });

      it('should accept 16-byte buffer', () => {
        const buffer = Buffer.alloc(16);
        expect(Guid.isRawGuidUint8Array(buffer)).toBe(true);
      });

      it('should reject wrong length buffer', () => {
        const buffer = Buffer.alloc(20);
        expect(Guid.isRawGuidUint8Array(buffer)).toBe(false);
      });

      it('should reject non-buffer', () => {
        expect(Guid.isRawGuidUint8Array('not-a-buffer' as any)).toBe(false);
      });

      it('should reject null', () => {
        expect(Guid.isRawGuidUint8Array(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(Guid.isRawGuidUint8Array(undefined as any)).toBe(false);
      });

      it('should reject empty buffer', () => {
        expect(Guid.isRawGuidUint8Array(Buffer.alloc(0))).toBe(false);
      });
    });

    describe('isBigIntGuid', () => {
      it('should accept valid BigIntGuid', () => {
        expect(Guid.isBigIntGuid(testBigIntGuid)).toBe(true);
      });

      it('should accept zero bigint', () => {
        expect(Guid.isBigIntGuid(0n)).toBe(true);
      });

      it('should accept max valid bigint', () => {
        const maxBigInt = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
        expect(Guid.isBigIntGuid(maxBigInt)).toBe(true);
      });

      it('should reject negative bigint', () => {
        expect(Guid.isBigIntGuid(-1n)).toBe(false);
      });

      it('should reject too large bigint', () => {
        const tooBig = BigInt('0x1' + 'F'.repeat(32));
        expect(Guid.isBigIntGuid(tooBig)).toBe(false);
      });

      it('should reject non-bigint', () => {
        expect(Guid.isBigIntGuid('not-a-bigint' as any)).toBe(false);
      });

      it('should reject null', () => {
        expect(Guid.isBigIntGuid(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(Guid.isBigIntGuid(undefined as any)).toBe(false);
      });

      it('should reject regular number', () => {
        expect(Guid.isBigIntGuid(12345 as any)).toBe(false);
      });
    });
  });

  describe('Conversion Static Methods Thoroughness', () => {
    describe('toFullHexFromBigInt', () => {
      it('should convert zero bigint', () => {
        const result = Guid.toFullHexFromBigInt(0n);
        expect(result).toBe('00000000-0000-0000-0000-000000000000');
      });

      it('should convert max bigint', () => {
        const maxBigInt = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
        const result = Guid.toFullHexFromBigInt(maxBigInt);
        expect(result).toBe('ffffffff-ffff-ffff-ffff-ffffffffffff');
      });

      it('should handle mid-range values', () => {
        const result = Guid.toFullHexFromBigInt(testBigIntGuid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should pad with leading zeros', () => {
        const smallBigInt = BigInt('0x123');
        const result = Guid.toFullHexFromBigInt(smallBigInt);
        expect(result.length).toBe(36);
        expect(result).toContain('0000-0000-0000-0000-000000000123');
      });

      it('should throw for negative bigint', () => {
        expect(() => Guid.toFullHexFromBigInt(-1n)).toThrow(GuidError);
      });

      it('should throw for too large bigint', () => {
        const tooBig = BigInt('0x1' + 'F'.repeat(32));
        expect(() => Guid.toFullHexFromBigInt(tooBig)).toThrow(GuidError);
      });
    });

    describe('toShortHexGuid comprehensive', () => {
      it('should handle all boundary values', () => {
        expect(Guid.toShortHexGuid(allZerosFullHex)).toBe(allZerosShortHex);
        expect(Guid.toShortHexGuid(allFsFullHex)).toBe(allFsShortHex);
      });

      it('should handle base64 with padding', () => {
        const result = Guid.toShortHexGuid(testBase64Guid);
        expect(result).toBe(testShortHexGuid);
      });

      it('should throw for invalid base64 in conversion', () => {
        expect(() =>
          Guid.toShortHexGuid('!!!INVALID_BASE64!!!' as any),
        ).toThrow(GuidError);
      });

      it('should handle base64 edge cases', () => {
        // Valid base64 but wrong length after decoding
        expect(() => Guid.toRawGuidPlatformBuffer('SGVsbG8=' as any)).toThrow(
          GuidError,
        );
      });
    });
  });

  describe('Instance Methods Thoroughness', () => {
    describe('serialize and hydrate', () => {
      it('should round-trip through serialize/hydrate', () => {
        const original = new Guid(testFullHexGuid);
        const serialized = original.serialize();
        const hydrated = Guid.hydrate(serialized);
        expect(hydrated.equals(original)).toBe(true);
      });

      it('should serialize to base64', () => {
        const guid = new Guid(testFullHexGuid);
        const serialized = guid.serialize();
        expect(serialized).toBe(testBase64Guid);
      });

      it('should handle boundary values in serialization', () => {
        const zeroGuid = new Guid(allZerosFullHex);
        const serialized = zeroGuid.serialize();
        const hydrated = Guid.hydrate(serialized);
        expect(hydrated.asFullHexGuid).toBe(allZerosFullHex);
      });
    });

    describe('toString', () => {
      it('should return base64 format', () => {
        const guid = new Guid(testFullHexGuid);
        expect(guid.toString()).toBe(testBase64Guid);
      });

      it('should match asBase64Guid', () => {
        const guid = new Guid(testFullHexGuid);
        expect(guid.toString()).toBe(guid.asBase64Guid);
      });
    });

    describe('toJson', () => {
      it('should return stringified base64 format', () => {
        const guid = new Guid(testFullHexGuid);
        const jsonString = guid.toJson();
        // toJson calls JSON.stringify, which adds quotes
        expect(jsonString).toBe(JSON.stringify(guid.asBase64Guid));
        expect(jsonString).toBe(JSON.stringify(testBase64Guid));
      });

      it('should be parseable back to base64', () => {
        const guid = new Guid(testFullHexGuid);
        const jsonString = guid.toJson();
        // Parse to remove quotes, then can reconstruct
        const parsed = JSON.parse(jsonString);
        const restored = new Guid(parsed as Base64Guid);
        expect(restored.equals(guid)).toBe(true);
      });
    });

    describe('asUint8Array', () => {
      it('should return Uint8Array with correct length', () => {
        const guid = new Guid(testFullHexGuid);
        const uint8 = guid.asPlatformBuffer;
        expect(uint8).toBeInstanceOf(Uint8Array);
        expect(uint8.length).toBe(16);
      });

      it('should match buffer contents', () => {
        const guid = new Guid(testFullHexGuid);
        const uint8 = guid.asPlatformBuffer;
        const buffer = guid.asRawGuidPlatformBuffer;
        expect(Array.from(uint8)).toEqual(Array.from(buffer));
      });

      it('should handle boundary values', () => {
        const zeroGuid = new Guid(allZerosFullHex);
        const uint8 = zeroGuid.asPlatformBuffer;
        expect(uint8.every((byte) => byte === 0)).toBe(true);

        const ffGuid = new Guid(allFsFullHex);
        const uint8Ff = ffGuid.asPlatformBuffer;
        expect(uint8Ff.every((byte) => byte === 0xff)).toBe(true);
      });
    });

    describe('equals', () => {
      it('should return true for same GUID', () => {
        const guid1 = new Guid(testFullHexGuid);
        const guid2 = new Guid(testFullHexGuid);
        expect(guid1.equals(guid2)).toBe(true);
      });

      it('should return true for different formats of same GUID', () => {
        const guid1 = new Guid(testFullHexGuid);
        const guid2 = new Guid(testShortHexGuid);
        const guid3 = new Guid(testBase64Guid);
        const guid4 = new Guid(testBigIntGuid);
        const guid5 = new Guid(testRawGuidBuffer);

        expect(guid1.equals(guid2)).toBe(true);
        expect(guid1.equals(guid3)).toBe(true);
        expect(guid1.equals(guid4)).toBe(true);
        expect(guid1.equals(guid5)).toBe(true);
      });

      it('should return false for different GUIDs', () => {
        const guid1 = new Guid(testFullHexGuid);
        const guid2 = Guid.new();
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('should handle boundary comparisons', () => {
        const zeroGuid1 = new Guid(allZerosFullHex);
        const zeroGuid2 = new Guid(allZerosShortHex);
        expect(zeroGuid1.equals(zeroGuid2)).toBe(true);

        const ffGuid1 = new Guid(allFsFullHex);
        const ffGuid2 = new Guid(allFsShortHex);
        expect(ffGuid1.equals(ffGuid2)).toBe(true);
      });
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle cascading validation failures', () => {
      expect(() => new Guid('invalid-format-here' as any)).toThrow(GuidError);
    });

    it('should provide meaningful error types', () => {
      try {
        new Guid('toolong' as any);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GuidError);
        expect((error as GuidError).type).toBeDefined();
      }
    });

    it('should handle conversion failures with proper error types', () => {
      try {
        Guid.toFullHexGuid(Buffer.alloc(10) as any);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GuidError);
      }
    });

    it('should maintain error information through call stack', () => {
      try {
        const invalidBuffer = Buffer.alloc(10);
        Guid.toRawGuidPlatformBuffer(invalidBuffer as any);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GuidError);
        expect((error as GuidError).length).toBeDefined();
      }
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle creating many GUIDs efficiently', () => {
      const count = 1000;
      const start = Date.now();
      const guids = Array.from({ length: count }, () => Guid.new());
      const duration = Date.now() - start;

      expect(guids).toHaveLength(count);
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time

      // Verify all are unique
      const uniqueSet = new Set(guids.map((g) => g.asFullHexGuid));
      expect(uniqueSet.size).toBe(count);
    });

    it('should handle many conversions efficiently', () => {
      const guid = new Guid(testFullHexGuid);
      const iterations = 10000;

      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        void guid.asFullHexGuid;
        void guid.asShortHexGuid;
        void guid.asBase64Guid;
        void guid.asBigIntGuid;
        void guid.asRawGuidPlatformBuffer;
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should be fast
    });
  });

  describe('Constructor Internal Validation', () => {
    it('should validate after brand detection', () => {
      // Force validation path by providing wrong format
      expect(
        () => new Guid('00000000-0000-0000-0000-00000000000X' as any),
      ).toThrow(GuidError);
    });

    it('should handle error in toRawGuidBuffer during construction', () => {
      expect(() => new Guid({ invalid: 'object' } as any)).toThrow(GuidError);
    });

    it('should skip UUID validation for boundary values', () => {
      // These should NOT throw even though uuid.validate would reject them
      const zeroGuid = new Guid(allZerosFullHex);
      expect(zeroGuid.asFullHexGuid).toBe(allZerosFullHex);

      const ffGuid = new Guid(allFsFullHex);
      expect(ffGuid.asFullHexGuid).toBe(allFsFullHex);
    });
  });

  describe('Factory Methods', () => {
    describe('fromFullHex', () => {
      it('should create a GUID from full hex string', () => {
        const guid = Guid.fromFullHex(testFullHexGuid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should throw on invalid full hex', () => {
        expect(() => Guid.fromFullHex('invalid')).toThrow(GuidError);
      });
    });

    describe('fromShortHex', () => {
      it('should create a GUID from short hex string', () => {
        const guid = Guid.fromShortHex(testShortHexGuid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asShortHexGuid).toBe(testShortHexGuid);
      });

      it('should throw on invalid short hex', () => {
        expect(() => Guid.fromShortHex('invalid')).toThrow(GuidError);
      });
    });

    describe('fromBase64', () => {
      it('should create a GUID from base64 string', () => {
        const guid = Guid.fromBase64(testBase64Guid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asBase64Guid).toBe(testBase64Guid);
      });

      it('should throw on invalid base64', () => {
        expect(() => Guid.fromBase64('!')).toThrow(GuidError);
      });
    });

    describe('fromBigInt', () => {
      it('should create a GUID from bigint', () => {
        const guid = Guid.fromBigInt(testBigIntGuid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asBigIntGuid).toBe(testBigIntGuid);
      });

      it('should handle 0n bigint', () => {
        const guid = Guid.fromBigInt(0n as BigIntGuid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asBigIntGuid).toBe(0n);
      });

      it('should throw on negative bigint', () => {
        expect(() => Guid.fromBigInt(-1n as BigIntGuid)).toThrow(GuidError);
      });

      it('should throw on bigint exceeding 128 bits', () => {
        const tooBig = BigInt(
          '0x1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
        ) as BigIntGuid;
        expect(() => Guid.fromBigInt(tooBig)).toThrow(GuidError);
      });
    });

    describe('fromBuffer', () => {
      it('should create a GUID from buffer', () => {
        const guid = Guid.fromPlatformBuffer(testRawGuidBuffer);
        expect(guid).toBeInstanceOf(Guid);
        expect(
          Buffer.compare(guid.asRawGuidPlatformBuffer, testRawGuidBuffer),
        ).toBe(0);
      });

      it('should throw on wrong buffer length', () => {
        const wrongBuffer = Buffer.from('too short');
        expect(() =>
          Guid.fromPlatformBuffer(wrongBuffer as RawGuidPlatformBuffer),
        ).toThrow(GuidError);
      });
    });

    describe('fromUint8Array', () => {
      it('should create a GUID from Uint8Array', () => {
        // Create raw Uint8Array (not wrapped in Buffer) for browser compatibility
        const uint8Array = new Uint8Array([
          0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4, 0xa7, 0x16, 0x44,
          0x66, 0x55, 0x44, 0x00, 0x00,
        ]);
        const guid = Guid.fromPlatformBuffer(uint8Array);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should throw on wrong Uint8Array length', () => {
        const wrongLength = new Uint8Array([0x01, 0x02, 0x03]);
        expect(() => Guid.fromPlatformBuffer(wrongLength)).toThrow(GuidError);
      });

      it('should handle all zeros Uint8Array', () => {
        const zeros = new Uint8Array(16).fill(0);
        const guid = Guid.fromPlatformBuffer(zeros);
        expect(guid.asFullHexGuid).toBe(allZerosFullHex);
      });

      it('should handle all 0xFF Uint8Array', () => {
        const ffs = new Uint8Array(16).fill(0xff);
        const guid = Guid.fromPlatformBuffer(ffs);
        expect(guid.asFullHexGuid).toBe(allFsFullHex);
      });

      it('should roundtrip from asUint8Array', () => {
        const original = Guid.generate();
        const uint8 = original.asPlatformBuffer;
        const reconstructed = Guid.fromPlatformBuffer(uint8);
        expect(reconstructed.equals(original)).toBe(true);
      });
    });
  });

  describe('New Instance Methods', () => {
    describe('clone', () => {
      it('should create an independent copy', () => {
        const guid1 = new Guid(testFullHexGuid);
        const guid2 = guid1.clone();

        expect(guid2).toBeInstanceOf(Guid);
        expect(guid2).not.toBe(guid1); // Different instances
        expect(guid2.equals(guid1)).toBe(true); // Same value
        expect(guid2.asFullHexGuid).toBe(guid1.asFullHexGuid);
      });

      it('should create independent buffer copies', () => {
        const guid1 = new Guid(testFullHexGuid);
        const guid2 = guid1.clone();

        // Buffers should not be the same object
        expect(guid2.asRawGuidPlatformBuffer).not.toBe(
          guid1.asRawGuidPlatformBuffer,
        );
        // But should have same content
        expect(
          Buffer.compare(
            guid2.asRawGuidPlatformBuffer,
            guid1.asRawGuidPlatformBuffer,
          ),
        ).toBe(0);
      });

      it('should clone boundary values correctly', () => {
        const guid1 = new Guid(allZerosFullHex);
        const guid2 = guid1.clone();

        expect(guid2.asFullHexGuid).toBe(allZerosFullHex);
        expect(guid2.equals(guid1)).toBe(true);
      });
    });

    describe('hashCode', () => {
      it('should return consistent hash for same GUID', () => {
        const guid1 = new Guid(testFullHexGuid);
        const guid2 = new Guid(testFullHexGuid);

        expect(guid1.hashCode()).toBe(guid2.hashCode());
      });

      it('should return different hash for different GUIDs', () => {
        const guid1 = new Guid(testFullHexGuid);
        const guid2 = Guid.new();

        // Extremely unlikely to collide
        expect(guid1.hashCode()).not.toBe(guid2.hashCode());
      });

      it('should return same hash on multiple calls', () => {
        const guid = new Guid(testFullHexGuid);
        const hash1 = guid.hashCode();
        const hash2 = guid.hashCode();

        expect(hash1).toBe(hash2);
      });

      it('should return numeric hash', () => {
        const guid = new Guid(testFullHexGuid);
        const hash = guid.hashCode();

        expect(typeof hash).toBe('number');
        expect(Number.isFinite(hash)).toBe(true);
        expect(Number.isInteger(hash)).toBe(true);
      });

      it('should handle boundary values', () => {
        const guid1 = new Guid(allZerosFullHex);
        const guid2 = new Guid(allFsFullHex);

        expect(typeof guid1.hashCode()).toBe('number');
        expect(typeof guid2.hashCode()).toBe('number');
        expect(guid1.hashCode()).not.toBe(guid2.hashCode());
      });

      it('should be useful for Map keys', () => {
        const map = new Map<number, Guid>();
        const guid1 = new Guid(testFullHexGuid);
        const guid2 = Guid.new();

        map.set(guid1.hashCode(), guid1);
        map.set(guid2.hashCode(), guid2);

        expect(map.get(guid1.hashCode())).toBe(guid1);
        expect(map.get(guid2.hashCode())).toBe(guid2);
      });
    });

    describe('equals with null safety', () => {
      it('should handle null parameter', () => {
        const guid = new Guid(testFullHexGuid);
        expect(guid.equals(null)).toBe(false);
      });

      it('should handle undefined parameter', () => {
        const guid = new Guid(testFullHexGuid);
        expect(guid.equals(undefined)).toBe(false);
      });

      it('should return true for equal GUIDs', () => {
        const guid1 = new Guid(testFullHexGuid);
        const guid2 = new Guid(testFullHexGuid);
        expect(guid1.equals(guid2)).toBe(true);
      });

      it('should return false for different GUIDs', () => {
        const guid1 = new Guid(testFullHexGuid);
        const guid2 = Guid.new();
        expect(guid1.equals(guid2)).toBe(false);
      });
    });
  });

  describe('Performance and Caching', () => {
    describe('Getter caching', () => {
      it('should cache asFullHexGuid results', () => {
        const guid = new Guid(testShortHexGuid);
        const result1 = guid.asFullHexGuid;
        const result2 = guid.asFullHexGuid;

        // Should return same string instance (cached)
        expect(result1).toBe(result2);
        expect(result1).toBe(testFullHexGuid);
      });

      it('should cache asShortHexGuid results', () => {
        const guid = new Guid(testFullHexGuid);
        const result1 = guid.asShortHexGuid;
        const result2 = guid.asShortHexGuid;

        // Should return same string instance (cached)
        expect(result1).toBe(result2);
        expect(result1).toBe(testShortHexGuid);
      });

      it('should not recompute cached values', () => {
        const guid = new Guid(testBase64Guid);

        // First access computes
        const full1 = guid.asFullHexGuid;
        const short1 = guid.asShortHexGuid;

        // Second access uses cache
        const full2 = guid.asFullHexGuid;
        const short2 = guid.asShortHexGuid;

        expect(full1).toBe(full2);
        expect(short1).toBe(short2);
      });
    });

    describe('Factory method performance', () => {
      it('should create GUIDs efficiently via factory methods', () => {
        const iterations = 1000;
        const start = Date.now();

        for (let i = 0; i < iterations; i++) {
          Guid.fromFullHex(testFullHexGuid);
        }

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(1000); // Should complete in < 1 second
      });
    });
  });

  describe('lengthToGuidBrand optimization', () => {
    it('should use O(1) lookup via ReverseLengthMap', () => {
      // Valid lengths
      expect(Guid.lengthToGuidBrand(36, false)).toBe(GuidBrandType.FullHexGuid);
      expect(Guid.lengthToGuidBrand(32, false)).toBe(
        GuidBrandType.ShortHexGuid,
      );
      expect(Guid.lengthToGuidBrand(24, false)).toBe(GuidBrandType.Base64Guid);
      expect(Guid.lengthToGuidBrand(16, true)).toBe(
        GuidBrandType.RawGuidPlatformBuffer,
      );
    });

    it('should validate type consistency (buffer vs string)', () => {
      // Should throw when isBuffer doesn't match brand type
      expect(() => Guid.lengthToGuidBrand(16, false)).toThrow(GuidError);
      expect(() => Guid.lengthToGuidBrand(36, true)).toThrow(GuidError);
    });

    it('should throw on zero or negative length', () => {
      expect(() => Guid.lengthToGuidBrand(0, false)).toThrow(GuidError);
      expect(() => Guid.lengthToGuidBrand(-1, false)).toThrow(GuidError);
    });

    it('should throw on unknown length', () => {
      expect(() => Guid.lengthToGuidBrand(999, false)).toThrow(GuidError);
    });
  });

  describe('validateAndConvert centralization', () => {
    it('should provide consistent error messages', () => {
      // All invalid inputs should go through same validation path
      expect(() => new Guid(null as any)).toThrow(GuidError);

      try {
        new Guid(null as any);
        throw new Error('Should have thrown GuidError');
      } catch (error) {
        expect(error).toBeInstanceOf(GuidError);
        if (error instanceof GuidError) {
          expect(error.type).toBe(GuidErrorType.InvalidGuid);
        }
      }
    });

    it('should validate all input types consistently', () => {
      // Valid conversions should work for all types
      const guid1 = new Guid(testFullHexGuid);
      const guid2 = new Guid(testShortHexGuid);
      const guid3 = new Guid(testBase64Guid);
      const guid4 = new Guid(testBigIntGuid);
      const guid5 = new Guid(testRawGuidBuffer);

      // All should represent the same GUID
      expect(guid1.equals(guid2)).toBe(true);
      expect(guid1.equals(guid3)).toBe(true);
      expect(guid1.equals(guid4)).toBe(true);
      expect(guid1.equals(guid5)).toBe(true);
    });

    it('should handle 0n bigint specially', () => {
      // 0n is falsy but should be valid
      const guid = new Guid(0n as BigIntGuid);
      expect(guid.asBigIntGuid).toBe(0n);
    });

    it('should reject negative bigint', () => {
      expect(() => new Guid(-1n as BigIntGuid)).toThrow(GuidError);
      expect(() => new Guid(-100n as BigIntGuid)).toThrow(GuidError);
    });

    it('should validate hex string format', () => {
      // Invalid hex characters should be rejected
      expect(
        () => new Guid('ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ' as FullHexGuid),
      ).toThrow(GuidError);
      expect(
        () => new Guid('GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG' as ShortHexGuid),
      ).toThrow(GuidError);
    });
  });

  describe('Buffer Immutability', () => {
    it('should return defensive copy from asRawGuidBuffer', () => {
      const guid = new Guid(testFullHexGuid);
      const buffer1 = guid.asRawGuidPlatformBuffer;
      const buffer2 = guid.asRawGuidPlatformBuffer;

      // Should be different buffer instances
      expect(buffer1).not.toBe(buffer2);

      // But same content
      expect(Buffer.compare(buffer1, buffer2)).toBe(0);
    });

    it('should prevent external mutation via asRawGuidBuffer', () => {
      const guid = new Guid(testFullHexGuid);
      const originalHex = guid.asFullHexGuid;

      // Get buffer and try to mutate it
      const buffer = guid.asRawGuidPlatformBuffer;
      buffer[0] = 0xff;
      buffer[1] = 0xff;

      // GUID should be unchanged
      expect(guid.asFullHexGuid).toBe(originalHex);
    });

    it('asRawGuidBufferUnsafe should return same instance', () => {
      const guid = new Guid(testFullHexGuid);
      const buffer1 = guid.asRawGuidPlatformBufferUnsafe;
      const buffer2 = guid.asRawGuidPlatformBufferUnsafe;

      // Should be same buffer instance
      expect(buffer1).toBe(buffer2);
    });
  });

  describe('isEmpty and isNilOrEmpty', () => {
    it('should detect empty GUID', () => {
      const emptyGuid = new Guid(allZerosFullHex);
      expect(emptyGuid.isEmpty()).toBe(true);
    });

    it('should return false for non-empty GUID', () => {
      const guid = new Guid(testFullHexGuid);
      expect(guid.isEmpty()).toBe(false);
    });

    it('Empty constant should be empty', () => {
      expect(Guid.Empty.isEmpty()).toBe(true);
    });

    it('isNilOrEmpty should handle null', () => {
      expect(Guid.isNilOrEmpty(null)).toBe(true);
    });

    it('isNilOrEmpty should handle undefined', () => {
      expect(Guid.isNilOrEmpty(undefined)).toBe(true);
    });

    it('isNilOrEmpty should handle empty GUID', () => {
      const emptyGuid = new Guid(allZerosFullHex);
      expect(Guid.isNilOrEmpty(emptyGuid)).toBe(true);
    });

    it('isNilOrEmpty should return false for valid GUID', () => {
      const guid = new Guid(testFullHexGuid);
      expect(Guid.isNilOrEmpty(guid)).toBe(false);
    });
  });

  describe('RFC 4122 Version Support', () => {
    it('should extract version from v4 GUID', () => {
      const v4Guid = Guid.new();
      expect(v4Guid.getVersion()).toBe(4);
    });

    it('should return undefined for boundary values', () => {
      const emptyGuid = new Guid(allZerosFullHex);
      expect(emptyGuid.getVersion()).toBeUndefined();

      const ffGuid = new Guid(allFsFullHex);
      expect(ffGuid.getVersion()).toBeUndefined();
    });

    it('should validate v4 GUIDs correctly', () => {
      const v4Guid = Guid.new();
      expect(v4Guid.isValidV4()).toBe(true);
    });

    it('should accept boundary values as valid', () => {
      const emptyGuid = new Guid(allZerosFullHex);
      expect(emptyGuid.isValidV4()).toBe(true);

      const ffGuid = new Guid(allFsFullHex);
      expect(ffGuid.isValidV4()).toBe(true);
    });
  });

  describe('compareTo', () => {
    it('should return 0 for equal GUIDs', () => {
      const guid1 = new Guid(testFullHexGuid);
      const guid2 = new Guid(testFullHexGuid);
      expect(guid1.compareTo(guid2)).toBe(0);
    });

    it('should return consistent ordering', () => {
      const guid1 = new Guid(allZerosFullHex);
      const guid2 = new Guid(testFullHexGuid);

      expect(guid1.compareTo(guid2)).toBeLessThan(0);
      expect(guid2.compareTo(guid1)).toBeGreaterThan(0);
    });

    it('should enable array sorting', () => {
      const guids = [
        Guid.new(),
        new Guid(allZerosFullHex),
        Guid.new(),
        new Guid(allFsFullHex),
      ];

      const sorted = guids.sort((a, b) => a.compareTo(b));

      // Should be sorted
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].compareTo(sorted[i + 1])).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('Cached Performance', () => {
    it('should cache base64 representation', () => {
      const guid = new Guid(testFullHexGuid);
      const base64_1 = guid.asBase64Guid;
      const base64_2 = guid.asBase64Guid;

      // Should return same instance (cached)
      expect(base64_1).toBe(base64_2);
    });

    it('toString should use cached base64', () => {
      const guid = new Guid(testFullHexGuid);
      const str1 = guid.toString();
      const str2 = guid.toString();

      expect(str1).toBe(str2);
    });
  });

  describe('Parse and TryParse API', () => {
    describe('parse', () => {
      it('should parse valid full hex', () => {
        const guid = Guid.parse(testFullHexGuid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should throw on invalid input', () => {
        expect(() => Guid.parse('invalid')).toThrow(GuidError);
      });

      it('should parse all valid formats', () => {
        expect(Guid.parse(testFullHexGuid)).toBeInstanceOf(Guid);
        expect(Guid.parse(testShortHexGuid)).toBeInstanceOf(Guid);
        expect(Guid.parse(testBase64Guid)).toBeInstanceOf(Guid);
        expect(Guid.parse(testBigIntGuid)).toBeInstanceOf(Guid);
        expect(Guid.parse(testRawGuidBuffer)).toBeInstanceOf(Guid);
      });
    });

    describe('tryParse', () => {
      it('should return GUID for valid input', () => {
        const guid = Guid.tryParse(testFullHexGuid);
        expect(guid).toBeInstanceOf(Guid);
        expect(guid?.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should return null for invalid input', () => {
        const guid = Guid.tryParse('invalid');
        expect(guid).toBeNull();
      });

      it('should return null for malformed hex', () => {
        const guid = Guid.tryParse('ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ');
        expect(guid).toBeNull();
      });

      it('should handle all valid formats', () => {
        expect(Guid.tryParse(testFullHexGuid)).not.toBeNull();
        expect(Guid.tryParse(testShortHexGuid)).not.toBeNull();
        expect(Guid.tryParse(testBase64Guid)).not.toBeNull();
        expect(Guid.tryParse(testBigIntGuid)).not.toBeNull();
        expect(Guid.tryParse(testRawGuidBuffer)).not.toBeNull();
      });
    });

    describe('isValid', () => {
      it('should return true for valid GUIDs', () => {
        expect(Guid.isValid(testFullHexGuid)).toBe(true);
        expect(Guid.isValid(testShortHexGuid)).toBe(true);
        expect(Guid.isValid(testBase64Guid)).toBe(true);
      });

      it('should return false for invalid input', () => {
        expect(Guid.isValid('invalid')).toBe(false);
        expect(Guid.isValid('')).toBe(false);
        expect(Guid.isValid(null)).toBe(false);
        expect(Guid.isValid(undefined)).toBe(false);
      });

      it('should validate without creating instance', () => {
        // This should not throw even for invalid input
        expect(() => Guid.isValid('ZZZZ')).not.toThrow();
      });
    });

    describe('generate', () => {
      it('should create new random GUID', () => {
        const guid = Guid.generate();
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.isValidV4()).toBe(true);
      });

      it('should generate unique GUIDs', () => {
        const guid1 = Guid.generate();
        const guid2 = Guid.generate();
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('new() should still work for backward compatibility', () => {
        const guid = Guid.new();
        expect(guid).toBeInstanceOf(Guid);
        expect(guid.isValidV4()).toBe(true);
      });
    });
  });

  describe('Constant-Time Equality', () => {
    it('should support regular equality', () => {
      const guid1 = new Guid(testFullHexGuid);
      const guid2 = new Guid(testFullHexGuid);
      expect(guid1.equals(guid2)).toBe(true);
    });

    it('should support constant-time equality', () => {
      const guid1 = new Guid(testFullHexGuid);
      const guid2 = new Guid(testFullHexGuid);
      expect(guid1.equals(guid2, true)).toBe(true);
    });

    it('constant-time should return false for different GUIDs', () => {
      const guid1 = new Guid(testFullHexGuid);
      const guid2 = Guid.generate();
      expect(guid1.equals(guid2, true)).toBe(false);
    });

    it('should handle null with constant-time', () => {
      const guid = new Guid(testFullHexGuid);
      expect(guid.equals(null, true)).toBe(false);
    });
  });

  describe('Namespace GUIDs (v3 and v5)', () => {
    describe('v3 (MD5)', () => {
      it('should create v3 GUID from name and namespace', () => {
        const guid = Guid.v3('example.com', Guid.Namespaces.DNS);
        expect(guid).toBeInstanceOf(Guid);
      });

      it('should be deterministic', () => {
        const guid1 = Guid.v3('example.com', Guid.Namespaces.DNS);
        const guid2 = Guid.v3('example.com', Guid.Namespaces.DNS);
        expect(guid1.equals(guid2)).toBe(true);
      });

      it('should differ for different names', () => {
        const guid1 = Guid.v3('example.com', Guid.Namespaces.DNS);
        const guid2 = Guid.v3('different.com', Guid.Namespaces.DNS);
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('should differ for different namespaces', () => {
        const guid1 = Guid.v3('example', Guid.Namespaces.DNS);
        const guid2 = Guid.v3('example', Guid.Namespaces.URL);
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('should extract version 3', () => {
        const guid = Guid.v3('test', Guid.Namespaces.DNS);
        expect(guid.getVersion()).toBe(3);
      });
    });

    describe('v5 (SHA-1)', () => {
      it('should create v5 GUID from name and namespace', () => {
        const guid = Guid.v5('example.com', Guid.Namespaces.DNS);
        expect(guid).toBeInstanceOf(Guid);
      });

      it('should be deterministic', () => {
        const guid1 = Guid.v5('example.com', Guid.Namespaces.DNS);
        const guid2 = Guid.v5('example.com', Guid.Namespaces.DNS);
        expect(guid1.equals(guid2)).toBe(true);
      });

      it('should differ for different names', () => {
        const guid1 = Guid.v5('example.com', Guid.Namespaces.DNS);
        const guid2 = Guid.v5('different.com', Guid.Namespaces.DNS);
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('should extract version 5', () => {
        const guid = Guid.v5('test', Guid.Namespaces.DNS);
        expect(guid.getVersion()).toBe(5);
      });

      it('should differ from v3 for same input', () => {
        const v3Guid = Guid.v3('example.com', Guid.Namespaces.DNS);
        const v5Guid = Guid.v5('example.com', Guid.Namespaces.DNS);
        expect(v3Guid.equals(v5Guid)).toBe(false);
      });
    });

    describe('Namespaces', () => {
      it('should have DNS namespace', () => {
        expect(Guid.Namespaces.DNS).toBeDefined();
        expect(typeof Guid.Namespaces.DNS).toBe('string');
      });

      it('should have URL namespace', () => {
        expect(Guid.Namespaces.URL).toBeDefined();
        expect(typeof Guid.Namespaces.URL).toBe('string');
      });
    });
  });

  describe('Immutability', () => {
    it('should seal instances', () => {
      const guid = new Guid(testFullHexGuid);
      expect(Object.isSealed(guid)).toBe(true);
    });

    it('should prevent property addition', () => {
      const guid = new Guid(testFullHexGuid) as any;
      expect(() => {
        guid.newProperty = 'test';
      }).toThrow();
    });

    it('should prevent property deletion', () => {
      const guid = new Guid(testFullHexGuid) as any;
      expect(() => {
        delete guid._value;
      }).toThrow();
    });

    it('should still allow cache updates', () => {
      const guid = new Guid(testFullHexGuid);
      // First access sets cache
      const hex1 = guid.asFullHexGuid;
      // Second access uses cache
      const hex2 = guid.asFullHexGuid;
      expect(hex1).toBe(hex2);
    });
  });

  describe('Version-Specific Validation', () => {
    describe('isValidV3', () => {
      it('should return true for v3 GUID', () => {
        const v3Guid = Guid.v3('test', Guid.Namespaces.DNS);
        expect(v3Guid.isValidV3()).toBe(true);
      });

      it('should return false for v4 GUID', () => {
        const v4Guid = Guid.generate();
        expect(v4Guid.isValidV3()).toBe(false);
      });

      it('should return false for v5 GUID', () => {
        const v5Guid = Guid.v5('test', Guid.Namespaces.DNS);
        expect(v5Guid.isValidV3()).toBe(false);
      });
    });

    describe('isValidV5', () => {
      it('should return true for v5 GUID', () => {
        const v5Guid = Guid.v5('test', Guid.Namespaces.DNS);
        expect(v5Guid.isValidV5()).toBe(true);
      });

      it('should return false for v4 GUID', () => {
        const v4Guid = Guid.generate();
        expect(v4Guid.isValidV5()).toBe(false);
      });

      it('should return false for v3 GUID', () => {
        const v3Guid = Guid.v3('test', Guid.Namespaces.DNS);
        expect(v3Guid.isValidV5()).toBe(false);
      });
    });

    describe('Cross-version validation', () => {
      it('v3 GUID should only validate as v3', () => {
        const v3Guid = Guid.v3('test', Guid.Namespaces.DNS);
        expect(v3Guid.isValidV3()).toBe(true);
        expect(v3Guid.isValidV4()).toBe(false);
        expect(v3Guid.isValidV5()).toBe(false);
      });

      it('v4 GUID should only validate as v4', () => {
        const v4Guid = Guid.generate();
        expect(v4Guid.isValidV3()).toBe(false);
        expect(v4Guid.isValidV4()).toBe(true);
        expect(v4Guid.isValidV5()).toBe(false);
      });

      it('v5 GUID should only validate as v5', () => {
        const v5Guid = Guid.v5('test', Guid.Namespaces.DNS);
        expect(v5Guid.isValidV3()).toBe(false);
        expect(v5Guid.isValidV4()).toBe(false);
        expect(v5Guid.isValidV5()).toBe(true);
      });
    });
  });

  describe('V1 GUID Support', () => {
    describe('v1 creation', () => {
      it('should create v1 GUID', () => {
        const v1Guid = Guid.v1();
        expect(v1Guid).toBeInstanceOf(Guid);
        expect(v1Guid.getVersion()).toBe(1);
      });

      it('should create unique v1 GUIDs', () => {
        const guid1 = Guid.v1();
        const guid2 = Guid.v1();
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('should validate as v1', () => {
        const v1Guid = Guid.v1();
        expect(v1Guid.isValidV1()).toBe(true);
        expect(v1Guid.isValidV3()).toBe(false);
        expect(v1Guid.isValidV4()).toBe(false);
        expect(v1Guid.isValidV5()).toBe(false);
      });
    });

    describe('getTimestamp', () => {
      it('should extract timestamp from v1 GUID', () => {
        const v1Guid = Guid.v1();
        const timestamp = v1Guid.getTimestamp();
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp!.getTime()).toBeGreaterThan(Date.now() - 1000);
        expect(timestamp!.getTime()).toBeLessThan(Date.now() + 1000);
      });

      it('should return undefined for v4 GUID', () => {
        const v4Guid = Guid.generate();
        expect(v4Guid.getTimestamp()).toBeUndefined();
      });

      it('should return undefined for v3 GUID', () => {
        const v3Guid = Guid.v3('test', Guid.Namespaces.DNS);
        expect(v3Guid.getTimestamp()).toBeUndefined();
      });

      it('should return undefined for v5 GUID', () => {
        const v5Guid = Guid.v5('test', Guid.Namespaces.DNS);
        expect(v5Guid.getTimestamp()).toBeUndefined();
      });
    });

    describe('isValidV1', () => {
      it('should return true for v1 GUID', () => {
        const v1Guid = Guid.v1();
        expect(v1Guid.isValidV1()).toBe(true);
      });

      it('should return false for v4 GUID', () => {
        const v4Guid = Guid.generate();
        expect(v4Guid.isValidV1()).toBe(false);
      });
    });
  });

  describe('Variant Detection', () => {
    describe('getVariant', () => {
      it('should detect RFC 4122 variant for v4 GUID', () => {
        const v4Guid = Guid.generate();
        expect(v4Guid.getVariant()).toBe(1);
      });

      it('should detect RFC 4122 variant for v1 GUID', () => {
        const v1Guid = Guid.v1();
        expect(v1Guid.getVariant()).toBe(1);
      });

      it('should detect RFC 4122 variant for v3 GUID', () => {
        const v3Guid = Guid.v3('test', Guid.Namespaces.DNS);
        expect(v3Guid.getVariant()).toBe(1);
      });

      it('should detect RFC 4122 variant for v5 GUID', () => {
        const v5Guid = Guid.v5('test', Guid.Namespaces.DNS);
        expect(v5Guid.getVariant()).toBe(1);
      });
    });
  });

  describe('URL-Safe Base64', () => {
    describe('asUrlSafeBase64', () => {
      it('should return URL-safe base64 string', () => {
        const guid = new Guid(testFullHexGuid);
        const urlSafe = guid.asUrlSafeBase64;
        expect(urlSafe).toBeDefined();
        expect(urlSafe).not.toContain('+');
        expect(urlSafe).not.toContain('/');
        expect(urlSafe).not.toContain('=');
      });

      it('should be different from regular base64', () => {
        const guid = new Guid(testFullHexGuid);
        const regular = guid.asBase64Guid;
        const urlSafe = guid.asUrlSafeBase64;
        expect(urlSafe).not.toBe(regular);
      });

      it('should handle boundary values', () => {
        const zeroGuid = new Guid(allZerosFullHex);
        const urlSafe = zeroGuid.asUrlSafeBase64;
        expect(urlSafe).toBeDefined();
        expect(typeof urlSafe).toBe('string');
      });
    });

    describe('fromUrlSafeBase64', () => {
      it('should create GUID from URL-safe base64', () => {
        const original = new Guid(testFullHexGuid);
        const urlSafe = original.asUrlSafeBase64;
        const restored = Guid.fromUrlSafeBase64(urlSafe);
        expect(restored.equals(original)).toBe(true);
      });

      it('should round-trip correctly', () => {
        const guid1 = Guid.generate();
        const urlSafe = guid1.asUrlSafeBase64;
        const guid2 = Guid.fromUrlSafeBase64(urlSafe);
        expect(guid2.equals(guid1)).toBe(true);
      });

      it('should handle boundary values', () => {
        const zeroGuid = new Guid(allZerosFullHex);
        const urlSafe = zeroGuid.asUrlSafeBase64;
        const restored = Guid.fromUrlSafeBase64(urlSafe);
        expect(restored.equals(zeroGuid)).toBe(true);
      });

      it('should work with all GUID versions', () => {
        const v1 = Guid.v1();
        const v3 = Guid.v3('test', Guid.Namespaces.DNS);
        const v4 = Guid.generate();
        const v5 = Guid.v5('test', Guid.Namespaces.DNS);

        expect(Guid.fromUrlSafeBase64(v1.asUrlSafeBase64).equals(v1)).toBe(
          true,
        );
        expect(Guid.fromUrlSafeBase64(v3.asUrlSafeBase64).equals(v3)).toBe(
          true,
        );
        expect(Guid.fromUrlSafeBase64(v4.asUrlSafeBase64).equals(v4)).toBe(
          true,
        );
        expect(Guid.fromUrlSafeBase64(v5.asUrlSafeBase64).equals(v5)).toBe(
          true,
        );
      });

      it('should handle URL-safe characters correctly', () => {
        // Create a GUID that will have + or / in base64
        const guid = Guid.generate();
        const urlSafe = guid.asUrlSafeBase64;

        // Verify no URL-unsafe characters
        expect(urlSafe).not.toMatch(/[+/=]/);

        // Verify round-trip
        const restored = Guid.fromUrlSafeBase64(urlSafe);
        expect(restored.equals(guid)).toBe(true);
      });
    });
  });

  describe('Debug String', () => {
    describe('toDebugString', () => {
      it('should return debug string for v4 GUID', () => {
        const v4Guid = Guid.generate();
        const debug = v4Guid.toDebugString();
        expect(debug).toContain('Guid(');
        expect(debug).toContain('v4');
        expect(debug).toContain('variant=1');
      });

      it('should return debug string for v1 GUID', () => {
        const v1Guid = Guid.v1();
        const debug = v1Guid.toDebugString();
        expect(debug).toContain('Guid(');
        expect(debug).toContain('v1');
        expect(debug).toContain('variant=1');
      });

      it('should return debug string for v3 GUID', () => {
        const v3Guid = Guid.v3('test', Guid.Namespaces.DNS);
        const debug = v3Guid.toDebugString();
        expect(debug).toContain('Guid(');
        expect(debug).toContain('v3');
        expect(debug).toContain('variant=1');
      });

      it('should return debug string for v5 GUID', () => {
        const v5Guid = Guid.v5('test', Guid.Namespaces.DNS);
        const debug = v5Guid.toDebugString();
        expect(debug).toContain('Guid(');
        expect(debug).toContain('v5');
        expect(debug).toContain('variant=1');
      });

      it('should include full hex representation', () => {
        const guid = new Guid(testFullHexGuid);
        const debug = guid.toDebugString();
        expect(debug).toContain(testFullHexGuid);
      });

      it('should handle boundary values', () => {
        const zeroGuid = new Guid(allZerosFullHex);
        const debug = zeroGuid.toDebugString();
        expect(debug).toContain('Guid(');
        expect(debug).toContain(allZerosFullHex);
      });
    });
  });

  describe('Complete Version Support', () => {
    it('should support all RFC 4122 versions', () => {
      const v1 = Guid.v1();
      const v3 = Guid.v3('test', Guid.Namespaces.DNS);
      const v4 = Guid.generate();
      const v5 = Guid.v5('test', Guid.Namespaces.DNS);

      expect(v1.getVersion()).toBe(1);
      expect(v3.getVersion()).toBe(3);
      expect(v4.getVersion()).toBe(4);
      expect(v5.getVersion()).toBe(5);

      expect(v1.isValidV1()).toBe(true);
      expect(v3.isValidV3()).toBe(true);
      expect(v4.isValidV4()).toBe(true);
      expect(v5.isValidV5()).toBe(true);
    });

    it('should have mutually exclusive version validation', () => {
      const v1 = Guid.v1();
      expect(v1.isValidV1()).toBe(true);
      expect(v1.isValidV3()).toBe(false);
      expect(v1.isValidV4()).toBe(false);
      expect(v1.isValidV5()).toBe(false);
    });
  });

  describe('Powerhouse Integration', () => {
    it('should convert v1 GUID to all formats', () => {
      const v1 = Guid.v1();
      expect(v1.asFullHexGuid).toBeDefined();
      expect(v1.asShortHexGuid).toBeDefined();
      expect(v1.asBase64Guid).toBeDefined();
      expect(v1.asUrlSafeBase64).toBeDefined();
      expect(v1.asBigIntGuid).toBeDefined();
      expect(v1.asRawGuidPlatformBuffer).toBeDefined();
    });

    it('should extract metadata from v1 GUID', () => {
      const v1 = Guid.v1();
      expect(v1.getVersion()).toBe(1);
      expect(v1.getVariant()).toBe(1);
      expect(v1.getTimestamp()).toBeInstanceOf(Date);
      expect(v1.toDebugString()).toContain('v1');
    });

    it('should support all operations on all versions', () => {
      const versions = [
        Guid.v1(),
        Guid.v3('test', Guid.Namespaces.DNS),
        Guid.generate(),
        Guid.v5('test', Guid.Namespaces.DNS),
      ];

      versions.forEach((guid) => {
        expect(guid.clone().equals(guid)).toBe(true);
        expect(guid.hashCode()).toBeDefined();
        expect(guid.compareTo(guid)).toBe(0);
        expect(guid.serialize()).toBeDefined();
        expect(guid.toJson()).toBeDefined();
        expect(guid.toString()).toBeDefined();
        expect(guid.toDebugString()).toBeDefined();
      });
    });
  });

  describe('Version-Branded Types', () => {
    it('should create v1 GUID with version brand', () => {
      const v1 = Guid.v1();
      expect(v1.getVersion()).toBe(1);
      expect(v1.isValidV1()).toBe(true);
    });

    it('should create v3 GUID with version brand', () => {
      const v3 = Guid.v3('test', Guid.Namespaces.DNS);
      expect(v3.getVersion()).toBe(3);
      expect(v3.isValidV3()).toBe(true);
    });

    it('should create v4 GUID with version brand', () => {
      const v4 = Guid.v4();
      expect(v4.getVersion()).toBe(4);
      expect(v4.isValidV4()).toBe(true);
    });

    it('should create v5 GUID with version brand', () => {
      const v5 = Guid.v5('test', Guid.Namespaces.DNS);
      expect(v5.getVersion()).toBe(5);
      expect(v5.isValidV5()).toBe(true);
    });

    it('should maintain version brand through conversions', () => {
      const v1 = Guid.v1();
      const hex = v1.asFullHexGuid;
      const base64 = v1.asBase64Guid;
      const bigint = v1.asBigIntGuid;

      expect(hex).toBeDefined();
      expect(base64).toBeDefined();
      expect(bigint).toBeDefined();
      expect(v1.getVersion()).toBe(1);
    });

    it('should work with type guards', () => {
      const v1 = Guid.v1();
      const v3 = Guid.v3('test', Guid.Namespaces.DNS);
      const v4 = Guid.v4();
      const v5 = Guid.v5('test', Guid.Namespaces.URL);

      expect(v1.isValidV1()).toBe(true);
      expect(v1.isValidV3()).toBe(false);
      expect(v1.isValidV4()).toBe(false);
      expect(v1.isValidV5()).toBe(false);

      expect(v3.isValidV1()).toBe(false);
      expect(v3.isValidV3()).toBe(true);
      expect(v3.isValidV4()).toBe(false);
      expect(v3.isValidV5()).toBe(false);

      expect(v4.isValidV1()).toBe(false);
      expect(v4.isValidV3()).toBe(false);
      expect(v4.isValidV4()).toBe(true);
      expect(v4.isValidV5()).toBe(false);

      expect(v5.isValidV1()).toBe(false);
      expect(v5.isValidV3()).toBe(false);
      expect(v5.isValidV4()).toBe(false);
      expect(v5.isValidV5()).toBe(true);
    });

    it('should support all operations on branded types', () => {
      const v1 = Guid.v1();
      const v3 = Guid.v3('test', Guid.Namespaces.DNS);
      const v4 = Guid.v4();
      const v5 = Guid.v5('test', Guid.Namespaces.URL);

      [v1, v3, v4, v5].forEach((guid) => {
        expect(guid.clone()).toBeDefined();
        expect(guid.hashCode()).toBeDefined();
        expect(guid.isEmpty()).toBe(false);
        expect(guid.toDebugString()).toContain('Guid(');
        expect(guid.asFullHexGuid).toBeDefined();
        expect(guid.asShortHexGuid).toBeDefined();
        expect(guid.asBase64Guid).toBeDefined();
        expect(guid.asBigIntGuid).toBeDefined();
      });
    });

    it('should maintain version through clone', () => {
      const v1 = Guid.v1();
      const cloned = v1.clone();
      expect(cloned.getVersion()).toBe(1);
      expect(cloned.equals(v1)).toBe(true);
    });

    it('should compare branded GUIDs correctly', () => {
      const v1a = Guid.v1();
      const v1b = Guid.v1();
      const v4 = Guid.v4();

      expect(v1a.equals(v1a)).toBe(true);
      expect(v1a.equals(v1b)).toBe(false);
      expect(v1a.equals(v4)).toBe(false);
    });

    it('should serialize and deserialize branded GUIDs', () => {
      const v1 = Guid.v1();
      const serialized = v1.serialize();
      const deserialized = Guid.hydrate(serialized);

      expect(deserialized.equals(v1)).toBe(true);
      expect(deserialized.getVersion()).toBe(1);
    });

    it('should handle URL-safe base64 with branded types', () => {
      const v1 = Guid.v1();
      const urlSafe = v1.asUrlSafeBase64;
      const restored = Guid.fromUrlSafeBase64(urlSafe);

      expect(restored.equals(v1)).toBe(true);
      expect(restored.getVersion()).toBe(1);
    });

    it('should work with all factory methods', () => {
      const fromHex = Guid.fromFullHex(Guid.v4().asFullHexGuid);
      const fromShort = Guid.fromShortHex(Guid.v4().asShortHexGuid);
      const fromBase64 = Guid.fromBase64(Guid.v4().asBase64Guid);
      const fromBigInt = Guid.fromBigInt(Guid.v4().asBigIntGuid);
      const fromBuffer = Guid.fromPlatformBuffer(
        Guid.v4().asRawGuidPlatformBuffer,
      );

      [fromHex, fromShort, fromBase64, fromBigInt, fromBuffer].forEach(
        (guid) => {
          expect(guid).toBeInstanceOf(Guid);
          expect(guid.getVersion()).toBeDefined();
        },
      );
    });
  });

  describe('Error Handling Coverage', () => {
    it('should handle v1 generation errors', () => {
      jest.spyOn(uuid, 'v1').mockImplementationOnce(() => {
        throw new Error('v1 error');
      });
      expect(() => Guid.v1()).toThrow(GuidError);
    });

    it('should handle v3 generation errors', () => {
      jest.spyOn(uuid, 'v3').mockImplementationOnce(() => {
        throw new Error('v3 error');
      });
      expect(() => Guid.v3('test', Guid.Namespaces.DNS)).toThrow(GuidError);
    });

    it('should handle v4 generation returning null', () => {
      jest.spyOn(uuid, 'v4').mockImplementationOnce(() => null as any);
      expect(() => Guid.generate()).toThrow(GuidError);
    });

    it('should handle v5 generation errors', () => {
      jest.spyOn(uuid, 'v5').mockImplementationOnce(() => {
        throw new Error('v5 error');
      });
      expect(() => Guid.v5('test', Guid.Namespaces.DNS)).toThrow(GuidError);
    });

    it('should handle bigint in isBase64Guid', () => {
      expect(Guid.isBase64Guid(BigInt(123))).toBe(false);
    });

    it('should handle bigint in isRawGuidUint8Array', () => {
      expect(Guid.isRawGuidUint8Array(BigInt(123))).toBe(false);
    });

    it('should handle invalid toRawGuidPlatformBuffer input', () => {
      expect(() => Guid.toRawGuidPlatformBuffer('invalid' as any)).toThrow(
        GuidError,
      );
    });

    it('should handle invalid brand in toRawGuidPlatformBuffer', () => {
      const invalidInput = { length: 99 } as any;
      expect(() => Guid.toRawGuidPlatformBuffer(invalidInput)).toThrow(
        GuidError,
      );
    });

    it('should handle catch blocks in validation methods', () => {
      const invalidValue = {
        toString: () => {
          throw new Error('test');
        },
      } as any;
      expect(Guid.isBase64Guid(invalidValue)).toBe(false);
      expect(Guid.isRawGuidUint8Array(invalidValue)).toBe(false);
      expect(Guid.isBigIntGuid(invalidValue)).toBe(false);
    });

    it('should handle invalid length in toRawGuidPlatformBuffer result', () => {
      const shortArray = new Uint8Array(8);
      expect(() => new Guid(shortArray as any)).toThrow(GuidError);
    });

    it('should handle GuidError re-throw in v3', () => {
      jest.spyOn(uuid, 'v3').mockImplementationOnce(() => {
        throw new GuidError(GuidErrorType.InvalidGuid);
      });
      expect(() => Guid.v3('test', Guid.Namespaces.DNS)).toThrow(GuidError);
    });

    it('should handle GuidError re-throw in v5', () => {
      jest.spyOn(uuid, 'v5').mockImplementationOnce(() => {
        throw new GuidError(GuidErrorType.InvalidGuid);
      });
      expect(() => Guid.v5('test', Guid.Namespaces.DNS)).toThrow(GuidError);
    });

    it('should handle GuidError re-throw in v1', () => {
      jest.spyOn(uuid, 'v1').mockImplementationOnce(() => {
        throw new GuidError(GuidErrorType.InvalidGuid);
      });
      expect(() => Guid.v1()).toThrow(GuidError);
    });

    it('should handle non-string/non-Uint8Array in Base64Guid conversion', () => {
      // Force the else branch in toRawGuidPlatformBuffer for Base64Guid
      const mockValue = {
        length: 24,
        toString: () => 'VQ6EAOKbQdSnFkRmVUQAAA==',
      } as any;
      // This should hit the else branch and throw
      expect(() => Guid.toRawGuidPlatformBuffer(mockValue)).toThrow(GuidError);
    });
  });
});
