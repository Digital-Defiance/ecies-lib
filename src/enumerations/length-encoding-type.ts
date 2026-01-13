/**
 * Length encoding type enumeration.
 * Specifies the integer type used to encode data length in binary formats.
 */
export enum LengthEncodingType {
  /** 8-bit unsigned integer (0-255) */
  UInt8 = 0,
  /** 16-bit unsigned integer (0-65535) */
  UInt16 = 1,
  /** 32-bit unsigned integer (0-4294967295) */
  UInt32 = 2,
  /** 64-bit unsigned integer (0-18446744073709551615) */
  UInt64 = 3,
}
