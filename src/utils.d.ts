import { LengthEncodingType } from './enumerations/length-encoding-type';
/**
 * Encodes the length of the data in the buffer
 * @param buffer The buffer to encode
 * @returns The encoded buffer
 */
export declare function lengthEncodeData(buffer: Buffer): Buffer;
export declare function decodeLengthEncodedData(buffer: Buffer): {
    data: Buffer;
    totalLength: number;
};
export declare function uint8ArrayToBase64(uint8Array: Uint8Array): string;
export declare function base64ToUint8Array(base64String: string): Uint8Array;
export declare function uint8ArrayToHex(uint8Array: Uint8Array): string;
export declare function hexToUint8Array(hexString: string): Uint8Array;
/**
 * Utility functions for browser ECIES implementation
 */
/**
 * CRC16-CCITT implementation for data integrity checking
 * Uses CRC16-CCITT-FALSE variant (init 0xFFFF)
 */
export declare function crc16(data: Uint8Array): Uint8Array;
/**
 * Convert string to Uint8Array (UTF-8 encoding)
 */
export declare function stringToUint8Array(str: string): Uint8Array;
/**
 * Convert Uint8Array to string (UTF-8 decoding)
 */
export declare function uint8ArrayToString(array: Uint8Array): string;
/**
 * Secure random bytes generation
 */
export declare function randomBytes(length: number): Uint8Array;
/**
 * Compare two Uint8Arrays for equality
 */
export declare function arraysEqual(a: Uint8Array, b: Uint8Array): boolean;
/**
 * Concatenate multiple Uint8Arrays
 */
export declare function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array;
/**
 * Get the length encoding type for a given length
 * @param length The length to evaluate
 * @returns The corresponding LengthEncodingType
 */
export declare function getLengthEncodingTypeForLength(length: number | BigInt): LengthEncodingType;
/**
 * Get the length encoding type for a given value
 * @param value The value to evaluate
 * @returns The corresponding LengthEncodingType
 */
export declare function getLengthEncodingTypeFromValue(value: number): LengthEncodingType;
/**
 * Get the length in bytes for a given LengthEncodingType
 * @param type The LengthEncodingType to evaluate
 * @returns The length in bytes
 */
export declare function getLengthForLengthType(type: LengthEncodingType): number;
//# sourceMappingURL=utils.d.ts.map