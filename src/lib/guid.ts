import * as uuid from 'uuid';
import type {
  Base64Guid,
  BigIntGuid,
  FullHexGuid,
  RawGuidPlatformBuffer,
  ShortHexGuid,
} from '../ecies_types';
import { GuidBrandType } from '../enumerations/guid-brand-type';
import { GuidErrorType } from '../enumerations/guid-error-type';
import { GuidError } from '../errors/guid';
import type { IGuid } from '../interfaces/guid';

// Define a type that can handle all GUID variants
export type GuidInput =
  | string
  | FullHexGuid
  | ShortHexGuid
  | Base64Guid
  | BigIntGuid
  | RawGuidPlatformBuffer
  | bigint
  | Uint8Array;

/**
 * Type representing a GuidUint8Array with its RFC 4122 version attached.
 * The version is determined at parse time and provides compile-time information.
 */
export type VersionedGuidUint8Array<
  V extends 1 | 3 | 4 | 5 | 6 | 7 | undefined =
    | 1
    | 3
    | 4
    | 5
    | 6
    | 7
    | undefined,
> = GuidUint8Array & { readonly __version: V };

/**
 * Guid represents a GUID/UUID (Globally Unique Identifier) that is compliant with the RFC 4122 standard.
 * Supports all UUID versions (v1-v5), with factory methods for v3, v4, and v5.
 *
 * This class extends Uint8Array directly, making it a true 16-byte array that can be used
 * anywhere a Uint8Array is expected while providing GUID-specific functionality.
 *
 * Guid instances can be created from a variety of input types, including:
 * - FullHexGuid: A 36-character string representation of the GUID, including dashes
 * - ShortHexGuid: A 32-character string representation of the GUID, excluding dashes
 * - Base64Guid: A 24-character base64-encoded string representation of the GUID
 * - BigIntGuid: A bigint representation of the GUID
 * - RawGuidUint8Array: A 16-byte Uint8Array representation of the GUID
 * Guid instances can be converted to any of these representations using the appropriate method.
 */
export class GuidUint8Array extends Uint8Array implements IGuid {
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
   * The RFC 4122 version of this GUID (1, 3, 4, 5, or undefined for boundary/invalid)
   */
  public __version?: 1 | 3 | 4 | 5 | 6 | 7 | undefined;

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
   * Type guard to check if a value is a Uint8Array
   */
  private static isUint8Array(value: unknown): value is Uint8Array {
    return value instanceof Uint8Array;
  }

  /**
   * Cached empty/nil GUID constant (all zeros)
   */
  private static _empty?: GuidUint8Array;

  /**
   * Empty/nil GUID constant (all zeros)
   * Note: Since GuidUint8Array extends Uint8Array, it cannot be frozen.
   * A new instance is returned each time to prevent mutation of a shared instance.
   */
  public static get Empty(): GuidUint8Array {
    if (!GuidUint8Array._empty) {
      GuidUint8Array._empty = new GuidUint8Array(
        '00000000-0000-0000-0000-000000000000' as FullHexGuid,
      );
    }
    return GuidUint8Array._empty;
  }

  constructor(value: GuidInput) {
    // Validate and convert the input to a raw 16-byte array
    const array = GuidUint8Array.validateAndConvertStatic(value);

    // Call super with the array to initialize the Uint8Array
    super(array);

    // Initialize cache properties
    this._cachedFullHex = undefined;
    this._cachedShortHex = undefined;
    this._cachedBase64 = undefined;
    this.__version = undefined;
  }

  /**
   * Override species to return Uint8Array for methods like slice(), map(), etc.
   * This ensures that operations on GuidUint8Array return plain Uint8Array
   * rather than trying to construct a new GuidUint8Array (which would fail
   * because those methods don't pass valid GUID data).
   */
  static get [Symbol.species](): Uint8ArrayConstructor {
    return Uint8Array;
  }

