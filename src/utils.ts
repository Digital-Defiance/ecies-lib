import { EciesStringKey } from './enumerations/ecies-string-key';
import { LengthEncodingType } from './enumerations/length-encoding-type';
import { LengthErrorType } from './enumerations/length-error-type';
import { LengthError } from './errors';
import { EciesComponentId, getEciesI18nEngine } from './i18n-setup';

/**
 * Encodes the length of the data in the buffer
 * @param buffer The buffer to encode
 * @returns The encoded buffer
 */
export function lengthEncodeData(buffer: Uint8Array): Uint8Array {
  const lengthType: LengthEncodingType = getLengthEncodingTypeForLength(
    buffer.length,
  );
  const lengthTypeSize: number = getLengthForLengthType(lengthType);
  const result = new Uint8Array(1 + lengthTypeSize + buffer.length);
  const view = new DataView(result.buffer);

  view.setUint8(0, lengthType);
  switch (lengthType) {
    case LengthEncodingType.UInt8:
      view.setUint8(1, buffer.length);
      break;
    case LengthEncodingType.UInt16:
      view.setUint16(1, buffer.length, false); // big-endian
      break;
    case LengthEncodingType.UInt32:
      view.setUint32(1, buffer.length, false); // big-endian
      break;
    case LengthEncodingType.UInt64:
      view.setBigUint64(1, BigInt(buffer.length), false); // big-endian
      break;
  }
  result.set(buffer, 1 + lengthTypeSize);
  return result;
}

export function decodeLengthEncodedData(buffer: Uint8Array): {
  data: Uint8Array;
  totalLength: number;
} {
  if (buffer.length < 1) {
    throw new LengthError(LengthErrorType.LengthIsTooShort);
  }

  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );
  const lengthType: LengthEncodingType = getLengthEncodingTypeFromValue(
    view.getUint8(0),
  );
  const lengthTypeSize: number = getLengthForLengthType(lengthType);

  if (buffer.length < 1 + lengthTypeSize) {
    throw new LengthError(LengthErrorType.LengthIsTooShort);
  }

  let length: number | bigint;
  switch (lengthType) {
    case LengthEncodingType.UInt8:
      length = view.getUint8(1);
      break;
    case LengthEncodingType.UInt16:
      length = view.getUint16(1, false); // big-endian
      break;
    case LengthEncodingType.UInt32:
      length = view.getUint32(1, false); // big-endian
      break;
    case LengthEncodingType.UInt64:
      length = view.getBigUint64(1, false); // big-endian
      if (length.valueOf() > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new LengthError(LengthErrorType.LengthIsTooLong);
      }
      break;
    default:
      throw new LengthError(LengthErrorType.LengthIsInvalidType);
  }

  const totalLength = 1 + lengthTypeSize + Number(length);
  if (totalLength > buffer.length) {
    throw new LengthError(LengthErrorType.LengthIsTooShort);
  }
  return {
    data: buffer.subarray(1 + lengthTypeSize, totalLength),
    totalLength,
  };
}

export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

export function base64ToUint8Array(base64String: string): Uint8Array {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToUint8Array(hexString: string): Uint8Array {
  const engine = getEciesI18nEngine();
  if (!hexString || typeof hexString !== 'string') {
    throw new Error(
      engine.translate(
        EciesComponentId,
        EciesStringKey.Error_Utils_InvalidHexString,
      ),
    );
  }
  if (hexString.length % 2 !== 0) {
    throw new Error(
      engine.translate(
        EciesComponentId,
        EciesStringKey.Error_Utils_HexStringMustHaveEvenLength,
      ),
    );
  }
  if (!/^[0-9a-fA-F]*$/.test(hexString)) {
    throw new Error(
      engine.translate(
        EciesComponentId,
        EciesStringKey.Error_Utils_HexStringContainsInvalidCharacters,
      ),
    );
  }
  const len = hexString.length;
  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Utility functions for browser ECIES implementation
 */

/**
 * CRC16-CCITT implementation for data integrity checking
 * Uses CRC16-CCITT-FALSE variant (init 0xFFFF)
 */
export function crc16(data: Uint8Array): Uint8Array {
  let crc = 0xffff; // Initial value for CRC16-CCITT-FALSE
  const polynomial = 0x1021; // CRC16-CCITT polynomial

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff; // Keep it 16-bit
    }
  }

  const result = new Uint8Array(2);
  result[0] = (crc >>> 8) & 0xff; // Big-endian
  result[1] = crc & 0xff;
  return result;
}

