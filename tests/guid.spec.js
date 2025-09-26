"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const guid_brand_type_1 = require("../src/enumerations/guid-brand-type");
const guid_error_type_1 = require("../src/enumerations/guid-error-type");
const guid_1 = require("../src/errors/guid");
const guid_2 = require("../src/guid");
const DEFAULT_UUID = '5549c83a-20fa-4a11-ae7d-9dc3f1681e9e';
// Mock only uuid.v4 to return predictable values, but use real validation
jest.mock('uuid', () => {
    const actualUuid = jest.requireActual('uuid');
    let callCount = 0;
    const mockV4 = jest.fn(() => {
        const uuids = [
            DEFAULT_UUID,
            '1234c83a-20fa-4a11-ae7d-9dc3f1681e9e',
            '5678c83a-20fa-4a11-ae7d-9dc3f1681e9e',
            '9abcc83a-20fa-4a11-ae7d-9dc3f1681e9e',
        ];
        const uuid = uuids[callCount % uuids.length];
        callCount++;
        return uuid;
    });
    return {
        ...actualUuid,
        v4: mockV4,
    };
});
beforeEach(() => {
    jest.clearAllMocks();
});
describe('guid', () => {
    describe('Format Conversions', () => {
        let guid;
        beforeEach(() => {
            guid = guid_2.GuidV4.new();
        });
        it('should convert between all formats correctly', () => {
            // Full hex -> Short hex -> Base64 -> Uint8Array -> BigInt -> Full hex
            const fullHex = guid.asFullHexGuid;
            const shortHex = guid_2.GuidV4.toShortHexGuid(fullHex);
            const base64 = new guid_2.GuidV4(shortHex).asBase64Guid;
            const uint8Array = new guid_2.GuidV4(base64).asRawGuidUint8Array;
            const bigInt = new guid_2.GuidV4(uint8Array).asBigIntGuid;
            const backToFullHex = new guid_2.GuidV4(bigInt).asFullHexGuid;
            expect(backToFullHex).toEqual(fullHex);
        });
        it('should handle boundary values in hex format', () => {
            // Test with all zeros
            const zeroHex = '00000000-0000-0000-0000-000000000000';
            const zeroGuid = new guid_2.GuidV4(zeroHex);
            expect(zeroGuid.asFullHexGuid).toEqual(zeroHex);
            // Test with all fs
            const maxHex = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
            const maxGuid = new guid_2.GuidV4(maxHex);
            expect(maxGuid.asFullHexGuid).toEqual(maxHex);
        });
        it('should handle boundary values in base64 format', () => {
            // Test with all zeros
            const zeroUint8Array = new Uint8Array(16);
            const zeroBase64 = typeof btoa === 'function'
                ? btoa(String.fromCharCode(...zeroUint8Array))
                : '';
            const zeroGuid = new guid_2.GuidV4(zeroBase64);
            expect(zeroGuid.asBase64Guid).toEqual(zeroBase64);
            // Test with all ones
            const maxUint8Array = new Uint8Array(16).fill(0xff);
            const maxBase64 = typeof btoa === 'function'
                ? btoa(String.fromCharCode(...maxUint8Array))
                : '';
            const maxGuid = new guid_2.GuidV4(maxBase64);
            expect(maxGuid.asBase64Guid).toEqual(maxBase64);
        });
        it('should handle boundary values in bigint format', () => {
            // Test with zero
            const zeroGuid = new guid_2.GuidV4(0n);
            expect(zeroGuid.asBigIntGuid).toEqual(0n);
            // Test with maximum valid value
            const maxBigInt = BigInt('0x' + 'f'.repeat(32));
            const maxGuid = new guid_2.GuidV4(maxBigInt);
            expect(maxGuid.asBigIntGuid).toEqual(maxBigInt);
        });
        describe('Invalid Conversions', () => {
            it('should handle invalid hex to base64 conversion', () => {
                expect(() => guid_2.GuidV4.toShortHexGuid('invalid-hex')).toThrowType(guid_1.GuidError, (error) => {
                    expect(error.type).toBe(guid_error_type_1.GuidErrorType.Invalid);
                });
            });
            it('should handle invalid base64 to hex conversion', () => {
                expect(() => new guid_2.GuidV4('!@#$%^&*')).toThrowType(guid_1.GuidError, (error) => {
                    expect(error.type).toBe(guid_error_type_1.GuidErrorType.UnknownLength);
                });
            });
            it('should handle invalid Uint8Array to hex conversion', () => {
                const invalidUint8Array = new Uint8Array([
                    1, 2, 3,
                ]);
                expect(() => new guid_2.GuidV4(invalidUint8Array)).toThrowType(guid_1.GuidError, (error) => {
                    expect(error.type).toBe(guid_error_type_1.GuidErrorType.Invalid);
                });
            });
        });
    });
    describe('Validation', () => {
        describe('Full Hex Format', () => {
            it('should validate correct format with mixed case', () => {
                const mixedCase = '5549C83a-20fA-4a11-ae7D-9dc3f1681e9e';
                expect(guid_2.GuidV4.isFullHexGuid(mixedCase)).toBeTruthy();
            });
            it('should reject invalid characters', () => {
                const invalidChars = '5549c83g-20fa-4a11-ae7d-9dc3f1681e9e'; // 'g' is invalid
                expect(guid_2.GuidV4.isFullHexGuid(invalidChars)).toBeFalsy();
            });
            it('should reject incorrect dash positions', () => {
                const wrongDashes = '5549c83a-20f-a4a11-ae7d-9dc3f1681e9e';
                expect(guid_2.GuidV4.isFullHexGuid(wrongDashes)).toBeFalsy();
            });
            it('should reject missing dashes', () => {
                const noDashes = '5549c83a20fa4a11ae7d9dc3f1681e9e';
                expect(guid_2.GuidV4.isFullHexGuid(noDashes)).toBeFalsy();
            });
            it('should reject extra dashes', () => {
                const extraDashes = '5549c83a--20fa-4a11-ae7d-9dc3f1681e9e';
                expect(guid_2.GuidV4.isFullHexGuid(extraDashes)).toBeFalsy();
            });
        });
        describe('Short Hex Format', () => {
            it('should validate correct format with mixed case', () => {
                const mixedCase = '5549C83a20fA4a11ae7D9dc3f1681e9e';
                expect(guid_2.GuidV4.isShortHexGuid(mixedCase)).toBeTruthy();
            });
            it('should reject invalid characters', () => {
                const invalidChars = '5549c83g20fa4a11ae7d9dc3f1681e9e'; // 'g' is invalid
                expect(guid_2.GuidV4.isShortHexGuid(invalidChars)).toBeFalsy();
            });
            it('should reject incorrect length', () => {
                const wrongLength = '5549c83a20fa4a11ae7d9dc3f1681e9';
                expect(guid_2.GuidV4.isShortHexGuid(wrongLength)).toBeFalsy();
            });
            it('should reject dashes', () => {
                const withDashes = '5549c83a-20fa-4a11-ae7d-9dc3f1681e9e';
                expect(guid_2.GuidV4.isShortHexGuid(withDashes)).toBeFalsy();
            });
        });
        describe('Base64 Format', () => {
            it('should validate correct base64 padding', () => {
                const validBase64 = typeof btoa === 'function'
                    ? btoa(String.fromCharCode(...new Uint8Array(16)))
                    : '';
                expect(guid_2.GuidV4.isBase64Guid(validBase64)).toBeTruthy();
            });
            it('should reject invalid base64 characters', () => {
                const invalidChars = '!@#$%^&*()_+';
                expect(guid_2.GuidV4.isBase64Guid(invalidChars)).toBeFalsy();
            });
            it('should reject incorrect padding', () => {
                const wrongPadding = typeof btoa === 'function'
                    ? btoa(String.fromCharCode(...new Uint8Array(16)))
                    : '';
                expect(guid_2.GuidV4.isBase64Guid(wrongPadding.slice(0, -1))).toBeFalsy();
            });
            it('should reject non-base64 strings of correct length', () => {
                const nonBase64 = '!@#$%^&*()_+{}[]';
                expect(guid_2.GuidV4.isBase64Guid(nonBase64)).toBeFalsy();
            });
        });
        describe('Uint8Array Format', () => {
            it('should validate correct Uint8Array length', () => {
                const validUint8Array = new Uint8Array(16);
                expect(guid_2.GuidV4.isRawGuidUint8Array(validUint8Array)).toBeTruthy();
            });
            it('should reject too short Uint8Array', () => {
                const shortUint8Array = new Uint8Array(15);
                expect(guid_2.GuidV4.isRawGuidUint8Array(shortUint8Array)).toBeFalsy();
            });
            it('should reject too long Uint8Array', () => {
                const longUint8Array = new Uint8Array(17);
                expect(guid_2.GuidV4.isRawGuidUint8Array(longUint8Array)).toBeFalsy();
            });
            it('should reject non-Uint8Array input', () => {
                expect(guid_2.GuidV4.isRawGuidUint8Array({})).toBeFalsy();
            });
        });
        describe('BigInt Format', () => {
            it('should validate zero', () => {
                expect(guid_2.GuidV4.isBigIntGuid(0n)).toBeTruthy();
            });
            it('should validate maximum value', () => {
                const maxBigInt = BigInt('0x' + 'f'.repeat(32));
                expect(guid_2.GuidV4.isBigIntGuid(maxBigInt)).toBeTruthy();
            });
            it('should reject negative values', () => {
                expect(guid_2.GuidV4.isBigIntGuid(-1n)).toBeFalsy();
            });
            it('should reject too large values', () => {
                const tooBig = BigInt('0x' + 'f'.repeat(33));
                expect(guid_2.GuidV4.isBigIntGuid(tooBig)).toBeFalsy();
            });
            it('should reject non-bigint input', () => {
                expect(guid_2.GuidV4.isBigIntGuid({})).toBeFalsy();
            });
        });
    });
    describe('Error Handling', () => {
        it('should handle undefined input consistently', () => {
            expect(() => new guid_2.GuidV4(undefined)).toThrowType(guid_1.GuidError, (error) => {
                expect(error.type).toBe(guid_error_type_1.GuidErrorType.Invalid);
            });
        });
        it('should handle non-string/non-Uint8Array input', () => {
            expect(() => new guid_2.GuidV4({})).toThrowType(guid_1.GuidError, (error) => {
                expect(error.type).toBe(guid_error_type_1.GuidErrorType.UnknownLength);
            });
        });
        it('should handle invalid string length', () => {
            expect(() => new guid_2.GuidV4('abc')).toThrowType(guid_1.GuidError, (error) => {
                expect(error.type).toBe(guid_error_type_1.GuidErrorType.UnknownLength);
                expect(error.length).toBe(3);
            });
        });
        it('should handle malformed hex string', () => {
            const malformedHex = '5549c83g-20fa-4a11-ae7d-9dc3f1681e9e'; // Invalid character 'g'
            expect(() => new guid_2.GuidV4(malformedHex)).toThrowType(guid_1.GuidError, (error) => {
                expect(error.type).toBe(guid_error_type_1.GuidErrorType.Invalid);
            });
        });
        it('should handle malformed base64 string', () => {
            const malformedBase64 = '!@#$%^&*()_+{}[]';
            expect(() => new guid_2.GuidV4(malformedBase64)).toThrowType(guid_1.GuidError, (error) => {
                expect(error.type).toBe(guid_error_type_1.GuidErrorType.UnknownLength);
            });
        });
    });
    describe('Comparison', () => {
        it('should correctly compare equal guids from different formats', () => {
            const guid1 = guid_2.GuidV4.new();
            const guid2 = new guid_2.GuidV4(guid1.asBase64Guid);
            const guid3 = new guid_2.GuidV4(guid1.asBigIntGuid);
            const guid4 = new guid_2.GuidV4(guid1.asRawGuidUint8Array);
            expect(guid1.equals(guid2)).toBeTruthy();
            expect(guid2.equals(guid3)).toBeTruthy();
            expect(guid3.equals(guid4)).toBeTruthy();
            expect(guid4.equals(guid1)).toBeTruthy();
        });
        it('should correctly compare different guids', () => {
            const guid1 = guid_2.GuidV4.new();
            const guid2 = guid_2.GuidV4.new();
            expect(guid1.equals(guid2)).toBeFalsy();
        });
    });
    describe('Brand Type Handling', () => {
        it('should handle unknown brand type', () => {
            expect(() => guid_2.GuidV4.guidBrandToLength(guid_brand_type_1.GuidBrandType.Unknown)).toThrowType(guid_1.GuidError, (error) => {
                expect(error.type).toBe(guid_error_type_1.GuidErrorType.UnknownBrand);
            });
        });
        it('should handle unknown length', () => {
            expect(() => guid_2.GuidV4.lengthToGuidBrand(0, false)).toThrowType(guid_1.GuidError, (error) => {
                expect(error.type).toBe(guid_error_type_1.GuidErrorType.UnknownLength);
            });
        });
        it('should handle Uint8Array flag correctly', () => {
            expect(() => guid_2.GuidV4.lengthToGuidBrand(36, true)).toThrowType(guid_1.GuidError, (error) => {
                expect(error.type).toBe(guid_error_type_1.GuidErrorType.UnknownLength);
            });
        });
    });
});
//# sourceMappingURL=guid.spec.js.map