  /**
   * Validates input and converts to raw array with comprehensive error handling.
   * This centralizes all validation logic for better maintainability.
   * Static version for use in constructor before super() call.
   * @param value The input value to validate and convert
   * @returns The validated raw GUID array
   * @throws {GuidError} If validation fails
   */
  private static validateAndConvertStatic(value: GuidInput): Uint8Array {
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

        if (isFullHex && !GuidUint8Array.FULL_HEX_PATTERN.test(value)) {
          const array = new TextEncoder().encode(value);
          throw new GuidError(
            GuidErrorType.InvalidGuidWithDetails,
            GuidBrandType.FullHexGuid,
            value.length,
            array,
          );
        } else if (isShortHex && !GuidUint8Array.HEX_PATTERN.test(value)) {
          const array = new TextEncoder().encode(value);
          throw new GuidError(
            GuidErrorType.InvalidGuidWithDetails,
            GuidBrandType.ShortHexGuid,
            value.length,
            array,
          );
        }
      }

      // Determine and verify the brand/type
      const expectedBrand = GuidUint8Array.whichBrand(value);
      const verifiedBrand = GuidUint8Array.verifyGuid(expectedBrand, value);

      if (!verifiedBrand) {
        const valueBuffer = GuidUint8Array.isUint8Array(value)
          ? value
          : new TextEncoder().encode(strValue);
        throw new GuidError(
          GuidErrorType.InvalidGuidWithDetails,
          expectedBrand,
          undefined,
          valueBuffer,
        );
      }

      // Convert to raw array
      const array = GuidUint8Array.toRawGuidPlatformBuffer(value);

      // Validate against UUID standard (skip for boundary values)
      const hexString = Array.from(array)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      const fullHex = GuidUint8Array.toFullHexGuid(hexString);
      const isBoundary = GuidUint8Array.isBoundaryValue(fullHex);

      if (!isBoundary && !uuid.validate(fullHex)) {
        throw new GuidError(
          GuidErrorType.InvalidGuid,
          expectedBrand,
          undefined,
          array,
        );
      }

