import { EciesStringKey } from './enumerations/ecies-string-key';
import { LengthEncodingType } from './enumerations/length-encoding-type';
import { LengthErrorType } from './enumerations/length-error-type';
import { LengthError } from './errors';
import { EciesComponentId, getEciesI18nEngine } from './i18n-setup';

/**
 * Encodes the length of the data in the buffer.
 * Automatically selects the appropriate integer type based on data length.
 * @param buffer The buffer to encode
 * @returns The encoded buffer with length prefix
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

/**
 * Decodes length-encoded data from a buffer.
 * Reads the length type and data length, then extracts the data.
 * @param buffer The buffer containing length-encoded data
 * @returns Object containing the decoded data and total length consumed
 * @throws {LengthError} If the buffer is too short or length encoding is invalid
 */
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

/**
 * Converts a Uint8Array to a Base64 string.
 * @param uint8Array The byte array to convert
 * @returns Base64 encoded string
 */
export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

/**
 * Converts a Base64 string to a Uint8Array.
 * @param base64String The Base64 string to decode
 * @returns Decoded byte array
 */
export function base64ToUint8Array(base64String: string): Uint8Array {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts a Uint8Array to a hexadecimal string.
 * @param uint8Array The byte array to convert
 * @returns Hexadecimal string representation
 */
export function uint8ArrayToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a hexadecimal string to a Uint8Array.
 * @param hexString The hexadecimal string to convert (must have even length)
 * @returns Decoded byte array
 * @throws {Error} If the hex string is invalid or has odd length
 */
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
 * CRC16-CCITT implementation for data integrity checking.
 * Uses CRC16-CCITT-FALSE variant (init 0xFFFF).
 * @param data The data to calculate CRC for
 * @returns 2-byte CRC checksum in big-endian format
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
 * Converts a string to Uint8Array using UTF-8 encoding.
 * @param str The string to convert
 * @returns UTF-8 encoded byte array
 */
export function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Converts a Uint8Array to string using UTF-8 decoding.
 * @param array The byte array to decode
 * @returns Decoded UTF-8 string
 */
export function uint8ArrayToString(array: Uint8Array): string {
  return new TextDecoder().decode(array);
}

/**
 * Generates cryptographically secure random bytes.
 * @param length The number of random bytes to generate
 * @returns Array of random bytes
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Compares two Uint8Arrays for equality using constant-time comparison.
 * Prevents timing attacks by always comparing all bytes.
 * @param a First byte array
 * @param b Second byte array
 * @returns True if arrays are equal, false otherwise
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
 * Concatenates multiple Uint8Arrays into a single array.
 * @param arrays Variable number of byte arrays to concatenate
 * @returns Single concatenated byte array
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
 * Determines the appropriate length encoding type for a given length value.
 * Selects the smallest integer type that can represent the length.
 * @param length The length value to evaluate (number or bigint)
 * @returns The corresponding LengthEncodingType
 * @throws {LengthError} If the length exceeds maximum supported value
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
 * Converts a numeric value to its corresponding LengthEncodingType.
 * @param value The numeric value to convert
 * @returns The corresponding LengthEncodingType
 * @throws {LengthError} If the value doesn't match any valid encoding type
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
 * Safely converts BigInt to Number, throwing if value exceeds safe integer range.
 * JavaScript's Number.MAX_SAFE_INTEGER is 2^53 - 1.
 * @param value The BigInt value to convert
 * @returns The number value
 * @throws {Error} If value exceeds safe integer range
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
 * Returns the byte length for a given LengthEncodingType.
 * @param type The LengthEncodingType to evaluate
 * @returns The length in bytes (1, 2, 4, or 8)
 * @throws {LengthError} If the type is invalid
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

/**
 * Validates whether a string contains only valid hexadecimal characters.
 * @param value The string to validate
 * @returns True if the string is a valid hex string, false otherwise
 */
export function isHexString(value: string): boolean {
  return typeof value === 'string' && /^[0-9a-fA-F]*$/.test(value);
}
