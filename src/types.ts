import { Brand } from 'ts-brand';
import { GuidBrandType } from './enumerations';

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
 * GUID stored as a MongoDB ObjectId
 */
export type MongoObjectIdGuid = Brand<string, 'GuidV4', GuidBrandType.MongoObjectId>;
/**
 * GUID stored as a raw buffer
 */
export type RawGuidUint8Array = Uint8Array &
  Brand<Uint8Array, 'GuidV4', GuidBrandType.RawGuidUint8Array>;

// Placeholder GUID types for cross-project compatibility
export type BinaryGuid = Uint8Array;
export type HexGuid = string;
export type ShortGuid = string;

/**
 * MongoDB ObjectId as 24-character hex string (from objectid.toHexString())
 * Can be converted to GuidV4 using GuidV4.fromMongoObjectId()
 */
export type MongoObjectIdHexString = Brand<string, 'MongoObjectId'>;

export type SignatureUint8Array = Uint8Array &
  Brand<Uint8Array, 'SignatureArray'>;
export type ChecksumUint8Array = Uint8Array &
  Brand<Uint8Array, 'Sha3Checksum', 'ChecksumArray'>;
export type SignatureString = string & Brand<string, 'SignatureString'>;
export type HexString = Brand<string, 'HexString'>;
export type ChecksumString = Brand<HexString, 'Sha3Checksum', 'ChecksumString'>;
