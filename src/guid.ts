import * as uuid from 'uuid';
import { GuidBrandType } from './enumerations/guid-brand-type';
import { GuidErrorType } from './enumerations/guid-error-type';
import { GuidError } from './errors/guid';
import { getCompatibleEciesEngine } from './i18n-setup';
import { IGuidV4 } from './interfaces/guid';
import {
  Base64Guid,
  BigIntGuid,
  FullHexGuid,
  RawGuidUint8Array,
  ShortHexGuid,
} from './types';
import { base64ToUint8Array, uint8ArrayToHex } from './utils';

// Re-export Base64Guid so it's available to importers of guid.ts
export type { Base64Guid };

// Define a type that can handle all GUID variants
export type GuidInput =
  | string
  | FullHexGuid
  | ShortHexGuid
  | Base64Guid
  | BigIntGuid
  | RawGuidUint8Array
  | bigint
  | Uint8Array;

/**
 * GuidV4 represents a GUID (Globally Unique Identifier) that is compliant with the RFC 4122 standard.
 * GuidV4 instances can be created from a variety of input types, including:
 * - FullHexGuid: A 36-character string representation of the GUID, including dashes
 * - ShortHexGuid: A 32-character string representation of the GUID, excluding dashes
 * - Base64Guid: A 24-character base64-encoded string representation of the GUID
 * - BigIntGuid: A bigint representation of the GUID
 * - RawGuidUint8Array: A 16-byte Uint8Array representation of the GUID
 * GuidV4 instances can be converted to any of these representations using the appropriate method.
 */
export class GuidV4 implements IGuidV4 {
  /**
   * GUID is stored internally as a raw 16-byte Uint8Array.
   */
  private readonly _value: RawGuidUint8Array;
  constructor(value: GuidInput) {
    // Check for UnknownLength issues first - this applies to any input type
    let brandCheckPassed = false;
    try {
      GuidV4.whichBrand(value);
      brandCheckPassed = true;
    } catch (error) {
      if (
        error instanceof GuidError &&
        (error.type === GuidErrorType.UnknownLength ||
          error.type === GuidErrorType.UnknownBrand)
      ) {
        // For Uint8Array with wrong length, treat as Invalid rather than UnknownLength
        if (
          value instanceof Uint8Array &&
          error.type === GuidErrorType.UnknownLength
        ) {
          throw new GuidError(
            GuidErrorType.Invalid,
            getCompatibleEciesEngine() as any,
          );
        }
        throw error; // Let UnknownLength/UnknownBrand bubble up for other types
      }
      // For other errors from whichBrand, continue with validation
    }

    // Only do validation if brand check passed
    if (brandCheckPassed) {
      try {
        if (!GuidV4.isValid(value as any)) {
          throw new GuidError(
            GuidErrorType.Invalid,
            getCompatibleEciesEngine() as any,
          );
        }
      } catch (error) {
        if (error instanceof GuidError) {
          throw error;
        }
        throw new GuidError(
          GuidErrorType.Invalid,
          getCompatibleEciesEngine() as any,
        );
      }
    }

    this._value = GuidV4.toRawGuidUint8Array(value);
  }

