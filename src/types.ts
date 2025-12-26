import { Buffer } from './lib/buffer-compat';
import { Brand } from 'ts-brand';
import { GuidBrandType } from './enumerations';

export type SignatureUint8Array = Uint8Array &
  Brand<Uint8Array, 'SignatureArray'>;
export type ChecksumUint8Array = Uint8Array &
  Brand<Uint8Array, 'Sha3Checksum', 'ChecksumArray'>;
export type SignatureString = string & Brand<string, 'SignatureString'>;
export type HexString = Brand<string, 'HexString'>;
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
export type RawGuidBuffer = Uint8Array &
  Brand<Uint8Array, 'GuidV4', GuidBrandType.RawGuidBuffer>;

/**
 * Extended Buffer type for data
 */
export type DataBuffer = Uint8Array & {
  toBuffer(): Uint8Array;
  toHex(): string;
};

// Placeholder GUID types for cross-project compatibility
export type BinaryGuid = Buffer | Uint8Array;
export type HexGuid = string;
export type ShortGuid = string;
