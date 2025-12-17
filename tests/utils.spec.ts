import { LengthEncodingType } from '../src/enumerations/length-encoding-type';
import { LengthError } from '../src/errors';
import {
  arraysEqual,
  base64ToUint8Array,
  concatUint8Arrays,
  crc16,
  decodeLengthEncodedData,
  getLengthEncodingTypeForLength,
  getLengthEncodingTypeFromValue,
  getLengthForLengthType,
  hexToUint8Array,
  lengthEncodeData,
  randomBytes,
  stringToUint8Array,
  uint8ArrayToHex,
  uint8ArrayToString,
} from '../src/utils';

describe('utils', () => {
  describe('lengthEncodeData', () => {
    it('encodes UInt8 length', () => {
      const data = new Uint8Array([116, 101, 115, 116]); // 'test'
      const result = lengthEncodeData(data);
      expect(result[0]).toBe(LengthEncodingType.UInt8);
      expect(result[1]).toBe(4);
      expect(Array.from(result.subarray(2))).toEqual([116, 101, 115, 116]);
    });

    it('encodes UInt16 length', () => {
      const data = new Uint8Array(300);
      const result = lengthEncodeData(data);
      const view = new DataView(
        result.buffer,
        result.byteOffset,
        result.byteLength,
      );
      expect(result[0]).toBe(LengthEncodingType.UInt16);
      expect(view.getUint16(1, false)).toBe(300); // big-endian
    });

    it('encodes UInt32 length', () => {
      const data = new Uint8Array(70000);
      const result = lengthEncodeData(data);
      const view = new DataView(
        result.buffer,
        result.byteOffset,
        result.byteLength,
      );
      expect(result[0]).toBe(LengthEncodingType.UInt32);
      expect(view.getUint32(1, false)).toBe(70000); // big-endian
    });
  });

  describe('decodeLengthEncodedData', () => {
    it('decodes UInt8 encoded data', () => {
      const original = new Uint8Array([104, 101, 108, 108, 111]); // 'hello'
      const encoded = lengthEncodeData(original);
      const { data, totalLength } = decodeLengthEncodedData(encoded);
      expect(Array.from(data)).toEqual([104, 101, 108, 108, 111]);
      expect(totalLength).toBe(encoded.length);
    });

    it('throws on empty buffer', () => {
      expect(() => decodeLengthEncodedData(new Uint8Array(0))).toThrow(
        LengthError,
      );
    });

    it('throws on insufficient length data', () => {
      const buffer = new Uint8Array([LengthEncodingType.UInt16]);
      expect(() => decodeLengthEncodedData(buffer)).toThrow(LengthError);
    });

    it('throws on insufficient data length', () => {
      const buffer = new Uint8Array([LengthEncodingType.UInt8, 10, 1, 2, 3]);
      expect(() => decodeLengthEncodedData(buffer)).toThrow(LengthError);
    });

    it('throws on invalid length type', () => {
      const buffer = new Uint8Array([99, 5, 1, 2, 3, 4, 5]);
      expect(() => decodeLengthEncodedData(buffer)).toThrow(LengthError);
    });
  });

  describe('base64ToUint8Array', () => {
    it('converts base64 to Uint8Array', () => {
      const base64 = btoa('hello');
      const result = base64ToUint8Array(base64);
      expect(new TextDecoder().decode(result)).toBe('hello');
    });
  });

  describe('uint8ArrayToHex', () => {
    it('converts Uint8Array to hex string', () => {
      const array = new Uint8Array([255, 0, 128]);
      expect(uint8ArrayToHex(array)).toBe('ff0080');
    });
  });

  describe('hexToUint8Array', () => {
    it('converts hex string to Uint8Array', () => {
      const result = hexToUint8Array('ff0080');
      expect(Array.from(result)).toEqual([255, 0, 128]);
    });
  });

  describe('crc16', () => {
    it('calculates CRC16-CCITT', () => {
      const data = new Uint8Array([0x31, 0x32, 0x33, 0x34, 0x35]);
      const result = crc16(data);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(0x45);
      expect(result[1]).toBe(0x60);
    });

    it('handles empty data', () => {
      const result = crc16(new Uint8Array(0));
      expect(result).toHaveLength(2);
    });
  });

  describe('stringToUint8Array', () => {
    it('converts string to UTF-8 bytes', () => {
      const result = stringToUint8Array('hello');
      expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
    });

    it('handles Unicode characters', () => {
      const result = stringToUint8Array('🚀');
      expect(result.length).toBe(4);
    });
  });

  describe('uint8ArrayToString', () => {
    it('converts UTF-8 bytes to string', () => {
      const array = new Uint8Array([104, 101, 108, 108, 111]);
      expect(uint8ArrayToString(array)).toBe('hello');
    });
  });

  describe('randomBytes', () => {
    it('generates random bytes of specified length', () => {
      const result = randomBytes(16);
      expect(result).toHaveLength(16);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('generates different values on subsequent calls', () => {
      const a = randomBytes(8);
      const b = randomBytes(8);
      expect(arraysEqual(a, b)).toBe(false);
    });
  });

  describe('arraysEqual', () => {
    it('returns true for equal arrays', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3]);
      expect(arraysEqual(a, b)).toBe(true);
    });

    it('returns false for different arrays', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 4]);
      expect(arraysEqual(a, b)).toBe(false);
    });

    it('returns false for different lengths', () => {
      const a = new Uint8Array([1, 2]);
      const b = new Uint8Array([1, 2, 3]);
      expect(arraysEqual(a, b)).toBe(false);
    });
  });

  describe('concatUint8Arrays', () => {
    it('concatenates multiple arrays', () => {
      const a = new Uint8Array([1, 2]);
      const b = new Uint8Array([3, 4]);
      const c = new Uint8Array([5]);
      const result = concatUint8Arrays(a, b, c);
      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
    });

    it('handles empty arrays', () => {
      const a = new Uint8Array([1]);
      const b = new Uint8Array([]);
      const c = new Uint8Array([2]);
      const result = concatUint8Arrays(a, b, c);
      expect(Array.from(result)).toEqual([1, 2]);
    });
  });

  describe('getLengthEncodingTypeForLength', () => {
    it('returns UInt8 for small numbers', () => {
      expect(getLengthEncodingTypeForLength(255)).toBe(
        LengthEncodingType.UInt8,
      );
    });

    it('returns UInt16 for medium numbers', () => {
      expect(getLengthEncodingTypeForLength(65535)).toBe(
        LengthEncodingType.UInt16,
      );
    });

    it('returns UInt32 for large numbers', () => {
      expect(getLengthEncodingTypeForLength(4294967295)).toBe(
        LengthEncodingType.UInt32,
      );
    });

    it('returns UInt64 for very large numbers', () => {
      expect(getLengthEncodingTypeForLength(Number.MAX_SAFE_INTEGER - 1)).toBe(
        LengthEncodingType.UInt64,
      );
    });

    it('handles BigInt values', () => {
      expect(getLengthEncodingTypeForLength(255n)).toBe(
        LengthEncodingType.UInt8,
      );
      expect(getLengthEncodingTypeForLength(65535n)).toBe(
        LengthEncodingType.UInt16,
      );
    });

    it('throws for too large values', () => {
      expect(() =>
        getLengthEncodingTypeForLength(Number.MAX_SAFE_INTEGER + 1),
      ).toThrow(LengthError);
      expect(() =>
        getLengthEncodingTypeForLength(18446744073709551616n),
      ).toThrow(LengthError);
    });

    it('throws for invalid types', () => {
      expect(() => getLengthEncodingTypeForLength('invalid' as any)).toThrow(
        LengthError,
      );
    });
  });

  describe('getLengthEncodingTypeFromValue', () => {
    it('returns correct type for valid values', () => {
      expect(getLengthEncodingTypeFromValue(0)).toBe(LengthEncodingType.UInt8);
      expect(getLengthEncodingTypeFromValue(1)).toBe(LengthEncodingType.UInt16);
      expect(getLengthEncodingTypeFromValue(2)).toBe(LengthEncodingType.UInt32);
      expect(getLengthEncodingTypeFromValue(3)).toBe(LengthEncodingType.UInt64);
    });

    it('throws for invalid values', () => {
      expect(() => getLengthEncodingTypeFromValue(99)).toThrow(LengthError);
    });
  });

  describe('getLengthForLengthType', () => {
    it('returns correct byte lengths', () => {
      expect(getLengthForLengthType(LengthEncodingType.UInt8)).toBe(1);
      expect(getLengthForLengthType(LengthEncodingType.UInt16)).toBe(2);
      expect(getLengthForLengthType(LengthEncodingType.UInt32)).toBe(4);
      expect(getLengthForLengthType(LengthEncodingType.UInt64)).toBe(8);
    });

    it('throws for invalid type', () => {
      expect(() => getLengthForLengthType(99 as any)).toThrow(LengthError);
    });
  });
});
