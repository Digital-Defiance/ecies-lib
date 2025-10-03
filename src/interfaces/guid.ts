import {
  Base64Guid,
  BigIntGuid,
  // prettier-ignore
  FullHexGuid,
  RawGuidUint8Array,
  ShortHexGuid,
} from '../types';

export interface IGuidV4 {
  /**
   * Returns the GUID as a raw buffer.
   */
  get asRawGuidUint8Array(): RawGuidUint8Array;
  /**
   * Returns the GUID as a full hex string.
   */
  get asFullHexGuid(): FullHexGuid;
  /**
   * Returns the GUID as a Uint8Array.
   */
  get asUint8Array(): Uint8Array;
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
   * @param other The GUID to compare to
   */
  equals(other: IGuidV4): boolean;
}
