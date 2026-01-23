/**
 * GUID interface defining operations for globally unique identifiers.
 * Supports multiple representations (hex, base64, BigInt) and RFC 4122 validation.
 */
import type {
  Base64Guid,
  BigIntGuid,
  // prettier-ignore
  FullHexGuid,
  RawGuidPlatformBuffer,
  ShortHexGuid,
} from '../ecies_types';
import type { PlatformBuffer } from './platform-buffer';

export interface IGuid {
  /**
   * Returns the GUID as a raw buffer.
   */
  get asRawGuidPlatformBuffer(): RawGuidPlatformBuffer;
  /**
   * Returns the GUID as a full hex string.
   */
  get asFullHexGuid(): FullHexGuid;
  /**
   * Returns the GUID as a PlatformBuffer.
   */
  get asPlatformBuffer(): PlatformBuffer;
  /**
   * Returns the GUID as a short hex string.
   */
  get asShortHexGuid(): ShortHexGuid;
  /**
   * Returns the GUID as a BigInt.
   */
  get asBigIntGuid(): BigIntGuid;
  /**
   * Returns the GUID as a Base64 string.
   */
  get asBase64Guid(): Base64Guid;
  /**
   * Returns a URL-safe base64 representation.
   */
  get asUrlSafeBase64(): string;

  /**
   * Returns the GUID as a base64 string
   */
  serialize(): string;
  /**
   * Returns the GUID as a JSON string
   */
  toJson(): string;
  /**
   * Returns the GUID as a Base64 string
   */
  toString(): Base64Guid;
  /**
   * Compares this GUID to another GUID
   * @param other The GUID to compare to (can be null/undefined)
   * @param constantTime Use constant-time comparison to prevent timing attacks
   */
  equals(other: IGuid | null | undefined, constantTime?: boolean): boolean;
  /**
   * Creates a new GuidV4 instance with the same value as this one.
   * @returns A new GuidV4 instance with identical value
   */
  clone(): IGuid;
  /**
   * Returns the hash code for this GUID based on its buffer content.
   * Useful for using GUIDs as Map/Set keys.
   * @returns A numeric hash code
   */
  hashCode(): number;
  /**
   * Checks if this GUID is empty (all zeros).
   * @returns True if the GUID is all zeros, false otherwise
   */
  isEmpty(): boolean;
  /**
   * Extracts the RFC 4122 version from the GUID.
   * @returns The version number (1-5) or undefined
   */
  getVersion(): number | undefined;
  /**
   * Extracts the variant from the GUID.
   * @returns The variant (0-2) or undefined
   */
  getVariant(): number | undefined;
  /**
   * Returns the timestamp from a v1 GUID.
   * @returns Date object or undefined if not a v1 GUID
   */
  getTimestamp(): Date | undefined;
  /**
   * Validates that this GUID is a proper v1 GUID according to RFC 4122.
   * @returns True if valid v1 GUID, false otherwise
   */
  isValidV1(): boolean;
  /**
   * Validates that this GUID is a proper v3 GUID according to RFC 4122.
   * @returns True if valid v3 GUID, false otherwise
   */
  isValidV3(): boolean;
  /**
   * Validates that this GUID is a proper v4 GUID according to RFC 4122.
   * @returns True if valid v4 GUID or boundary value, false otherwise
   */
  isValidV4(): boolean;
  /**
   * Validates that this GUID is a proper v5 GUID according to RFC 4122.
   * @returns True if valid v5 GUID, false otherwise
   */
  isValidV5(): boolean;
  /**
   * Compares two GUIDs for ordering.
   * @param other The other GUID to compare to
   * @returns -1 if this < other, 0 if equal, 1 if this > other
   */
  compareTo(other: IGuid): number;
  /**
   * Returns a human-readable debug string.
   */
  toDebugString(): string;
}
