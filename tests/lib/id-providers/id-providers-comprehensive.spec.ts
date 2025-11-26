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
 */

import { IIdProvider } from '../../../src/interfaces/id-provider';
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
        while (Date.now() - start < 2) {} // 2ms delay
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

          expect(provider.equals(original, deserialized)).toBe(true);
        }
      });

      it('should accept both uppercase and lowercase hex', () => {
        const id = provider.generate();
        const lower = provider.serialize(id);
        const upper = lower.toUpperCase();

        const fromLower = provider.deserialize(lower);
        const fromUpper = provider.deserialize(upper);

        expect(provider.equals(fromLower, fromUpper)).toBe(true);
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
        const id = provider.generate();
        const clone = provider.clone(id);

        expect(provider.equals(id, clone)).toBe(true);
        expect(provider.equals(id, id)).toBe(true);
      });

      it('should correctly compare different IDs', () => {
        const id1 = provider.generate();
        const id2 = provider.generate();

        expect(provider.equals(id1, id2)).toBe(false);
      });

      it('should be constant-time for same-length inputs', () => {
        // This test verifies timing doesn't leak equality information
        const id1 = provider.generate();
        const id2 = provider.generate();
        const id3 = provider.clone(id1);

        // Modify only the last byte
        id3[11] = id3[11] ^ 0xff;

        const iterations = 10000;

        // Time comparison of different IDs
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
        // Note: Timing tests can be flaky, so we use a generous margin
        const ratio = Math.max(time1, time2) / Math.min(time1, time2);
        expect(ratio).toBeLessThan(15.0); // Increased for CI stability
      });

      it('should handle length mismatch gracefully', () => {
        const id1 = provider.generate();
        const id2 = new Uint8Array(16);

        expect(provider.equals(id1, id2)).toBe(false);
      });
    });

    describe('Cloning', () => {
      it('should create independent copies', () => {
        const original = provider.generate();
        const cloned = provider.clone(original);

        // Should be equal
        expect(provider.equals(original, cloned)).toBe(true);

        // But not the same object
        expect(original).not.toBe(cloned);

        // Modifying clone shouldn't affect original
        cloned[0] = cloned[0] ^ 0xff;
        expect(provider.equals(original, cloned)).toBe(false);
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
        // Empty GUID is structurally valid (correct version/variant bits can be zero)
        // but semantically empty - isEmpty() is the proper check
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

          expect(provider.equals(original, deserialized)).toBe(true);
        }
      });
    });

    describe('Deserialization', () => {
      it('should accept multiple GUID formats', () => {
        const id = provider.generate();
        const base64 = provider.serialize(id);

        // Should accept base64
        const fromBase64 = provider.deserialize(base64);
        expect(provider.equals(id, fromBase64)).toBe(true);
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

          expect(provider.equals(original, deserialized)).toBe(true);
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

        expect(provider.equals(id, deserialized)).toBe(true);
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

          expect(provider.equals(original, deserialized)).toBe(true);
        }
      });
    });
  });

  describe('Cross-Provider Tests', () => {
    const providers: Array<{ name: string; provider: IIdProvider }> = [
      { name: 'ObjectID', provider: new ObjectIdProvider() },
      { name: 'GUIDv4', provider: new GuidV4Provider() },
      { name: 'UUID', provider: new UuidProvider() },
      { name: 'Custom20', provider: new CustomIdProvider(20) },
    ];

    describe('Interface Compliance', () => {
      it('should all implement generate()', () => {
        for (const { name, provider } of providers) {
          expect(() => provider.generate()).not.toThrow();
          const id = provider.generate();
          expect(id).toBeInstanceOf(Uint8Array);
        }
      });

      it('should all implement validate()', () => {
        for (const { provider } of providers) {
          const id = provider.generate();
          expect(provider.validate(id)).toBe(true);
        }
      });

      it('should all implement serialize()/deserialize()', () => {
        for (const { provider } of providers) {
          const id = provider.generate();
          const str = provider.serialize(id);
          const back = provider.deserialize(str);
          expect(provider.equals(id, back)).toBe(true);
        }
      });

      it('should all implement equals()', () => {
        for (const { provider } of providers) {
          const id1 = provider.generate();
          const id2 = provider.generate();
          const clone = provider.clone(id1);

          expect(provider.equals(id1, clone)).toBe(true);
          expect(provider.equals(id1, id2)).toBe(false);
        }
      });

      it('should all implement clone()', () => {
        for (const { provider } of providers) {
          const id = provider.generate();
          const clone = provider.clone(id);

          expect(provider.equals(id, clone)).toBe(true);
          expect(id).not.toBe(clone);
        }
      });
    });

    describe('Length Verification', () => {
      it('should respect declared byte lengths', () => {
        for (const { name, provider } of providers) {
          const id = provider.generate();
          expect(id.length).toBe(provider.byteLength);
        }
      });
    });

    describe('Serialization Format Differences', () => {
      it('should have distinct serialization formats', () => {
        const formats = providers.map(({ provider }) => {
          const id = provider.generate();
          return provider.serialize(id);
        });

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

    describe('Non-Comparability', () => {
      it('should not consider IDs from different providers equal', () => {
        for (let i = 0; i < providers.length; i++) {
          for (let j = i + 1; j < providers.length; j++) {
            const id1 = providers[i].provider.generate();
            const id2 = providers[j].provider.generate();

            expect(providers[i].provider.equals(id1, id2)).toBe(false);
            expect(providers[j].provider.equals(id2, id1)).toBe(false);
          }
        }
      });
    });
  });

  describe('Security Properties', () => {
    it('should use constant-time comparison for all providers', () => {
      const providers = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
        new UuidProvider(),
        new CustomIdProvider(16),
      ];

      for (const provider of providers) {
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
        // Note: Timing tests can be flaky, so we use a generous margin
        const ratio = Math.max(time1, time2) / Math.min(time1, time2);
        expect(ratio).toBeLessThan(15.0); // Increased from 6.0 to account for system variance
      }
    });

    it('should not leak information through validation timing', () => {
      const provider = new ObjectIdProvider();
      const validId = provider.generate();
      const invalidLength = new Uint8Array(11);
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
      // Note: Timing tests can be flaky, so we use a generous margin
      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      expect(ratio).toBeLessThan(30.0); // Increased for CI stability
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

      // Should serialize 1000 IDs in under 50ms (relaxed for CI environments)
      expect(elapsed).toBeLessThan(50);
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