  public static isValid(
    value:
      | string
      | FullHexGuid
      | ShortHexGuid
      | Base64Guid
      | BigIntGuid
      | RawGuidUint8Array,
  ) {
    try {
      if (value === null || value === undefined) {
        return false;
      }
      const strValue = String(value);
      if (!strValue && value !== 0n) {
        return false;
      }
      const expectedBrand = GuidV4.whichBrand(value);
      const verifiedBrand = GuidV4.verifyGuid(expectedBrand, value);
      if (!verifiedBrand) {
        return false;
      }
      const uintArray = GuidV4.toRawGuidUint8Array(value);
      // Skip UUID validation for boundary values that are mathematically valid but not RFC 4122 compliant
      const fullHex = GuidV4.toFullHexGuid(uintArray);
      const isAllZeros = fullHex === '00000000-0000-0000-0000-000000000000';
      const isAllFs = fullHex === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      if (!isAllZeros && !isAllFs && !uuid.validate(fullHex)) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
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
    [GuidBrandType.RawGuidUint8Array]: 16,
    [GuidBrandType.BigIntGuid]: -1, // Variable length
  };

  private static readonly ReverseLengthMap: Record<number, GuidBrandType> = {
    0: GuidBrandType.Unknown,
    36: GuidBrandType.FullHexGuid,
    32: GuidBrandType.ShortHexGuid,
    24: GuidBrandType.Base64Guid,
    16: GuidBrandType.RawGuidUint8Array,
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
    [GuidBrandType.RawGuidUint8Array]: (guid: GuidInput) =>
      this.isRawGuidUint8Array(guid),
  };

  /**
   * Returns the GUID as a raw Uint8Array.
   */
  public get asRawGuidUint8Array(): RawGuidUint8Array {
    return this._value;
  }
  public static new<
    TStringKey extends string,
    TLanguage extends string,
  >(): GuidV4 {
    try {
      const uuidStr = uuid.v4();
      if (!uuidStr) {
        throw new GuidError(
          GuidErrorType.Invalid,
          getCompatibleEciesEngine() as any,
        );
      }
      return new GuidV4(uuidStr as FullHexGuid);
    } catch (error) {
      // If there's an error creating the GUID, throw a more specific error
      if (error instanceof GuidError) {
        throw error;
      }
      throw new GuidError(
        GuidErrorType.Invalid,
        getCompatibleEciesEngine() as any,
      );
    }
  }
  /**
   * Returns the GUID as a full hex string.
   */
  public get asFullHexGuid(): FullHexGuid {
    return GuidV4.toFullHexGuid(this._value) as FullHexGuid;
  }
  /**
   * Returns the GUID as a raw Uint8Array.
   */
  public get asUint8Array(): Uint8Array {
    return this._value as Uint8Array;
  }
  /**
   * Returns the GUID as a short hex string.
   */
  public get asShortHexGuid(): ShortHexGuid {
    return GuidV4.toShortHexGuid(this.asFullHexGuid) as ShortHexGuid;
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
    const hex = uint8ArrayToHex(this._value);
    return BigInt('0x' + hex) as BigIntGuid;
  }
  /**
   * Returns the GUID as a base64 string.
   */
  public get asBase64Guid(): Base64Guid {
    return btoa(String.fromCharCode(...this._value)) as Base64Guid;
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
  public static guidBrandToLength<
    TStringKey extends string,
    TLanguage extends string,
  >(guidBrand: GuidBrandType): number {
    const length = GuidV4.LengthMap[guidBrand];
    if (length <= 0) {
      throw new GuidError(
        GuidErrorType.UnknownBrand,
        getCompatibleEciesEngine() as any,
        guidBrand,
      );
    }
    return length as number;
  }

  /**
   * Returns the brand of the GUID for the given length.
   * @param length The length of the GUID to get the brand for.
   * @param isUint8Array Whether the GUID is a Uint8Array.
   * @returns The brand of the GUID for the given length.
   */
  public static lengthToGuidBrand<
    TStringKey extends string,
    TLanguage extends string,
  >(length: number, isUint8Array: boolean): GuidBrandType {
    if (length <= 0) {
      throw new GuidError(
        GuidErrorType.UnknownLength,
        getCompatibleEciesEngine() as any,
        undefined,
        length,
      );
    }
    const keys = Object.keys(GuidV4.ReverseLengthMap);
    const values = Object.values(GuidV4.ReverseLengthMap);
    for (let i = 0; i < keys.length; i++) {
      const len = parseInt(keys[i]);
      const brand = values[i];
      if (len === length) {
        if (isUint8Array && !brand.endsWith('Uint8Array')) {
          continue;
        } else if (!isUint8Array && brand.endsWith('Uint8Array')) {
          continue;
        }
        return brand;
      }
    }
    throw new GuidError(
      GuidErrorType.UnknownLength,
      getCompatibleEciesEngine() as any,
      undefined,
      length,
    );
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

      // Allow boundary values (all zeros and all fs)
      const isAllZeros = strValue === '00000000-0000-0000-0000-000000000000';
      const isAllFs = strValue === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      return isAllZeros || isAllFs || GuidV4.validateUuid(strValue);
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
        // Allow boundary values (all zeros and all fs)
        const isAllZeros =
          fullHexGuid === '00000000-0000-0000-0000-000000000000';
        const isAllFs = fullHexGuid === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
        return isAllZeros || isAllFs || uuid.validate(fullHexGuid);
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
      } else if (value instanceof Uint8Array) {
        valueLength = value.length;
      } else {
        valueLength = String(value).length;
      }

      const result =
        valueLength === GuidV4.guidBrandToLength(GuidBrandType.Base64Guid);

      if (result) {
        try {
          const fromBase64: RawGuidUint8Array =
            GuidV4.toRawGuidUint8Array(value);
          const hex = uint8ArrayToHex(fromBase64);
          const fullHexGuid = GuidV4.toFullHexGuid(hex);
          // Allow boundary values (all zeros and all fs)
          const isAllZeros =
            fullHexGuid === '00000000-0000-0000-0000-000000000000';
          const isAllFs =
            fullHexGuid === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
          return isAllZeros || isAllFs || uuid.validate(fullHexGuid);
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
  public static isRawGuidUint8Array(value: GuidInput): boolean {
    try {
      if (value === null || value === undefined) {
        return false;
      }
      const expectedLength = GuidV4.guidBrandToLength(
        GuidBrandType.RawGuidUint8Array,
      );
      let valueLength: number;
      if (typeof value === 'bigint') {
        valueLength = value.toString(16).length;
      } else if (value instanceof Uint8Array) {
        valueLength = value.length;
      } else {
        valueLength = String(value).length;
      }

      if (valueLength !== expectedLength) {
        return false;
      }

      try {
        if (!(value instanceof Uint8Array)) {
          return false;
        }
        const hex = uint8ArrayToHex(value);
        const fullHexGuid = GuidV4.toFullHexGuid(hex);
        // Allow boundary values (all zeros and all fs)
        const isAllZeros =
          fullHexGuid === '00000000-0000-0000-0000-000000000000';
        const isAllFs = fullHexGuid === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
        return isAllZeros || isAllFs || GuidV4.validateUuid(fullHexGuid);
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
      if (value < 0n) {
        return false;
      }
      const bigIntString = value.toString(16);
      if (bigIntString.length > 32) {
        return false;
      }

      try {
        const fromBigInt = GuidV4.toFullHexFromBigInt(value);
        // Allow boundary values (all zeros and all fs)
        const isAllZeros =
          fromBigInt === '00000000-0000-0000-0000-000000000000';
        const isAllFs = fromBigInt === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
        return isAllZeros || isAllFs || uuid.validate(fromBigInt);
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
      throw new GuidError(
        GuidErrorType.Invalid,
        getCompatibleEciesEngine() as any,
      );
    }
    if (typeof value === 'bigint') {
      return GuidBrandType.BigIntGuid;
    }
    const isUint8Array = value instanceof Uint8Array;
    let expectedLength: number;

    if (typeof value === 'bigint') {
      // For bigint, we'll use the string representation length
      const bigintValue = value as bigint;
      expectedLength = bigintValue.toString(16).length;
    } else if (isUint8Array) {
      expectedLength = (value as Uint8Array).length;
    } else {
      expectedLength = String(value).length;
    }
    return GuidV4.lengthToGuidBrand(expectedLength, isUint8Array);
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
   * @param dateCreated The date created for Mongoose IDs
   * @returns The GUID value as a full hex GUID.
   */
  public static toFullHexGuid<
    TStringKey extends string,
    TLanguage extends string,
  >(
    guid:
      | RawGuidUint8Array
      | BigIntGuid
      | Base64Guid
      | ShortHexGuid
      | FullHexGuid
      | string,
  ): FullHexGuid {
    if (!guid) {
      throw new GuidError(
        GuidErrorType.Invalid,
        getCompatibleEciesEngine() as any,
      );
    } else if (typeof guid === 'bigint') {
      return GuidV4.toFullHexFromBigInt(guid);
    } else if (
      guid instanceof Uint8Array &&
      guid.length === GuidV4.guidBrandToLength(GuidBrandType.RawGuidUint8Array)
    ) {
      const shortHex = uint8ArrayToHex(guid) as ShortHexGuid;
      return GuidV4.shortGuidToFullGuid(shortHex);
    } else if (guid instanceof Uint8Array) {
      throw new GuidError(
        GuidErrorType.Invalid,
        getCompatibleEciesEngine() as any,
      );
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
      const shortGuid = uint8ArrayToHex(base64ToUint8Array(strValue));
      return GuidV4.shortGuidToFullGuid(shortGuid);
    } else {
      throw new GuidError(
        GuidErrorType.Invalid,
        getCompatibleEciesEngine() as any,
      );
    }
  }

  public static toShortHexGuid<
    TStringKey extends string,
    TLanguage extends string,
  >(
    guid:
      | RawGuidUint8Array
      | BigIntGuid
      | Base64Guid
      | ShortHexGuid
      | FullHexGuid
      | string,
  ): ShortHexGuid {
    if (!guid) {
      throw new GuidError(
        GuidErrorType.Invalid,
        getCompatibleEciesEngine() as any,
      );
    } else if (typeof guid === 'bigint') {
      const fullHex = GuidV4.toFullHexFromBigInt(guid);
      return fullHex.replace(/-/g, '') as ShortHexGuid;
    } else if (
      guid instanceof Uint8Array &&
      guid.length === GuidV4.guidBrandToLength(GuidBrandType.RawGuidUint8Array)
    ) {
      return uint8ArrayToHex(guid) as ShortHexGuid;
    } else if (guid instanceof Uint8Array) {
      throw new GuidError(
        GuidErrorType.Invalid,
        getCompatibleEciesEngine() as any,
      );
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
      return uint8ArrayToHex(base64ToUint8Array(strValue)) as ShortHexGuid;
    } else {
      throw new GuidError(
        GuidErrorType.Invalid,
        getCompatibleEciesEngine() as any,
      );
    }
  }

  /**
   * Converts a given bigint to a full hex GUID.
   * @param bigInt The bigint to convert.
   * @returns The bigint as a full hex GUID.
   */
  public static toFullHexFromBigInt<
    TStringKey extends string,
    TLanguage extends string,
  >(bigInt: bigint): FullHexGuid {
    if (bigInt < 0n) {
      throw new GuidError(
        GuidErrorType.Invalid,
        getCompatibleEciesEngine() as any,
      );
    }
    const uuidBigInt = bigInt.toString(16).padStart(32, '0');
    if (uuidBigInt.length !== 32) {
      throw new GuidError(
        GuidErrorType.Invalid,
        getCompatibleEciesEngine() as any,
      );
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
   * @param dateCreated The date the GUID was created for Mongoose GUIDs
   * @returns The GUID value as a raw GUID buffer.
   */
  public static toRawGuidUint8Array<
    TStringKey extends string,
    TLanguage extends string,
  >(value: GuidInput): RawGuidUint8Array {
    const expectedBrand = GuidV4.whichBrand(value);
    let rawGuidUint8ArrayResult: RawGuidUint8Array = new Uint8Array(
      0,
    ) as RawGuidUint8Array;
    switch (expectedBrand) {
      case GuidBrandType.FullHexGuid:
        const shortHex1 = GuidV4.toShortHexGuid(value as ShortHexGuid);
        rawGuidUint8ArrayResult = new Uint8Array(
          shortHex1.match(/.{2}/g)!.map((byte: string) => parseInt(byte, 16)),
        ) as RawGuidUint8Array;
        break;
      case GuidBrandType.ShortHexGuid:
        const shortHex2 = GuidV4.toShortHexGuid(value as ShortHexGuid);
        rawGuidUint8ArrayResult = new Uint8Array(
          shortHex2.match(/.{2}/g)!.map((byte: string) => parseInt(byte, 16)),
        ) as RawGuidUint8Array;
        break;
      case GuidBrandType.Base64Guid:
        // Ensure value is a string before using it with atob
        if (typeof value === 'string' || value instanceof Uint8Array) {
          const binaryString = atob(value.toString());
          rawGuidUint8ArrayResult = new Uint8Array(
            Array.from(binaryString).map((c) => c.charCodeAt(0)),
          ) as RawGuidUint8Array;
        } else {
          throw new GuidError(
            GuidErrorType.Invalid,
            getCompatibleEciesEngine() as any,
          );
        }
        break;
      case GuidBrandType.RawGuidUint8Array:
        rawGuidUint8ArrayResult = value as RawGuidUint8Array;
        break;
      case GuidBrandType.BigIntGuid:
        const shortHex3 = GuidV4.toShortHexGuid(
          GuidV4.toFullHexFromBigInt(value as bigint),
        );
        rawGuidUint8ArrayResult = new Uint8Array(
          shortHex3.match(/.{2}/g)!.map((byte: string) => parseInt(byte, 16)),
        ) as RawGuidUint8Array;
        break;
      default:
        throw new GuidError(
          GuidErrorType.UnknownBrand,
          getCompatibleEciesEngine() as any,
        );
    }
    if (
      rawGuidUint8ArrayResult.length !==
      GuidV4.guidBrandToLength(GuidBrandType.RawGuidUint8Array)
    ) {
      throw new GuidError(
        GuidErrorType.UnknownLength,
        getCompatibleEciesEngine() as any,
        undefined,
        rawGuidUint8ArrayResult.length,
      );
    }
    return rawGuidUint8ArrayResult;
  }

  /**
   * Compare two GuidV4 instances
   * @param other - The other GuidV4 instance to compare
   * @returns True if the two GuidV4 instances are equal, false otherwise
   */
  public equals(other: IGuidV4): boolean {
    const a = this.asRawGuidUint8Array;
    const b = other.asRawGuidUint8Array;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
