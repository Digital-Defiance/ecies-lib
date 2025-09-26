"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuidV4 = void 0;
const uuid = __importStar(require("uuid"));
const guid_brand_type_1 = require("./enumerations/guid-brand-type");
const guid_error_type_1 = require("./enumerations/guid-error-type");
const guid_1 = require("./errors/guid");
const utils_1 = require("./utils");
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
class GuidV4 {
    constructor(value) {
        // Check for UnknownLength issues first - this applies to any input type
        try {
            _a.whichBrand(value);
        }
        catch (error) {
            if (error instanceof guid_1.GuidError &&
                (error.type === guid_error_type_1.GuidErrorType.UnknownLength ||
                    error.type === guid_error_type_1.GuidErrorType.UnknownBrand)) {
                // For Uint8Array with wrong length, treat as Invalid rather than UnknownLength
                if (value instanceof Uint8Array &&
                    error.type === guid_error_type_1.GuidErrorType.UnknownLength) {
                    throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
                }
                throw error; // Let UnknownLength/UnknownBrand bubble up for other types
            }
            // For other errors from whichBrand, continue with validation
        }
        try {
            if (!_a.isValid(value)) {
                throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
            }
        }
        catch (error) {
            if (error instanceof guid_1.GuidError) {
                throw error;
            }
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
        this._value = _a.toRawGuidUint8Array(value);
    }
    static isValid(value) {
        try {
            if (value === null || value === undefined) {
                return false;
            }
            const strValue = String(value);
            if (!strValue && value !== 0n) {
                return false;
            }
            const expectedBrand = _a.whichBrand(value);
            const verifiedBrand = _a.verifyGuid(expectedBrand, value);
            if (!verifiedBrand) {
                return false;
            }
            const uintArray = _a.toRawGuidUint8Array(value);
            // Skip UUID validation for boundary values that are mathematically valid but not RFC 4122 compliant
            const fullHex = _a.toFullHexGuid(uintArray);
            const isAllZeros = fullHex === '00000000-0000-0000-0000-000000000000';
            const isAllFs = fullHex === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
            if (!isAllZeros && !isAllFs && !uuid.validate(fullHex)) {
                return false;
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    static validateUuid(value) {
        return uuid.validate(value);
    }
    serialize() {
        return this.asBase64Guid;
    }
    static hydrate(value) {
        return new _a(value);
    }
    /**
     * Returns the GUID as a raw Uint8Array.
     */
    get asRawGuidUint8Array() {
        return this._value;
    }
    static new() {
        try {
            const uuidStr = uuid.v4();
            if (!uuidStr) {
                throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
            }
            return new _a(uuidStr);
        }
        catch (error) {
            // If there's an error creating the GUID, throw a more specific error
            if (error instanceof guid_1.GuidError) {
                throw error;
            }
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
    }
    /**
     * Returns the GUID as a full hex string.
     */
    get asFullHexGuid() {
        return _a.toFullHexGuid(this._value);
    }
    /**
     * Returns the GUID as a raw Uint8Array.
     */
    get asUint8Array() {
        return this._value;
    }
    /**
     * Returns the GUID as a short hex string.
     */
    get asShortHexGuid() {
        return _a.toShortHexGuid(this.asFullHexGuid);
    }
    /**
     * Returns the GUID as a base64 string.
     */
    toString() {
        return this.asBase64Guid;
    }
    /**
     * Returns the GUID as a JSON string.
     * @returns The GUID as a JSON string.
     */
    toJson() {
        return JSON.stringify(this.asBase64Guid);
    }
    /**
     * Returns the GUID as a bigint.
     */
    get asBigIntGuid() {
        const hex = (0, utils_1.uint8ArrayToHex)(this._value);
        return BigInt('0x' + hex);
    }
    /**
     * Returns the GUID as a base64 string.
     */
    get asBase64Guid() {
        return btoa(String.fromCharCode(...this._value));
    }
    /**
     * Verifies if a given GUID is valid for the given brand.
     * @param guidBrand The brand of the GUID to verify.
     * @param guid The GUID to verify.
     * @returns True if the GUID is valid for the given brand, false otherwise.
     */
    static verifyGuid(guidBrand, guid) {
        if (guid === null || guid === undefined) {
            return false;
        }
        try {
            const verifyFunc = _a.VerifyFunctions[guidBrand];
            return verifyFunc(guid);
        }
        catch {
            return false;
        }
    }
    /**
     * Returns the length of the GUID for the given brand.
     * @param guidBrand The brand of the GUID to get the length for.
     * @returns The length of the GUID for the given brand.
     */
    static guidBrandToLength(guidBrand) {
        const length = _a.LengthMap[guidBrand];
        if (length <= 0) {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.UnknownBrand, guidBrand);
        }
        return length;
    }
    /**
     * Returns the brand of the GUID for the given length.
     * @param length The length of the GUID to get the brand for.
     * @param isUint8Array Whether the GUID is a Uint8Array.
     * @returns The brand of the GUID for the given length.
     */
    static lengthToGuidBrand(length, isUint8Array) {
        if (length <= 0) {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.UnknownLength, undefined);
        }
        const keys = Object.keys(_a.ReverseLengthMap);
        const values = Object.values(_a.ReverseLengthMap);
        for (let i = 0; i < keys.length; i++) {
            const len = parseInt(keys[i]);
            const brand = values[i];
            if (len === length) {
                if (isUint8Array && !brand.endsWith('Uint8Array')) {
                    continue;
                }
                else if (!isUint8Array && brand.endsWith('Uint8Array')) {
                    continue;
                }
                return brand;
            }
        }
        throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.UnknownLength, undefined, length);
    }
    /**
     * Verifies if a given GUID is a valid full hex GUID.
     * @param fullHexGuidValue The full hex GUID to verify.
     * @returns True if the GUID is a valid full hex GUID, false otherwise.
     */
    static isFullHexGuid(fullHexGuidValue) {
        try {
            if (fullHexGuidValue === null || fullHexGuidValue === undefined) {
                return false;
            }
            const expectedLength = _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.FullHexGuid);
            const strValue = String(fullHexGuidValue);
            if (strValue.length !== expectedLength) {
                return false;
            }
            // Allow boundary values (all zeros and all fs)
            const isAllZeros = strValue === '00000000-0000-0000-0000-000000000000';
            const isAllFs = strValue === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
            return isAllZeros || isAllFs || _a.validateUuid(strValue);
        }
        catch {
            return false;
        }
    }
    /**
     * Verifies if a given GUID is a valid short hex GUID.
     * @param shortHexGuidValue The short hex GUID to verify.
     * @returns True if the GUID is a valid short hex GUID, false otherwise.
     */
    static isShortHexGuid(shortHexGuidValue) {
        try {
            if (shortHexGuidValue === null || shortHexGuidValue === undefined) {
                return false;
            }
            const expectedLength = _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.ShortHexGuid);
            const strValue = String(shortHexGuidValue);
            if (strValue.length !== expectedLength) {
                return false;
            }
            try {
                const fullHexGuid = _a.toFullHexGuid(strValue);
                // Allow boundary values (all zeros and all fs)
                const isAllZeros = fullHexGuid === '00000000-0000-0000-0000-000000000000';
                const isAllFs = fullHexGuid === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
                return isAllZeros || isAllFs || uuid.validate(fullHexGuid);
            }
            catch {
                return false;
            }
        }
        catch {
            return false;
        }
    }
    /**
     * Verifies if a given GUID is a valid base64 GUID.
     * @param value The base64 GUID to verify.
     * @returns True if the GUID is a valid base64 GUID, false otherwise.
     */
    static isBase64Guid(value) {
        try {
            if (value === null || value === undefined) {
                return false;
            }
            let valueLength;
            if (typeof value === 'bigint') {
                valueLength = value.toString(16).length;
            }
            else if (value instanceof Uint8Array) {
                valueLength = value.length;
            }
            else {
                valueLength = String(value).length;
            }
            const result = valueLength === _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.Base64Guid);
            if (result) {
                try {
                    const fromBase64 = _a.toRawGuidUint8Array(value);
                    const hex = (0, utils_1.uint8ArrayToHex)(fromBase64);
                    const fullHexGuid = _a.toFullHexGuid(hex);
                    // Allow boundary values (all zeros and all fs)
                    const isAllZeros = fullHexGuid === '00000000-0000-0000-0000-000000000000';
                    const isAllFs = fullHexGuid === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
                    return isAllZeros || isAllFs || uuid.validate(fullHexGuid);
                }
                catch {
                    return false;
                }
            }
            return result;
        }
        catch {
            return false;
        }
    }
    /**
     * Verifies if a given GUID is a valid raw GUID buffer.
     * @param value The raw GUID buffer to verify.
     * @returns True if the GUID is a valid raw GUID buffer, false otherwise.
     */
    static isRawGuidUint8Array(value) {
        try {
            if (value === null || value === undefined) {
                return false;
            }
            const expectedLength = _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.RawGuidUint8Array);
            let valueLength;
            if (typeof value === 'bigint') {
                valueLength = value.toString(16).length;
            }
            else if (value instanceof Uint8Array) {
                valueLength = value.length;
            }
            else {
                valueLength = String(value).length;
            }
            if (valueLength !== expectedLength) {
                return false;
            }
            try {
                if (!(value instanceof Uint8Array)) {
                    return false;
                }
                const hex = (0, utils_1.uint8ArrayToHex)(value);
                const fullHexGuid = _a.toFullHexGuid(hex);
                // Allow boundary values (all zeros and all fs)
                const isAllZeros = fullHexGuid === '00000000-0000-0000-0000-000000000000';
                const isAllFs = fullHexGuid === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
                return isAllZeros || isAllFs || _a.validateUuid(fullHexGuid);
            }
            catch {
                return false;
            }
        }
        catch {
            return false;
        }
    }
    /**
     * Verifies if a given GUID is a valid bigint GUID.
     * @param value The bigint GUID to verify.
     * @returns True if the GUID is a valid bigint GUID, false otherwise.
     */
    static isBigIntGuid(value) {
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
                const fromBigInt = _a.toFullHexFromBigInt(value);
                // Allow boundary values (all zeros and all fs)
                const isAllZeros = fromBigInt === '00000000-0000-0000-0000-000000000000';
                const isAllFs = fromBigInt === 'ffffffff-ffff-ffff-ffff-ffffffffffff';
                return isAllZeros || isAllFs || uuid.validate(fromBigInt);
            }
            catch {
                return false;
            }
        }
        catch {
            return false;
        }
    }
    /**
     * Determines the brand of a given GUID value.
     * @param value The GUID value to determine the brand of.
     * @returns The brand of the GUID value.
     */
    static whichBrand(value) {
        if (value === null || value === undefined) {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
        if (typeof value === 'bigint') {
            return guid_brand_type_1.GuidBrandType.BigIntGuid;
        }
        const isUint8Array = value instanceof Uint8Array;
        let expectedLength;
        if (typeof value === 'bigint') {
            // For bigint, we'll use the string representation length
            const bigintValue = value;
            expectedLength = bigintValue.toString(16).length;
        }
        else if (isUint8Array) {
            expectedLength = value.length;
        }
        else {
            expectedLength = String(value).length;
        }
        return _a.lengthToGuidBrand(expectedLength, isUint8Array);
    }
    /**
     * Converts a given short hex GUID to a full hex GUID.
     * @param shortGuid The short hex GUID to convert.
     * @returns The short hex GUID as a full hex GUID.
     */
    static shortGuidToFullGuid(shortGuid) {
        // insert dashes
        const str = shortGuid.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
        return str;
    }
    /**
     * Converts a given GUID value to a full hex GUID.
     * @param guid The GUID value to convert.
     * @param dateCreated The date created for Mongoose IDs
     * @returns The GUID value as a full hex GUID.
     */
    static toFullHexGuid(guid) {
        if (!guid) {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
        else if (typeof guid === 'bigint') {
            return _a.toFullHexFromBigInt(guid);
        }
        else if (guid instanceof Uint8Array &&
            guid.length === _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.RawGuidUint8Array)) {
            const shortHex = (0, utils_1.uint8ArrayToHex)(guid);
            return _a.shortGuidToFullGuid(shortHex);
        }
        else if (guid instanceof Uint8Array) {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
        // all remaining cases are string types
        const strValue = String(guid);
        if (strValue.length === _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.ShortHexGuid)) {
            // short hex guid
            return _a.shortGuidToFullGuid(strValue);
        }
        else if (strValue.length === _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.FullHexGuid)) {
            // already a full hex guid
            return strValue;
        }
        else if (strValue.length === _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.Base64Guid)) {
            // base64 guid
            const shortGuid = (0, utils_1.uint8ArrayToHex)((0, utils_1.base64ToUint8Array)(strValue));
            return _a.shortGuidToFullGuid(shortGuid);
        }
        else {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
    }
    static toShortHexGuid(guid) {
        if (!guid) {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
        else if (typeof guid === 'bigint') {
            const fullHex = _a.toFullHexFromBigInt(guid);
            return fullHex.replace(/-/g, '');
        }
        else if (guid instanceof Uint8Array &&
            guid.length === _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.RawGuidUint8Array)) {
            return (0, utils_1.uint8ArrayToHex)(guid);
        }
        else if (guid instanceof Uint8Array) {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
        // all remaining cases are string types
        const strValue = String(guid);
        if (strValue.length === _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.ShortHexGuid)) {
            // already a short hex guid
            return strValue;
        }
        else if (strValue.length === _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.FullHexGuid)) {
            // full hex guid
            return strValue.replace(/-/g, '');
        }
        else if (strValue.length === _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.Base64Guid)) {
            // base64 guid
            return (0, utils_1.uint8ArrayToHex)((0, utils_1.base64ToUint8Array)(strValue));
        }
        else {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
    }
    /**
     * Converts a given bigint to a full hex GUID.
     * @param bigInt The bigint to convert.
     * @returns The bigint as a full hex GUID.
     */
    static toFullHexFromBigInt(bigInt) {
        if (bigInt < 0n) {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
        const uuidBigInt = bigInt.toString(16).padStart(32, '0');
        if (uuidBigInt.length !== 32) {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
        }
        const rebuiltUuid = uuidBigInt.slice(0, 8) +
            '-' +
            uuidBigInt.slice(8, 12) +
            '-' +
            uuidBigInt.slice(12, 16) +
            '-' +
            uuidBigInt.slice(16, 20) +
            '-' +
            uuidBigInt.slice(20);
        return rebuiltUuid;
    }
    /**
     * Converts a given GUID value to a raw GUID buffer.
     * @param value The GUID value to convert.
     * @param dateCreated The date the GUID was created for Mongoose GUIDs
     * @returns The GUID value as a raw GUID buffer.
     */
    static toRawGuidUint8Array(value) {
        const expectedBrand = _a.whichBrand(value);
        let rawGuidUint8ArrayResult = new Uint8Array(0);
        switch (expectedBrand) {
            case guid_brand_type_1.GuidBrandType.FullHexGuid:
                const shortHex1 = _a.toShortHexGuid(value);
                rawGuidUint8ArrayResult = new Uint8Array(shortHex1.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
                break;
            case guid_brand_type_1.GuidBrandType.ShortHexGuid:
                const shortHex2 = _a.toShortHexGuid(value);
                rawGuidUint8ArrayResult = new Uint8Array(shortHex2.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
                break;
            case guid_brand_type_1.GuidBrandType.Base64Guid:
                // Ensure value is a string before using it with atob
                if (typeof value === 'string' || value instanceof Uint8Array) {
                    const binaryString = atob(value.toString());
                    rawGuidUint8ArrayResult = new Uint8Array(Array.from(binaryString).map((c) => c.charCodeAt(0)));
                }
                else {
                    throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.Invalid);
                }
                break;
            case guid_brand_type_1.GuidBrandType.RawGuidUint8Array:
                rawGuidUint8ArrayResult = value;
                break;
            case guid_brand_type_1.GuidBrandType.BigIntGuid:
                const shortHex3 = _a.toShortHexGuid(_a.toFullHexFromBigInt(value));
                rawGuidUint8ArrayResult = new Uint8Array(shortHex3.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
                break;
            default:
                throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.UnknownBrand);
        }
        if (rawGuidUint8ArrayResult.length !==
            _a.guidBrandToLength(guid_brand_type_1.GuidBrandType.RawGuidUint8Array)) {
            throw new guid_1.GuidError(guid_error_type_1.GuidErrorType.UnknownLength, undefined, rawGuidUint8ArrayResult.length);
        }
        return rawGuidUint8ArrayResult;
    }
    /**
     * Compare two GuidV4 instances
     * @param other - The other GuidV4 instance to compare
     * @returns True if the two GuidV4 instances are equal, false otherwise
     */
    equals(other) {
        const a = this.asRawGuidUint8Array;
        const b = other.asRawGuidUint8Array;
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
}
exports.GuidV4 = GuidV4;
_a = GuidV4;
GuidV4.LengthMap = {
    [guid_brand_type_1.GuidBrandType.Unknown]: -1,
    [guid_brand_type_1.GuidBrandType.FullHexGuid]: 36,
    [guid_brand_type_1.GuidBrandType.ShortHexGuid]: 32,
    [guid_brand_type_1.GuidBrandType.Base64Guid]: 24,
    [guid_brand_type_1.GuidBrandType.RawGuidUint8Array]: 16,
    [guid_brand_type_1.GuidBrandType.BigIntGuid]: -1, // Variable length
};
GuidV4.ReverseLengthMap = {
    0: guid_brand_type_1.GuidBrandType.Unknown,
    36: guid_brand_type_1.GuidBrandType.FullHexGuid,
    32: guid_brand_type_1.GuidBrandType.ShortHexGuid,
    24: guid_brand_type_1.GuidBrandType.Base64Guid,
    16: guid_brand_type_1.GuidBrandType.RawGuidUint8Array,
    // BigIntGuid is variable length, so it is not included in the reverse map
};
GuidV4.VerifyFunctions = {
    [guid_brand_type_1.GuidBrandType.Unknown]: () => false,
    [guid_brand_type_1.GuidBrandType.FullHexGuid]: (guid) => _a.isFullHexGuid(guid),
    [guid_brand_type_1.GuidBrandType.ShortHexGuid]: (guid) => _a.isShortHexGuid(guid),
    [guid_brand_type_1.GuidBrandType.Base64Guid]: (guid) => _a.isBase64Guid(guid),
    [guid_brand_type_1.GuidBrandType.BigIntGuid]: (guid) => _a.isBigIntGuid(guid),
    [guid_brand_type_1.GuidBrandType.RawGuidUint8Array]: (guid) => _a.isRawGuidUint8Array(guid),
};
//# sourceMappingURL=guid.js.map