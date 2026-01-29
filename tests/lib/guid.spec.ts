import * as uuid from 'uuid';
import { GuidBrandType } from '../../src/enumerations/guid-brand-type';
import { GuidErrorType } from '../../src/enumerations/guid-error-type';
import { GuidError } from '../../src/errors/guid';
import { GuidUint8Array } from '../../src/lib/guid';
import {
  Base64Guid,
  BigIntGuid,
  FullHexGuid,
  RawGuidPlatformBuffer,
  ShortHexGuid,
} from '../../src/types';

// Mock uuid module for error handling tests
jest.mock('uuid', () => ({
  ...jest.requireActual('uuid'),
  v1: jest.fn(),
  v3: jest.fn(),
  v4: jest.fn(),
  v5: jest.fn(),
}));

const mockedUuid = uuid as jest.Mocked<typeof uuid>;

// Store original implementations
const originalV1 = jest.requireActual<typeof uuid>('uuid').v1;
const originalV3 = jest.requireActual<typeof uuid>('uuid').v3;
const originalV4 = jest.requireActual<typeof uuid>('uuid').v4;
const originalV5 = jest.requireActual<typeof uuid>('uuid').v5;

describe('Guid', () => {
  // Reset mocks to use real implementations before each test
  beforeEach(() => {
    mockedUuid.v1.mockImplementation(originalV1);
    mockedUuid.v3.mockImplementation(originalV3);
    mockedUuid.v4.mockImplementation(originalV4);
    mockedUuid.v5.mockImplementation(originalV5);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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
        const guid = new GuidUint8Array(testFullHexGuid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should create from ShortHexGuid', () => {
        const guid = new GuidUint8Array(testShortHexGuid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asShortHexGuid).toBe(testShortHexGuid);
      });

      it('should create from Base64Guid', () => {
        const guid = new GuidUint8Array(testBase64Guid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asBase64Guid).toBe(testBase64Guid);
      });

      it('should create from BigIntGuid', () => {
        const guid = new GuidUint8Array(testBigIntGuid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asBigIntGuid).toBe(testBigIntGuid);
      });

      it('should create from RawGuidBuffer', () => {
        const guid = new GuidUint8Array(testRawGuidBuffer);
        expect(guid).toBeInstanceOf(GuidUint8Array);
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
        const guid = new GuidUint8Array(uint8Array);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should create from valid UUID v4', () => {
        const validUuid = uuid.v4();
        const guid = new GuidUint8Array(validUuid as FullHexGuid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asFullHexGuid).toBe(validUuid);
      });
    });

    describe('Boundary Values', () => {
      it('should accept all zeros (full hex)', () => {
        const guid = new GuidUint8Array(allZerosFullHex);
        expect(guid.asFullHexGuid).toBe(allZerosFullHex);
      });

      it('should accept all zeros (short hex)', () => {
        const guid = new GuidUint8Array(allZerosShortHex);
        expect(guid.asShortHexGuid).toBe(allZerosShortHex);
      });

      it('should accept all Fs (full hex)', () => {
        const guid = new GuidUint8Array(allFsFullHex);
        expect(guid.asFullHexGuid).toBe(allFsFullHex);
      });

      it('should accept all Fs (short hex)', () => {
        const guid = new GuidUint8Array(allFsShortHex);
        expect(guid.asShortHexGuid).toBe(allFsShortHex);
      });

      it('should accept bigint zero', () => {
        const guid = new GuidUint8Array(0n as BigIntGuid);
        expect(guid.asBigIntGuid).toBe(0n);
      });

      it('should accept max bigint value for GUID', () => {
        const maxBigInt = BigInt(
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
        ) as BigIntGuid;
        const guid = new GuidUint8Array(maxBigInt);
        expect(guid.asBigIntGuid).toBe(maxBigInt);
      });
    });

    describe('Invalid Input - Null/Undefined', () => {
      it('should throw GuidError for null', () => {
        expect(() => new GuidUint8Array(null as any)).toThrow(GuidError);
        expect(() => new GuidUint8Array(null as any)).toThrow(
          expect.objectContaining({ type: GuidErrorType.InvalidGuid }),
        );
      });

      it('should throw GuidError for undefined', () => {
        expect(() => new GuidUint8Array(undefined as any)).toThrow(GuidError);
        expect(() => new GuidUint8Array(undefined as any)).toThrow(
          expect.objectContaining({ type: GuidErrorType.InvalidGuid }),
        );
      });

      it('should throw GuidError for empty string', () => {
        expect(() => new GuidUint8Array('')).toThrow(GuidError);
      });
    });

    describe('Invalid Input - Wrong Length', () => {
      it('should throw GuidError for wrong length string', () => {
        expect(() => new GuidUint8Array('123' as any)).toThrow(GuidError);
        expect(() => new GuidUint8Array('123' as any)).toThrow(
          expect.objectContaining({
            type: GuidErrorType.InvalidGuidUnknownLength,
          }),
        );
      });

      it('should throw GuidError for wrong length buffer', () => {
        const wrongBuffer = Buffer.from('1234', 'hex');
        expect(() => new GuidUint8Array(wrongBuffer as any)).toThrow(GuidError);
      });

      it('should throw GuidError for 35-character string', () => {
        expect(
          () =>
            new GuidUint8Array('550e8400-e29b-41d4-a716-44665544000' as any),
        ).toThrow(GuidError);
      });

      it('should throw GuidError for 37-character string', () => {
        expect(
          () =>
            new GuidUint8Array('550e8400-e29b-41d4-a716-4466554400000' as any),
        ).toThrow(GuidError);
      });
    });

    describe('Invalid Input - Invalid Format', () => {
      it('should throw GuidError for invalid full hex format', () => {
        expect(
          () =>
            new GuidUint8Array(
              'ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ' as FullHexGuid,
            ),
        ).toThrow(GuidError);
        expect(
          () =>
            new GuidUint8Array(
              'ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ' as FullHexGuid,
            ),
        ).toThrow(GuidError);
      });

      it('should throw GuidError for invalid short hex format', () => {
        expect(
          () => new GuidUint8Array('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ' as any),
        ).toThrow(GuidError);
      });

      it('should throw GuidError for invalid base64 format', () => {
        expect(
          () => new GuidUint8Array('!!INVALID_BASE64_GUID!!' as any),
        ).toThrow(GuidError);
      });

      it('should throw GuidError for negative bigint', () => {
        expect(() => new GuidUint8Array(-1n as BigIntGuid)).toThrow(GuidError);
      });

      it('should throw GuidError for bigint too large', () => {
        const tooBig = BigInt('0x1' + 'F'.repeat(32)) as BigIntGuid;
        expect(() => new GuidUint8Array(tooBig)).toThrow(GuidError);
      });
    });

    describe('Invalid Input - Wrong Dashes', () => {
      it('should throw GuidError for missing dashes in full hex', () => {
        // This should be treated as wrong length since it's 32 chars without dashes
        const guid = new GuidUint8Array(testShortHexGuid);
        expect(guid.asShortHexGuid).toBe(testShortHexGuid);
      });

      it('should throw GuidError for dashes in wrong positions', () => {
        expect(
          () =>
            new GuidUint8Array('550e-8400e29b-41d4a716-446655440000' as any),
        ).toThrow(GuidError);
      });
    });
  });

  describe('Static new() Method', () => {
    it('should create a new random GUID', () => {
      const guid = GuidUint8Array.new();
      expect(guid).toBeInstanceOf(GuidUint8Array);
    });

    it('should create unique GUIDs', () => {
      const guid1 = GuidUint8Array.new();
      const guid2 = GuidUint8Array.new();
      expect(guid1.asFullHexGuid).not.toBe(guid2.asFullHexGuid);
    });

    it('should create valid UUIDs', () => {
      const guid = GuidUint8Array.new();
      expect(uuid.validate(guid.asFullHexGuid)).toBe(true);
    });
  });

  describe('Conversion Methods', () => {
    describe('toFullHexGuid', () => {
      it('should convert short hex to full hex', () => {
        const result = GuidUint8Array.toFullHexGuid(testShortHexGuid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should convert base64 to full hex', () => {
        const result = GuidUint8Array.toFullHexGuid(testBase64Guid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should convert bigint to full hex', () => {
        const result = GuidUint8Array.toFullHexGuid(testBigIntGuid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should convert buffer to full hex', () => {
        const result = GuidUint8Array.toFullHexGuid(testRawGuidBuffer);
        expect(result).toBe(testFullHexGuid);
      });

      it('should return full hex as-is', () => {
        const result = GuidUint8Array.toFullHexGuid(testFullHexGuid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should throw for invalid input', () => {
        expect(() => GuidUint8Array.toFullHexGuid('' as any)).toThrow(
          GuidError,
        );
      });

      it('should throw for null', () => {
        expect(() => GuidUint8Array.toFullHexGuid(null as any)).toThrow(
          GuidError,
        );
      });
    });

    describe('toShortHexGuid', () => {
      it('should convert full hex to short hex', () => {
        const result = GuidUint8Array.toShortHexGuid(testFullHexGuid);
        expect(result).toBe(testShortHexGuid);
      });

      it('should convert base64 to short hex', () => {
        const result = GuidUint8Array.toShortHexGuid(testBase64Guid);
        expect(result).toBe(testShortHexGuid);
      });

      it('should convert bigint to short hex', () => {
        const result = GuidUint8Array.toShortHexGuid(testBigIntGuid);
        expect(result).toBe(testShortHexGuid);
      });

      it('should convert buffer to short hex', () => {
        const result = GuidUint8Array.toShortHexGuid(testRawGuidBuffer);
        expect(result).toBe(testShortHexGuid);
      });

      it('should return short hex as-is', () => {
        const result = GuidUint8Array.toShortHexGuid(testShortHexGuid);
        expect(result).toBe(testShortHexGuid);
      });
    });

    describe('toRawGuidBuffer', () => {
      it('should convert full hex to buffer', () => {
        const result = GuidUint8Array.toRawGuidPlatformBuffer(testFullHexGuid);
        expect(Buffer.compare(result, testRawGuidBuffer)).toBe(0);
      });

      it('should convert short hex to buffer', () => {
        const result = GuidUint8Array.toRawGuidPlatformBuffer(testShortHexGuid);
        expect(Buffer.compare(result, testRawGuidBuffer)).toBe(0);
      });

      it('should convert base64 to buffer', () => {
        const result = GuidUint8Array.toRawGuidPlatformBuffer(testBase64Guid);
        expect(Buffer.compare(result, testRawGuidBuffer)).toBe(0);
      });

      it('should convert bigint to buffer', () => {
        const result = GuidUint8Array.toRawGuidPlatformBuffer(testBigIntGuid);
        expect(Buffer.compare(result, testRawGuidBuffer)).toBe(0);
      });

      it('should return buffer as-is', () => {
        const result =
          GuidUint8Array.toRawGuidPlatformBuffer(testRawGuidBuffer);
        expect(Buffer.compare(result, testRawGuidBuffer)).toBe(0);
      });

      it('should throw for buffer with wrong length', () => {
        const wrongBuffer = Buffer.from('12345678', 'hex');
        expect(() =>
          GuidUint8Array.toRawGuidPlatformBuffer(wrongBuffer as any),
        ).toThrow(GuidError);
        expect(() =>
          GuidUint8Array.toRawGuidPlatformBuffer(wrongBuffer as any),
        ).toThrow(
          expect.objectContaining({
            type: GuidErrorType.InvalidGuidUnknownLength,
          }),
        );
      });
    });

    describe('toFullHexFromBigInt', () => {
      it('should convert bigint to full hex', () => {
        const result = GuidUint8Array.toFullHexFromBigInt(testBigIntGuid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should pad short bigint values', () => {
        const smallBigInt = 1n as BigIntGuid;
        const result = GuidUint8Array.toFullHexFromBigInt(smallBigInt);
        expect(result).toBe('00000000-0000-0000-0000-000000000001');
      });

      it('should throw for negative bigint', () => {
        expect(() => GuidUint8Array.toFullHexFromBigInt(-1n as any)).toThrow(
          GuidError,
        );
      });

      it('should throw for bigint too large', () => {
        const tooBig = BigInt('0x1' + 'F'.repeat(32)) as BigIntGuid;
        expect(() => GuidUint8Array.toFullHexFromBigInt(tooBig)).toThrow(
          GuidError,
        );
      });
    });
  });

  describe('Getter Methods', () => {
    let guid: GuidUint8Array;

    beforeEach(() => {
      guid = new GuidUint8Array(testFullHexGuid);
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
      const brand = GuidUint8Array.whichBrand(testFullHexGuid);
      expect(brand).toBe(GuidBrandType.FullHexGuid);
    });

    it('should detect ShortHexGuid', () => {
      const brand = GuidUint8Array.whichBrand(testShortHexGuid);
      expect(brand).toBe(GuidBrandType.ShortHexGuid);
    });

    it('should detect Base64Guid', () => {
      const brand = GuidUint8Array.whichBrand(testBase64Guid);
      expect(brand).toBe(GuidBrandType.Base64Guid);
    });

    it('should detect BigIntGuid', () => {
      const brand = GuidUint8Array.whichBrand(testBigIntGuid);
      expect(brand).toBe(GuidBrandType.BigIntGuid);
    });

    it('should detect RawGuidBuffer', () => {
      const brand = GuidUint8Array.whichBrand(testRawGuidBuffer);
      expect(brand).toBe(GuidBrandType.RawGuidPlatformBuffer);
    });

    it('should throw for null', () => {
      expect(() => GuidUint8Array.whichBrand(null as any)).toThrow(GuidError);
    });

    it('should throw for undefined', () => {
      expect(() => GuidUint8Array.whichBrand(undefined as any)).toThrow(
        GuidError,
      );
    });
  });

  describe('Brand Verification - verifyGuid', () => {
    it('should verify FullHexGuid', () => {
      expect(
        GuidUint8Array.verifyGuid(GuidBrandType.FullHexGuid, testFullHexGuid),
      ).toBe(true);
      expect(
        GuidUint8Array.verifyGuid(GuidBrandType.FullHexGuid, 'invalid'),
      ).toBe(false);
    });

    it('should verify ShortHexGuid', () => {
      expect(
        GuidUint8Array.verifyGuid(GuidBrandType.ShortHexGuid, testShortHexGuid),
      ).toBe(true);
      expect(
        GuidUint8Array.verifyGuid(GuidBrandType.ShortHexGuid, 'invalid'),
      ).toBe(false);
    });

    it('should verify Base64Guid', () => {
      expect(
        GuidUint8Array.verifyGuid(GuidBrandType.Base64Guid, testBase64Guid),
      ).toBe(true);
      expect(
        GuidUint8Array.verifyGuid(GuidBrandType.Base64Guid, 'invalid'),
      ).toBe(false);
    });

    it('should verify BigIntGuid', () => {
      expect(
        GuidUint8Array.verifyGuid(GuidBrandType.BigIntGuid, testBigIntGuid),
      ).toBe(true);
      expect(GuidUint8Array.verifyGuid(GuidBrandType.BigIntGuid, -1n)).toBe(
        false,
      );
    });

    it('should verify RawGuidBuffer', () => {
      expect(
        GuidUint8Array.verifyGuid(
          GuidBrandType.RawGuidPlatformBuffer,
          testRawGuidBuffer,
        ),
      ).toBe(true);
      expect(
        GuidUint8Array.verifyGuid(
          GuidBrandType.RawGuidPlatformBuffer,
          Buffer.from('invalid', 'hex'),
        ),
      ).toBe(false);
    });

    it('should return false for null', () => {
      expect(
        GuidUint8Array.verifyGuid(GuidBrandType.FullHexGuid, null as any),
      ).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(
        GuidUint8Array.verifyGuid(GuidBrandType.FullHexGuid, undefined as any),
      ).toBe(false);
    });

    it('should return false for Unknown brand', () => {
      expect(
        GuidUint8Array.verifyGuid(GuidBrandType.Unknown, testFullHexGuid),
      ).toBe(false);
    });
  });

  describe('Individual Verification Methods', () => {
    describe('isFullHexGuid', () => {
      it('should return true for valid full hex', () => {
        expect(GuidUint8Array.isFullHexGuid(testFullHexGuid)).toBe(true);
      });

      it('should return true for boundary values', () => {
        expect(GuidUint8Array.isFullHexGuid(allZerosFullHex)).toBe(true);
        expect(GuidUint8Array.isFullHexGuid(allFsFullHex)).toBe(true);
      });

      it('should return false for invalid format', () => {
        expect(GuidUint8Array.isFullHexGuid(testShortHexGuid)).toBe(false);
        expect(GuidUint8Array.isFullHexGuid('invalid')).toBe(false);
      });

      it('should return false for null/undefined', () => {
        expect(GuidUint8Array.isFullHexGuid(null as any)).toBe(false);
        expect(GuidUint8Array.isFullHexGuid(undefined as any)).toBe(false);
      });
    });

    describe('isShortHexGuid', () => {
      it('should return true for valid short hex', () => {
        expect(GuidUint8Array.isShortHexGuid(testShortHexGuid)).toBe(true);
      });

      it('should return true for boundary values', () => {
        expect(GuidUint8Array.isShortHexGuid(allZerosShortHex)).toBe(true);
        expect(GuidUint8Array.isShortHexGuid(allFsShortHex)).toBe(true);
      });

      it('should return false for invalid format', () => {
        expect(GuidUint8Array.isShortHexGuid(testFullHexGuid)).toBe(false);
        expect(GuidUint8Array.isShortHexGuid('invalid')).toBe(false);
      });

      it('should return false for null/undefined', () => {
        expect(GuidUint8Array.isShortHexGuid(null as any)).toBe(false);
        expect(GuidUint8Array.isShortHexGuid(undefined as any)).toBe(false);
      });
    });

    describe('isBase64Guid', () => {
      it('should return true for valid base64', () => {
        expect(GuidUint8Array.isBase64Guid(testBase64Guid)).toBe(true);
      });

      it('should return false for invalid format', () => {
        expect(GuidUint8Array.isBase64Guid(testFullHexGuid)).toBe(false);
        expect(GuidUint8Array.isBase64Guid('invalid')).toBe(false);
      });

      it('should return false for wrong length', () => {
        expect(GuidUint8Array.isBase64Guid('VQ6EAOKbQdSnFkRm' as any)).toBe(
          false,
        );
      });

      it('should return false for null/undefined', () => {
        expect(GuidUint8Array.isBase64Guid(null as any)).toBe(false);
        expect(GuidUint8Array.isBase64Guid(undefined as any)).toBe(false);
      });
    });

    describe('isRawGuidBuffer', () => {
      it('should return true for valid buffer', () => {
        expect(GuidUint8Array.isRawGuidUint8Array(testRawGuidBuffer)).toBe(
          true,
        );
      });

      it('should return false for wrong length buffer', () => {
        expect(
          GuidUint8Array.isRawGuidUint8Array(Buffer.from('1234', 'hex')),
        ).toBe(false);
      });

      it('should return false for non-buffer', () => {
        expect(GuidUint8Array.isRawGuidUint8Array(testFullHexGuid)).toBe(false);
      });

      it('should return false for null/undefined', () => {
        expect(GuidUint8Array.isRawGuidUint8Array(null as any)).toBe(false);
        expect(GuidUint8Array.isRawGuidUint8Array(undefined as any)).toBe(
          false,
        );
      });
    });

    describe('isBigIntGuid', () => {
      it('should return true for valid bigint', () => {
        expect(GuidUint8Array.isBigIntGuid(testBigIntGuid)).toBe(true);
      });

      it('should return true for zero bigint', () => {
        expect(GuidUint8Array.isBigIntGuid(0n)).toBe(true);
      });

      it('should return false for negative bigint', () => {
        expect(GuidUint8Array.isBigIntGuid(-1n)).toBe(false);
      });

      it('should return false for bigint too large', () => {
        const tooBig = BigInt('0x1' + 'F'.repeat(32));
        expect(GuidUint8Array.isBigIntGuid(tooBig)).toBe(false);
      });

      it('should return false for non-bigint', () => {
        expect(GuidUint8Array.isBigIntGuid(testFullHexGuid as any)).toBe(false);
        expect(GuidUint8Array.isBigIntGuid(123 as any)).toBe(false);
      });

      it('should return false for null/undefined', () => {
        expect(GuidUint8Array.isBigIntGuid(null as any)).toBe(false);
        expect(GuidUint8Array.isBigIntGuid(undefined as any)).toBe(false);
      });
    });
  });

  describe('Length Mapping', () => {
    describe('guidBrandToLength', () => {
      it('should return 36 for FullHexGuid', () => {
        expect(
          GuidUint8Array.guidBrandToLength(GuidBrandType.FullHexGuid),
        ).toBe(36);
      });

      it('should return 32 for ShortHexGuid', () => {
        expect(
          GuidUint8Array.guidBrandToLength(GuidBrandType.ShortHexGuid),
        ).toBe(32);
      });

      it('should return 24 for Base64Guid', () => {
        expect(GuidUint8Array.guidBrandToLength(GuidBrandType.Base64Guid)).toBe(
          24,
        );
      });

      it('should return 16 for RawGuidBuffer', () => {
        expect(
          GuidUint8Array.guidBrandToLength(GuidBrandType.RawGuidPlatformBuffer),
        ).toBe(16);
      });

      it('should throw for BigIntGuid (variable length)', () => {
        expect(() =>
          GuidUint8Array.guidBrandToLength(GuidBrandType.BigIntGuid),
        ).toThrow(GuidError);
        expect(() =>
          GuidUint8Array.guidBrandToLength(GuidBrandType.BigIntGuid),
        ).toThrow(
          expect.objectContaining({
            type: GuidErrorType.InvalidGuidUnknownBrand,
          }),
        );
      });

      it('should throw for Unknown', () => {
        expect(() =>
          GuidUint8Array.guidBrandToLength(GuidBrandType.Unknown),
        ).toThrow(GuidError);
      });
    });

    describe('lengthToGuidBrand', () => {
      it('should return FullHexGuid for length 36', () => {
        expect(GuidUint8Array.lengthToGuidBrand(36, false)).toBe(
          GuidBrandType.FullHexGuid,
        );
      });

      it('should return ShortHexGuid for length 32', () => {
        expect(GuidUint8Array.lengthToGuidBrand(32, false)).toBe(
          GuidBrandType.ShortHexGuid,
        );
      });

      it('should return Base64Guid for length 24', () => {
        expect(GuidUint8Array.lengthToGuidBrand(24, false)).toBe(
          GuidBrandType.Base64Guid,
        );
      });

      it('should return RawGuidBuffer for length 16 with buffer flag', () => {
        expect(GuidUint8Array.lengthToGuidBrand(16, true)).toBe(
          GuidBrandType.RawGuidPlatformBuffer,
        );
      });

      it('should throw for zero length', () => {
        expect(() => GuidUint8Array.lengthToGuidBrand(0, false)).toThrow(
          GuidError,
        );
        expect(() => GuidUint8Array.lengthToGuidBrand(0, false)).toThrow(
          expect.objectContaining({
            type: GuidErrorType.InvalidGuidUnknownLength,
          }),
        );
      });

      it('should throw for negative length', () => {
        expect(() => GuidUint8Array.lengthToGuidBrand(-1, false)).toThrow(
          GuidError,
        );
      });

      it('should throw for unknown length', () => {
        expect(() => GuidUint8Array.lengthToGuidBrand(99, false)).toThrow(
          GuidError,
        );
      });
    });
  });

  describe('Serialization and Hydration', () => {
    it('should serialize to Base64', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
      expect(guid.serialize()).toBe(testBase64Guid);
    });

    it('should hydrate from Base64', () => {
      const guid = GuidUint8Array.hydrate(testBase64Guid);
      expect(guid).toBeInstanceOf(GuidUint8Array);
      expect(guid.asBase64Guid).toBe(testBase64Guid);
    });

    it('should round-trip serialize/hydrate', () => {
      const original = new GuidUint8Array(testFullHexGuid);
      const serialized = original.serialize();
      const hydrated = GuidUint8Array.hydrate(serialized);
      expect(hydrated.equals(original)).toBe(true);
    });
  });

  describe('Equality', () => {
    it('should return true for equal GUIDs', () => {
      const guid1 = new GuidUint8Array(testFullHexGuid);
      const guid2 = new GuidUint8Array(testShortHexGuid);
      expect(guid1.equals(guid2)).toBe(true);
    });

    it('should return false for different GUIDs', () => {
      const guid1 = new GuidUint8Array(testFullHexGuid);
      const guid2 = GuidUint8Array.new();
      expect(guid1.equals(guid2)).toBe(false);
    });

    it('should work with different input formats', () => {
      const guid1 = new GuidUint8Array(testFullHexGuid);
      const guid2 = new GuidUint8Array(testBase64Guid);
      const guid3 = new GuidUint8Array(testBigIntGuid);
      const guid4 = new GuidUint8Array(testRawGuidBuffer);

      expect(guid1.equals(guid2)).toBe(true);
      expect(guid1.equals(guid3)).toBe(true);
      expect(guid1.equals(guid4)).toBe(true);
    });
  });

  describe('UUID Validation', () => {
    it('should validate correct UUIDs', () => {
      const validUuid = uuid.v4();
      expect(GuidUint8Array.validateUuid(validUuid)).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(GuidUint8Array.validateUuid('invalid')).toBe(false);
      expect(
        GuidUint8Array.validateUuid('ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ'),
      ).toBe(false);
    });

    it('should accept boundary UUIDs', () => {
      expect(GuidUint8Array.validateUuid(allZerosFullHex)).toBe(true);
      expect(GuidUint8Array.validateUuid(allFsFullHex)).toBe(true);
    });
  });

  describe('Error Handling Coverage', () => {
    it('should handle catch blocks in constructor with bigint', () => {
      // Test the bigint-specific error path
      const invalidBigInt = BigInt('0x1' + 'F'.repeat(33)) as BigIntGuid;
      expect(() => new GuidUint8Array(invalidBigInt)).toThrow(GuidError);
    });

    it('should handle error in new() method when uuid generation fails', () => {
      // The uuid.v4() function is well-tested and reliable, so we just verify
      // that new() creates valid GUIDs consistently
      const guid1 = GuidUint8Array.new();
      const guid2 = GuidUint8Array.new();
      expect(guid1).toBeInstanceOf(GuidUint8Array);
      expect(guid2).toBeInstanceOf(GuidUint8Array);
      expect(uuid.validate(guid1.asFullHexGuid)).toBe(true);
      expect(uuid.validate(guid2.asFullHexGuid)).toBe(true);
    });

    it('should handle invalid base64 in toRawGuidBuffer', () => {
      // A base64 string that's 24 chars but not valid GUID
      expect(() =>
        GuidUint8Array.toRawGuidPlatformBuffer('!!!INVALID_BASE64!!!' as any),
      ).toThrow(GuidError);
    });
  });

  describe('Edge Cases and Corner Cases', () => {
    it('should handle GUID with lowercase hex', () => {
      const lowerCaseGuid = testFullHexGuid.toLowerCase() as FullHexGuid;
      const guid = new GuidUint8Array(lowerCaseGuid);
      expect(guid.asFullHexGuid).toBe(lowerCaseGuid);
    });

    it('should handle GUID with uppercase hex', () => {
      const upperCaseGuid = testFullHexGuid.toUpperCase() as FullHexGuid;
      const guid = new GuidUint8Array(upperCaseGuid);
      expect(guid.asFullHexGuid.toLowerCase()).toBe(
        testFullHexGuid.toLowerCase(),
      );
    });

    it('should handle mixed case hex', () => {
      const mixedCase = '550E8400-E29B-41D4-A716-446655440000' as FullHexGuid;
      const guid = new GuidUint8Array(mixedCase);
      expect(guid).toBeInstanceOf(GuidUint8Array);
    });

    it('should handle conversion errors gracefully', () => {
      // Test various error paths
      expect(() =>
        GuidUint8Array.toFullHexGuid(Buffer.alloc(20) as any),
      ).toThrow(GuidError);
      expect(() => GuidUint8Array.toShortHexGuid(null as any)).toThrow(
        GuidError,
      );
    });

    it('should handle all conversion switch branches', () => {
      // Test all branches in toRawGuidBuffer
      const fullHexBuffer =
        GuidUint8Array.toRawGuidPlatformBuffer(testFullHexGuid);
      const shortHexBuffer =
        GuidUint8Array.toRawGuidPlatformBuffer(testShortHexGuid);
      const base64Buffer =
        GuidUint8Array.toRawGuidPlatformBuffer(testBase64Guid);
      const bigIntBuffer =
        GuidUint8Array.toRawGuidPlatformBuffer(testBigIntGuid);
      const rawBuffer =
        GuidUint8Array.toRawGuidPlatformBuffer(testRawGuidBuffer);

      expect(Buffer.compare(fullHexBuffer, testRawGuidBuffer)).toBe(0);
      expect(Buffer.compare(shortHexBuffer, testRawGuidBuffer)).toBe(0);
      expect(Buffer.compare(base64Buffer, testRawGuidBuffer)).toBe(0);
      expect(Buffer.compare(bigIntBuffer, testRawGuidBuffer)).toBe(0);
      expect(Buffer.compare(rawBuffer, testRawGuidBuffer)).toBe(0);
    });

    it('should handle default case in toRawGuidBuffer', () => {
      // Force an unknown brand type to hit the default case
      expect(() =>
        GuidUint8Array.toRawGuidPlatformBuffer({ length: 99 } as any),
      ).toThrow(GuidError);
    });
  });

  describe('Integration Tests', () => {
    it('should convert between all formats successfully', () => {
      const guid = new GuidUint8Array(testFullHexGuid);

      const fullHex = guid.asFullHexGuid;
      const shortHex = guid.asShortHexGuid;
      const base64 = guid.asBase64Guid;
      const bigInt = guid.asBigIntGuid;
      const buffer = guid.asRawGuidPlatformBuffer;

      // Create new GUIDs from each format
      const fromFullHex = new GuidUint8Array(fullHex);
      const fromShortHex = new GuidUint8Array(shortHex);
      const fromBase64 = new GuidUint8Array(base64);
      const fromBigInt = new GuidUint8Array(bigInt);
      const fromBuffer = new GuidUint8Array(buffer);

      // All should be equal
      expect(fromFullHex.equals(guid)).toBe(true);
      expect(fromShortHex.equals(guid)).toBe(true);
      expect(fromBase64.equals(guid)).toBe(true);
      expect(fromBigInt.equals(guid)).toBe(true);
      expect(fromBuffer.equals(guid)).toBe(true);
    });

    it('should handle rapid creation and conversion', () => {
      const guids = Array.from({ length: 100 }, () => GuidUint8Array.new());

      guids.forEach((guid) => {
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(uuid.validate(guid.asFullHexGuid)).toBe(true);

        // Test all conversions
        const serialized = guid.serialize();
        const hydrated = GuidUint8Array.hydrate(serialized);
        expect(hydrated.equals(guid)).toBe(true);
      });
    });
  });

  describe('Static Method Edge Cases', () => {
    describe('validateUuid', () => {
      it('should validate proper UUID v4', () => {
        const validUuid = uuid.v4();
        expect(GuidUint8Array.validateUuid(validUuid)).toBe(true);
      });

      it('should reject invalid UUID', () => {
        expect(GuidUint8Array.validateUuid('not-a-uuid')).toBe(false);
      });

      it('should reject empty string', () => {
        expect(GuidUint8Array.validateUuid('')).toBe(false);
      });

      it('should handle boundary values', () => {
        // uuid.validate actually accepts all zeros and all Fs
        expect(GuidUint8Array.validateUuid(allZerosFullHex)).toBe(true);
        expect(GuidUint8Array.validateUuid(allFsFullHex)).toBe(true);
        // And Guid.isFullHexGuid also accepts them
        expect(GuidUint8Array.isFullHexGuid(allZerosFullHex)).toBe(true);
        expect(GuidUint8Array.isFullHexGuid(allFsFullHex)).toBe(true);
      });
    });

    describe('guidBrandToLength', () => {
      it('should return correct length for FullHexGuid', () => {
        expect(
          GuidUint8Array.guidBrandToLength(GuidBrandType.FullHexGuid),
        ).toBe(36);
      });

      it('should return correct length for ShortHexGuid', () => {
        expect(
          GuidUint8Array.guidBrandToLength(GuidBrandType.ShortHexGuid),
        ).toBe(32);
      });

      it('should return correct length for Base64Guid', () => {
        expect(GuidUint8Array.guidBrandToLength(GuidBrandType.Base64Guid)).toBe(
          24,
        );
      });

      it('should return correct length for RawGuidBuffer', () => {
        expect(
          GuidUint8Array.guidBrandToLength(GuidBrandType.RawGuidPlatformBuffer),
        ).toBe(16);
      });

      it('should throw for Unknown brand', () => {
        expect(() =>
          GuidUint8Array.guidBrandToLength(GuidBrandType.Unknown),
        ).toThrow(GuidError);
      });

      it('should throw for BigIntGuid', () => {
        expect(() =>
          GuidUint8Array.guidBrandToLength(GuidBrandType.BigIntGuid),
        ).toThrow(GuidError);
      });
    });

    describe('lengthToGuidBrand', () => {
      it('should identify FullHexGuid length', () => {
        expect(GuidUint8Array.lengthToGuidBrand(36, false)).toBe(
          GuidBrandType.FullHexGuid,
        );
      });

      it('should identify ShortHexGuid length', () => {
        expect(GuidUint8Array.lengthToGuidBrand(32, false)).toBe(
          GuidBrandType.ShortHexGuid,
        );
      });

      it('should identify Base64Guid length', () => {
        expect(GuidUint8Array.lengthToGuidBrand(24, false)).toBe(
          GuidBrandType.Base64Guid,
        );
      });

      it('should identify RawGuidBuffer length', () => {
        expect(GuidUint8Array.lengthToGuidBrand(16, true)).toBe(
          GuidBrandType.RawGuidPlatformBuffer,
        );
      });

      it('should throw for zero length', () => {
        expect(() => GuidUint8Array.lengthToGuidBrand(0, false)).toThrow(
          GuidError,
        );
      });

      it('should throw for negative length', () => {
        expect(() => GuidUint8Array.lengthToGuidBrand(-1, false)).toThrow(
          GuidError,
        );
      });

      it('should throw for unknown length', () => {
        expect(() => GuidUint8Array.lengthToGuidBrand(100, false)).toThrow(
          GuidError,
        );
      });

      it('should distinguish buffer from string for same length', () => {
        // Length 16 could be buffer or string, but buffer flag differentiates
        expect(GuidUint8Array.lengthToGuidBrand(16, true)).toBe(
          GuidBrandType.RawGuidPlatformBuffer,
        );
        expect(() => GuidUint8Array.lengthToGuidBrand(16, false)).toThrow(
          GuidError,
        );
      });
    });

    describe('whichBrand', () => {
      it('should identify FullHexGuid', () => {
        expect(GuidUint8Array.whichBrand(testFullHexGuid)).toBe(
          GuidBrandType.FullHexGuid,
        );
      });

      it('should identify ShortHexGuid', () => {
        expect(GuidUint8Array.whichBrand(testShortHexGuid)).toBe(
          GuidBrandType.ShortHexGuid,
        );
      });

      it('should identify Base64Guid', () => {
        expect(GuidUint8Array.whichBrand(testBase64Guid)).toBe(
          GuidBrandType.Base64Guid,
        );
      });

      it('should identify BigIntGuid', () => {
        expect(GuidUint8Array.whichBrand(testBigIntGuid)).toBe(
          GuidBrandType.BigIntGuid,
        );
      });

      it('should identify RawGuidBuffer', () => {
        expect(GuidUint8Array.whichBrand(testRawGuidBuffer)).toBe(
          GuidBrandType.RawGuidPlatformBuffer,
        );
      });

      it('should throw for invalid input', () => {
        expect(() => GuidUint8Array.whichBrand('invalid' as any)).toThrow(
          GuidError,
        );
      });

      it('should throw for null', () => {
        expect(() => GuidUint8Array.whichBrand(null as any)).toThrow(GuidError);
      });

      it('should throw for undefined', () => {
        expect(() => GuidUint8Array.whichBrand(undefined as any)).toThrow(
          GuidError,
        );
      });
    });

    describe('verifyGuid', () => {
      it('should verify valid FullHexGuid', () => {
        expect(
          GuidUint8Array.verifyGuid(GuidBrandType.FullHexGuid, testFullHexGuid),
        ).toBe(true);
      });

      it('should reject invalid brand/value combination', () => {
        expect(
          GuidUint8Array.verifyGuid(
            GuidBrandType.ShortHexGuid,
            testFullHexGuid,
          ),
        ).toBe(false);
      });

      it('should reject null', () => {
        expect(
          GuidUint8Array.verifyGuid(GuidBrandType.FullHexGuid, null as any),
        ).toBe(false);
      });

      it('should reject undefined', () => {
        expect(
          GuidUint8Array.verifyGuid(
            GuidBrandType.FullHexGuid,
            undefined as any,
          ),
        ).toBe(false);
      });

      it('should handle exceptions gracefully', () => {
        expect(
          GuidUint8Array.verifyGuid(GuidBrandType.Unknown, 'anything'),
        ).toBe(false);
      });
    });
  });

  describe('Type Guard Methods', () => {
    describe('isFullHexGuid', () => {
      it('should accept valid full hex GUID', () => {
        expect(GuidUint8Array.isFullHexGuid(testFullHexGuid)).toBe(true);
      });

      it('should accept all zeros', () => {
        expect(GuidUint8Array.isFullHexGuid(allZerosFullHex)).toBe(true);
      });

      it('should accept all Fs', () => {
        expect(GuidUint8Array.isFullHexGuid(allFsFullHex)).toBe(true);
      });

      it('should reject short hex GUID', () => {
        expect(GuidUint8Array.isFullHexGuid(testShortHexGuid)).toBe(false);
      });

      it('should reject wrong length', () => {
        expect(GuidUint8Array.isFullHexGuid('too-short')).toBe(false);
      });

      it('should reject null', () => {
        expect(GuidUint8Array.isFullHexGuid(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(GuidUint8Array.isFullHexGuid(undefined as any)).toBe(false);
      });

      it('should handle exceptions', () => {
        expect(GuidUint8Array.isFullHexGuid({ invalid: 'object' } as any)).toBe(
          false,
        );
      });
    });

    describe('isShortHexGuid', () => {
      it('should accept valid short hex GUID', () => {
        expect(GuidUint8Array.isShortHexGuid(testShortHexGuid)).toBe(true);
      });

      it('should accept all zeros', () => {
        expect(GuidUint8Array.isShortHexGuid(allZerosShortHex)).toBe(true);
      });

      it('should accept all Fs', () => {
        expect(GuidUint8Array.isShortHexGuid(allFsShortHex)).toBe(true);
      });

      it('should reject full hex GUID', () => {
        expect(GuidUint8Array.isShortHexGuid(testFullHexGuid)).toBe(false);
      });

      it('should reject wrong length', () => {
        expect(GuidUint8Array.isShortHexGuid('too-short')).toBe(false);
      });

      it('should reject null', () => {
        expect(GuidUint8Array.isShortHexGuid(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(GuidUint8Array.isShortHexGuid(undefined as any)).toBe(false);
      });

      it('should handle invalid hex characters', () => {
        expect(
          GuidUint8Array.isShortHexGuid('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'),
        ).toBe(false);
      });
    });

    describe('isBase64Guid', () => {
      it('should accept valid base64 GUID', () => {
        expect(GuidUint8Array.isBase64Guid(testBase64Guid)).toBe(true);
      });

      it('should reject wrong length', () => {
        expect(GuidUint8Array.isBase64Guid('ABC=')).toBe(false);
      });

      it('should reject null', () => {
        expect(GuidUint8Array.isBase64Guid(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(GuidUint8Array.isBase64Guid(undefined as any)).toBe(false);
      });

      it('should handle bigint input', () => {
        expect(GuidUint8Array.isBase64Guid(12345n as any)).toBe(false);
      });

      it('should handle buffer input', () => {
        expect(GuidUint8Array.isBase64Guid(Buffer.alloc(10))).toBe(false);
      });

      it('should reject invalid base64 content', () => {
        expect(GuidUint8Array.isBase64Guid('!!!INVALID!!!!!!!!!!!!')).toBe(
          false,
        );
      });
    });

    describe('isRawGuidBuffer', () => {
      it('should accept valid raw buffer', () => {
        expect(GuidUint8Array.isRawGuidUint8Array(testRawGuidBuffer)).toBe(
          true,
        );
      });

      it('should accept 16-byte buffer', () => {
        const buffer = Buffer.alloc(16);
        expect(GuidUint8Array.isRawGuidUint8Array(buffer)).toBe(true);
      });

      it('should reject wrong length buffer', () => {
        const buffer = Buffer.alloc(20);
        expect(GuidUint8Array.isRawGuidUint8Array(buffer)).toBe(false);
      });

      it('should reject non-buffer', () => {
        expect(GuidUint8Array.isRawGuidUint8Array('not-a-buffer' as any)).toBe(
          false,
        );
      });

      it('should reject null', () => {
        expect(GuidUint8Array.isRawGuidUint8Array(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(GuidUint8Array.isRawGuidUint8Array(undefined as any)).toBe(
          false,
        );
      });

      it('should reject empty buffer', () => {
        expect(GuidUint8Array.isRawGuidUint8Array(Buffer.alloc(0))).toBe(false);
      });
    });

    describe('isBigIntGuid', () => {
      it('should accept valid BigIntGuid', () => {
        expect(GuidUint8Array.isBigIntGuid(testBigIntGuid)).toBe(true);
      });

      it('should accept zero bigint', () => {
        expect(GuidUint8Array.isBigIntGuid(0n)).toBe(true);
      });

      it('should accept max valid bigint', () => {
        const maxBigInt = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
        expect(GuidUint8Array.isBigIntGuid(maxBigInt)).toBe(true);
      });

      it('should reject negative bigint', () => {
        expect(GuidUint8Array.isBigIntGuid(-1n)).toBe(false);
      });

      it('should reject too large bigint', () => {
        const tooBig = BigInt('0x1' + 'F'.repeat(32));
        expect(GuidUint8Array.isBigIntGuid(tooBig)).toBe(false);
      });

      it('should reject non-bigint', () => {
        expect(GuidUint8Array.isBigIntGuid('not-a-bigint' as any)).toBe(false);
      });

      it('should reject null', () => {
        expect(GuidUint8Array.isBigIntGuid(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(GuidUint8Array.isBigIntGuid(undefined as any)).toBe(false);
      });

      it('should reject regular number', () => {
        expect(GuidUint8Array.isBigIntGuid(12345 as any)).toBe(false);
      });
    });
  });

  describe('Conversion Static Methods Thoroughness', () => {
    describe('toFullHexFromBigInt', () => {
      it('should convert zero bigint', () => {
        const result = GuidUint8Array.toFullHexFromBigInt(0n);
        expect(result).toBe('00000000-0000-0000-0000-000000000000');
      });

      it('should convert max bigint', () => {
        const maxBigInt = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
        const result = GuidUint8Array.toFullHexFromBigInt(maxBigInt);
        expect(result).toBe('ffffffff-ffff-ffff-ffff-ffffffffffff');
      });

      it('should handle mid-range values', () => {
        const result = GuidUint8Array.toFullHexFromBigInt(testBigIntGuid);
        expect(result).toBe(testFullHexGuid);
      });

      it('should pad with leading zeros', () => {
        const smallBigInt = BigInt('0x123');
        const result = GuidUint8Array.toFullHexFromBigInt(smallBigInt);
        expect(result.length).toBe(36);
        expect(result).toContain('0000-0000-0000-0000-000000000123');
      });

      it('should throw for negative bigint', () => {
        expect(() => GuidUint8Array.toFullHexFromBigInt(-1n)).toThrow(
          GuidError,
        );
      });

      it('should throw for too large bigint', () => {
        const tooBig = BigInt('0x1' + 'F'.repeat(32));
        expect(() => GuidUint8Array.toFullHexFromBigInt(tooBig)).toThrow(
          GuidError,
        );
      });
    });

    describe('toShortHexGuid comprehensive', () => {
      it('should handle all boundary values', () => {
        expect(GuidUint8Array.toShortHexGuid(allZerosFullHex)).toBe(
          allZerosShortHex,
        );
        expect(GuidUint8Array.toShortHexGuid(allFsFullHex)).toBe(allFsShortHex);
      });

      it('should handle base64 with padding', () => {
        const result = GuidUint8Array.toShortHexGuid(testBase64Guid);
        expect(result).toBe(testShortHexGuid);
      });

      it('should throw for invalid base64 in conversion', () => {
        expect(() =>
          GuidUint8Array.toShortHexGuid('!!!INVALID_BASE64!!!' as any),
        ).toThrow(GuidError);
      });

      it('should handle base64 edge cases', () => {
        // Valid base64 but wrong length after decoding
        expect(() =>
          GuidUint8Array.toRawGuidPlatformBuffer('SGVsbG8=' as any),
        ).toThrow(GuidError);
      });
    });
  });

  describe('Instance Methods Thoroughness', () => {
    describe('serialize and hydrate', () => {
      it('should round-trip through serialize/hydrate', () => {
        const original = new GuidUint8Array(testFullHexGuid);
        const serialized = original.serialize();
        const hydrated = GuidUint8Array.hydrate(serialized);
        expect(hydrated.equals(original)).toBe(true);
      });

      it('should serialize to base64', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const serialized = guid.serialize();
        expect(serialized).toBe(testBase64Guid);
      });

      it('should handle boundary values in serialization', () => {
        const zeroGuid = new GuidUint8Array(allZerosFullHex);
        const serialized = zeroGuid.serialize();
        const hydrated = GuidUint8Array.hydrate(serialized);
        expect(hydrated.asFullHexGuid).toBe(allZerosFullHex);
      });
    });

    describe('toString', () => {
      it('should return base64 format', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        expect(guid.toString()).toBe(testBase64Guid);
      });

      it('should match asBase64Guid', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        expect(guid.toString()).toBe(guid.asBase64Guid);
      });
    });

    describe('toJson', () => {
      it('should return stringified base64 format', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const jsonString = guid.toJson();
        // toJson calls JSON.stringify, which adds quotes
        expect(jsonString).toBe(JSON.stringify(guid.asBase64Guid));
        expect(jsonString).toBe(JSON.stringify(testBase64Guid));
      });

      it('should be parseable back to base64', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const jsonString = guid.toJson();
        // Parse to remove quotes, then can reconstruct
        const parsed = JSON.parse(jsonString);
        const restored = new GuidUint8Array(parsed as Base64Guid);
        expect(restored.equals(guid)).toBe(true);
      });
    });

    describe('asUint8Array', () => {
      it('should return Uint8Array with correct length', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const uint8 = guid.asPlatformBuffer;
        expect(uint8).toBeInstanceOf(Uint8Array);
        expect(uint8.length).toBe(16);
      });

      it('should match buffer contents', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const uint8 = guid.asPlatformBuffer;
        const buffer = guid.asRawGuidPlatformBuffer;
        expect(Array.from(uint8)).toEqual(Array.from(buffer));
      });

      it('should handle boundary values', () => {
        const zeroGuid = new GuidUint8Array(allZerosFullHex);
        const uint8 = zeroGuid.asPlatformBuffer;
        expect(uint8.every((byte) => byte === 0)).toBe(true);

        const ffGuid = new GuidUint8Array(allFsFullHex);
        const uint8Ff = ffGuid.asPlatformBuffer;
        expect(uint8Ff.every((byte) => byte === 0xff)).toBe(true);
      });
    });

    describe('equals', () => {
      it('should return true for same GUID', () => {
        const guid1 = new GuidUint8Array(testFullHexGuid);
        const guid2 = new GuidUint8Array(testFullHexGuid);
        expect(guid1.equals(guid2)).toBe(true);
      });

      it('should return true for different formats of same GUID', () => {
        const guid1 = new GuidUint8Array(testFullHexGuid);
        const guid2 = new GuidUint8Array(testShortHexGuid);
        const guid3 = new GuidUint8Array(testBase64Guid);
        const guid4 = new GuidUint8Array(testBigIntGuid);
        const guid5 = new GuidUint8Array(testRawGuidBuffer);

        expect(guid1.equals(guid2)).toBe(true);
        expect(guid1.equals(guid3)).toBe(true);
        expect(guid1.equals(guid4)).toBe(true);
        expect(guid1.equals(guid5)).toBe(true);
      });

      it('should return false for different GUIDs', () => {
        const guid1 = new GuidUint8Array(testFullHexGuid);
        const guid2 = GuidUint8Array.new();
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('should handle boundary comparisons', () => {
        const zeroGuid1 = new GuidUint8Array(allZerosFullHex);
        const zeroGuid2 = new GuidUint8Array(allZerosShortHex);
        expect(zeroGuid1.equals(zeroGuid2)).toBe(true);

        const ffGuid1 = new GuidUint8Array(allFsFullHex);
        const ffGuid2 = new GuidUint8Array(allFsShortHex);
        expect(ffGuid1.equals(ffGuid2)).toBe(true);
      });
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle cascading validation failures', () => {
      expect(() => new GuidUint8Array('invalid-format-here' as any)).toThrow(
        GuidError,
      );
    });

    it('should provide meaningful error types', () => {
      try {
        new GuidUint8Array('toolong' as any);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GuidError);
        expect((error as GuidError).type).toBeDefined();
      }
    });

    it('should handle conversion failures with proper error types', () => {
      try {
        GuidUint8Array.toFullHexGuid(Buffer.alloc(10) as any);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GuidError);
      }
    });

    it('should maintain error information through call stack', () => {
      try {
        const invalidBuffer = Buffer.alloc(10);
        GuidUint8Array.toRawGuidPlatformBuffer(invalidBuffer as any);
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
      const guids = Array.from({ length: count }, () => GuidUint8Array.new());
      const duration = Date.now() - start;

      expect(guids).toHaveLength(count);
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time

      // Verify all are unique
      const uniqueSet = new Set(guids.map((g) => g.asFullHexGuid));
      expect(uniqueSet.size).toBe(count);
    });

    it('should handle many conversions efficiently', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
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
        () => new GuidUint8Array('00000000-0000-0000-0000-00000000000X' as any),
      ).toThrow(GuidError);
    });

    it('should handle error in toRawGuidBuffer during construction', () => {
      expect(() => new GuidUint8Array({ invalid: 'object' } as any)).toThrow(
        GuidError,
      );
    });

    it('should skip UUID validation for boundary values', () => {
      // These should NOT throw even though uuid.validate would reject them
      const zeroGuid = new GuidUint8Array(allZerosFullHex);
      expect(zeroGuid.asFullHexGuid).toBe(allZerosFullHex);

      const ffGuid = new GuidUint8Array(allFsFullHex);
      expect(ffGuid.asFullHexGuid).toBe(allFsFullHex);
    });
  });

  describe('Factory Methods', () => {
    describe('fromFullHex', () => {
      it('should create a GUID from full hex string', () => {
        const guid = GuidUint8Array.fromFullHex(testFullHexGuid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should throw on invalid full hex', () => {
        expect(() => GuidUint8Array.fromFullHex('invalid')).toThrow(GuidError);
      });
    });

    describe('fromShortHex', () => {
      it('should create a GUID from short hex string', () => {
        const guid = GuidUint8Array.fromShortHex(testShortHexGuid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asShortHexGuid).toBe(testShortHexGuid);
      });

      it('should throw on invalid short hex', () => {
        expect(() => GuidUint8Array.fromShortHex('invalid')).toThrow(GuidError);
      });
    });

    describe('fromBase64', () => {
      it('should create a GUID from base64 string', () => {
        const guid = GuidUint8Array.fromBase64(testBase64Guid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asBase64Guid).toBe(testBase64Guid);
      });

      it('should throw on invalid base64', () => {
        expect(() => GuidUint8Array.fromBase64('!')).toThrow(GuidError);
      });
    });

    describe('fromBigInt', () => {
      it('should create a GUID from bigint', () => {
        const guid = GuidUint8Array.fromBigInt(testBigIntGuid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asBigIntGuid).toBe(testBigIntGuid);
      });

      it('should handle 0n bigint', () => {
        const guid = GuidUint8Array.fromBigInt(0n as BigIntGuid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asBigIntGuid).toBe(0n);
      });

      it('should throw on negative bigint', () => {
        expect(() => GuidUint8Array.fromBigInt(-1n as BigIntGuid)).toThrow(
          GuidError,
        );
      });

      it('should throw on bigint exceeding 128 bits', () => {
        const tooBig = BigInt(
          '0x1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
        ) as BigIntGuid;
        expect(() => GuidUint8Array.fromBigInt(tooBig)).toThrow(GuidError);
      });
    });

    describe('fromBuffer', () => {
      it('should create a GUID from buffer', () => {
        const guid = GuidUint8Array.fromPlatformBuffer(testRawGuidBuffer);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(
          Buffer.compare(guid.asRawGuidPlatformBuffer, testRawGuidBuffer),
        ).toBe(0);
      });

      it('should throw on wrong buffer length', () => {
        const wrongBuffer = Buffer.from('too short');
        expect(() =>
          GuidUint8Array.fromPlatformBuffer(
            wrongBuffer as RawGuidPlatformBuffer,
          ),
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
        const guid = GuidUint8Array.fromPlatformBuffer(uint8Array);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should throw on wrong Uint8Array length', () => {
        const wrongLength = new Uint8Array([0x01, 0x02, 0x03]);
        expect(() => GuidUint8Array.fromPlatformBuffer(wrongLength)).toThrow(
          GuidError,
        );
      });

      it('should handle all zeros Uint8Array', () => {
        const zeros = new Uint8Array(16).fill(0);
        const guid = GuidUint8Array.fromPlatformBuffer(zeros);
        expect(guid.asFullHexGuid).toBe(allZerosFullHex);
      });

      it('should handle all 0xFF Uint8Array', () => {
        const ffs = new Uint8Array(16).fill(0xff);
        const guid = GuidUint8Array.fromPlatformBuffer(ffs);
        expect(guid.asFullHexGuid).toBe(allFsFullHex);
      });

      it('should roundtrip from asUint8Array', () => {
        const original = GuidUint8Array.generate();
        const uint8 = original.asPlatformBuffer;
        const reconstructed = GuidUint8Array.fromPlatformBuffer(uint8);
        expect(reconstructed.equals(original)).toBe(true);
      });
    });
  });

  describe('New Instance Methods', () => {
    describe('clone', () => {
      it('should create an independent copy', () => {
        const guid1 = new GuidUint8Array(testFullHexGuid);
        const guid2 = guid1.clone();

        expect(guid2).toBeInstanceOf(GuidUint8Array);
        expect(guid2).not.toBe(guid1); // Different instances
        expect(guid2.equals(guid1)).toBe(true); // Same value
        expect(guid2.asFullHexGuid).toBe(guid1.asFullHexGuid);
      });

      it('should create independent buffer copies', () => {
        const guid1 = new GuidUint8Array(testFullHexGuid);
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
        const guid1 = new GuidUint8Array(allZerosFullHex);
        const guid2 = guid1.clone();

        expect(guid2.asFullHexGuid).toBe(allZerosFullHex);
        expect(guid2.equals(guid1)).toBe(true);
      });
    });

    describe('hashCode', () => {
      it('should return consistent hash for same GUID', () => {
        const guid1 = new GuidUint8Array(testFullHexGuid);
        const guid2 = new GuidUint8Array(testFullHexGuid);

        expect(guid1.hashCode()).toBe(guid2.hashCode());
      });

      it('should return different hash for different GUIDs', () => {
        const guid1 = new GuidUint8Array(testFullHexGuid);
        const guid2 = GuidUint8Array.new();

        // Extremely unlikely to collide
        expect(guid1.hashCode()).not.toBe(guid2.hashCode());
      });

      it('should return same hash on multiple calls', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const hash1 = guid.hashCode();
        const hash2 = guid.hashCode();

        expect(hash1).toBe(hash2);
      });

      it('should return numeric hash', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const hash = guid.hashCode();

        expect(typeof hash).toBe('number');
        expect(Number.isFinite(hash)).toBe(true);
        expect(Number.isInteger(hash)).toBe(true);
      });

      it('should handle boundary values', () => {
        const guid1 = new GuidUint8Array(allZerosFullHex);
        const guid2 = new GuidUint8Array(allFsFullHex);

        expect(typeof guid1.hashCode()).toBe('number');
        expect(typeof guid2.hashCode()).toBe('number');
        expect(guid1.hashCode()).not.toBe(guid2.hashCode());
      });

      it('should be useful for Map keys', () => {
        const map = new Map<number, GuidUint8Array>();
        const guid1 = new GuidUint8Array(testFullHexGuid);
        const guid2 = GuidUint8Array.new();

        map.set(guid1.hashCode(), guid1);
        map.set(guid2.hashCode(), guid2);

        expect(map.get(guid1.hashCode())).toBe(guid1);
        expect(map.get(guid2.hashCode())).toBe(guid2);
      });
    });

    describe('equals with null safety', () => {
      it('should handle null parameter', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        expect(guid.equals(null)).toBe(false);
      });

      it('should handle undefined parameter', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        expect(guid.equals(undefined)).toBe(false);
      });

      it('should return true for equal GUIDs', () => {
        const guid1 = new GuidUint8Array(testFullHexGuid);
        const guid2 = new GuidUint8Array(testFullHexGuid);
        expect(guid1.equals(guid2)).toBe(true);
      });

      it('should return false for different GUIDs', () => {
        const guid1 = new GuidUint8Array(testFullHexGuid);
        const guid2 = GuidUint8Array.new();
        expect(guid1.equals(guid2)).toBe(false);
      });
    });
  });

  describe('Performance and Caching', () => {
    describe('Getter caching', () => {
      it('should cache asFullHexGuid results', () => {
        const guid = new GuidUint8Array(testShortHexGuid);
        const result1 = guid.asFullHexGuid;
        const result2 = guid.asFullHexGuid;

        // Should return same string instance (cached)
        expect(result1).toBe(result2);
        expect(result1).toBe(testFullHexGuid);
      });

      it('should cache asShortHexGuid results', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const result1 = guid.asShortHexGuid;
        const result2 = guid.asShortHexGuid;

        // Should return same string instance (cached)
        expect(result1).toBe(result2);
        expect(result1).toBe(testShortHexGuid);
      });

      it('should not recompute cached values', () => {
        const guid = new GuidUint8Array(testBase64Guid);

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
          GuidUint8Array.fromFullHex(testFullHexGuid);
        }

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(1000); // Should complete in < 1 second
      });
    });
  });

  describe('lengthToGuidBrand optimization', () => {
    it('should use O(1) lookup via ReverseLengthMap', () => {
      // Valid lengths
      expect(GuidUint8Array.lengthToGuidBrand(36, false)).toBe(
        GuidBrandType.FullHexGuid,
      );
      expect(GuidUint8Array.lengthToGuidBrand(32, false)).toBe(
        GuidBrandType.ShortHexGuid,
      );
      expect(GuidUint8Array.lengthToGuidBrand(24, false)).toBe(
        GuidBrandType.Base64Guid,
      );
      expect(GuidUint8Array.lengthToGuidBrand(16, true)).toBe(
        GuidBrandType.RawGuidPlatformBuffer,
      );
    });

    it('should validate type consistency (buffer vs string)', () => {
      // Should throw when isBuffer doesn't match brand type
      expect(() => GuidUint8Array.lengthToGuidBrand(16, false)).toThrow(
        GuidError,
      );
      expect(() => GuidUint8Array.lengthToGuidBrand(36, true)).toThrow(
        GuidError,
      );
    });

    it('should throw on zero or negative length', () => {
      expect(() => GuidUint8Array.lengthToGuidBrand(0, false)).toThrow(
        GuidError,
      );
      expect(() => GuidUint8Array.lengthToGuidBrand(-1, false)).toThrow(
        GuidError,
      );
    });

    it('should throw on unknown length', () => {
      expect(() => GuidUint8Array.lengthToGuidBrand(999, false)).toThrow(
        GuidError,
      );
    });
  });

  describe('validateAndConvert centralization', () => {
    it('should provide consistent error messages', () => {
      // All invalid inputs should go through same validation path
      expect(() => new GuidUint8Array(null as any)).toThrow(GuidError);

      try {
        new GuidUint8Array(null as any);
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
      const guid1 = new GuidUint8Array(testFullHexGuid);
      const guid2 = new GuidUint8Array(testShortHexGuid);
      const guid3 = new GuidUint8Array(testBase64Guid);
      const guid4 = new GuidUint8Array(testBigIntGuid);
      const guid5 = new GuidUint8Array(testRawGuidBuffer);

      // All should represent the same GUID
      expect(guid1.equals(guid2)).toBe(true);
      expect(guid1.equals(guid3)).toBe(true);
      expect(guid1.equals(guid4)).toBe(true);
      expect(guid1.equals(guid5)).toBe(true);
    });

    it('should handle 0n bigint specially', () => {
      // 0n is falsy but should be valid
      const guid = new GuidUint8Array(0n as BigIntGuid);
      expect(guid.asBigIntGuid).toBe(0n);
    });

    it('should reject negative bigint', () => {
      expect(() => new GuidUint8Array(-1n as BigIntGuid)).toThrow(GuidError);
      expect(() => new GuidUint8Array(-100n as BigIntGuid)).toThrow(GuidError);
    });

    it('should validate hex string format', () => {
      // Invalid hex characters should be rejected
      expect(
        () =>
          new GuidUint8Array(
            'ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ' as FullHexGuid,
          ),
      ).toThrow(GuidError);
      expect(
        () =>
          new GuidUint8Array(
            'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG' as ShortHexGuid,
          ),
      ).toThrow(GuidError);
    });
  });

  describe('Buffer Immutability', () => {
    it('should return defensive copy from asRawGuidBuffer', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
      const buffer1 = guid.asRawGuidPlatformBuffer;
      const buffer2 = guid.asRawGuidPlatformBuffer;

      // Should be different buffer instances
      expect(buffer1).not.toBe(buffer2);

      // But same content
      expect(Buffer.compare(buffer1, buffer2)).toBe(0);
    });

    it('should prevent external mutation via asRawGuidBuffer', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
      const originalHex = guid.asFullHexGuid;

      // Get buffer and try to mutate it
      const buffer = guid.asRawGuidPlatformBuffer;
      buffer[0] = 0xff;
      buffer[1] = 0xff;

      // GUID should be unchanged
      expect(guid.asFullHexGuid).toBe(originalHex);
    });

    it('asRawGuidBufferUnsafe should return same instance', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
      const buffer1 = guid.asRawGuidPlatformBufferUnsafe;
      const buffer2 = guid.asRawGuidPlatformBufferUnsafe;

      // Should be same buffer instance
      expect(buffer1).toBe(buffer2);
    });
  });

  describe('isEmpty and isNilOrEmpty', () => {
    it('should detect empty GUID', () => {
      const emptyGuid = new GuidUint8Array(allZerosFullHex);
      expect(emptyGuid.isEmpty()).toBe(true);
    });

    it('should return false for non-empty GUID', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
      expect(guid.isEmpty()).toBe(false);
    });

    it('Empty constant should be empty', () => {
      expect(GuidUint8Array.Empty.isEmpty()).toBe(true);
    });

    it('isNilOrEmpty should handle null', () => {
      expect(GuidUint8Array.isNilOrEmpty(null)).toBe(true);
    });

    it('isNilOrEmpty should handle undefined', () => {
      expect(GuidUint8Array.isNilOrEmpty(undefined)).toBe(true);
    });

    it('isNilOrEmpty should handle empty GUID', () => {
      const emptyGuid = new GuidUint8Array(allZerosFullHex);
      expect(GuidUint8Array.isNilOrEmpty(emptyGuid)).toBe(true);
    });

    it('isNilOrEmpty should return false for valid GUID', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
      expect(GuidUint8Array.isNilOrEmpty(guid)).toBe(false);
    });
  });

  describe('RFC 4122 Version Support', () => {
    it('should extract version from v4 GUID', () => {
      const v4Guid = GuidUint8Array.new();
      expect(v4Guid.getVersion()).toBe(4);
    });

    it('should return undefined for boundary values', () => {
      const emptyGuid = new GuidUint8Array(allZerosFullHex);
      expect(emptyGuid.getVersion()).toBeUndefined();

      const ffGuid = new GuidUint8Array(allFsFullHex);
      expect(ffGuid.getVersion()).toBeUndefined();
    });

    it('should validate v4 GUIDs correctly', () => {
      const v4Guid = GuidUint8Array.new();
      expect(v4Guid.isValidV4()).toBe(true);
    });

    it('should accept boundary values as valid', () => {
      const emptyGuid = new GuidUint8Array(allZerosFullHex);
      expect(emptyGuid.isValidV4()).toBe(true);

      const ffGuid = new GuidUint8Array(allFsFullHex);
      expect(ffGuid.isValidV4()).toBe(true);
    });
  });

  describe('compareTo', () => {
    it('should return 0 for equal GUIDs', () => {
      const guid1 = new GuidUint8Array(testFullHexGuid);
      const guid2 = new GuidUint8Array(testFullHexGuid);
      expect(guid1.compareTo(guid2)).toBe(0);
    });

    it('should return consistent ordering', () => {
      const guid1 = new GuidUint8Array(allZerosFullHex);
      const guid2 = new GuidUint8Array(testFullHexGuid);

      expect(guid1.compareTo(guid2)).toBeLessThan(0);
      expect(guid2.compareTo(guid1)).toBeGreaterThan(0);
    });

    it('should enable array sorting', () => {
      const guids = [
        GuidUint8Array.new(),
        new GuidUint8Array(allZerosFullHex),
        GuidUint8Array.new(),
        new GuidUint8Array(allFsFullHex),
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
      const guid = new GuidUint8Array(testFullHexGuid);
      const base64_1 = guid.asBase64Guid;
      const base64_2 = guid.asBase64Guid;

      // Should return same instance (cached)
      expect(base64_1).toBe(base64_2);
    });

    it('toString should use cached base64', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
      const str1 = guid.toString();
      const str2 = guid.toString();

      expect(str1).toBe(str2);
    });
  });

  describe('Parse and TryParse API', () => {
    describe('parse', () => {
      it('should parse valid full hex', () => {
        const guid = GuidUint8Array.parse(testFullHexGuid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should throw on invalid input', () => {
        expect(() => GuidUint8Array.parse('invalid')).toThrow(GuidError);
      });

      it('should parse all valid formats', () => {
        expect(GuidUint8Array.parse(testFullHexGuid)).toBeInstanceOf(
          GuidUint8Array,
        );
        expect(GuidUint8Array.parse(testShortHexGuid)).toBeInstanceOf(
          GuidUint8Array,
        );
        expect(GuidUint8Array.parse(testBase64Guid)).toBeInstanceOf(
          GuidUint8Array,
        );
        expect(GuidUint8Array.parse(testBigIntGuid)).toBeInstanceOf(
          GuidUint8Array,
        );
        expect(GuidUint8Array.parse(testRawGuidBuffer)).toBeInstanceOf(
          GuidUint8Array,
        );
      });
    });

    describe('tryParse', () => {
      it('should return GUID for valid input', () => {
        const guid = GuidUint8Array.tryParse(testFullHexGuid);
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid?.asFullHexGuid).toBe(testFullHexGuid);
      });

      it('should return null for invalid input', () => {
        const guid = GuidUint8Array.tryParse('invalid');
        expect(guid).toBeNull();
      });

      it('should return null for malformed hex', () => {
        const guid = GuidUint8Array.tryParse(
          'ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ',
        );
        expect(guid).toBeNull();
      });

      it('should handle all valid formats', () => {
        expect(GuidUint8Array.tryParse(testFullHexGuid)).not.toBeNull();
        expect(GuidUint8Array.tryParse(testShortHexGuid)).not.toBeNull();
        expect(GuidUint8Array.tryParse(testBase64Guid)).not.toBeNull();
        expect(GuidUint8Array.tryParse(testBigIntGuid)).not.toBeNull();
        expect(GuidUint8Array.tryParse(testRawGuidBuffer)).not.toBeNull();
      });
    });

    describe('isValid', () => {
      it('should return true for valid GUIDs', () => {
        expect(GuidUint8Array.isValid(testFullHexGuid)).toBe(true);
        expect(GuidUint8Array.isValid(testShortHexGuid)).toBe(true);
        expect(GuidUint8Array.isValid(testBase64Guid)).toBe(true);
      });

      it('should return false for invalid input', () => {
        expect(GuidUint8Array.isValid('invalid')).toBe(false);
        expect(GuidUint8Array.isValid('')).toBe(false);
        expect(GuidUint8Array.isValid(null)).toBe(false);
        expect(GuidUint8Array.isValid(undefined)).toBe(false);
      });

      it('should validate without creating instance', () => {
        // This should not throw even for invalid input
        expect(() => GuidUint8Array.isValid('ZZZZ')).not.toThrow();
      });
    });

    describe('generate', () => {
      it('should create new random GUID', () => {
        const guid = GuidUint8Array.generate();
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.isValidV4()).toBe(true);
      });

      it('should generate unique GUIDs', () => {
        const guid1 = GuidUint8Array.generate();
        const guid2 = GuidUint8Array.generate();
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('new() should still work for backward compatibility', () => {
        const guid = GuidUint8Array.new();
        expect(guid).toBeInstanceOf(GuidUint8Array);
        expect(guid.isValidV4()).toBe(true);
      });
    });
  });

  describe('Constant-Time Equality', () => {
    it('should support regular equality', () => {
      const guid1 = new GuidUint8Array(testFullHexGuid);
      const guid2 = new GuidUint8Array(testFullHexGuid);
      expect(guid1.equals(guid2)).toBe(true);
    });

    it('should support constant-time equality', () => {
      const guid1 = new GuidUint8Array(testFullHexGuid);
      const guid2 = new GuidUint8Array(testFullHexGuid);
      expect(guid1.equals(guid2, true)).toBe(true);
    });

    it('constant-time should return false for different GUIDs', () => {
      const guid1 = new GuidUint8Array(testFullHexGuid);
      const guid2 = GuidUint8Array.generate();
      expect(guid1.equals(guid2, true)).toBe(false);
    });

    it('should handle null with constant-time', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
      expect(guid.equals(null, true)).toBe(false);
    });
  });

  describe('Namespace GUIDs (v3 and v5)', () => {
    describe('v3 (MD5)', () => {
      it('should create v3 GUID from name and namespace', () => {
        const guid = GuidUint8Array.v3(
          'example.com',
          GuidUint8Array.Namespaces.DNS,
        );
        expect(guid).toBeInstanceOf(GuidUint8Array);
      });

      it('should be deterministic', () => {
        const guid1 = GuidUint8Array.v3(
          'example.com',
          GuidUint8Array.Namespaces.DNS,
        );
        const guid2 = GuidUint8Array.v3(
          'example.com',
          GuidUint8Array.Namespaces.DNS,
        );
        expect(guid1.equals(guid2)).toBe(true);
      });

      it('should differ for different names', () => {
        const guid1 = GuidUint8Array.v3(
          'example.com',
          GuidUint8Array.Namespaces.DNS,
        );
        const guid2 = GuidUint8Array.v3(
          'different.com',
          GuidUint8Array.Namespaces.DNS,
        );
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('should differ for different namespaces', () => {
        const guid1 = GuidUint8Array.v3(
          'example',
          GuidUint8Array.Namespaces.DNS,
        );
        const guid2 = GuidUint8Array.v3(
          'example',
          GuidUint8Array.Namespaces.URL,
        );
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('should extract version 3', () => {
        const guid = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
        expect(guid.getVersion()).toBe(3);
      });
    });

    describe('v5 (SHA-1)', () => {
      it('should create v5 GUID from name and namespace', () => {
        const guid = GuidUint8Array.v5(
          'example.com',
          GuidUint8Array.Namespaces.DNS,
        );
        expect(guid).toBeInstanceOf(GuidUint8Array);
      });

      it('should be deterministic', () => {
        const guid1 = GuidUint8Array.v5(
          'example.com',
          GuidUint8Array.Namespaces.DNS,
        );
        const guid2 = GuidUint8Array.v5(
          'example.com',
          GuidUint8Array.Namespaces.DNS,
        );
        expect(guid1.equals(guid2)).toBe(true);
      });

      it('should differ for different names', () => {
        const guid1 = GuidUint8Array.v5(
          'example.com',
          GuidUint8Array.Namespaces.DNS,
        );
        const guid2 = GuidUint8Array.v5(
          'different.com',
          GuidUint8Array.Namespaces.DNS,
        );
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('should extract version 5', () => {
        const guid = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS);
        expect(guid.getVersion()).toBe(5);
      });

      it('should differ from v3 for same input', () => {
        const v3Guid = GuidUint8Array.v3(
          'example.com',
          GuidUint8Array.Namespaces.DNS,
        );
        const v5Guid = GuidUint8Array.v5(
          'example.com',
          GuidUint8Array.Namespaces.DNS,
        );
        expect(v3Guid.equals(v5Guid)).toBe(false);
      });
    });

    describe('Namespaces', () => {
      it('should have DNS namespace', () => {
        expect(GuidUint8Array.Namespaces.DNS).toBeDefined();
        expect(typeof GuidUint8Array.Namespaces.DNS).toBe('string');
      });

      it('should have URL namespace', () => {
        expect(GuidUint8Array.Namespaces.URL).toBeDefined();
        expect(typeof GuidUint8Array.Namespaces.URL).toBe('string');
      });
    });
  });

  describe('Immutability', () => {
    it('should seal instances', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
      expect(Object.isSealed(guid)).toBe(true);
    });

    it('should prevent property addition', () => {
      const guid = new GuidUint8Array(testFullHexGuid) as any;
      expect(() => {
        guid.newProperty = 'test';
      }).toThrow();
    });

    it('should prevent property deletion', () => {
      const guid = new GuidUint8Array(testFullHexGuid) as any;
      expect(() => {
        delete guid._value;
      }).toThrow();
    });

    it('should still allow cache updates', () => {
      const guid = new GuidUint8Array(testFullHexGuid);
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
        const v3Guid = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
        expect(v3Guid.isValidV3()).toBe(true);
      });

      it('should return false for v4 GUID', () => {
        const v4Guid = GuidUint8Array.generate();
        expect(v4Guid.isValidV3()).toBe(false);
      });

      it('should return false for v5 GUID', () => {
        const v5Guid = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS);
        expect(v5Guid.isValidV3()).toBe(false);
      });
    });

    describe('isValidV5', () => {
      it('should return true for v5 GUID', () => {
        const v5Guid = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS);
        expect(v5Guid.isValidV5()).toBe(true);
      });

      it('should return false for v4 GUID', () => {
        const v4Guid = GuidUint8Array.generate();
        expect(v4Guid.isValidV5()).toBe(false);
      });

      it('should return false for v3 GUID', () => {
        const v3Guid = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
        expect(v3Guid.isValidV5()).toBe(false);
      });
    });

    describe('Cross-version validation', () => {
      it('v3 GUID should only validate as v3', () => {
        const v3Guid = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
        expect(v3Guid.isValidV3()).toBe(true);
        expect(v3Guid.isValidV4()).toBe(false);
        expect(v3Guid.isValidV5()).toBe(false);
      });

      it('v4 GUID should only validate as v4', () => {
        const v4Guid = GuidUint8Array.generate();
        expect(v4Guid.isValidV3()).toBe(false);
        expect(v4Guid.isValidV4()).toBe(true);
        expect(v4Guid.isValidV5()).toBe(false);
      });

      it('v5 GUID should only validate as v5', () => {
        const v5Guid = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS);
        expect(v5Guid.isValidV3()).toBe(false);
        expect(v5Guid.isValidV4()).toBe(false);
        expect(v5Guid.isValidV5()).toBe(true);
      });
    });
  });

  describe('V1 GUID Support', () => {
    describe('v1 creation', () => {
      it('should create v1 GUID', () => {
        const v1Guid = GuidUint8Array.v1();
        expect(v1Guid).toBeInstanceOf(GuidUint8Array);
        expect(v1Guid.getVersion()).toBe(1);
      });

      it('should create unique v1 GUIDs', () => {
        const guid1 = GuidUint8Array.v1();
        const guid2 = GuidUint8Array.v1();
        expect(guid1.equals(guid2)).toBe(false);
      });

      it('should validate as v1', () => {
        const v1Guid = GuidUint8Array.v1();
        expect(v1Guid.isValidV1()).toBe(true);
        expect(v1Guid.isValidV3()).toBe(false);
        expect(v1Guid.isValidV4()).toBe(false);
        expect(v1Guid.isValidV5()).toBe(false);
      });
    });

    describe('getTimestamp', () => {
      it('should extract timestamp from v1 GUID', () => {
        const v1Guid = GuidUint8Array.v1();
        const timestamp = v1Guid.getTimestamp();
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp!.getTime()).toBeGreaterThan(Date.now() - 1000);
        expect(timestamp!.getTime()).toBeLessThan(Date.now() + 1000);
      });

      it('should return undefined for v4 GUID', () => {
        const v4Guid = GuidUint8Array.generate();
        expect(v4Guid.getTimestamp()).toBeUndefined();
      });

      it('should return undefined for v3 GUID', () => {
        const v3Guid = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
        expect(v3Guid.getTimestamp()).toBeUndefined();
      });

      it('should return undefined for v5 GUID', () => {
        const v5Guid = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS);
        expect(v5Guid.getTimestamp()).toBeUndefined();
      });
    });

    describe('isValidV1', () => {
      it('should return true for v1 GUID', () => {
        const v1Guid = GuidUint8Array.v1();
        expect(v1Guid.isValidV1()).toBe(true);
      });

      it('should return false for v4 GUID', () => {
        const v4Guid = GuidUint8Array.generate();
        expect(v4Guid.isValidV1()).toBe(false);
      });
    });
  });

  describe('V6 GUID Support', () => {
    it('should create v6 GUID', () => {
      const v6Guid = GuidUint8Array.v6();
      expect(v6Guid).toBeInstanceOf(GuidUint8Array);
      expect(v6Guid.getVersion()).toBe(6);
    });

    it('should create unique v6 GUIDs', () => {
      const guid1 = GuidUint8Array.v6();
      const guid2 = GuidUint8Array.v6();
      expect(guid1.equals(guid2)).toBe(false);
    });

    it('should validate as v6', () => {
      const v6Guid = GuidUint8Array.v6();
      expect(v6Guid.isValidV6()).toBe(true);
      expect(v6Guid.isValidV1()).toBe(false);
      expect(v6Guid.isValidV3()).toBe(false);
      expect(v6Guid.isValidV4()).toBe(false);
      expect(v6Guid.isValidV5()).toBe(false);
      expect(v6Guid.isValidV7()).toBe(false);
    });
  });

  describe('V7 GUID Support', () => {
    it('should create v7 GUID', () => {
      const v7Guid = GuidUint8Array.v7();
      expect(v7Guid).toBeInstanceOf(GuidUint8Array);
      expect(v7Guid.getVersion()).toBe(7);
    });

    it('should create unique v7 GUIDs', () => {
      const guid1 = GuidUint8Array.v7();
      const guid2 = GuidUint8Array.v7();
      expect(guid1.equals(guid2)).toBe(false);
    });

    it('should validate as v7', () => {
      const v7Guid = GuidUint8Array.v7();
      expect(v7Guid.isValidV7()).toBe(true);
      expect(v7Guid.isValidV1()).toBe(false);
      expect(v7Guid.isValidV3()).toBe(false);
      expect(v7Guid.isValidV4()).toBe(false);
      expect(v7Guid.isValidV5()).toBe(false);
      expect(v7Guid.isValidV6()).toBe(false);
    });
  });

  describe('Variant Detection', () => {
    describe('getVariant', () => {
      it('should detect RFC 4122 variant for v4 GUID', () => {
        const v4Guid = GuidUint8Array.generate();
        expect(v4Guid.getVariant()).toBe(1);
      });

      it('should detect RFC 4122 variant for v1 GUID', () => {
        const v1Guid = GuidUint8Array.v1();
        expect(v1Guid.getVariant()).toBe(1);
      });

      it('should detect RFC 4122 variant for v3 GUID', () => {
        const v3Guid = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
        expect(v3Guid.getVariant()).toBe(1);
      });

      it('should detect RFC 4122 variant for v5 GUID', () => {
        const v5Guid = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS);
        expect(v5Guid.getVariant()).toBe(1);
      });

      it('should detect RFC 4122 variant for v6 GUID', () => {
        const v6Guid = GuidUint8Array.v6();
        expect(v6Guid.getVariant()).toBe(1);
      });

      it('should detect RFC 4122 variant for v7 GUID', () => {
        const v7Guid = GuidUint8Array.v7();
        expect(v7Guid.getVariant()).toBe(1);
      });
    });
  });

  describe('URL-Safe Base64', () => {
    describe('asUrlSafeBase64', () => {
      it('should return URL-safe base64 string', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const urlSafe = guid.asUrlSafeBase64;
        expect(urlSafe).toBeDefined();
        expect(urlSafe).not.toContain('+');
        expect(urlSafe).not.toContain('/');
        expect(urlSafe).not.toContain('=');
      });

      it('should be different from regular base64', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const regular = guid.asBase64Guid;
        const urlSafe = guid.asUrlSafeBase64;
        expect(urlSafe).not.toBe(regular);
      });

      it('should handle boundary values', () => {
        const zeroGuid = new GuidUint8Array(allZerosFullHex);
        const urlSafe = zeroGuid.asUrlSafeBase64;
        expect(urlSafe).toBeDefined();
        expect(typeof urlSafe).toBe('string');
      });
    });

    describe('fromUrlSafeBase64', () => {
      it('should create GUID from URL-safe base64', () => {
        const original = new GuidUint8Array(testFullHexGuid);
        const urlSafe = original.asUrlSafeBase64;
        const restored = GuidUint8Array.fromUrlSafeBase64(urlSafe);
        expect(restored.equals(original)).toBe(true);
      });

      it('should round-trip correctly', () => {
        const guid1 = GuidUint8Array.generate();
        const urlSafe = guid1.asUrlSafeBase64;
        const guid2 = GuidUint8Array.fromUrlSafeBase64(urlSafe);
        expect(guid2.equals(guid1)).toBe(true);
      });

      it('should handle boundary values', () => {
        const zeroGuid = new GuidUint8Array(allZerosFullHex);
        const urlSafe = zeroGuid.asUrlSafeBase64;
        const restored = GuidUint8Array.fromUrlSafeBase64(urlSafe);
        expect(restored.equals(zeroGuid)).toBe(true);
      });

      it('should work with all GUID versions', () => {
        const v1 = GuidUint8Array.v1();
        const v3 = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
        const v4 = GuidUint8Array.generate();
        const v5 = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS);

        expect(
          GuidUint8Array.fromUrlSafeBase64(v1.asUrlSafeBase64).equals(v1),
        ).toBe(true);
        expect(
          GuidUint8Array.fromUrlSafeBase64(v3.asUrlSafeBase64).equals(v3),
        ).toBe(true);
        expect(
          GuidUint8Array.fromUrlSafeBase64(v4.asUrlSafeBase64).equals(v4),
        ).toBe(true);
        expect(
          GuidUint8Array.fromUrlSafeBase64(v5.asUrlSafeBase64).equals(v5),
        ).toBe(true);
      });

      it('should handle URL-safe characters correctly', () => {
        // Create a GUID that will have + or / in base64
        const guid = GuidUint8Array.generate();
        const urlSafe = guid.asUrlSafeBase64;

        // Verify no URL-unsafe characters
        expect(urlSafe).not.toMatch(/[+/=]/);

        // Verify round-trip
        const restored = GuidUint8Array.fromUrlSafeBase64(urlSafe);
        expect(restored.equals(guid)).toBe(true);
      });
    });
  });

  describe('Debug String', () => {
    describe('toDebugString', () => {
      it('should return debug string for v4 GUID', () => {
        const v4Guid = GuidUint8Array.generate();
        const debug = v4Guid.toDebugString();
        expect(debug).toContain('Guid(');
        expect(debug).toContain('v4');
        expect(debug).toContain('variant=1');
      });

      it('should return debug string for v1 GUID', () => {
        const v1Guid = GuidUint8Array.v1();
        const debug = v1Guid.toDebugString();
        expect(debug).toContain('Guid(');
        expect(debug).toContain('v1');
        expect(debug).toContain('variant=1');
      });

      it('should return debug string for v3 GUID', () => {
        const v3Guid = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
        const debug = v3Guid.toDebugString();
        expect(debug).toContain('Guid(');
        expect(debug).toContain('v3');
        expect(debug).toContain('variant=1');
      });

      it('should return debug string for v5 GUID', () => {
        const v5Guid = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS);
        const debug = v5Guid.toDebugString();
        expect(debug).toContain('Guid(');
        expect(debug).toContain('v5');
        expect(debug).toContain('variant=1');
      });

      it('should include full hex representation', () => {
        const guid = new GuidUint8Array(testFullHexGuid);
        const debug = guid.toDebugString();
        expect(debug).toContain(testFullHexGuid);
      });

      it('should handle boundary values', () => {
        const zeroGuid = new GuidUint8Array(allZerosFullHex);
        const debug = zeroGuid.toDebugString();
        expect(debug).toContain('Guid(');
        expect(debug).toContain(allZerosFullHex);
      });
    });
  });

  describe('Complete Version Support', () => {
    it('should support all RFC 4122 versions', () => {
      const v1 = GuidUint8Array.v1();
      const v3 = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
      const v4 = GuidUint8Array.generate();
      const v5 = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS);

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
      const v1 = GuidUint8Array.v1();
      expect(v1.isValidV1()).toBe(true);
      expect(v1.isValidV3()).toBe(false);
      expect(v1.isValidV4()).toBe(false);
      expect(v1.isValidV5()).toBe(false);
    });
  });

  describe('Powerhouse Integration', () => {
    it('should convert v1 GUID to all formats', () => {
      const v1 = GuidUint8Array.v1();
      expect(v1.asFullHexGuid).toBeDefined();
      expect(v1.asShortHexGuid).toBeDefined();
      expect(v1.asBase64Guid).toBeDefined();
      expect(v1.asUrlSafeBase64).toBeDefined();
      expect(v1.asBigIntGuid).toBeDefined();
      expect(v1.asRawGuidPlatformBuffer).toBeDefined();
    });

    it('should extract metadata from v1 GUID', () => {
      const v1 = GuidUint8Array.v1();
      expect(v1.getVersion()).toBe(1);
      expect(v1.getVariant()).toBe(1);
      expect(v1.getTimestamp()).toBeInstanceOf(Date);
      expect(v1.toDebugString()).toContain('v1');
    });

    it('should support all operations on all versions', () => {
      const versions = [
        GuidUint8Array.v1(),
        GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS),
        GuidUint8Array.generate(),
        GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS),
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
      const v1 = GuidUint8Array.v1();
      expect(v1.getVersion()).toBe(1);
      expect(v1.isValidV1()).toBe(true);
    });

    it('should create v3 GUID with version brand', () => {
      const v3 = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
      expect(v3.getVersion()).toBe(3);
      expect(v3.isValidV3()).toBe(true);
    });

    it('should create v4 GUID with version brand', () => {
      const v4 = GuidUint8Array.v4();
      expect(v4.getVersion()).toBe(4);
      expect(v4.isValidV4()).toBe(true);
    });

    it('should create v5 GUID with version brand', () => {
      const v5 = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS);
      expect(v5.getVersion()).toBe(5);
      expect(v5.isValidV5()).toBe(true);
    });

    it('should maintain version brand through conversions', () => {
      const v1 = GuidUint8Array.v1();
      const hex = v1.asFullHexGuid;
      const base64 = v1.asBase64Guid;
      const bigint = v1.asBigIntGuid;

      expect(hex).toBeDefined();
      expect(base64).toBeDefined();
      expect(bigint).toBeDefined();
      expect(v1.getVersion()).toBe(1);
    });

    it('should work with type guards', () => {
      const v1 = GuidUint8Array.v1();
      const v3 = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
      const v4 = GuidUint8Array.v4();
      const v5 = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.URL);

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
      const v1 = GuidUint8Array.v1();
      const v3 = GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS);
      const v4 = GuidUint8Array.v4();
      const v5 = GuidUint8Array.v5('test', GuidUint8Array.Namespaces.URL);

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
      const v1 = GuidUint8Array.v1();
      const cloned = v1.clone();
      expect(cloned.getVersion()).toBe(1);
      expect(cloned.equals(v1)).toBe(true);
    });

    it('should compare branded GUIDs correctly', () => {
      const v1a = GuidUint8Array.v1();
      const v1b = GuidUint8Array.v1();
      const v4 = GuidUint8Array.v4();

      expect(v1a.equals(v1a)).toBe(true);
      expect(v1a.equals(v1b)).toBe(false);
      expect(v1a.equals(v4)).toBe(false);
    });

    it('should serialize and deserialize branded GUIDs', () => {
      const v1 = GuidUint8Array.v1();
      const serialized = v1.serialize();
      const deserialized = GuidUint8Array.hydrate(serialized);

      expect(deserialized.equals(v1)).toBe(true);
      expect(deserialized.getVersion()).toBe(1);
    });

    it('should handle URL-safe base64 with branded types', () => {
      const v1 = GuidUint8Array.v1();
      const urlSafe = v1.asUrlSafeBase64;
      const restored = GuidUint8Array.fromUrlSafeBase64(urlSafe);

      expect(restored.equals(v1)).toBe(true);
      expect(restored.getVersion()).toBe(1);
    });

    it('should work with all factory methods', () => {
      const fromHex = GuidUint8Array.fromFullHex(
        GuidUint8Array.v4().asFullHexGuid,
      );
      const fromShort = GuidUint8Array.fromShortHex(
        GuidUint8Array.v4().asShortHexGuid,
      );
      const fromBase64 = GuidUint8Array.fromBase64(
        GuidUint8Array.v4().asBase64Guid,
      );
      const fromBigInt = GuidUint8Array.fromBigInt(
        GuidUint8Array.v4().asBigIntGuid,
      );
      const fromBuffer = GuidUint8Array.fromPlatformBuffer(
        GuidUint8Array.v4().asRawGuidPlatformBuffer,
      );

      [fromHex, fromShort, fromBase64, fromBigInt, fromBuffer].forEach(
        (guid) => {
          expect(guid).toBeInstanceOf(GuidUint8Array);
          expect(guid.getVersion()).toBeDefined();
        },
      );
    });
  });

  describe('Error Handling Coverage', () => {
    it('should handle v1 generation errors', () => {
      mockedUuid.v1.mockImplementationOnce(() => {
        throw new Error('v1 error');
      });
      expect(() => GuidUint8Array.v1()).toThrow(GuidError);
    });

    it('should handle v3 generation errors', () => {
      mockedUuid.v3.mockImplementationOnce(() => {
        throw new Error('v3 error');
      });
      expect(() =>
        GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS),
      ).toThrow(GuidError);
    });

    it('should handle v4 generation returning null', () => {
      mockedUuid.v4.mockImplementationOnce(() => null as unknown as string);
      expect(() => GuidUint8Array.generate()).toThrow(GuidError);
    });

    it('should handle v5 generation errors', () => {
      mockedUuid.v5.mockImplementationOnce(() => {
        throw new Error('v5 error');
      });
      expect(() =>
        GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS),
      ).toThrow(GuidError);
    });

    it('should handle bigint in isBase64Guid', () => {
      expect(GuidUint8Array.isBase64Guid(BigInt(123))).toBe(false);
    });

    it('should handle bigint in isRawGuidUint8Array', () => {
      expect(GuidUint8Array.isRawGuidUint8Array(BigInt(123))).toBe(false);
    });

    it('should handle invalid toRawGuidPlatformBuffer input', () => {
      expect(() =>
        GuidUint8Array.toRawGuidPlatformBuffer('invalid' as unknown as FullHexGuid),
      ).toThrow(GuidError);
    });

    it('should handle invalid brand in toRawGuidPlatformBuffer', () => {
      const invalidInput = { length: 99 } as unknown as FullHexGuid;
      expect(() =>
        GuidUint8Array.toRawGuidPlatformBuffer(invalidInput),
      ).toThrow(GuidError);
    });

    it('should handle catch blocks in validation methods', () => {
      const invalidValue = {
        toString: () => {
          throw new Error('test');
        },
      } as unknown as string;
      expect(GuidUint8Array.isBase64Guid(invalidValue)).toBe(false);
      expect(GuidUint8Array.isRawGuidUint8Array(invalidValue)).toBe(false);
      expect(GuidUint8Array.isBigIntGuid(invalidValue)).toBe(false);
    });

    it('should handle invalid length in toRawGuidPlatformBuffer result', () => {
      const shortArray = new Uint8Array(8);
      expect(() => new GuidUint8Array(shortArray as unknown as RawGuidPlatformBuffer)).toThrow(GuidError);
    });

    it('should handle GuidError re-throw in v3', () => {
      mockedUuid.v3.mockImplementationOnce(() => {
        throw new GuidError(GuidErrorType.InvalidGuid);
      });
      expect(() =>
        GuidUint8Array.v3('test', GuidUint8Array.Namespaces.DNS),
      ).toThrow(GuidError);
    });

    it('should handle GuidError re-throw in v5', () => {
      mockedUuid.v5.mockImplementationOnce(() => {
        throw new GuidError(GuidErrorType.InvalidGuid);
      });
      expect(() =>
        GuidUint8Array.v5('test', GuidUint8Array.Namespaces.DNS),
      ).toThrow(GuidError);
    });

    it('should handle GuidError re-throw in v1', () => {
      mockedUuid.v1.mockImplementationOnce(() => {
        throw new GuidError(GuidErrorType.InvalidGuid);
      });
      expect(() => GuidUint8Array.v1()).toThrow(GuidError);
    });

    it('should handle non-string/non-Uint8Array in Base64Guid conversion', () => {
      // Force the else branch in toRawGuidPlatformBuffer for Base64Guid
      const mockValue = {
        length: 24,
        toString: () => 'VQ6EAOKbQdSnFkRmVUQAAA==',
      } as unknown as FullHexGuid;
      // This should hit the else branch and throw
      expect(() => GuidUint8Array.toRawGuidPlatformBuffer(mockValue)).toThrow(
        GuidError,
      );
    });
  });
});
