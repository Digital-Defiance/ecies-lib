import * as uuid from 'uuid';
import { GuidBrandType } from '../enumerations/guid-brand-type';
import { GuidErrorType } from '../enumerations/guid-error-type';
import { GuidError } from '../errors/guid';
import { IGuidV4 } from '../interfaces/guid';
import {
  Base64Guid,
  BigIntGuid,
  FullHexGuid,
  RawGuidBuffer,
  ShortHexGuid,
} from '../types';
import { Buffer } from './buffer-compat';

// Define a type that can handle all GUID variants
export type GuidInput =
  | string
  | FullHexGuid
  | ShortHexGuid
  | Base64Guid
  | BigIntGuid
  | RawGuidBuffer
  | bigint
  | Uint8Array;

/**
 * GuidV4 represents a GUID (Globally Unique Identifier) that is compliant with the RFC 4122 standard.
 * GuidV4 instances can be created from a variety of input types, including:
 * - FullHexGuid: A 36-character string representation of the GUID, including dashes
 * - ShortHexGuid: A 32-character string representation of the GUID, excluding dashes
 * - Base64Guid: A 24-character base64-encoded string representation of the GUID
 * - BigIntGuid: A bigint representation of the GUID
 * - RawGuidBuffer: A 16-byte Buffer representation of the GUID
 * GuidV4 instances can be converted to any of these representations using the appropriate method.
 */
export class GuidV4 implements IGuidV4 {
  /**
   * GUID is stored internally as a raw 16-byte Buffer.
   */
  private readonly _value: RawGuidBuffer;

  /**
   * Boundary value constants for special GUID validation
   */
  private static readonly BOUNDARY_VALUES = {
    ALL_ZEROS_FULL: '00000000-0000-0000-0000-000000000000' as const,
    ALL_ZEROS_SHORT: '00000000000000000000000000000000' as const,
    ALL_FS_FULL: 'ffffffff-ffff-ffff-ffff-ffffffffffff' as const,
    ALL_FS_SHORT: 'ffffffffffffffffffffffffffffffff' as const,
  } as const;

  /**
   * Maximum valid bigint value for a 128-bit GUID
   */
  private static readonly MAX_BIGINT_VALUE = BigInt(
    '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
  );

  /**
   * Cached full hex representation for performance
   */
  private _cachedFullHex?: FullHexGuid;

  /**
   * Cached short hex representation for performance
   */
  private _cachedShortHex?: ShortHexGuid;

  /**
   * Cached base64 representation for performance
   */
  private _cachedBase64?: Base64Guid;

  /**
   * Regex for validating hex strings (case insensitive)
   */
  private static readonly HEX_PATTERN = /^[0-9a-f]+$/i;

  /**
   * Regex for validating full hex GUID format
   */
  private static readonly FULL_HEX_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Cached empty/nil GUID constant (all zeros)
   */
  private static _empty?: GuidV4;

  /**
   * Empty/nil GUID constant (all zeros)
   */
  public static get Empty(): GuidV4 {
    if (!GuidV4._empty) {
      GuidV4._empty = Object.freeze(
        new GuidV4('00000000-0000-0000-0000-000000000000' as FullHexGuid),
      ) as GuidV4;
    }
    return GuidV4._empty;
  }

  constructor(value: GuidInput) {
    const buffer = GuidV4.validateAndConvert(value);
    // Note: We cannot freeze a Buffer as it's an ArrayBuffer view
    // Instead, we ensure the buffer is never directly modified after construction
    this._value = buffer;

    // Initialize cache properties so they exist before sealing
    this._cachedFullHex = undefined;
    this._cachedShortHex = undefined;
    this._cachedBase64 = undefined;

    // Seal the instance to prevent property addition/deletion
    // Cache properties can still be set once since they were initialized
    Object.seal(this);
  }