/**
 * Convert string to Uint8Array (UTF-8 encoding)
 */
export function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to string (UTF-8 decoding)
 */
export function uint8ArrayToString(array: Uint8Array): string {
  return new TextDecoder().decode(array);
}

/**
 * Secure random bytes generation
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Compare two Uint8Arrays for equality
 */
export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

/**
 * Concatenate multiple Uint8Arrays
 */
export function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

/**
 * Get the length encoding type for a given length
 * @param length The length to evaluate
 * @returns The corresponding LengthEncodingType
 */
export function getLengthEncodingTypeForLength<
  _TStringKey extends string,
  _TLanguage extends string,
>(length: number | bigint): LengthEncodingType {
  if (typeof length === 'number') {
    if (length < 256) {
      return LengthEncodingType.UInt8;
    } else if (length < 65536) {
      return LengthEncodingType.UInt16;
    } else if (length < 4294967296) {
      return LengthEncodingType.UInt32;
    } else if (length < Number.MAX_SAFE_INTEGER) {
      return LengthEncodingType.UInt64;
    } else {
      throw new LengthError(LengthErrorType.LengthIsTooLong);
    }
  } else if (typeof length === 'bigint') {
    if (length < 256n) {
      return LengthEncodingType.UInt8;
    } else if (length < 65536n) {
      return LengthEncodingType.UInt16;
    } else if (length < 4294967296n) {
      return LengthEncodingType.UInt32;
    } else if (length < 18446744073709551616n) {
      return LengthEncodingType.UInt64;
    } else {
      throw new LengthError(LengthErrorType.LengthIsTooLong);
    }
  } else {
    throw new LengthError(LengthErrorType.LengthIsInvalidType);
  }
}

/**
 * Get the length encoding type for a given value
 * @param value The value to evaluate
 * @returns The corresponding LengthEncodingType
 */
export function getLengthEncodingTypeFromValue<
  _TStringKey extends string,
  _TLanguage extends string,
>(value: number): LengthEncodingType {
  for (const length of Object.values(LengthEncodingType)) {
    if (length === value) {
      return length;
    }
  }
  throw new LengthError(LengthErrorType.LengthIsInvalidType);
}

/**
 * Safely converts BigInt to Number, throwing if value exceeds safe integer range
 * @param value The BigInt value to convert
 * @returns The number value
 */
export function safeBigIntToNumber(value: bigint): number {
  const engine = getEciesI18nEngine();
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      engine.translate(
        EciesComponentId,
        EciesStringKey.Error_Utils_ValueExceedsSafeIntegerRange,
      ),
    );
  }
  if (value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error(
      engine.translate(
        EciesComponentId,
        EciesStringKey.Error_Utils_ValueBelowSafeIntegerRange,
      ),
    );
  }
  return Number(value);
}

/**
 * Get the length in bytes for a given LengthEncodingType
 * @param type The LengthEncodingType to evaluate
 * @returns The length in bytes
 */
export function getLengthForLengthType<
  _TStringKey extends string,
  _TLanguage extends string,
>(type: LengthEncodingType): number {
  switch (type) {
    case LengthEncodingType.UInt8:
      return 1;
    case LengthEncodingType.UInt16:
      return 2;
    case LengthEncodingType.UInt32:
      return 4;
    case LengthEncodingType.UInt64:
      return 8;
    default:
      throw new LengthError(LengthErrorType.LengthIsInvalidType);
  }
}

export function isHexString(value: string): boolean {
  return typeof value === 'string' && /^[0-9a-fA-F]*$/.test(value);
}
