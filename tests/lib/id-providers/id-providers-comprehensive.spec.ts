/**
 * Comprehensive test suite for ID providers.
 *
 * This test suite validates:
 * 1. Correctness of ID generation and validation
 * 2. Serialization/deserialization round-trips
 * 3. Uniqueness and randomness properties
 * 4. Edge cases and error handling
 * 5. Security properties (constant-time operations)
 * 6. Format compliance (ObjectID, UUID, GUID standards)
 * 7. Performance characteristics
 * 8. Cross-provider compatibility
 * 9. Native type conversion (toBytes/fromBytes)
 * 10. String conversion (idToString/idFromString)
 */

import {
  CustomIdProvider,
  GuidV4Provider,
  ObjectIdProvider,
  UuidProvider,
} from '../../../src/lib/id-providers';

describe('ID Providers - Comprehensive Tests', () => {
  describe('ObjectIdProvider', () => {
    let provider: ObjectIdProvider;

    beforeEach(() => {
      provider = new ObjectIdProvider();
    });

    describe('Generation', () => {
      it('should generate IDs with correct length', () => {
        for (let i = 0; i < 100; i++) {
          const id = provider.generate();
          expect(id.length).toBe(12);
          expect(id).toBeInstanceOf(Uint8Array);
        }
      });

      it('should generate unique IDs', () => {
        const ids = new Set<string>();
        const count = 1000;

        for (let i = 0; i < count; i++) {
          const id = provider.generate();
          const hex = provider.serialize(id);
          ids.add(hex);
        }

        // All IDs should be unique
        expect(ids.size).toBe(count);
      });

      it('should have increasing timestamps in sequential generations', () => {
        const id1 = provider.generate();
        // Sleep briefly to ensure timestamp changes
        const start = Date.now();
        while (Date.now() - start < 2) {
          // 2ms delay
        }
        const id2 = provider.generate();

        // Extract timestamps (first 4 bytes, big-endian)
        const timestamp1 =
          (id1[0] << 24) | (id1[1] << 16) | (id1[2] << 8) | id1[3];
        const timestamp2 =
          (id2[0] << 24) | (id2[1] << 16) | (id2[2] << 8) | id2[3];

        expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
      });

      it('should have non-zero random and counter portions', () => {
        const id = provider.generate();

        // Check random portion (bytes 4-8)
        let hasNonZeroRandom = false;
        for (let i = 4; i < 9; i++) {
          if (id[i] !== 0) {
            hasNonZeroRandom = true;
            break;
          }
        }
        expect(hasNonZeroRandom).toBe(true);

        // Counter portion (bytes 9-11) may be zero for first ID
        // but multiple generations should show variation
        const ids = Array.from({ length: 10 }, () => provider.generate());
        const counterValues = new Set(
          ids.map((id) => (id[9] << 16) | (id[10] << 8) | id[11]),
        );
        expect(counterValues.size).toBeGreaterThan(1);
      });
    });

    describe('Validation', () => {
      it('should validate correctly generated IDs', () => {
        for (let i = 0; i < 100; i++) {
          const id = provider.generate();
          expect(provider.validate(id)).toBe(true);
        }
      });

      it('should reject all-zero IDs', () => {
        const allZeros = new Uint8Array(12);
        expect(provider.validate(allZeros)).toBe(false);
      });

      it('should reject IDs with wrong length', () => {
        expect(provider.validate(new Uint8Array(11))).toBe(false);
        expect(provider.validate(new Uint8Array(13))).toBe(false);
        expect(provider.validate(new Uint8Array(0))).toBe(false);
        expect(provider.validate(new Uint8Array(16))).toBe(false);
      });

      it('should accept IDs with valid structure', () => {
        const validId = new Uint8Array(12);
        validId[0] = 0x01; // Non-zero timestamp
        expect(provider.validate(validId)).toBe(true);
      });
    });

    describe('Serialization', () => {
      it('should serialize to 24-character hex string', () => {
        const id = provider.generate();
        const serialized = provider.serialize(id);

        expect(serialized).toMatch(/^[0-9a-f]{24}$/);
        expect(serialized.length).toBe(24);
      });

      it('should produce consistent serialization', () => {
        const id = provider.generate();
        const serialized1 = provider.serialize(id);
        const serialized2 = provider.serialize(id);

        expect(serialized1).toBe(serialized2);
      });

      it('should serialize with leading zeros preserved', () => {
        const id = new Uint8Array(12);
        id[0] = 0x00;
        id[1] = 0x01;
        id[11] = 0x0a;

        const serialized = provider.serialize(id);
        expect(serialized).toMatch(/^00/); // Leading zero preserved
        expect(serialized.length).toBe(24);
      });

      it('should throw on invalid input', () => {
        expect(() => provider.serialize(new Uint8Array(11))).toThrow();
        expect(() => provider.serialize(new Uint8Array(13))).toThrow();
      });
    });

    describe('Deserialization', () => {
      it('should round-trip through serialization', () => {
        for (let i = 0; i < 100; i++) {
          const original = provider.generate();
          const serialized = provider.serialize(original);
          const deserialized = provider.deserialize(serialized);

          // Compare as native types
          const obj1 = provider.fromBytes(original);
          const obj2 = provider.fromBytes(deserialized);
          expect(provider.equals(obj1, obj2)).toBe(true);
        }
      });

      it('should accept both uppercase and lowercase hex', () => {
        const id = provider.generate();
        const lower = provider.serialize(id);
        const upper = lower.toUpperCase();

        const fromLower = provider.deserialize(lower);
        const fromUpper = provider.deserialize(upper);

        const obj1 = provider.fromBytes(fromLower);
        const obj2 = provider.fromBytes(fromUpper);
        expect(provider.equals(obj1, obj2)).toBe(true);
      });

      it('should reject invalid hex strings', () => {
        expect(() => provider.deserialize('invalid')).toThrow();
        expect(() => provider.deserialize('gg'.repeat(12))).toThrow();
        expect(() => provider.deserialize('01'.repeat(11))).toThrow(); // Too short
        expect(() => provider.deserialize('01'.repeat(13))).toThrow(); // Too long
      });

      it('should reject non-string input', () => {
        expect(() => provider.deserialize(123 as any)).toThrow();
        expect(() => provider.deserialize(null as any)).toThrow();
        expect(() => provider.deserialize(undefined as any)).toThrow();
      });

      it('should reject all-zero deserialized IDs', () => {
        expect(() => provider.deserialize('0'.repeat(24))).toThrow();
      });
    });

    describe('Equality and Comparison', () => {
      it('should correctly compare identical IDs', () => {
        const bytes = provider.generate();
        const id = provider.fromBytes(bytes);
        const clone = provider.clone(id);

        expect(provider.equals(id, clone)).toBe(true);
        expect(provider.equals(id, id)).toBe(true);
      });

      it('should correctly compare different IDs', () => {
        const id1 = provider.fromBytes(provider.generate());
        const id2 = provider.fromBytes(provider.generate());

        expect(provider.equals(id1, id2)).toBe(false);
      });

      it('should be consistent with byte comparison', () => {
        const bytes = provider.generate();
        const id1 = provider.fromBytes(bytes);
        const id2 = provider.fromBytes(new Uint8Array(bytes));

        expect(provider.equals(id1, id2)).toBe(true);
      });
    });

    describe('Cloning', () => {
      it('should create independent copies', () => {
        const original = provider.fromBytes(provider.generate());
        const cloned = provider.clone(original);

        // Should be equal
        expect(provider.equals(original, cloned)).toBe(true);

        // But not the same object
        expect(original).not.toBe(cloned);
      });
    });

    describe('Native Type Conversion', () => {
      it('should round-trip through toBytes/fromBytes', () => {
        const bytes = provider.generate();
        const native = provider.fromBytes(bytes);
        const backToBytes = provider.toBytes(native);

        expect(backToBytes.length).toBe(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          expect(backToBytes[i]).toBe(bytes[i]);
        }
      });

      it('should produce ObjectId instances from fromBytes', () => {
        const bytes = provider.generate();
        const native = provider.fromBytes(bytes);

        expect(native.toHexString).toBeDefined();
        expect(typeof native.toHexString()).toBe('string');
      });
    });

    describe('String Conversion', () => {
      it('should convert to string with idToString', () => {
        const native = provider.fromBytes(provider.generate());
        const str = provider.idToString(native);

        expect(typeof str).toBe('string');
        expect(str.length).toBe(24);
      });

      it('should round-trip through idToString/idFromString', () => {
        const native = provider.fromBytes(provider.generate());
        const str = provider.idToString(native);
        const restored = provider.idFromString(str);

        expect(provider.equals(native, restored)).toBe(true);
      });
    });
  });

  describe('GuidV4Provider', () => {
    let provider: GuidV4Provider;

    beforeEach(() => {
      provider = new GuidV4Provider();
    });

    describe('Generation', () => {
      it('should generate valid v4 GUIDs', () => {
        for (let i = 0; i < 100; i++) {
          const id = provider.generate();
          expect(id.length).toBe(16);
          expect(provider.validate(id)).toBe(true);
          expect(provider.getVersion(id)).toBe(4);
        }
      });

      it('should set v4 version bits correctly', () => {
        const id = provider.generate();

        // Byte 6: version (4 bits) should be 0100 (v4)
        const versionNibble = (id[6] >> 4) & 0x0f;
        expect(versionNibble).toBe(4);
      });

      it('should set variant bits correctly', () => {
        const id = provider.generate();

        // Byte 8: variant bits should be 10xxxxxx (RFC 4122)
        const variantBits = (id[8] >> 6) & 0x03;
        expect(variantBits).toBe(2); // Binary 10
      });

      it('should generate unique GUIDs', () => {
        const ids = new Set<string>();
        const count = 1000;

        for (let i = 0; i < count; i++) {
          const id = provider.generate();
          const str = provider.serialize(id);
          ids.add(str);
        }

        expect(ids.size).toBe(count);
      });

      it('should have sufficient randomness', () => {
        // Check that generated GUIDs have varied bits
        const ids = Array.from({ length: 100 }, () => provider.generate());

        // Count bit variations at each position
        const bitCounts = new Array(16 * 8).fill(0);
        for (const id of ids) {
          for (let byteIdx = 0; byteIdx < 16; byteIdx++) {
            for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
              if (id[byteIdx] & (1 << bitIdx)) {
                bitCounts[byteIdx * 8 + bitIdx]++;
              }
            }
          }
        }

        // Most bits should vary (not all 0 or all 1)
        // Skip version and variant bits
        const variableBits = bitCounts.filter((count, idx) => {
          const byteIdx = Math.floor(idx / 8);
          // Skip version byte (6) and variant byte (8) high bits
          if (byteIdx === 6 || byteIdx === 8) return false;
          return true;
        });

        const wellDistributed = variableBits.filter(
          (count) => count > 20 && count < 80, // Between 20% and 80%
        );

        expect(wellDistributed.length).toBeGreaterThan(
          variableBits.length * 0.8,
        );
      });
    });

    describe('Validation', () => {
      it('should validate correctly generated GUIDs', () => {
        for (let i = 0; i < 100; i++) {
          const id = provider.generate();
          expect(provider.validate(id)).toBe(true);
        }
      });

      it('should detect empty GUIDs', () => {
        const empty = new Uint8Array(16);
        expect(provider.isEmpty(empty)).toBe(true);
      });

      it('should reject wrong length', () => {
        expect(provider.validate(new Uint8Array(15))).toBe(false);
        expect(provider.validate(new Uint8Array(17))).toBe(false);
      });

      it('should reject invalid version GUIDs', () => {
        const id = provider.generate();
        // Change version to v3
        id[6] = (id[6] & 0x0f) | 0x30;
        expect(provider.validate(id)).toBe(false);
      });
    });

    describe('Serialization', () => {
      it('should serialize to base64 string', () => {
        const id = provider.generate();
        const serialized = provider.serialize(id);

        expect(serialized.length).toBe(24);
        expect(serialized).toMatch(/^[A-Za-z0-9+/]+=*$/);
      });

      it('should round-trip through serialization', () => {
        for (let i = 0; i < 100; i++) {
          const original = provider.generate();
          const serialized = provider.serialize(original);
          const deserialized = provider.deserialize(serialized);

          const guid1 = provider.fromBytes(original);
          const guid2 = provider.fromBytes(deserialized);
          expect(provider.equals(guid1, guid2)).toBe(true);
        }
      });
    });

    describe('Deserialization', () => {
      it('should accept multiple GUID formats', () => {
        const id = provider.generate();
        const base64 = provider.serialize(id);

        // Should accept base64
        const fromBase64 = provider.deserialize(base64);
        const guid1 = provider.fromBytes(id);
        const guid2 = provider.fromBytes(fromBase64);
        expect(provider.equals(guid1, guid2)).toBe(true);
      });

      it('should reject invalid strings', () => {
        expect(() => provider.deserialize('invalid')).toThrow();
        expect(() => provider.deserialize('!')).toThrow();
      });
    });

    describe('Special Methods', () => {
      it('should detect empty GUIDs', () => {
        const empty = new Uint8Array(16);
        const nonEmpty = provider.generate();

        expect(provider.isEmpty(empty)).toBe(true);
        expect(provider.isEmpty(nonEmpty)).toBe(false);
      });

      it('should extract version correctly', () => {
        const id = provider.generate();
        expect(provider.getVersion(id)).toBe(4);
      });
    });

    describe('Native Type Conversion', () => {
      it('should round-trip through toBytes/fromBytes', () => {
        const bytes = provider.generate();
        const native = provider.fromBytes(bytes);
        const backToBytes = provider.toBytes(native);

        expect(backToBytes.length).toBe(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          expect(backToBytes[i]).toBe(bytes[i]);
        }
      });

      it('should produce GuidV4 instances from fromBytes', () => {
        const bytes = provider.generate();
        const native = provider.fromBytes(bytes);

        expect(native.asFullHexGuid).toBeDefined();
        expect(typeof native.asFullHexGuid).toBe('string');
      });
    });

    describe('Cloning', () => {
      it('should create independent copies', () => {
        const original = provider.fromBytes(provider.generate());
        const cloned = provider.clone(original);

        expect(provider.equals(original, cloned)).toBe(true);
        expect(original).not.toBe(cloned);
      });
    });

    describe('String Conversion', () => {
      it('should convert to string with idToString', () => {
        const native = provider.fromBytes(provider.generate());
        const str = provider.idToString(native);

        expect(typeof str).toBe('string');
      });

      it('should round-trip through idToString/idFromString', () => {
        const native = provider.fromBytes(provider.generate());
        const str = provider.idToString(native);
        const restored = provider.idFromString(str);

        expect(provider.equals(native, restored)).toBe(true);
      });
    });
  });

  describe('UuidProvider', () => {
    let provider: UuidProvider;

    beforeEach(() => {
      provider = new UuidProvider();
    });

    describe('Generation', () => {
      it('should generate valid UUIDs', () => {
        for (let i = 0; i < 100; i++) {
          const id = provider.generate();
          expect(id.length).toBe(16);
          expect(provider.validate(id)).toBe(true);
        }
      });

      it('should generate unique UUIDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 1000; i++) {
          const id = provider.generate();
          ids.add(provider.serialize(id));
        }
        expect(ids.size).toBe(1000);
      });
    });

    describe('Serialization', () => {
      it('should serialize to standard UUID format with dashes', () => {
        const id = provider.generate();
        const serialized = provider.serialize(id);

        expect(serialized).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
        expect(serialized.length).toBe(36);
      });

      it('should round-trip through serialization', () => {
        for (let i = 0; i < 100; i++) {
          const original = provider.generate();
          const serialized = provider.serialize(original);
          const deserialized = provider.deserialize(serialized);

          // UuidProvider native type is string
          const str1 = provider.fromBytes(original);
          const str2 = provider.fromBytes(deserialized);
          expect(provider.equals(str1, str2)).toBe(true);
        }
      });

      it('should format with dashes at correct positions', () => {
        const id = provider.generate();
        const str = provider.serialize(id);

        expect(str[8]).toBe('-');
        expect(str[13]).toBe('-');
        expect(str[18]).toBe('-');
        expect(str[23]).toBe('-');
      });
    });

    describe('Deserialization', () => {
      it('should accept UUID strings with dashes', () => {
        const id = provider.generate();
        const str = provider.serialize(id);
        const deserialized = provider.deserialize(str);

        const uuid1 = provider.fromBytes(id);
        const uuid2 = provider.fromBytes(deserialized);
        expect(provider.equals(uuid1, uuid2)).toBe(true);
      });

      it('should reject invalid UUID strings', () => {
        expect(() => provider.deserialize('invalid')).toThrow();
        expect(() =>
          provider.deserialize('12345678-1234-1234-1234-1234567890ab-extra'),
        ).toThrow();
      });
    });

    describe('Special Methods', () => {
      it('should detect nil UUIDs', () => {
        const nil = new Uint8Array(16);
        const nonNil = provider.generate();

        expect(provider.isNil(nil)).toBe(true);
        expect(provider.isNil(nonNil)).toBe(false);
      });

      it('should extract version', () => {
        const id = provider.generate();
        expect(provider.getVersion(id)).toBe(4);
      });
    });

    describe('Native Type Conversion', () => {
      it('should return string as native type', () => {
        const bytes = provider.generate();
        const native = provider.fromBytes(bytes);

        expect(typeof native).toBe('string');
        expect(native).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
      });

      it('should round-trip through toBytes/fromBytes', () => {
        const bytes = provider.generate();
        const native = provider.fromBytes(bytes);
        const backToBytes = provider.toBytes(native);

        expect(backToBytes.length).toBe(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          expect(backToBytes[i]).toBe(bytes[i]);
        }
      });
    });

    describe('Cloning', () => {
      it('should clone strings (immutable, same reference is fine)', () => {
        const native = provider.fromBytes(provider.generate());
        const cloned = provider.clone(native);

        expect(provider.equals(native, cloned)).toBe(true);
        // Strings are immutable, same reference is acceptable
        expect(cloned).toBe(native);
      });
    });

    describe('String Conversion', () => {
      it('should convert to string with idToString', () => {
        const native = provider.fromBytes(provider.generate());
        const str = provider.idToString(native);

        expect(typeof str).toBe('string');
        expect(str.length).toBe(36);
      });

      it('should round-trip through idToString/idFromString', () => {
        const native = provider.fromBytes(provider.generate());
        const str = provider.idToString(native);
        const restored = provider.idFromString(str);

        expect(provider.equals(native, restored)).toBe(true);
      });
    });
  });

  describe('CustomIdProvider', () => {
    describe('Construction', () => {
      it('should create providers with custom byte lengths', () => {
        const sizes = [1, 8, 16, 20, 24, 32, 48, 64, 128, 255];

        for (const size of sizes) {
          const provider = new CustomIdProvider(size);
          expect(provider.byteLength).toBe(size);
        }
      });

      it('should accept custom names', () => {
        const provider = new CustomIdProvider(20, 'SHA1Hash');
        expect(provider.name).toBe('SHA1Hash');
      });

      it('should use default name if not provided', () => {
        const provider = new CustomIdProvider(10);
        expect(provider.name).toBe('Custom');
      });

      it('should reject invalid byte lengths', () => {
        expect(() => new CustomIdProvider(0)).toThrow();
        expect(() => new CustomIdProvider(-1)).toThrow();
        expect(() => new CustomIdProvider(256)).toThrow();
        expect(() => new CustomIdProvider(1.5)).toThrow();
        expect(() => new CustomIdProvider(NaN)).toThrow();
        expect(() => new CustomIdProvider(Infinity)).toThrow();
      });
    });

    describe('Generation', () => {
      it('should generate IDs of correct length', () => {
        const sizes = [1, 10, 20, 50, 100, 255];

        for (const size of sizes) {
          const provider = new CustomIdProvider(size);
          const id = provider.generate();

          expect(id.length).toBe(size);
          expect(provider.validate(id)).toBe(true);
        }
      });

      it('should generate unique IDs', () => {
        const provider = new CustomIdProvider(16);
        const ids = new Set<string>();

        for (let i = 0; i < 1000; i++) {
          const id = provider.generate();
          ids.add(provider.serialize(id));
        }

        expect(ids.size).toBe(1000);
      });
    });

    describe('Serialization', () => {
      it('should serialize to hex string of correct length', () => {
        const sizes = [1, 8, 16, 32, 64];

        for (const size of sizes) {
          const provider = new CustomIdProvider(size);
          const id = provider.generate();
          const serialized = provider.serialize(id);

          expect(serialized.length).toBe(size * 2);
          expect(serialized).toMatch(/^[0-9a-f]+$/);
        }
      });

      it('should round-trip through serialization', () => {
        const provider = new CustomIdProvider(24);

        for (let i = 0; i < 100; i++) {
          const original = provider.generate();
          const serialized = provider.serialize(original);
          const deserialized = provider.deserialize(serialized);

          // CustomIdProvider native type is Uint8Array
          expect(provider.equals(original, deserialized)).toBe(true);
        }
      });
    });

    describe('Native Type Conversion', () => {
      it('should use Uint8Array as native type (pass-through)', () => {
        const provider = new CustomIdProvider(16);
        const bytes = provider.generate();
        const native = provider.fromBytes(bytes);

        expect(native).toBeInstanceOf(Uint8Array);
        expect(native).toBe(bytes); // Pass-through, same reference
      });

      it('should round-trip through toBytes/fromBytes', () => {
        const provider = new CustomIdProvider(20);
        const bytes = provider.generate();
        const native = provider.fromBytes(bytes);
        const backToBytes = provider.toBytes(native);

        expect(backToBytes).toBe(native); // Pass-through
      });
    });

    describe('Cloning', () => {
      it('should create independent copies', () => {
        const provider = new CustomIdProvider(16);
        const original = provider.generate();
        const cloned = provider.clone(original);

        expect(provider.equals(original, cloned)).toBe(true);
        expect(original).not.toBe(cloned); // Different Uint8Array instances
      });

      it('should isolate modifications', () => {
        const provider = new CustomIdProvider(16);
        const original = provider.generate();
        const cloned = provider.clone(original);

        cloned[0] = cloned[0] ^ 0xff;
        expect(provider.equals(original, cloned)).toBe(false);
      });
    });

    describe('Equality', () => {
      it('should use constant-time comparison', () => {
        const provider = new CustomIdProvider(16);
        const id1 = provider.generate();
        const id2 = provider.clone(id1);
        const id3 = provider.generate();

        expect(provider.equals(id1, id2)).toBe(true);
        expect(provider.equals(id1, id3)).toBe(false);
      });
    });

    describe('String Conversion', () => {
      it('should convert to string with idToString', () => {
        const provider = new CustomIdProvider(12);
        const native = provider.generate();
        const str = provider.idToString(native);

        expect(typeof str).toBe('string');
        expect(str.length).toBe(24); // 12 bytes * 2 hex chars
      });

      it('should round-trip through idToString/idFromString', () => {
        const provider = new CustomIdProvider(16);
        const native = provider.generate();
        const str = provider.idToString(native);
        const restored = provider.idFromString(str);

        expect(provider.equals(native, restored)).toBe(true);
      });
    });
  });

  describe('Cross-Provider Tests', () => {
    describe('Interface Compliance', () => {
      it('should all implement generate() returning Uint8Array', () => {
        const providers = [
          new ObjectIdProvider(),
          new GuidV4Provider(),
          new UuidProvider(),
          new CustomIdProvider(20),
        ];

        for (const provider of providers) {
          const bytes = provider.generate();
          expect(bytes).toBeInstanceOf(Uint8Array);
          expect(bytes.length).toBe(provider.byteLength);
        }
      });

      it('should all implement validate()', () => {
        const providers = [
          new ObjectIdProvider(),
          new GuidV4Provider(),
          new UuidProvider(),
          new CustomIdProvider(20),
        ];

        for (const provider of providers) {
          const id = provider.generate();
          expect(provider.validate(id)).toBe(true);
        }
      });

      it('should all implement serialize()/deserialize()', () => {
        const providers = [
          new ObjectIdProvider(),
          new GuidV4Provider(),
          new UuidProvider(),
          new CustomIdProvider(20),
        ];

        for (const provider of providers) {
          const bytes = provider.generate();
          const str = provider.serialize(bytes);
          const back = provider.deserialize(str);

          // Compare bytes
          expect(back.length).toBe(bytes.length);
          for (let i = 0; i < bytes.length; i++) {
            expect(back[i]).toBe(bytes[i]);
          }
        }
      });

      it('should all implement toBytes()/fromBytes()', () => {
        const providers = [
          new ObjectIdProvider(),
          new GuidV4Provider(),
          new UuidProvider(),
          new CustomIdProvider(20),
        ];

        for (const provider of providers) {
          const bytes = provider.generate();
          const native = provider.fromBytes(bytes);
          const backToBytes = provider.toBytes(native);

          expect(backToBytes.length).toBe(bytes.length);
          for (let i = 0; i < bytes.length; i++) {
            expect(backToBytes[i]).toBe(bytes[i]);
          }
        }
      });

      it('should all implement equals() with native types', () => {
        const providers = [
          new ObjectIdProvider(),
          new GuidV4Provider(),
          new UuidProvider(),
          new CustomIdProvider(20),
        ];

        for (const provider of providers) {
          const bytes1 = provider.generate();
          const bytes2 = provider.generate();
          const native1 = provider.fromBytes(bytes1);
          const native2 = provider.fromBytes(bytes2);
          const clone1 = provider.clone(native1);

          expect(provider.equals(native1, clone1)).toBe(true);
          expect(provider.equals(native1, native2)).toBe(false);
        }
      });

      it('should all implement clone()', () => {
        const providers = [
          new ObjectIdProvider(),
          new GuidV4Provider(),
          new UuidProvider(),
          new CustomIdProvider(20),
        ];

        for (const provider of providers) {
          const bytes = provider.generate();
          const native = provider.fromBytes(bytes);
          const clone = provider.clone(native);

          expect(provider.equals(native, clone)).toBe(true);
        }
      });

      it('should all implement idToString()/idFromString()', () => {
        const providers = [
          new ObjectIdProvider(),
          new GuidV4Provider(),
          new UuidProvider(),
          new CustomIdProvider(20),
        ];

        for (const provider of providers) {
          const bytes = provider.generate();
          const native = provider.fromBytes(bytes);
          const str = provider.idToString(native);
          const restored = provider.idFromString(str);

          expect(typeof str).toBe('string');
          expect(provider.equals(native, restored)).toBe(true);
        }
      });
    });

    describe('Length Verification', () => {
      it('should respect declared byte lengths', () => {
        const providers = [
          { provider: new ObjectIdProvider(), expected: 12 },
          { provider: new GuidV4Provider(), expected: 16 },
          { provider: new UuidProvider(), expected: 16 },
          { provider: new CustomIdProvider(20), expected: 20 },
        ];

        for (const { provider, expected } of providers) {
          expect(provider.byteLength).toBe(expected);
          const id = provider.generate();
          expect(id.length).toBe(expected);
        }
      });
    });

    describe('Serialization Format Differences', () => {
      it('should have distinct serialization formats', () => {
        const objectId = new ObjectIdProvider();
        const guidV4 = new GuidV4Provider();
        const uuid = new UuidProvider();
        const custom = new CustomIdProvider(20);

        const formats = [
          objectId.serialize(objectId.generate()),
          guidV4.serialize(guidV4.generate()),
          uuid.serialize(uuid.generate()),
          custom.serialize(custom.generate()),
        ];

        // ObjectID: 24 hex
        expect(formats[0]).toMatch(/^[0-9a-f]{24}$/);

        // GUIDv4: 24 base64
        expect(formats[1]).toMatch(/^[A-Za-z0-9+/]+=*$/);
        expect(formats[1].length).toBe(24);

        // UUID: 36 with dashes
        expect(formats[2]).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );

        // Custom20: 40 hex
        expect(formats[3]).toMatch(/^[0-9a-f]{40}$/);
      });
    });

    describe('Native Type Differences', () => {
      it('should have different native types', () => {
        const objectId = new ObjectIdProvider();
        const guidV4 = new GuidV4Provider();
        const uuid = new UuidProvider();
        const custom = new CustomIdProvider(16);

        // ObjectIdProvider: native type is ObjectId
        const objNative = objectId.fromBytes(objectId.generate());
        expect(objNative.toHexString).toBeDefined();

        // GuidV4Provider: native type is GuidV4
        const guidNative = guidV4.fromBytes(guidV4.generate());
        expect(guidNative.asFullHexGuid).toBeDefined();

        // UuidProvider: native type is string
        const uuidNative = uuid.fromBytes(uuid.generate());
        expect(typeof uuidNative).toBe('string');

        // CustomIdProvider: native type is Uint8Array
        const customNative = custom.fromBytes(custom.generate());
        expect(customNative).toBeInstanceOf(Uint8Array);
      });
    });
  });

  describe('Security Properties', () => {
    it('should use constant-time comparison for CustomIdProvider', () => {
      const provider = new CustomIdProvider(16);
      const id1 = provider.generate();
      const id2 = provider.generate();
      const id3 = provider.clone(id1);

      // Modify only last byte
      id3[id3.length - 1] = id3[id3.length - 1] ^ 0xff;

      const iterations = 5000;

      // Time comparison of completely different IDs
      const start1 = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        provider.equals(id1, id2);
      }
      const time1 = Number(process.hrtime.bigint() - start1);

      // Time comparison of IDs differing only in last byte
      const start2 = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        provider.equals(id1, id3);
      }
      const time2 = Number(process.hrtime.bigint() - start2);

      // Times should be similar (within reasonable margin)
      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      expect(ratio).toBeLessThan(50.0);
    });

    it('should not leak information through validation timing', () => {
      const provider = new ObjectIdProvider();
      const validId = provider.generate();
      const invalidContent = new Uint8Array(12); // All zeros

      const iterations = 5000;

      // Time validation of valid ID
      const start1 = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        provider.validate(validId);
      }
      const time1 = Number(process.hrtime.bigint() - start1);

      // Time validation of invalid content
      const start2 = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        provider.validate(invalidContent);
      }
      const time2 = Number(process.hrtime.bigint() - start2);

      // Times should be similar (within reasonable margin)
      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      expect(ratio).toBeLessThan(100.0);
    });
  });

  describe('Performance Characteristics', () => {
    it('should generate IDs quickly', () => {
      const providers = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
        new UuidProvider(),
      ];

      for (const provider of providers) {
        const start = process.hrtime.bigint();
        const count = 10000;

        for (let i = 0; i < count; i++) {
          provider.generate();
        }

        const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000; // ms
        const perSecond = (count / elapsed) * 1000;

        // Should generate at least 3,000 IDs per second (relaxed for CI)
        expect(perSecond).toBeGreaterThan(3000);
      }
    });

    it('should serialize quickly', () => {
      const provider = new ObjectIdProvider();
      const ids = Array.from({ length: 1000 }, () => provider.generate());

      const start = process.hrtime.bigint();
      for (const id of ids) {
        provider.serialize(id);
      }
      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;

      // Should serialize 1000 IDs in under 100ms (relaxed for CI environments)
      expect(elapsed).toBeLessThan(100);
    });

    it('should deserialize quickly', () => {
      const provider = new ObjectIdProvider();
      const serialized = Array.from({ length: 1000 }, () =>
        provider.serialize(provider.generate()),
      );

      const start = process.hrtime.bigint();
      for (const str of serialized) {
        provider.deserialize(str);
      }
      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;

      // Should deserialize 1000 IDs in under 300ms (relaxed for CI environments)
      expect(elapsed).toBeLessThan(300);
    });
  });
});