  /**
   * Validates input and converts to raw buffer with comprehensive error handling.
   * This centralizes all validation logic for better maintainability.
   * @param value The input value to validate and convert
   * @returns The validated raw GUID buffer
   * @throws {GuidError} If validation fails
   */
  private static validateAndConvert(value: GuidInput): RawGuidBuffer {
    try {
      // Null/undefined check
      if (value === null || value === undefined) {
        throw new GuidError(GuidErrorType.InvalidGuid);
      }

      // Empty string check (but allow 0n bigint)
      const strValue = String(value);
      if (!strValue && value !== 0n) {
        throw new GuidError(GuidErrorType.InvalidGuid);
      }

      // Validate bigint is non-negative
      if (typeof value === 'bigint' && value < 0n) {
        throw new GuidError(GuidErrorType.InvalidGuid);
      }

      // Validate hex strings contain only valid hex characters
      if (typeof value === 'string') {
        const isFullHex = value.length === 36 && value.includes('-');
        const isShortHex = value.length === 32 && !value.includes('-');

        if (isFullHex && !GuidV4.FULL_HEX_PATTERN.test(value)) {
          const buffer = Buffer.from(value);
          throw new GuidError(
            GuidErrorType.InvalidGuidWithDetails,
            GuidBrandType.FullHexGuid,
            value.length,
            buffer,
          );
        } else if (isShortHex && !GuidV4.HEX_PATTERN.test(value)) {
          const buffer = Buffer.from(value);
          throw new GuidError(
            GuidErrorType.InvalidGuidWithDetails,
            GuidBrandType.ShortHexGuid,
            value.length,
            buffer,
          );
        }
      }

      // Determine and verify the brand/type
      const expectedBrand = GuidV4.whichBrand(value);
      const verifiedBrand = GuidV4.verifyGuid(expectedBrand, value);

      if (!verifiedBrand) {
        const valueBuffer = Buffer.isBuffer(value)
          ? value
          : Buffer.from(strValue);
        throw new GuidError(
          GuidErrorType.InvalidGuidWithDetails,
          expectedBrand,
          undefined,
          valueBuffer,
        );
      }

      // Convert to raw buffer
      const buffer = GuidV4.toRawGuidBuffer(value);

      // Validate against UUID standard (skip for boundary values)
      const fullHex = GuidV4.toFullHexGuid(buffer.toString('hex'));
      const isBoundary = GuidV4.isBoundaryValue(fullHex);

      if (!isBoundary && !uuid.validate(fullHex)) {
        throw new GuidError(
          GuidErrorType.InvalidGuid,
          expectedBrand,
          undefined,
          buffer,
        );
      }

      return buffer;
    } catch (error) {
      // Re-throw GuidError as-is
      if (error instanceof GuidError) {
        throw error;
      }

      // Wrap other errors with context
      if (typeof value === 'bigint') {
        throw new GuidError(GuidErrorType.InvalidGuid);
      }

      const length = Buffer.isBuffer(value)
        ? value.length
        : String(value).length;
      throw new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        length,
      );
    }
  }

  public static validateUuid(value: string): boolean {
    return uuid.validate(value);
  }

  public serialize(): string {
    return this.asBase64Guid;
  }

  public static hydrate(value: string): GuidV4 {
    return new GuidV4(value as Base64Guid);
  }

  private static readonly LengthMap: Record<GuidBrandType, number> = {
    [GuidBrandType.Unknown]: -1,
    [GuidBrandType.FullHexGuid]: 36,
    [GuidBrandType.ShortHexGuid]: 32,
    [GuidBrandType.Base64Guid]: 24,
    [GuidBrandType.RawGuidBuffer]: 16,
    [GuidBrandType.BigIntGuid]: -1, // Variable length
  };

  private static readonly ReverseLengthMap: Record<number, GuidBrandType> = {
    0: GuidBrandType.Unknown,
    36: GuidBrandType.FullHexGuid,
    32: GuidBrandType.ShortHexGuid,
    24: GuidBrandType.Base64Guid,
    16: GuidBrandType.RawGuidBuffer,
    // BigIntGuid is variable length, so it is not included in the reverse map
  };

  private static readonly VerifyFunctions: Record<
    GuidBrandType,
    (guid: GuidInput, validate?: boolean) => boolean
  > = {
    [GuidBrandType.Unknown]: () => false,
    [GuidBrandType.FullHexGuid]: (guid: GuidInput) => this.isFullHexGuid(guid),
    [GuidBrandType.ShortHexGuid]: (guid: GuidInput) =>
      this.isShortHexGuid(guid),
    [GuidBrandType.Base64Guid]: (guid: GuidInput) => this.isBase64Guid(guid),
    [GuidBrandType.BigIntGuid]: (guid: GuidInput) => this.isBigIntGuid(guid),
    [GuidBrandType.RawGuidBuffer]: (guid: GuidInput) =>
      this.isRawGuidBuffer(guid),
  };

  /**
   * Returns the GUID as a raw Buffer.
   * NOTE: Returns a defensive copy to prevent external mutation.
   * Use asRawGuidBufferUnsafe() if you need the internal buffer and guarantee no mutation.
   */
  public get asRawGuidBuffer(): RawGuidBuffer {
    return Buffer.from(this._value) as RawGuidBuffer;
  }

  /**
   * Returns the internal raw Buffer without copying.
   * ⚠️ WARNING: Do NOT mutate the returned buffer! This is for performance-critical paths only.
   * Mutating this buffer will corrupt the GUID instance.
   * @internal
   */
  public get asRawGuidBufferUnsafe(): RawGuidBuffer {
    return this._value;
  }

  /**
   * Generates a new random v4 GUID.
   * @returns A new GuidV4 instance with a randomly generated value
   */
  public static generate(): GuidV4 {
    try {
      const uuidStr = uuid.v4();
      if (!uuidStr) {
        throw new GuidError(GuidErrorType.InvalidGuid);
      }
      return new GuidV4(uuidStr as FullHexGuid);
    } catch (error) {
      if (error instanceof GuidError) {
        throw error;
      }
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
  }

  /**
   * Alias for generate() for backward compatibility.
   * @deprecated Use generate() instead for clearer intent
   */
  public static new(): GuidV4 {
    return GuidV4.generate();
  }

  /**
   * Parses a GUID from any valid format, throwing on invalid input.
   * This is the primary parsing method for when you expect valid input.
   * @param value The value to parse
   * @returns A new GuidV4 instance
   * @throws {GuidError} If the value is not a valid GUID
   */
  public static parse(value: GuidInput): GuidV4 {
    return new GuidV4(value);
  }

  /**
   * Attempts to parse a GUID, returning null on failure instead of throwing.
   * Use this when you're uncertain if the input is valid.
   * @param value The value to parse
   * @returns A new GuidV4 instance or null if parsing fails
   */
  public static tryParse(value: GuidInput): GuidV4 | null {
    try {
      return new GuidV4(value);
    } catch {
      return null;
    }
  }

  /**
   * Validates whether a value is a valid GUID without creating an instance.
   * More efficient than tryParse when you only need validation.
   * @param value The value to validate
   * @returns True if valid, false otherwise
   */
  public static isValid(value: unknown): boolean {
    if (!value) return false;
    try {
      const guid = new GuidV4(value as GuidInput);
      return guid.isValidV4();
    } catch {
      return false;
    }
  }

  /**
   * Factory method to create a GUID from a full hex string.
   * @param fullHex The full hex string (with dashes)
   * @returns A new GuidV4 instance
   */
  public static fromFullHex(fullHex: string): GuidV4 {
    return new GuidV4(fullHex as FullHexGuid);
  }

  /**
   * Factory method to create a GUID from a short hex string.
   * @param shortHex The short hex string (without dashes)
   * @returns A new GuidV4 instance
   */
  public static fromShortHex(shortHex: string): GuidV4 {
    return new GuidV4(shortHex as ShortHexGuid);
  }

  /**
   * Factory method to create a GUID from a base64 string.
   * @param base64 The base64 encoded string
   * @returns A new GuidV4 instance
   */
  public static fromBase64(base64: string): GuidV4 {
    return new GuidV4(base64 as Base64Guid);
  }

  /**
   * Factory method to create a GUID from a bigint.
   * @param bigint The bigint value
   * @returns A new GuidV4 instance
   */
  public static fromBigInt(bigint: bigint): GuidV4 {
    return new GuidV4(bigint as BigIntGuid);
  }

  /**
   * Factory method to create a GUID from a raw buffer.
   * @param buffer The raw 16-byte buffer
   * @returns A new GuidV4 instance
   */
  public static fromBuffer(buffer: Uint8Array): GuidV4 {
    return new GuidV4(buffer as RawGuidBuffer);
  }

  /**
   * Factory method to create a GUID from a raw Uint8Array.
   * This is an explicit alias for fromBuffer(), provided for clarity when working
   * with browser environments where Uint8Array is the native binary type.
   * @param bytes The raw 16-byte Uint8Array
   * @returns A new GuidV4 instance
   */
  public static fromUint8Array(bytes: Uint8Array): GuidV4 {
    return new GuidV4(bytes as RawGuidBuffer);
  }

  /**
   * Creates a namespace-based v3 GUID (MD5 hash).
   * Use this for deterministic GUIDs based on a namespace and name.
   * @param namespace The namespace GUID (e.g., uuid.v3.DNS)
   * @param name The name to hash within the namespace
   * @returns A new GuidV4 instance containing the v3 GUID
   * @example
   * const guid = GuidV4.v3('example.com', uuid.v3.DNS);
   */
  public static v3(name: string, namespace: string | Buffer): GuidV4 {
    try {
      const namespaceStr = Buffer.isBuffer(namespace)
        ? GuidV4.toFullHexGuid(namespace.toString('hex'))
        : namespace;
      const v3Guid = uuid.v3(name, namespaceStr);
      return new GuidV4(v3Guid as FullHexGuid);
    } catch (error) {
      if (error instanceof GuidError) {
        throw error;
      }
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
  }

  /**
   * Creates a namespace-based v5 GUID (SHA-1 hash).
   * Use this for deterministic GUIDs based on a namespace and name.
   * Preferred over v3 as SHA-1 is stronger than MD5.
   * @param namespace The namespace GUID (e.g., uuid.v5.DNS)
   * @param name The name to hash within the namespace
   * @returns A new GuidV4 instance containing the v5 GUID
   * @example
   * const guid = GuidV4.v5('example.com', uuid.v5.DNS);
   */
  public static v5(name: string, namespace: string | Buffer): GuidV4 {
    try {
      const namespaceStr = Buffer.isBuffer(namespace)
        ? GuidV4.toFullHexGuid(namespace.toString('hex'))
        : namespace;
      const v5Guid = uuid.v5(name, namespaceStr);
      return new GuidV4(v5Guid as FullHexGuid);
    } catch (error) {
      if (error instanceof GuidError) {
        throw error;
      }
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
  }

  /**
   * Common namespace constants for use with v3/v5 GUIDs.
   * These are the standard RFC 4122 namespace UUIDs, defined inline for browser compatibility.
   * (Avoids issues with uuid library's namespace exports in some bundler configurations)
   */
  public static readonly Namespaces = {
    /** DNS namespace UUID per RFC 4122 */
    DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    /** URL namespace UUID per RFC 4122 */
    URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  } as const;
  /**
   * Returns the GUID as a full hex string.
   * Result is cached for performance.
   */
  public get asFullHexGuid(): FullHexGuid {
    if (!this._cachedFullHex) {
      this._cachedFullHex = GuidV4.toFullHexGuid(this._value.toString('hex'));
    }
    return this._cachedFullHex;
  }
  /**
   * Returns the GUID as a raw Uint8Array.
   */
  public get asUint8Array(): Uint8Array {
    return this._value as Uint8Array;
  }
  /**
   * Returns the GUID as a short hex string.
   * Result is cached for performance.
   */
  public get asShortHexGuid(): ShortHexGuid {
    if (!this._cachedShortHex) {
      this._cachedShortHex = GuidV4.toShortHexGuid(this.asFullHexGuid);
    }
    return this._cachedShortHex;
  }
  /**
   * Returns the GUID as a base64 string.
   */
  public toString(): Base64Guid {
    return this.asBase64Guid as Base64Guid;
  }
  /**
   * Returns the GUID as a JSON string.
   * @returns The GUID as a JSON string.
   */
  public toJson(): string {
    return JSON.stringify(this.asBase64Guid);
  }
  /**
   * Returns the GUID as a bigint.
   */
  public get asBigIntGuid(): BigIntGuid {
    return BigInt('0x' + this._value.toString('hex')) as BigIntGuid;
  }
  /**
   * Returns the GUID as a base64 string.
   * Result is cached for performance.
   */
  public get asBase64Guid(): Base64Guid {
    if (!this._cachedBase64) {
      this._cachedBase64 = this._value.toString('base64') as Base64Guid;
    }
    return this._cachedBase64;
  }

  /**
   * Checks if a GUID value is a boundary value (all zeros or all Fs).
   * @param value The GUID value to check.
   * @returns True if the value is a boundary value.
   */
  private static isBoundaryValue(value: string): boolean {
    return (
      value === GuidV4.BOUNDARY_VALUES.ALL_ZEROS_FULL ||
      value === GuidV4.BOUNDARY_VALUES.ALL_ZEROS_SHORT ||
      value === GuidV4.BOUNDARY_VALUES.ALL_FS_FULL ||
      value === GuidV4.BOUNDARY_VALUES.ALL_FS_SHORT
    );
  }

  /**
   * Verifies if a given GUID is valid for the given brand.
   * @param guidBrand The brand of the GUID to verify.
   * @param guid The GUID to verify.
   * @returns True if the GUID is valid for the given brand, false otherwise.
   */
  public static verifyGuid(guidBrand: GuidBrandType, guid: GuidInput): boolean {
    if (guid === null || guid === undefined) {
      return false;
    }
    try {
      const verifyFunc = GuidV4.VerifyFunctions[guidBrand];
      return verifyFunc(guid);
    } catch {
      return false;
    }
  }

  /**
   * Returns the length of the GUID for the given brand.
   * @param guidBrand The brand of the GUID to get the length for.
   * @returns The length of the GUID for the given brand.
   */
  public static guidBrandToLength(guidBrand: GuidBrandType): number {
    const length = GuidV4.LengthMap[guidBrand];
    if (length <= 0) {
      throw new GuidError(GuidErrorType.InvalidGuidUnknownBrand, guidBrand);
    }
    return length as number;
  }

  /**
   * Returns the brand of the GUID for the given length.
   * @param length The length of the GUID to get the brand for.
   * @param isBuffer Whether the GUID is a Buffer.
   * @returns The brand of the GUID for the given length.
   */
  public static lengthToGuidBrand(
    length: number,
    isBuffer: boolean,
  ): GuidBrandType {
    if (length <= 0) {
      throw new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        length,
      );
    }

    const brand = GuidV4.ReverseLengthMap[length];

    if (!brand || brand === GuidBrandType.Unknown) {
      throw new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        length,
      );
    }

    // Validate buffer vs string type consistency
    const isBrandBuffer = brand === GuidBrandType.RawGuidBuffer;
    if (isBuffer !== isBrandBuffer) {
      throw new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        brand,
        length,
      );
    }

    return brand;
  }

  /**
   * Verifies if a given GUID is a valid full hex GUID.
   * @param fullHexGuidValue The full hex GUID to verify.
   * @returns True if the GUID is a valid full hex GUID, false otherwise.
   */
  public static isFullHexGuid(fullHexGuidValue: GuidInput): boolean {
    try {
      if (fullHexGuidValue === null || fullHexGuidValue === undefined) {
        return false;
      }
      const expectedLength = GuidV4.guidBrandToLength(
        GuidBrandType.FullHexGuid,
      );
      const strValue = String(fullHexGuidValue);

      if (strValue.length !== expectedLength) {
        return false;
      }

      // Boundary values are always valid
      if (GuidV4.isBoundaryValue(strValue)) {
        return true;
      }

      return GuidV4.validateUuid(strValue);
    } catch {
      return false;
    }
  }

  /**
   * Verifies if a given GUID is a valid short hex GUID.
   * @param shortHexGuidValue The short hex GUID to verify.
   * @returns True if the GUID is a valid short hex GUID, false otherwise.
   */
  public static isShortHexGuid(shortHexGuidValue: GuidInput): boolean {
    try {
      if (shortHexGuidValue === null || shortHexGuidValue === undefined) {
        return false;
      }
      const expectedLength = GuidV4.guidBrandToLength(
        GuidBrandType.ShortHexGuid,
      );
      const strValue = String(shortHexGuidValue);

      if (strValue.length !== expectedLength) {
        return false;
      }

      try {
        const fullHexGuid = GuidV4.toFullHexGuid(strValue);
        // Boundary values are always valid
        if (GuidV4.isBoundaryValue(fullHexGuid)) {
          return true;
        }
        return uuid.validate(fullHexGuid);
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Verifies if a given GUID is a valid base64 GUID.
   * @param value The base64 GUID to verify.
   * @returns True if the GUID is a valid base64 GUID, false otherwise.
   */
  public static isBase64Guid(value: GuidInput): boolean {
    try {
      if (value === null || value === undefined) {
        return false;
      }
      let valueLength: number;
      if (typeof value === 'bigint') {
        valueLength = value.toString(16).length;
      } else if (Buffer.isBuffer(value)) {
        valueLength = value.length;
      } else {
        valueLength = String(value).length;
      }

      const result =
        valueLength === GuidV4.guidBrandToLength(GuidBrandType.Base64Guid);

      if (result) {
        try {
          const fromBase64: Uint8Array = GuidV4.toRawGuidBuffer(value);
          const fullHexGuid = GuidV4.toFullHexGuid(fromBase64.toString('hex'));
          // Boundary values are always valid
          if (GuidV4.isBoundaryValue(fullHexGuid)) {
            return true;
          }
          return uuid.validate(fullHexGuid);
        } catch {
          return false;
        }
      }
      return result;
    } catch {
      return false;
    }
  }

  /**
   * Verifies if a given GUID is a valid raw GUID buffer.
   * @param value The raw GUID buffer to verify.
   * @returns True if the GUID is a valid raw GUID buffer, false otherwise.
   */
  public static isRawGuidBuffer(value: GuidInput): boolean {
    try {
      if (value === null || value === undefined) {
        return false;
      }
      const expectedLength = GuidV4.guidBrandToLength(
        GuidBrandType.RawGuidBuffer,
      );
      let valueLength: number;
      if (typeof value === 'bigint') {
        valueLength = value.toString(16).length;
      } else if (Buffer.isBuffer(value)) {
        valueLength = value.length;
      } else {
        valueLength = String(value).length;
      }

      if (valueLength !== expectedLength) {
        return false;
      }

      try {
        if (!Buffer.isBuffer(value)) {
          return false;
        }
        const fullHexGuid = GuidV4.toFullHexGuid(value.toString('hex'));
        // Boundary values are always valid
        if (GuidV4.isBoundaryValue(fullHexGuid)) {
          return true;
        }
        return GuidV4.validateUuid(fullHexGuid);
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Verifies if a given GUID is a valid bigint GUID.
   * @param value The bigint GUID to verify.
   * @returns True if the GUID is a valid bigint GUID, false otherwise.
   */
  public static isBigIntGuid(value: GuidInput): boolean {
    try {
      if (value === null || value === undefined) {
        return false;
      }
      if (typeof value !== 'bigint') {
        return false;
      }
      if (value < 0n || value > GuidV4.MAX_BIGINT_VALUE) {
        return false;
      }

      try {
        const fromBigInt = GuidV4.toFullHexFromBigInt(value);
        // Boundary values are always valid
        if (GuidV4.isBoundaryValue(fromBigInt)) {
          return true;
        }
        return uuid.validate(fromBigInt);
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Determines the brand of a given GUID value.
   * @param value The GUID value to determine the brand of.
   * @returns The brand of the GUID value.
   */
  public static whichBrand(value: GuidInput): GuidBrandType {
    if (value === null || value === undefined) {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }

    if (typeof value === 'bigint') {
      return GuidBrandType.BigIntGuid;
    }

    const isBuffer = Buffer.isBuffer(value);
    const expectedLength = isBuffer ? value.length : String(value).length;

    return GuidV4.lengthToGuidBrand(expectedLength, isBuffer);
  }

  /**
   * Converts a given short hex GUID to a full hex GUID.
   * @param shortGuid The short hex GUID to convert.
   * @returns The short hex GUID as a full hex GUID.
   */
  private static shortGuidToFullGuid(shortGuid: string): FullHexGuid {
    // insert dashes
    const str = shortGuid.replace(
      /(.{8})(.{4})(.{4})(.{4})(.{12})/,
      '$1-$2-$3-$4-$5',
    );
    return str as FullHexGuid;
  }

  /**
   * Converts a given GUID value to a full hex GUID.
   * @param guid The GUID value to convert.
   * @returns The GUID value as a full hex GUID.
   */
  public static toFullHexGuid(
    guid:
      | RawGuidBuffer
      | BigIntGuid
      | Base64Guid
      | ShortHexGuid
      | FullHexGuid
      | string,
  ): FullHexGuid {
    if (guid === null || guid === undefined) {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }

    if (typeof guid === 'bigint') {
      return GuidV4.toFullHexFromBigInt(guid);
    } else if (
      Buffer.isBuffer(guid) &&
      guid.length === GuidV4.guidBrandToLength(GuidBrandType.RawGuidBuffer)
    ) {
      const shortHex = guid.toString('hex') as ShortHexGuid;
      return GuidV4.shortGuidToFullGuid(shortHex);
    } else if (Buffer.isBuffer(guid)) {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
    // all remaining cases are string types
    const strValue = String(guid);
    if (
      strValue.length === GuidV4.guidBrandToLength(GuidBrandType.ShortHexGuid)
    ) {
      // short hex guid
      return GuidV4.shortGuidToFullGuid(strValue);
    } else if (
      strValue.length === GuidV4.guidBrandToLength(GuidBrandType.FullHexGuid)
    ) {
      // already a full hex guid
      return strValue as FullHexGuid;
    } else if (
      strValue.length === GuidV4.guidBrandToLength(GuidBrandType.Base64Guid)
    ) {
      // base64 guid
      const shortGuid = Buffer.from(strValue, 'base64').toString('hex');
      return GuidV4.shortGuidToFullGuid(shortGuid);
    } else {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
  }

  public static toShortHexGuid(
    guid:
      | RawGuidBuffer
      | BigIntGuid
      | Base64Guid
      | ShortHexGuid
      | FullHexGuid
      | string,
  ): ShortHexGuid {
    if (guid === null || guid === undefined) {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }

    if (typeof guid === 'bigint') {
      const fullHex = GuidV4.toFullHexFromBigInt(guid);
      return fullHex.replace(/-/g, '') as ShortHexGuid;
    } else if (
      Buffer.isBuffer(guid) &&
      guid.length === GuidV4.guidBrandToLength(GuidBrandType.RawGuidBuffer)
    ) {
      return guid.toString('hex') as ShortHexGuid;
    } else if (Buffer.isBuffer(guid)) {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
    // all remaining cases are string types
    const strValue = String(guid);

    if (
      strValue.length === GuidV4.guidBrandToLength(GuidBrandType.ShortHexGuid)
    ) {
      // already a short hex guid
      return strValue as ShortHexGuid;
    } else if (
      strValue.length === GuidV4.guidBrandToLength(GuidBrandType.FullHexGuid)
    ) {
      // full hex guid
      return strValue.replace(/-/g, '') as ShortHexGuid;
    } else if (
      strValue.length === GuidV4.guidBrandToLength(GuidBrandType.Base64Guid)
    ) {
      // base64 guid
      return Buffer.from(strValue, 'base64').toString('hex') as ShortHexGuid;
    } else {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
  }

  /**
   * Converts a given bigint to a full hex GUID.
   * @param bigInt The bigint to convert.
   * @returns The bigint as a full hex GUID.
   */
  public static toFullHexFromBigInt(bigInt: bigint): FullHexGuid {
    if (bigInt < 0n || bigInt > GuidV4.MAX_BIGINT_VALUE) {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
    const uuidBigInt = bigInt.toString(16).padStart(32, '0');
    // After padding, should always be exactly 32 characters
    if (uuidBigInt.length !== 32) {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
    const rebuiltUuid =
      uuidBigInt.slice(0, 8) +
      '-' +
      uuidBigInt.slice(8, 12) +
      '-' +
      uuidBigInt.slice(12, 16) +
      '-' +
      uuidBigInt.slice(16, 20) +
      '-' +
      uuidBigInt.slice(20);
    return rebuiltUuid as FullHexGuid;
  }

  /**
   * Converts a given GUID value to a raw GUID buffer.
   * @param value The GUID value to convert.
   * @returns The GUID value as a raw GUID buffer.
   */
  public static toRawGuidBuffer(value: GuidInput): RawGuidBuffer {
    const expectedBrand = GuidV4.whichBrand(value);
    let rawGuidBufferResult: RawGuidBuffer = Buffer.alloc(0) as RawGuidBuffer;
    switch (expectedBrand) {
      case GuidBrandType.FullHexGuid:
        rawGuidBufferResult = Buffer.from(
          GuidV4.toShortHexGuid(value as FullHexGuid),
          'hex',
        ) as RawGuidBuffer;
        break;
      case GuidBrandType.ShortHexGuid:
        rawGuidBufferResult = Buffer.from(
          GuidV4.toShortHexGuid(value as ShortHexGuid),
          'hex',
        ) as RawGuidBuffer;
        break;
      case GuidBrandType.Base64Guid:
        // Ensure value is a string before using it with Buffer.from
        if (typeof value === 'string' || Buffer.isBuffer(value)) {
          rawGuidBufferResult = Buffer.from(
            value.toString(),
            'base64',
          ) as RawGuidBuffer;
        } else {
          throw new GuidError(GuidErrorType.InvalidGuid);
        }
        break;
      case GuidBrandType.RawGuidBuffer:
        rawGuidBufferResult = value as RawGuidBuffer;
        break;
      case GuidBrandType.BigIntGuid:
        rawGuidBufferResult = Buffer.from(
          GuidV4.toShortHexGuid(GuidV4.toFullHexFromBigInt(value as bigint)),
          'hex',
        ) as RawGuidBuffer;
        break;
      default:
        throw new GuidError(GuidErrorType.InvalidGuidUnknownBrand);
    }
    if (
      rawGuidBufferResult.length !==
      GuidV4.guidBrandToLength(GuidBrandType.RawGuidBuffer)
    ) {
      throw new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        rawGuidBufferResult.length,
      );
    }
    return rawGuidBufferResult;
  }

  /**
   * Compare two GuidV4 instances for equality.
   * @param other - The other GuidV4 instance to compare (can be null/undefined)
   * @param constantTime - Use constant-time comparison to prevent timing attacks (default: false)
   * @returns True if the two GuidV4 instances are equal, false otherwise
   */
  public equals(
    other: IGuidV4 | null | undefined,
    constantTime = false,
  ): boolean {
    if (!other) {
      return false;
    }

    if (constantTime) {
      // Constant-time comparison to prevent timing attacks
      // Always compare all 16 bytes regardless of early mismatches
      const a = this.asRawGuidBufferUnsafe;
      const b = other.asRawGuidBuffer;
      let result = 0;
      for (let i = 0; i < 16; i++) {
        result |= a[i] ^ b[i];
      }
      return result === 0;
    }

    return (
      Buffer.compare(this.asRawGuidBufferUnsafe, other.asRawGuidBuffer) === 0
    );
  }

  /**
   * Checks if this GUID is empty (all zeros).
   * @returns True if the GUID is all zeros, false otherwise
   */
  public isEmpty(): boolean {
    // Check if all bytes are zero
    for (let i = 0; i < this._value.length; i++) {
      if (this._value[i] !== 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Static helper to check if a GUID is null, undefined, or empty.
   * @param guid The GUID to check
   * @returns True if the GUID is null, undefined, or empty
   */
  public static isNilOrEmpty(guid: IGuidV4 | null | undefined): boolean {
    return !guid || (guid instanceof GuidV4 && guid.isEmpty());
  }

  /**
   * Creates a new GuidV4 instance with the same value as this one.
   * @returns A new GuidV4 instance with identical value
   */
  public clone(): GuidV4 {
    return new GuidV4(Buffer.from(this._value) as RawGuidBuffer);
  }

  /**
   * Returns the hash code for this GUID based on its buffer content.
   * Useful for using GUIDs as Map/Set keys.
   * @returns A numeric hash code
   */
  public hashCode(): number {
    let hash = 0;
    for (let i = 0; i < this._value.length; i++) {
      hash = (hash << 5) - hash + this._value[i];
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Extracts the RFC 4122 version from the GUID.
   * Returns undefined for boundary values or invalid GUIDs.
   * @returns The version number (1-5) or undefined
   */
  public getVersion(): number | undefined {
    // Skip boundary values
    if (GuidV4.isBoundaryValue(this.asFullHexGuid)) {
      return undefined;
    }

    // Version is in bits 48-51 (byte 6, high nibble)
    const versionByte = this._value[6];
    const version = (versionByte >> 4) & 0x0f;

    // Valid RFC 4122 versions are 1-5
    return version >= 1 && version <= 5 ? version : undefined;
  }

  /**
   * Validates that this GUID is a proper v4 GUID according to RFC 4122.
   * Boundary values (all zeros/all Fs) return true as they're mathematically valid.
   * @returns True if valid v4 GUID or boundary value, false otherwise
   */
  public isValidV4(): boolean {
    // Boundary values are considered valid
    if (GuidV4.isBoundaryValue(this.asFullHexGuid)) {
      return true;
    }

    const version = this.getVersion();
    return version === 4;
  }

  /**
   * Compares two GUIDs for ordering.
   * Useful for sorting GUID arrays.
   * @param other The other GUID to compare to
   * @returns -1 if this < other, 0 if equal, 1 if this > other
   */
  public compareTo(other: IGuidV4): number {
    return Buffer.compare(this.asRawGuidBufferUnsafe, other.asRawGuidBuffer);
  }
}
