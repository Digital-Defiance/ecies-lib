import { GuidBrandType } from './enumerations/guid-brand-type';
import { IGuidV4 } from './interfaces/guid';
import { Base64Guid, BigIntGuid, FullHexGuid, RawGuidUint8Array, ShortHexGuid } from './types';
export type { Base64Guid };
export type GuidInput = string | FullHexGuid | ShortHexGuid | Base64Guid | BigIntGuid | RawGuidUint8Array | bigint | Uint8Array;
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
export declare class GuidV4 implements IGuidV4 {
    /**
     * GUID is stored internally as a raw 16-byte Uint8Array.
     */
    private readonly _value;
    constructor(value: GuidInput);
    static isValid(value: string | FullHexGuid | ShortHexGuid | Base64Guid | BigIntGuid | RawGuidUint8Array): boolean;
    static validateUuid(value: string): boolean;
    serialize(): string;
    static hydrate(value: string): GuidV4;
    private static readonly LengthMap;
    private static readonly ReverseLengthMap;
    private static readonly VerifyFunctions;
    /**
     * Returns the GUID as a raw Uint8Array.
     */
    get asRawGuidUint8Array(): RawGuidUint8Array;
    static new(): GuidV4;
    /**
     * Returns the GUID as a full hex string.
     */
    get asFullHexGuid(): FullHexGuid;
    /**
     * Returns the GUID as a raw Uint8Array.
     */
    get asUint8Array(): Uint8Array;
    /**
     * Returns the GUID as a short hex string.
     */
    get asShortHexGuid(): ShortHexGuid;
    /**
     * Returns the GUID as a base64 string.
     */
    toString(): Base64Guid;
    /**
     * Returns the GUID as a JSON string.
     * @returns The GUID as a JSON string.
     */
    toJson(): string;
    /**
     * Returns the GUID as a bigint.
     */
    get asBigIntGuid(): BigIntGuid;
    /**
     * Returns the GUID as a base64 string.
     */
    get asBase64Guid(): Base64Guid;
    /**
     * Verifies if a given GUID is valid for the given brand.
     * @param guidBrand The brand of the GUID to verify.
     * @param guid The GUID to verify.
     * @returns True if the GUID is valid for the given brand, false otherwise.
     */
    static verifyGuid(guidBrand: GuidBrandType, guid: GuidInput): boolean;
    /**
     * Returns the length of the GUID for the given brand.
     * @param guidBrand The brand of the GUID to get the length for.
     * @returns The length of the GUID for the given brand.
     */
    static guidBrandToLength(guidBrand: GuidBrandType): number;
    /**
     * Returns the brand of the GUID for the given length.
     * @param length The length of the GUID to get the brand for.
     * @param isUint8Array Whether the GUID is a Uint8Array.
     * @returns The brand of the GUID for the given length.
     */
    static lengthToGuidBrand(length: number, isUint8Array: boolean): GuidBrandType;
    /**
     * Verifies if a given GUID is a valid full hex GUID.
     * @param fullHexGuidValue The full hex GUID to verify.
     * @returns True if the GUID is a valid full hex GUID, false otherwise.
     */
    static isFullHexGuid(fullHexGuidValue: GuidInput): boolean;
    /**
     * Verifies if a given GUID is a valid short hex GUID.
     * @param shortHexGuidValue The short hex GUID to verify.
     * @returns True if the GUID is a valid short hex GUID, false otherwise.
     */
    static isShortHexGuid(shortHexGuidValue: GuidInput): boolean;
    /**
     * Verifies if a given GUID is a valid base64 GUID.
     * @param value The base64 GUID to verify.
     * @returns True if the GUID is a valid base64 GUID, false otherwise.
     */
    static isBase64Guid(value: GuidInput): boolean;
    /**
     * Verifies if a given GUID is a valid raw GUID buffer.
     * @param value The raw GUID buffer to verify.
     * @returns True if the GUID is a valid raw GUID buffer, false otherwise.
     */
    static isRawGuidUint8Array(value: GuidInput): boolean;
    /**
     * Verifies if a given GUID is a valid bigint GUID.
     * @param value The bigint GUID to verify.
     * @returns True if the GUID is a valid bigint GUID, false otherwise.
     */
    static isBigIntGuid(value: GuidInput): boolean;
    /**
     * Determines the brand of a given GUID value.
     * @param value The GUID value to determine the brand of.
     * @returns The brand of the GUID value.
     */
    static whichBrand(value: GuidInput): GuidBrandType;
    /**
     * Converts a given short hex GUID to a full hex GUID.
     * @param shortGuid The short hex GUID to convert.
     * @returns The short hex GUID as a full hex GUID.
     */
    private static shortGuidToFullGuid;
    /**
     * Converts a given GUID value to a full hex GUID.
     * @param guid The GUID value to convert.
     * @param dateCreated The date created for Mongoose IDs
     * @returns The GUID value as a full hex GUID.
     */
    static toFullHexGuid(guid: RawGuidUint8Array | BigIntGuid | Base64Guid | ShortHexGuid | FullHexGuid | string): FullHexGuid;
    static toShortHexGuid(guid: RawGuidUint8Array | BigIntGuid | Base64Guid | ShortHexGuid | FullHexGuid | string): ShortHexGuid;
    /**
     * Converts a given bigint to a full hex GUID.
     * @param bigInt The bigint to convert.
     * @returns The bigint as a full hex GUID.
     */
    static toFullHexFromBigInt(bigInt: bigint): FullHexGuid;
    /**
     * Converts a given GUID value to a raw GUID buffer.
     * @param value The GUID value to convert.
     * @param dateCreated The date the GUID was created for Mongoose GUIDs
     * @returns The GUID value as a raw GUID buffer.
     */
    static toRawGuidUint8Array(value: GuidInput): RawGuidUint8Array;
    /**
     * Compare two GuidV4 instances
     * @param other - The other GuidV4 instance to compare
     * @returns True if the two GuidV4 instances are equal, false otherwise
     */
    equals(other: IGuidV4): boolean;
}
//# sourceMappingURL=guid.d.ts.map