      return array;
    } catch (error) {
      // Re-throw GuidError as-is
      if (error instanceof GuidError) {
        throw error;
      }

      // Wrap other errors with context
      if (typeof value === 'bigint') {
        throw new GuidError(GuidErrorType.InvalidGuid);
      }

      const length = GuidUint8Array.isUint8Array(value)
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

  public static hydrate(value: string): VersionedGuidUint8Array {
    return GuidUint8Array.withVersion(new GuidUint8Array(value as Base64Guid));
  }

  private static readonly LengthMap: Record<GuidBrandType, number> = {
    [GuidBrandType.Unknown]: -1,
    [GuidBrandType.FullHexGuid]: 36,
    [GuidBrandType.ShortHexGuid]: 32,
    [GuidBrandType.Base64Guid]: 24,
    [GuidBrandType.RawGuidPlatformBuffer]: 16,
    [GuidBrandType.BigIntGuid]: -1, // Variable length
  };

  private static readonly ReverseLengthMap: Record<number, GuidBrandType> = {
    0: GuidBrandType.Unknown,
    36: GuidBrandType.FullHexGuid,
    32: GuidBrandType.ShortHexGuid,
    24: GuidBrandType.Base64Guid,
    16: GuidBrandType.RawGuidPlatformBuffer,
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
    [GuidBrandType.RawGuidPlatformBuffer]: (guid: GuidInput) =>
      this.isRawGuidUint8Array(guid),
  };

  /**
   * Returns the GUID as a raw Uint8Array.
   * NOTE: Returns a defensive copy to prevent external mutation.
   * Use asRawGuidUint8ArrayUnsafe() if you need the internal array and guarantee no mutation.
   */
  public get asRawGuidPlatformBuffer(): RawGuidPlatformBuffer {
    return new Uint8Array(this) as RawGuidPlatformBuffer;
  }

  /**
   * Returns the internal raw Uint8Array without copying.
   * ⚠️ WARNING: Do NOT mutate the returned array! This is for performance-critical paths only.
   * Mutating this array will corrupt the GUID instance.
   * @internal
   */
  public get asRawGuidPlatformBufferUnsafe(): RawGuidPlatformBuffer {
    return this as unknown as RawGuidPlatformBuffer;
  }

  /**
   * Attaches the RFC 4122 version to a GuidUint8Array instance.
   * @param guid The GuidUint8Array instance to attach version to
   * @returns The same instance with __version property set
   */
  private static withVersion<T extends GuidUint8Array>(
    guid: T,
  ): VersionedGuidUint8Array {
    const version = guid.getVersion() as 1 | 3 | 4 | 5 | undefined;
    guid.__version = version;
    return guid as VersionedGuidUint8Array;
  }

  /**
   * Generates a new random v4 GUID.
   * @returns A new Guid instance with a randomly generated value
   */
  public static generate(): VersionedGuidUint8Array<4> {
    try {
      const uuidStr = uuid.v4();
      if (!uuidStr) {
        throw new GuidError(GuidErrorType.InvalidGuid);
      }
      return GuidUint8Array.withVersion(
        new GuidUint8Array(uuidStr as FullHexGuid),
      ) as VersionedGuidUint8Array<4>;
    } catch (error) {
      if (error instanceof GuidError) {
        throw error;
      }
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
  }

  /**
   * Alias for generate() to create a v4 GUID.
   * @returns A new Guid instance with a randomly generated v4 value
   */
  public static v4(): VersionedGuidUint8Array<4> {
    return GuidUint8Array.generate();
  }

  /**
   * Alias for generate() for backward compatibility.
   * @deprecated Use generate() instead for clearer intent
   */
  public static new(): VersionedGuidUint8Array<4> {
    return GuidUint8Array.generate();
  }

  /**
   * Parses a GUID from any valid format, throwing on invalid input.
   * This is the primary parsing method for when you expect valid input.
   * @param value The value to parse
   * @returns A new Guid instance with __version attached
   * @throws {GuidError} If the value is not a valid GUID
   */
  public static parse(value: GuidInput): VersionedGuidUint8Array {
    return GuidUint8Array.withVersion(new GuidUint8Array(value));
  }

  /**
   * Attempts to parse a GUID, returning null on failure instead of throwing.
   * Use this when you're uncertain if the input is valid.
   * @param value The value to parse
   * @returns A new Guid instance with __version attached, or null if parsing fails
   */
  public static tryParse(value: GuidInput): VersionedGuidUint8Array | null {
    try {
      return GuidUint8Array.withVersion(new GuidUint8Array(value));
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
      const guid = new GuidUint8Array(value as GuidInput);
      return guid.isValidV4();
    } catch {
      return false;
    }
  }

  /**
   * Factory method to create a GUID from a full hex string.
   * @param fullHex The full hex string (with dashes)
   * @returns A new Guid instance with __version attached
   */
  public static fromFullHex(fullHex: string): VersionedGuidUint8Array {
    return GuidUint8Array.withVersion(
      new GuidUint8Array(fullHex as FullHexGuid),
    );
  }

  /**
   * Factory method to create a GUID from a short hex string.
   * @param shortHex The short hex string (without dashes)
   * @returns A new Guid instance with __version attached
   */
  public static fromShortHex(shortHex: string): VersionedGuidUint8Array {
    return GuidUint8Array.withVersion(
      new GuidUint8Array(shortHex as ShortHexGuid),
    );
  }

  /**
   * Factory method to create a GUID from a base64 string.
   * @param base64 The base64 encoded string
   * @returns A new Guid instance with __version attached
   */
  public static fromBase64(base64: string): VersionedGuidUint8Array {
    return GuidUint8Array.withVersion(new GuidUint8Array(base64 as Base64Guid));
  }

  /**
   * Factory method to create a GUID from a bigint.
   * @param bigint The bigint value
   * @returns A new Guid instance with __version attached
   */
  public static fromBigInt(bigint: bigint): VersionedGuidUint8Array {
    return GuidUint8Array.withVersion(new GuidUint8Array(bigint as BigIntGuid));
  }

  /**
   * Factory method to create a GUID from a raw Uint8Array.
   * This is an explicit alias for fromBuffer(), provided for clarity when working
   * with browser environments where Uint8Array is the native binary type.
   * @param bytes The raw 16-byte Uint8Array
   * @returns A new Guid instance with __version attached
   */
  public static fromPlatformBuffer(bytes: Uint8Array): VersionedGuidUint8Array {
    return GuidUint8Array.withVersion(
      new GuidUint8Array(bytes as RawGuidPlatformBuffer),
    );
  }

  /**
   * Creates a namespace-based v3 GUID (MD5 hash).
   * Use this for deterministic GUIDs based on a namespace and name.
   * @param name The name to hash within the namespace
   * @param namespace The namespace GUID (e.g., Guid.Namespaces.DNS)
   * @returns A new Guid instance containing the v3 GUID with __version attached
   * @example
   * const guid = Guid.v3('example.com', Guid.Namespaces.DNS);
   */
  public static v3(
    name: string,
    namespace: string | Uint8Array,
  ): VersionedGuidUint8Array<3> {
    try {
      const namespaceStr =
        typeof namespace === 'string'
          ? namespace
          : GuidUint8Array.toFullHexGuid(namespace as RawGuidPlatformBuffer);
      const v3Guid = uuid.v3(name, namespaceStr);
      return GuidUint8Array.withVersion(
        new GuidUint8Array(v3Guid as FullHexGuid),
      ) as VersionedGuidUint8Array<3>;
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
   * @param name The name to hash within the namespace
   * @param namespace The namespace GUID (e.g., Guid.Namespaces.DNS)
   * @returns A new Guid instance containing the v5 GUID with __version attached
   * @example
   * const guid = Guid.v5('example.com', Guid.Namespaces.DNS);
   */
  public static v5(
    name: string,
    namespace: string | Uint8Array,
  ): VersionedGuidUint8Array<5> {
    try {
      const namespaceStr =
        typeof namespace === 'string'
          ? namespace
          : GuidUint8Array.toFullHexGuid(namespace as RawGuidPlatformBuffer);
      const v5Guid = uuid.v5(name, namespaceStr);
      return GuidUint8Array.withVersion(
        new GuidUint8Array(v5Guid as FullHexGuid),
      ) as VersionedGuidUint8Array<5>;
    } catch (error) {
      if (error instanceof GuidError) {
        throw error;
      }
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
  }

  public static v6(options?: uuid.Version6Options): VersionedGuidUint8Array<6> {
    try {
      const v6Guid = uuid.v6(options);
      return GuidUint8Array.withVersion(
        new GuidUint8Array(v6Guid as FullHexGuid),
      ) as VersionedGuidUint8Array<6>;
    } catch (error) {
      if (error instanceof GuidError) {
        throw error;
      }
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
  }

  public static v7(options?: uuid.Version7Options): VersionedGuidUint8Array<7> {
    try {
      const v7Guid = uuid.v7(options);
      return GuidUint8Array.withVersion(
        new GuidUint8Array(v7Guid as FullHexGuid),
      ) as VersionedGuidUint8Array<7>;
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
      const hexString = Array.from(this)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      this._cachedFullHex = GuidUint8Array.toFullHexGuid(hexString);
    }
    return this._cachedFullHex;
  }
  /**
   * Returns the GUID as a raw Uint8Array.
   */
  public get asPlatformBuffer(): Uint8Array {
    return this as Uint8Array;
  }
  /**
   * Returns the GUID as a short hex string.
   * Result is cached for performance.
   */
  public get asShortHexGuid(): ShortHexGuid {
    if (!this._cachedShortHex) {
      this._cachedShortHex = GuidUint8Array.toShortHexGuid(this.asFullHexGuid);
    }
    return this._cachedShortHex;
  }
  /**
   * Returns the GUID as a base64 string.
   */
  public override toString(): Base64Guid {
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
    const hexString = Array.from(this)
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');
    return BigInt('0x' + hexString) as BigIntGuid;
  }
  /**
   * Returns the GUID as a base64 string.
   * Result is cached for performance.
   */
  public get asBase64Guid(): Base64Guid {
    if (!this._cachedBase64) {
      this._cachedBase64 = btoa(String.fromCharCode(...this)) as Base64Guid;
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
      value === GuidUint8Array.BOUNDARY_VALUES.ALL_ZEROS_FULL ||
      value === GuidUint8Array.BOUNDARY_VALUES.ALL_ZEROS_SHORT ||
      value === GuidUint8Array.BOUNDARY_VALUES.ALL_FS_FULL ||
      value === GuidUint8Array.BOUNDARY_VALUES.ALL_FS_SHORT
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
      const verifyFunc = GuidUint8Array.VerifyFunctions[guidBrand];
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
    const length = GuidUint8Array.LengthMap[guidBrand];
    if (length <= 0) {
      throw new GuidError(GuidErrorType.InvalidGuidUnknownBrand, guidBrand);
    }
    return length as number;
  }

  /**
   * Returns the brand of the GUID for the given length.
   * @param length The length of the GUID to get the brand for.
   * @param isUint8Array Whether the GUID is a Uint8Array.
   * @returns The brand of the GUID for the given length.
   */
  public static lengthToGuidBrand(
    length: number,
    isUint8Array: boolean,
  ): GuidBrandType {
    if (length <= 0) {
      throw new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        length,
      );
    }

    const brand = GuidUint8Array.ReverseLengthMap[length];

    if (!brand || brand === GuidBrandType.Unknown) {
      throw new GuidError(
        GuidErrorType.InvalidGuidUnknownLength,
        undefined,
        length,
      );
    }

    // Validate array vs string type consistency
    const isBrandUint8Array = brand === GuidBrandType.RawGuidPlatformBuffer;
    if (isUint8Array !== isBrandUint8Array) {
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
      const expectedLength = GuidUint8Array.guidBrandToLength(
        GuidBrandType.FullHexGuid,
      );
      const strValue = String(fullHexGuidValue);

      if (strValue.length !== expectedLength) {
        return false;
      }

      // Boundary values are always valid
      if (GuidUint8Array.isBoundaryValue(strValue)) {
        return true;
      }

      return GuidUint8Array.validateUuid(strValue);
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
      const expectedLength = GuidUint8Array.guidBrandToLength(
        GuidBrandType.ShortHexGuid,
      );
      const strValue = String(shortHexGuidValue);

      if (strValue.length !== expectedLength) {
        return false;
      }

      try {
        const fullHexGuid = GuidUint8Array.toFullHexGuid(strValue);
        // Boundary values are always valid
        if (GuidUint8Array.isBoundaryValue(fullHexGuid)) {
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
      } else if (GuidUint8Array.isUint8Array(value)) {
        valueLength = value.length;
      } else {
        valueLength = String(value).length;
      }

      const result =
        valueLength ===
        GuidUint8Array.guidBrandToLength(GuidBrandType.Base64Guid);

      if (result) {
        try {
          const fromBase64: Uint8Array =
            GuidUint8Array.toRawGuidPlatformBuffer(value);
          const hexString = Array.from(fromBase64)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('');
          const fullHexGuid = GuidUint8Array.toFullHexGuid(hexString);
          // Boundary values are always valid
          if (GuidUint8Array.isBoundaryValue(fullHexGuid)) {
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
   * Verifies if a given GUID is a valid raw GUID array.
   * @param value The raw GUID array to verify.
   * @returns True if the GUID is a valid raw GUID array, false otherwise.
   */
  public static isRawGuidUint8Array(value: GuidInput): boolean {
    try {
      if (value === null || value === undefined) {
        return false;
      }
      const expectedLength = GuidUint8Array.guidBrandToLength(
        GuidBrandType.RawGuidPlatformBuffer,
      );
      let valueLength: number;
      if (typeof value === 'bigint') {
        valueLength = value.toString(16).length;
      } else if (GuidUint8Array.isUint8Array(value)) {
        valueLength = value.length;
      } else {
        valueLength = String(value).length;
      }

      if (valueLength !== expectedLength) {
        return false;
      }

      try {
        if (!GuidUint8Array.isUint8Array(value)) {
          return false;
        }
        const hexString = Array.from(value as Uint8Array)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('');
        const fullHexGuid = GuidUint8Array.toFullHexGuid(hexString);
        // Boundary values are always valid
        if (GuidUint8Array.isBoundaryValue(fullHexGuid)) {
          return true;
        }
        return GuidUint8Array.validateUuid(fullHexGuid);
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
      if (value < 0n || value > GuidUint8Array.MAX_BIGINT_VALUE) {
        return false;
      }

      try {
        const fromBigInt = GuidUint8Array.toFullHexFromBigInt(value);
        // Boundary values are always valid
        if (GuidUint8Array.isBoundaryValue(fromBigInt)) {
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

    const isBuffer = GuidUint8Array.isUint8Array(value);
    const expectedLength = isBuffer
      ? (value as Uint8Array).length
      : String(value).length;

    return GuidUint8Array.lengthToGuidBrand(expectedLength, isBuffer);
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
      | RawGuidPlatformBuffer
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
      return GuidUint8Array.toFullHexFromBigInt(guid);
    } else if (
      GuidUint8Array.isUint8Array(guid) &&
      guid.length ===
        GuidUint8Array.guidBrandToLength(GuidBrandType.RawGuidPlatformBuffer)
    ) {
      const hexString = Array.from(guid as Uint8Array)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      const shortHex = hexString as ShortHexGuid;
      return GuidUint8Array.shortGuidToFullGuid(shortHex);
    } else if (GuidUint8Array.isUint8Array(guid)) {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
    // all remaining cases are string types
    const strValue = String(guid);
    if (
      strValue.length ===
      GuidUint8Array.guidBrandToLength(GuidBrandType.ShortHexGuid)
    ) {
      // short hex guid
      return GuidUint8Array.shortGuidToFullGuid(strValue);
    } else if (
      strValue.length ===
      GuidUint8Array.guidBrandToLength(GuidBrandType.FullHexGuid)
    ) {
      // already a full hex guid
      return strValue as FullHexGuid;
    } else if (
      strValue.length ===
      GuidUint8Array.guidBrandToLength(GuidBrandType.Base64Guid)
    ) {
      // base64 guid
      // base64 guid
      const binary = atob(strValue);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const shortGuid = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return GuidUint8Array.shortGuidToFullGuid(shortGuid);
    } else {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
  }

  public static toShortHexGuid(
    guid:
      | RawGuidPlatformBuffer
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
      const fullHex = GuidUint8Array.toFullHexFromBigInt(guid);
      return fullHex.replace(/-/g, '') as ShortHexGuid;
    } else if (
      GuidUint8Array.isUint8Array(guid) &&
      guid.length ===
        GuidUint8Array.guidBrandToLength(GuidBrandType.RawGuidPlatformBuffer)
    ) {
      return Array.from(guid as Uint8Array)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('') as ShortHexGuid;
    } else if (GuidUint8Array.isUint8Array(guid)) {
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
    // all remaining cases are string types
    const strValue = String(guid);

    if (
      strValue.length ===
      GuidUint8Array.guidBrandToLength(GuidBrandType.ShortHexGuid)
    ) {
      // already a short hex guid
      return strValue as ShortHexGuid;
    } else if (
      strValue.length ===
      GuidUint8Array.guidBrandToLength(GuidBrandType.FullHexGuid)
    ) {
      // full hex guid
      return strValue.replace(/-/g, '') as ShortHexGuid;
    } else if (
      strValue.length ===
      GuidUint8Array.guidBrandToLength(GuidBrandType.Base64Guid)
    ) {
      // base64 guid
      const binary = atob(strValue);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('') as ShortHexGuid;
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
    if (bigInt < 0n || bigInt > GuidUint8Array.MAX_BIGINT_VALUE) {
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
   * Converts a given GUID value to a raw GUID array.
   * @param value The GUID value to convert.
   * @returns The GUID value as a raw GUID array.
   */
  public static toRawGuidPlatformBuffer(
    value: GuidInput,
  ): RawGuidPlatformBuffer {
    const expectedBrand = GuidUint8Array.whichBrand(value);
    let rawGuidBufferResult: RawGuidPlatformBuffer = new Uint8Array(
      0,
    ) as RawGuidPlatformBuffer;
    switch (expectedBrand) {
      case GuidBrandType.FullHexGuid: {
        const hex1 = GuidUint8Array.toShortHexGuid(value as FullHexGuid);
        rawGuidBufferResult = new Uint8Array(
          hex1.length / 2,
        ) as RawGuidPlatformBuffer;
        for (let i = 0; i < hex1.length; i += 2) {
          rawGuidBufferResult[i / 2] = parseInt(hex1.slice(i, i + 2), 16);
        }
        break;
      }
      case GuidBrandType.ShortHexGuid: {
        const hex2 = GuidUint8Array.toShortHexGuid(value as ShortHexGuid);
        rawGuidBufferResult = new Uint8Array(
          hex2.length / 2,
        ) as RawGuidPlatformBuffer;
        for (let i = 0; i < hex2.length; i += 2) {
          rawGuidBufferResult[i / 2] = parseInt(hex2.slice(i, i + 2), 16);
        }
        break;
      }
      case GuidBrandType.Base64Guid:
        if (typeof value === 'string' || GuidUint8Array.isUint8Array(value)) {
          const b64 = value.toString();
          const binary = atob(b64);
          rawGuidBufferResult = new Uint8Array(
            binary.length,
          ) as RawGuidPlatformBuffer;
          for (let i = 0; i < binary.length; i++) {
            rawGuidBufferResult[i] = binary.charCodeAt(i);
          }
        } else {
          throw new GuidError(GuidErrorType.InvalidGuid);
        }
        break;
      case GuidBrandType.RawGuidPlatformBuffer:
        rawGuidBufferResult = value as RawGuidPlatformBuffer;
        break;
      case GuidBrandType.BigIntGuid: {
        const hex3 = GuidUint8Array.toShortHexGuid(
          GuidUint8Array.toFullHexFromBigInt(value as bigint),
        );
        rawGuidBufferResult = new Uint8Array(
          hex3.length / 2,
        ) as RawGuidPlatformBuffer;
        for (let i = 0; i < hex3.length; i += 2) {
          rawGuidBufferResult[i / 2] = parseInt(hex3.slice(i, i + 2), 16);
        }
        break;
      }
      default:
        throw new GuidError(GuidErrorType.InvalidGuidUnknownBrand);
    }
    if (
      rawGuidBufferResult.length !==
      GuidUint8Array.guidBrandToLength(GuidBrandType.RawGuidPlatformBuffer)
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
   * Compare two Guid instances for equality.
   * @param other - The other Guid instance to compare (can be null/undefined)
   * @param constantTime - Use constant-time comparison to prevent timing attacks (default: false)
   * @returns True if the two Guid instances are equal, false otherwise
   */
  public equals(
    other: IGuid | null | undefined,
    constantTime = false,
  ): boolean {
    if (!other) {
      return false;
    }

    if (constantTime) {
      const a = this.asRawGuidPlatformBufferUnsafe;
      const b = other.asRawGuidPlatformBuffer;
      let result = 0;
      for (let i = 0; i < 16; i++) {
        result |= a[i] ^ b[i];
      }
      return result === 0;
    }

    const a = this.asRawGuidPlatformBufferUnsafe;
    const b = other.asRawGuidPlatformBuffer;
    for (let i = 0; i < 16; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Checks if this GUID is empty (all zeros).
   * @returns True if the GUID is all zeros, false otherwise
   */
  public isEmpty(): boolean {
    // Check if all bytes are zero
    for (let i = 0; i < this.length; i++) {
      if (this[i] !== 0) {
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
  public static isNilOrEmpty(guid: IGuid | null | undefined): boolean {
    return !guid || (guid instanceof GuidUint8Array && guid.isEmpty());
  }

  /**
   * Creates a new Guid instance with the same value as this one.
   * @returns A new Guid instance with identical value and __version attached
   */
  public clone(): VersionedGuidUint8Array {
    return GuidUint8Array.withVersion(
      new GuidUint8Array(Uint8Array.from(this) as RawGuidPlatformBuffer),
    );
  }

  /**
   * Returns the hash code for this GUID based on its array content.
   * Useful for using GUIDs as Map/Set keys.
   * @returns A numeric hash code
   */
  public hashCode(): number {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
      hash = (hash << 5) - hash + this[i];
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
    if (GuidUint8Array.isBoundaryValue(this.asFullHexGuid)) {
      return undefined;
    }

    // Version is in bits 48-51 (byte 6, high nibble)
    const versionByte = this[6];
    const version = (versionByte >> 4) & 0x0f;

    // Valid RFC 4122 versions are 1-7
    return version >= 1 && version <= 7 ? version : undefined;
  }

  /**
   * Validates that this GUID is a proper v3 GUID according to RFC 4122.
   * @returns True if valid v3 GUID, false otherwise
   */
  public isValidV3(): boolean {
    return this.getVersion() === 3;
  }

  /**
   * Validates that this GUID is a proper v4 GUID according to RFC 4122.
   * Boundary values (all zeros/all Fs) return true as they're mathematically valid.
   * @returns True if valid v4 GUID or boundary value, false otherwise
   */
  public isValidV4(): boolean {
    // Boundary values are considered valid
    if (GuidUint8Array.isBoundaryValue(this.asFullHexGuid)) {
      return true;
    }

    const version = this.getVersion();
    return version === 4;
  }

  /**
   * Validates that this GUID is a proper v5 GUID according to RFC 4122.
   * @returns True if valid v5 GUID, false otherwise
   */
  public isValidV5(): boolean {
    return this.getVersion() === 5;
  }

  /**
   * Validates that this GUID is a proper v6 GUID according to RFC 4122.
   * @returns True if valid v6 GUID, false otherwise
   */
  public isValidV6(): boolean {
    return this.getVersion() === 6;
  }

  /**
   * Validates that this GUID is a proper v7 GUID according to RFC 4122.
   * @returns True if valid v7 GUID, false otherwise
   */
  public isValidV7(): boolean {
    return this.getVersion() === 7;
  }

  /**
   * Returns a human-readable string representation.
   */
  public toDebugString(): string {
    const version = this.getVersion();
    const variant = this.getVariant();
    return `Guid(${this.asFullHexGuid}, v${version ?? '?'}, variant=${variant ?? '?'})`;
  }

  /**
   * Compares two GUIDs for ordering.
   * Useful for sorting GUID arrays.
   * @param other The other GUID to compare to
   * @returns -1 if this < other, 0 if equal, 1 if this > other
   */
  public compareTo(other: IGuid): number {
    const a = this.asRawGuidPlatformBufferUnsafe;
    const b = other.asRawGuidPlatformBuffer;
    for (let i = 0; i < 16; i++) {
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }
    return 0;
  }

  /**
   * Returns the timestamp from a v1 GUID.
   * @returns Date object or undefined if not a v1 GUID
   */
  public getTimestamp(): Date | undefined {
    if (this.getVersion() !== 1) return undefined;

    const timeLow =
      (this[0] << 24) | (this[1] << 16) | (this[2] << 8) | this[3];
    const timeMid = (this[4] << 8) | this[5];
    const timeHigh = ((this[6] & 0x0f) << 8) | this[7];
    const timestamp =
      (BigInt(timeHigh) << 48n) |
      (BigInt(timeMid) << 32n) |
      BigInt(timeLow >>> 0);
    const unixTimestamp = Number(timestamp - 122192928000000000n) / 10000;
    return new Date(unixTimestamp);
  }

  /**
   * Extracts the variant from the GUID.
   * @returns The variant (0-2) or undefined
   */
  public getVariant(): number | undefined {
    const variantByte = this[8];
    if ((variantByte & 0x80) === 0) return 0; // NCS
    if ((variantByte & 0xc0) === 0x80) return 1; // RFC 4122
    if ((variantByte & 0xe0) === 0xc0) return 2; // Microsoft
    return undefined;
  }

  /**
   * Creates a v1 GUID (time-based).
   * @returns A new Guid instance containing a v1 GUID with __version attached
   */
  public static v1(options?: uuid.Version1Options): VersionedGuidUint8Array<1> {
    try {
      const v1Guid = uuid.v1(options);
      return GuidUint8Array.withVersion(
        new GuidUint8Array(v1Guid as FullHexGuid),
      ) as VersionedGuidUint8Array<1>;
    } catch (error) {
      if (error instanceof GuidError) throw error;
      throw new GuidError(GuidErrorType.InvalidGuid);
    }
  }

  /**
   * Validates that this GUID is a proper v1 GUID.
   * @returns True if valid v1 GUID, false otherwise
   */
  public isValidV1(): boolean {
    return this.getVersion() === 1;
  }

  /**
   * Returns a URL-safe base64 representation (no padding, URL-safe chars).
   */
  public get asUrlSafeBase64(): string {
    const base64 = btoa(String.fromCharCode(...this));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Creates a GUID from URL-safe base64.
   * @returns A new Guid instance with __version attached
   */
  public static fromUrlSafeBase64(urlSafe: string): VersionedGuidUint8Array {
    const base64 = urlSafe
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(24, '=');
    return GuidUint8Array.withVersion(new GuidUint8Array(base64 as Base64Guid));
  }
}
