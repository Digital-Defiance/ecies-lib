/**
 * Type definitions for the ECIES library.
 * Contains branded types for type safety and cross-project compatibility.
 */

import { Brand } from 'ts-brand';
import { GuidBrandType } from './enumerations';

/**
 * Branded type for ECDSA signatures stored as Uint8Array.
 * Ensures type safety for signature data.
 */
export type SignatureUint8Array = Uint8Array &
  Brand<Uint8Array, 'SignatureArray'>;

/**
 * Branded type for SHA3 checksums stored as Uint8Array.
 */
export type ChecksumUint8Array = Uint8Array &
  Brand<Uint8Array, 'Sha3Checksum', 'ChecksumArray'>;

/**
 * Branded type for signatures stored as strings.
 */
export type SignatureString = string & Brand<string, 'SignatureString'>;

/**
 * Branded type for hexadecimal strings.
 */
export type HexString = Brand<string, 'HexString'>;

/**
 * Branded type for SHA3 checksums stored as hex strings.
 */
export type ChecksumString = Brand<HexString, 'Sha3Checksum', 'ChecksumString'>;

/**
 * GUID stored as a BigInt
 */
export type BigIntGuid = Brand<bigint, 'GuidV4', GuidBrandType.BigIntGuid>;
/**
 * GUID stored as a hex string with dashes
 */
export type FullHexGuid = Brand<string, 'GuidV4', GuidBrandType.FullHexGuid>;
/**
 * GUID stored as a hex string without dashes
 */
export type ShortHexGuid = Brand<string, 'GuidV4', GuidBrandType.ShortHexGuid>;
/**
 * GUID stored as a base64 string
 */
export type Base64Guid = Brand<string, 'GuidV4', GuidBrandType.Base64Guid>;
/**
 * GUID stored as a raw buffer
 */
export type RawGuidPlatformBuffer = Uint8Array &
  Brand<Uint8Array, 'GuidV4', GuidBrandType.RawGuidPlatformBuffer>;

/**
 * Extended Buffer type for data with utility methods.
 */
export type DataBuffer = Uint8Array & {
  /** Converts to Uint8Array */
  toBuffer(): Uint8Array;
  /** Converts to hexadecimal string */
  toHex(): string;
};

/**
 * Placeholder GUID types for cross-project compatibility.
 * Note: Buffer type removed - use Uint8Array for cross-platform compatibility.
 */

/** GUID stored as a binary Uint8Array */
export type BinaryGuid = Uint8Array;
/** GUID stored as a hexadecimal string */
export type HexGuid = string;
/** GUID stored as a short string representation */
export type ShortGuid = string;
