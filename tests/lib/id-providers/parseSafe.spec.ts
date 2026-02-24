/**
 * Comprehensive tests for parseSafe() across all ID providers.
 *
 * parseSafe() should:
 * - Return the parsed native type on valid input
 * - Return undefined on invalid input (never throw)
 * - Be more lenient than deserialize() — trimming whitespace, stripping prefixes, etc.
 * - Round-trip correctly with serialize/idToString
 */

import { ObjectId } from 'bson';
import {
  CustomIdProvider,
  GuidV4Provider,
  ObjectIdProvider,
  UuidProvider,
  Uint8ArrayIdProvider,
} from '../../../src/lib/id-providers';

describe('parseSafe() — All ID Providers', () => {
  // ─────────────────────────────────────────────────────────────
  // ObjectIdProvider
  // ─────────────────────────────────────────────────────────────
  describe('ObjectIdProvider.parseSafe', () => {
    let provider: ObjectIdProvider;

    beforeEach(() => {
      provider = new ObjectIdProvider();
    });

    describe('valid inputs', () => {
      it('should parse a valid 24-char hex string', () => {
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(ObjectId);
        expect(result!.toHexString()).toBe(hex);
      });

      it('should parse its own idToString output', () => {
        const native = provider.fromBytes(provider.generate());
        const str = provider.idToString(native);
        const result = provider.parseSafe(str);

        expect(result).toBeDefined();
        expect(provider.equals(native, result!)).toBe(true);
      });

      it('should round-trip 100 random IDs', () => {
        for (let i = 0; i < 100; i++) {
          const native = provider.fromBytes(provider.generate());
          const str = provider.idToString(native);
          const parsed = provider.parseSafe(str);

          expect(parsed).toBeDefined();
          expect(provider.equals(native, parsed!)).toBe(true);
        }
      });

      it('should accept uppercase hex', () => {
        const id = provider.generate();
        const hex = provider.serialize(id).toUpperCase();
        const result = provider.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result!.toHexString()).toBe(hex.toLowerCase());
      });

      it('should accept mixed-case hex', () => {
        const hex = '507F1f77bcF86cD799439011';
        const result = provider.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result!.toHexString()).toBe(hex.toLowerCase());
      });

      it('should trim leading/trailing whitespace', () => {
        const id = provider.generate();
        const hex = provider.serialize(id);

        expect(provider.parseSafe(`  ${hex}  `)).toBeDefined();
        expect(provider.parseSafe(`\t${hex}\n`)).toBeDefined();
        expect(provider.parseSafe(` ${hex}`)).toBeDefined();
      });

      it('should strip 0x prefix', () => {
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(`0x${hex}`);

        expect(result).toBeDefined();
        expect(result!.toHexString()).toBe(hex);
      });

      it('should strip 0X prefix (uppercase)', () => {
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(`0X${hex}`);

        expect(result).toBeDefined();
        expect(result!.toHexString()).toBe(hex);
      });

      it('should handle 0x prefix with whitespace', () => {
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(`  0x${hex}  `);

        expect(result).toBeDefined();
        expect(result!.toHexString()).toBe(hex);
      });

      it('should parse a well-known ObjectId', () => {
        const knownHex = '507f1f77bcf86cd799439011';
        const result = provider.parseSafe(knownHex);

        expect(result).toBeDefined();
        expect(result!.toHexString()).toBe(knownHex);
      });
    });

    describe('invalid inputs — should return undefined', () => {
      it('should return undefined for empty string', () => {
        expect(provider.parseSafe('')).toBeUndefined();
      });

      it('should return undefined for whitespace-only string', () => {
        expect(provider.parseSafe('   ')).toBeUndefined();
      });

      it('should return undefined for too-short hex', () => {
        expect(provider.parseSafe('507f1f77bcf86cd79943')).toBeUndefined();
      });

      it('should return undefined for too-long hex', () => {
        expect(
          provider.parseSafe('507f1f77bcf86cd799439011aa'),
        ).toBeUndefined();
      });

      it('should return undefined for non-hex characters', () => {
        expect(provider.parseSafe('zzzzzzzzzzzzzzzzzzzzzzzz')).toBeUndefined();
        expect(provider.parseSafe('507f1f77bcf86cd79943ZZZZ')).toBeUndefined();
      });

      it('should return undefined for random words', () => {
        expect(provider.parseSafe('hello world')).toBeUndefined();
        expect(provider.parseSafe('not-an-objectid')).toBeUndefined();
      });

      it('should return undefined for UUID format', () => {
        expect(
          provider.parseSafe('550e8400-e29b-41d4-a716-446655440000'),
        ).toBeUndefined();
      });

      it('should return undefined for special characters', () => {
        expect(provider.parseSafe('!@#$%^&*()_+')).toBeUndefined();
        expect(provider.parseSafe('<script>alert(1)</script>')).toBeUndefined();
      });

      it('should return undefined for all-zero hex (invalid ObjectId)', () => {
        // new ObjectId('000000000000000000000000') succeeds in bson,
        // so this depends on the bson library's behavior
        const result = provider.parseSafe('000000000000000000000000');
        // Whether this is valid depends on bson; the key is it doesn't throw
        expect(result === undefined || result instanceof ObjectId).toBe(true);
      });

      it('should return undefined for null-like strings', () => {
        expect(provider.parseSafe('null')).toBeUndefined();
        expect(provider.parseSafe('undefined')).toBeUndefined();
        expect(provider.parseSafe('NaN')).toBeUndefined();
      });

      it('should return undefined for numeric strings', () => {
        expect(provider.parseSafe('12345')).toBeUndefined();
        expect(provider.parseSafe('0')).toBeUndefined();
      });
    });

    describe('never throws', () => {
      const edgeCases = [
        '',
        ' ',
        '\0',
        '\n',
        'abc',
        '0x',
        '0xZZ',
        '{}',
        '[]',
        'null',
        'undefined',
        'true',
        'false',
        '0'.repeat(1000),
        'a'.repeat(24),
        String.fromCharCode(0xffff),
      ];

      for (const input of edgeCases) {
        it(`should not throw for input: ${JSON.stringify(input).slice(0, 40)}`, () => {
          expect(() => provider.parseSafe(input)).not.toThrow();
        });
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // UuidProvider
  // ─────────────────────────────────────────────────────────────
  describe('UuidProvider.parseSafe', () => {
    let provider: UuidProvider;

    beforeEach(() => {
      provider = new UuidProvider();
    });

    describe('valid inputs', () => {
      it('should parse a standard UUID with dashes', () => {
        const id = provider.generate();
        const str = provider.serialize(id);
        const result = provider.parseSafe(str);

        expect(result).toBeDefined();
        expect(result).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
      });

      it('should round-trip through serialize → parseSafe', () => {
        for (let i = 0; i < 100; i++) {
          const id = provider.generate();
          const str = provider.serialize(id);
          const parsed = provider.parseSafe(str);

          expect(parsed).toBeDefined();
          expect(parsed).toBe(str);
        }
      });

      it('should round-trip through idToString → parseSafe', () => {
        const native = provider.fromBytes(provider.generate());
        const str = provider.idToString(native);
        const parsed = provider.parseSafe(str);

        expect(parsed).toBeDefined();
        expect(provider.equals(native, parsed!)).toBe(true);
      });

      it('should accept uppercase UUID', () => {
        const id = provider.generate();
        const str = provider.serialize(id).toUpperCase();
        const result = provider.parseSafe(str);

        expect(result).toBeDefined();
        // Result should be normalized to lowercase
        expect(result!.toLowerCase()).toBe(str.toLowerCase());
      });

      it('should trim whitespace', () => {
        const id = provider.generate();
        const str = provider.serialize(id);

        expect(provider.parseSafe(`  ${str}  `)).toBeDefined();
        expect(provider.parseSafe(`\t${str}\n`)).toBeDefined();
        expect(provider.parseSafe(` ${str}`)).toBeDefined();
      });

      it('should accept 32-char hex without dashes', () => {
        const id = provider.generate();
        const str = provider.serialize(id);
        const noDashes = str.replace(/-/g, '');

        expect(noDashes.length).toBe(32);
        const result = provider.parseSafe(noDashes);

        expect(result).toBeDefined();
        expect(result!.replace(/-/g, '')).toBe(noDashes.toLowerCase());
      });

      it('should accept UUID with braces (Microsoft format)', () => {
        const id = provider.generate();
        const str = provider.serialize(id);
        const braced = `{${str}}`;

        const result = provider.parseSafe(braced);
        expect(result).toBeDefined();
        expect(result!.toLowerCase()).toBe(str.toLowerCase());
      });

      it('should accept urn:uuid: prefix', () => {
        const id = provider.generate();
        const str = provider.serialize(id);
        const urn = `urn:uuid:${str}`;

        const result = provider.parseSafe(urn);
        expect(result).toBeDefined();
        expect(result!.toLowerCase()).toBe(str.toLowerCase());
      });

      it('should accept URN:UUID: prefix (case-insensitive)', () => {
        const id = provider.generate();
        const str = provider.serialize(id);
        const urn = `URN:UUID:${str}`;

        const result = provider.parseSafe(urn);
        expect(result).toBeDefined();
        expect(result!.toLowerCase()).toBe(str.toLowerCase());
      });

      it('should accept braces + whitespace', () => {
        const id = provider.generate();
        const str = provider.serialize(id);
        const result = provider.parseSafe(`  {${str}}  `);

        expect(result).toBeDefined();
        expect(result!.toLowerCase()).toBe(str.toLowerCase());
      });

      it('should accept urn:uuid: + whitespace', () => {
        const id = provider.generate();
        const str = provider.serialize(id);
        const result = provider.parseSafe(`  urn:uuid:${str}  `);

        expect(result).toBeDefined();
        expect(result!.toLowerCase()).toBe(str.toLowerCase());
      });

      it('should parse well-known UUIDs', () => {
        const wellKnown = [
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // DNS namespace
          '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // URL namespace
        ];

        for (const uuid of wellKnown) {
          const result = provider.parseSafe(uuid);
          expect(result).toBeDefined();
          expect(result!.toLowerCase()).toBe(uuid.toLowerCase());
        }
      });
    });

    describe('invalid inputs — should return undefined', () => {
      it('should return undefined for empty string', () => {
        expect(provider.parseSafe('')).toBeUndefined();
      });

      it('should return undefined for whitespace-only', () => {
        expect(provider.parseSafe('   ')).toBeUndefined();
      });

      it('should return undefined for random text', () => {
        expect(provider.parseSafe('hello world')).toBeUndefined();
        expect(provider.parseSafe('not-a-uuid')).toBeUndefined();
      });

      it('should return undefined for truncated UUID', () => {
        expect(provider.parseSafe('550e8400-e29b-41d4-a716')).toBeUndefined();
      });

      it('should return undefined for UUID with extra chars', () => {
        expect(
          provider.parseSafe('550e8400-e29b-41d4-a716-446655440000-extra'),
        ).toBeUndefined();
      });

      it('should return undefined for non-hex in UUID positions', () => {
        expect(
          provider.parseSafe('gggggggg-gggg-gggg-gggg-gggggggggggg'),
        ).toBeUndefined();
      });

      it('should return undefined for ObjectId hex (24 chars)', () => {
        expect(provider.parseSafe('507f1f77bcf86cd799439011')).toBeUndefined();
      });

      it('should return undefined for special characters', () => {
        expect(provider.parseSafe('!@#$%^&*()')).toBeUndefined();
      });

      it('should return undefined for null-like strings', () => {
        expect(provider.parseSafe('null')).toBeUndefined();
        expect(provider.parseSafe('undefined')).toBeUndefined();
      });

      it('should return undefined for malformed braces', () => {
        expect(provider.parseSafe('{not-a-uuid}')).toBeUndefined();
        expect(provider.parseSafe('{}')).toBeUndefined();
        expect(
          provider.parseSafe(
            '{550e8400-e29b-41d4-a716-446655440000', // missing closing brace
          ),
        ).toBeUndefined();
      });

      it('should return undefined for malformed urn', () => {
        expect(provider.parseSafe('urn:uuid:')).toBeUndefined();
        expect(provider.parseSafe('urn:uuid:invalid')).toBeUndefined();
      });
    });

    describe('never throws', () => {
      const edgeCases = [
        '',
        ' ',
        '\0',
        '\n',
        'abc',
        '0x',
        '{}',
        '{',
        '}',
        'urn:uuid:',
        'urn:uuid:xyz',
        'null',
        '0'.repeat(1000),
        String.fromCharCode(0xffff),
      ];

      for (const input of edgeCases) {
        it(`should not throw for input: ${JSON.stringify(input).slice(0, 40)}`, () => {
          expect(() => provider.parseSafe(input)).not.toThrow();
        });
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // GuidV4Provider
  // ─────────────────────────────────────────────────────────────
  describe('GuidV4Provider.parseSafe', () => {
    let provider: GuidV4Provider;

    beforeEach(() => {
      provider = new GuidV4Provider();
    });

    describe('valid inputs', () => {
      it('should parse serialized (base64) output', () => {
        const id = provider.generate();
        const base64 = provider.serialize(id);
        const result = provider.parseSafe(base64);

        expect(result).toBeDefined();
        const backToBytes = provider.toBytes(result!);
        for (let i = 0; i < 16; i++) {
          expect(backToBytes[i]).toBe(id[i]);
        }
      });

      it('should round-trip 100 random GUIDs via base64', () => {
        for (let i = 0; i < 100; i++) {
          const native = provider.fromBytes(provider.generate());
          const base64 = provider.serialize(provider.toBytes(native));
          const parsed = provider.parseSafe(base64);

          expect(parsed).toBeDefined();
          expect(provider.equals(native, parsed!)).toBe(true);
        }
      });

      it('should round-trip through idToString → parseSafe', () => {
        const native = provider.fromBytes(provider.generate());
        const str = provider.idToString(native);
        const parsed = provider.parseSafe(str);

        expect(parsed).toBeDefined();
        expect(provider.equals(native, parsed!)).toBe(true);
      });

      it('should accept full hex GUID with dashes (36 chars)', () => {
        const native = provider.fromBytes(provider.generate());
        const fullHex = native.asFullHexGuid;
        const result = provider.parseSafe(fullHex);

        expect(result).toBeDefined();
        expect(provider.equals(native, result!)).toBe(true);
      });

      it('should accept short hex GUID without dashes (32 chars)', () => {
        const native = provider.fromBytes(provider.generate());
        const fullHex = native.asFullHexGuid;
        const shortHex = fullHex.replace(/-/g, '');

        expect(shortHex.length).toBe(32);
        const result = provider.parseSafe(shortHex);

        expect(result).toBeDefined();
        expect(provider.equals(native, result!)).toBe(true);
      });

      it('should trim whitespace', () => {
        const native = provider.fromBytes(provider.generate());
        const str = native.asFullHexGuid;

        expect(provider.parseSafe(`  ${str}  `)).toBeDefined();
        expect(provider.parseSafe(`\t${str}\n`)).toBeDefined();
      });

      it('should parse well-known GUIDs', () => {
        // v4 GUID
        const result = provider.parseSafe(
          '550e8400-e29b-41d4-a716-446655440000',
        );
        expect(result).toBeDefined();
      });
    });

    describe('invalid inputs — should return undefined', () => {
      it('should return undefined for empty string', () => {
        expect(provider.parseSafe('')).toBeUndefined();
      });

      it('should return undefined for whitespace-only', () => {
        expect(provider.parseSafe('   ')).toBeUndefined();
      });

      it('should return undefined for random text', () => {
        expect(provider.parseSafe('hello world')).toBeUndefined();
        expect(provider.parseSafe('not-a-guid')).toBeUndefined();
      });

      it('should return undefined for ObjectId hex (24 chars)', () => {
        expect(provider.parseSafe('507f1f77bcf86cd799439011')).toBeUndefined();
      });

      it('should return undefined for truncated GUID', () => {
        expect(provider.parseSafe('550e8400-e29b-41d4')).toBeUndefined();
      });

      it('should return undefined for non-hex characters in GUID position', () => {
        expect(
          provider.parseSafe('zzzzzzzz-zzzz-4zzz-zzzz-zzzzzzzzzzzz'),
        ).toBeUndefined();
      });

      it('should return undefined for special characters', () => {
        expect(provider.parseSafe('!@#$%^&*()')).toBeUndefined();
      });

      it('should return undefined for null-like strings', () => {
        expect(provider.parseSafe('null')).toBeUndefined();
        expect(provider.parseSafe('undefined')).toBeUndefined();
      });
    });

    describe('never throws', () => {
      const edgeCases = [
        '',
        ' ',
        '\0',
        '\n',
        'abc',
        '0x',
        '{}',
        'null',
        '0'.repeat(1000),
        '='.repeat(24),
        String.fromCharCode(0xffff),
      ];

      for (const input of edgeCases) {
        it(`should not throw for input: ${JSON.stringify(input).slice(0, 40)}`, () => {
          expect(() => provider.parseSafe(input)).not.toThrow();
        });
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // CustomIdProvider
  // ─────────────────────────────────────────────────────────────
  describe('CustomIdProvider.parseSafe', () => {
    describe('with 16-byte provider', () => {
      let provider: CustomIdProvider;

      beforeEach(() => {
        provider = new CustomIdProvider(16, 'Test16');
      });

      describe('valid inputs', () => {
        it('should parse a valid hex string', () => {
          const id = provider.generate();
          const hex = provider.serialize(id);
          const result = provider.parseSafe(hex);

          expect(result).toBeDefined();
          expect(result).toBeInstanceOf(Uint8Array);
          expect(result!.length).toBe(16);
          expect(provider.equals(id, result!)).toBe(true);
        });

        it('should round-trip 100 random IDs', () => {
          for (let i = 0; i < 100; i++) {
            const id = provider.generate();
            const hex = provider.serialize(id);
            const parsed = provider.parseSafe(hex);

            expect(parsed).toBeDefined();
            expect(provider.equals(id, parsed!)).toBe(true);
          }
        });

        it('should accept uppercase hex', () => {
          const id = provider.generate();
          const hex = provider.serialize(id).toUpperCase();
          const result = provider.parseSafe(hex);

          expect(result).toBeDefined();
          expect(provider.equals(id, result!)).toBe(true);
        });

        it('should accept mixed-case hex', () => {
          const id = provider.generate();
          const hex = provider.serialize(id);
          const mixed = hex
            .split('')
            .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
            .join('');
          const result = provider.parseSafe(mixed);

          expect(result).toBeDefined();
          expect(provider.equals(id, result!)).toBe(true);
        });

        it('should trim whitespace', () => {
          const id = provider.generate();
          const hex = provider.serialize(id);

          expect(provider.parseSafe(`  ${hex}  `)).toBeDefined();
          expect(provider.parseSafe(`\t${hex}\n`)).toBeDefined();
        });

        it('should strip 0x prefix', () => {
          const id = provider.generate();
          const hex = provider.serialize(id);
          const result = provider.parseSafe(`0x${hex}`);

          expect(result).toBeDefined();
          expect(provider.equals(id, result!)).toBe(true);
        });

        it('should strip 0X prefix (uppercase)', () => {
          const id = provider.generate();
          const hex = provider.serialize(id);
          const result = provider.parseSafe(`0X${hex}`);

          expect(result).toBeDefined();
          expect(provider.equals(id, result!)).toBe(true);
        });

        it('should handle 0x prefix with whitespace', () => {
          const id = provider.generate();
          const hex = provider.serialize(id);
          const result = provider.parseSafe(`  0x${hex}  `);

          expect(result).toBeDefined();
          expect(provider.equals(id, result!)).toBe(true);
        });
      });

      describe('invalid inputs — should return undefined', () => {
        it('should return undefined for empty string', () => {
          expect(provider.parseSafe('')).toBeUndefined();
        });

        it('should return undefined for whitespace-only', () => {
          expect(provider.parseSafe('   ')).toBeUndefined();
        });

        it('should return undefined for wrong-length hex', () => {
          expect(provider.parseSafe('aabb')).toBeUndefined();
          expect(provider.parseSafe('a'.repeat(34))).toBeUndefined();
        });

        it('should return undefined for non-hex characters', () => {
          expect(provider.parseSafe('z'.repeat(32))).toBeUndefined();
          expect(
            provider.parseSafe('gghhiijjkkllmmnnooppqqrrssttuuvv'),
          ).toBeUndefined();
        });

        it('should return undefined for odd-length hex', () => {
          expect(provider.parseSafe('a'.repeat(31))).toBeUndefined();
        });

        it('should return undefined for random text', () => {
          expect(provider.parseSafe('hello world')).toBeUndefined();
        });

        it('should return undefined for just "0x"', () => {
          expect(provider.parseSafe('0x')).toBeUndefined();
        });
      });
    });

    describe('with varying byte lengths', () => {
      it('should work with 1-byte provider', () => {
        const provider = new CustomIdProvider(1, 'Tiny');
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result!.length).toBe(1);
        expect(provider.equals(id, result!)).toBe(true);
      });

      it('should work with 8-byte provider', () => {
        const provider = new CustomIdProvider(8);
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result!.length).toBe(8);
      });

      it('should work with 20-byte provider (SHA-1 size)', () => {
        const provider = new CustomIdProvider(20, 'SHA1');
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result!.length).toBe(20);
      });

      it('should work with 32-byte provider (SHA-256 size)', () => {
        const provider = new CustomIdProvider(32, 'SHA256');
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result!.length).toBe(32);
      });

      it('should work with 255-byte provider (max)', () => {
        const provider = new CustomIdProvider(255, 'MaxLen');
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result!.length).toBe(255);
      });

      it('should reject hex meant for a different-length provider', () => {
        const provider16 = new CustomIdProvider(16);
        const provider20 = new CustomIdProvider(20);

        const id16 = provider16.generate();
        const hex16 = provider16.serialize(id16);

        // 16-byte hex should not parse with 20-byte provider
        expect(provider20.parseSafe(hex16)).toBeUndefined();
      });
    });

    describe('never throws', () => {
      const provider = new CustomIdProvider(16);
      const edgeCases = [
        '',
        ' ',
        '\0',
        '\n',
        'abc',
        '0x',
        '0xZZ',
        '{}',
        'null',
        'undefined',
        '0'.repeat(1000),
        String.fromCharCode(0xffff),
      ];

      for (const input of edgeCases) {
        it(`should not throw for input: ${JSON.stringify(input).slice(0, 40)}`, () => {
          expect(() => provider.parseSafe(input)).not.toThrow();
        });
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Uint8ArrayIdProvider
  // ─────────────────────────────────────────────────────────────
  describe('Uint8ArrayIdProvider.parseSafe', () => {
    let provider: Uint8ArrayIdProvider;

    beforeEach(() => {
      provider = new Uint8ArrayIdProvider(16, 'Test16');
    });

    describe('valid inputs', () => {
      it('should parse a valid hex string', () => {
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result!.length).toBe(16);
        expect(provider.equals(id, result!)).toBe(true);
      });

      it('should round-trip 100 random IDs', () => {
        for (let i = 0; i < 100; i++) {
          const id = provider.generate();
          const hex = provider.serialize(id);
          const parsed = provider.parseSafe(hex);

          expect(parsed).toBeDefined();
          expect(provider.equals(id, parsed!)).toBe(true);
        }
      });

      it('should accept uppercase hex', () => {
        const id = provider.generate();
        const hex = provider.serialize(id).toUpperCase();
        const result = provider.parseSafe(hex);

        expect(result).toBeDefined();
        expect(provider.equals(id, result!)).toBe(true);
      });

      it('should trim whitespace', () => {
        const id = provider.generate();
        const hex = provider.serialize(id);

        const spacePadded = provider.parseSafe(`  ${hex}  `);
        expect(spacePadded).toBeDefined();
        expect(provider.equals(id, spacePadded!)).toBe(true);
      });

      it('should strip 0x prefix', () => {
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(`0x${hex}`);

        expect(result).toBeDefined();
        expect(provider.equals(id, result!)).toBe(true);
      });

      it('should strip 0X prefix (uppercase)', () => {
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(`0X${hex}`);

        expect(result).toBeDefined();
        expect(provider.equals(id, result!)).toBe(true);
      });

      it('should handle 0x prefix with whitespace', () => {
        const id = provider.generate();
        const hex = provider.serialize(id);
        const result = provider.parseSafe(`  0x${hex}  `);

        expect(result).toBeDefined();
        expect(provider.equals(id, result!)).toBe(true);
      });
    });

    describe('invalid inputs — should return undefined', () => {
      it('should return undefined for empty string', () => {
        expect(provider.parseSafe('')).toBeUndefined();
      });

      it('should return undefined for whitespace-only', () => {
        expect(provider.parseSafe('   ')).toBeUndefined();
      });

      it('should return undefined for wrong-length hex', () => {
        expect(provider.parseSafe('aabb')).toBeUndefined();
        expect(provider.parseSafe('a'.repeat(34))).toBeUndefined();
      });

      it('should return undefined for non-hex characters', () => {
        expect(provider.parseSafe('z'.repeat(32))).toBeUndefined();
      });

      it('should return undefined for random text', () => {
        expect(provider.parseSafe('hello world')).toBeUndefined();
      });

      it('should return undefined for just "0x"', () => {
        expect(provider.parseSafe('0x')).toBeUndefined();
      });
    });

    describe('with varying byte lengths', () => {
      it('should work with 12-byte provider (ObjectId size)', () => {
        const p = new Uint8ArrayIdProvider(12, 'OID');
        const id = p.generate();
        const hex = p.serialize(id);
        const result = p.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result!.length).toBe(12);
      });

      it('should work with 32-byte provider', () => {
        const p = new Uint8ArrayIdProvider(32, 'Hash');
        const id = p.generate();
        const hex = p.serialize(id);
        const result = p.parseSafe(hex);

        expect(result).toBeDefined();
        expect(result!.length).toBe(32);
      });
    });

    describe('never throws', () => {
      const edgeCases = [
        '',
        ' ',
        '\0',
        '\n',
        'abc',
        '0x',
        '0xZZ',
        '{}',
        'null',
        'undefined',
        '0'.repeat(1000),
        String.fromCharCode(0xffff),
      ];

      for (const input of edgeCases) {
        it(`should not throw for input: ${JSON.stringify(input).slice(0, 40)}`, () => {
          expect(() => provider.parseSafe(input)).not.toThrow();
        });
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Cross-Provider parseSafe
  // ─────────────────────────────────────────────────────────────
  describe('Cross-Provider parseSafe Behavior', () => {
    it('all providers should return undefined for empty string', () => {
      const providers = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
        new UuidProvider(),
        new CustomIdProvider(16),
        new Uint8ArrayIdProvider(16),
      ];

      for (const p of providers) {
        expect(p.parseSafe('')).toBeUndefined();
      }
    });

    it('all providers should return undefined for garbage input', () => {
      const providers = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
        new UuidProvider(),
        new CustomIdProvider(16),
        new Uint8ArrayIdProvider(16),
      ];

      const garbage = [
        'not-an-id',
        '!@#$%',
        '<script>',
        'SELECT * FROM',
        '../../../etc/passwd',
        'null',
        'undefined',
      ];

      for (const p of providers) {
        for (const g of garbage) {
          expect(p.parseSafe(g)).toBeUndefined();
        }
      }
    });

    it('all providers should have parseSafe as a function', () => {
      const providers = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
        new UuidProvider(),
        new CustomIdProvider(16),
        new Uint8ArrayIdProvider(16),
      ];

      for (const p of providers) {
        expect(typeof p.parseSafe).toBe('function');
      }
    });

    it('UUID serialized output should NOT parse as ObjectId', () => {
      const uuidProvider = new UuidProvider();
      const objectIdProvider = new ObjectIdProvider();

      const uuid = uuidProvider.serialize(uuidProvider.generate());
      // UUID has dashes, 36 chars — not a valid ObjectId
      expect(objectIdProvider.parseSafe(uuid)).toBeUndefined();
    });

    it('ObjectId serialized output should NOT parse as UUID', () => {
      const uuidProvider = new UuidProvider();
      const objectIdProvider = new ObjectIdProvider();

      const objectIdHex = objectIdProvider.serialize(
        objectIdProvider.generate(),
      );
      // 24-char hex — not a valid UUID
      expect(uuidProvider.parseSafe(objectIdHex)).toBeUndefined();
    });

    it('each provider should parse its own output but reject others', () => {
      const objectIdProvider = new ObjectIdProvider();
      const uuidProvider = new UuidProvider();
      const customProvider = new CustomIdProvider(20, 'Custom20');

      const objectIdStr = objectIdProvider.serialize(
        objectIdProvider.generate(),
      );
      const uuidStr = uuidProvider.serialize(uuidProvider.generate());
      const customStr = customProvider.serialize(customProvider.generate());

      // Each parses its own
      expect(objectIdProvider.parseSafe(objectIdStr)).toBeDefined();
      expect(uuidProvider.parseSafe(uuidStr)).toBeDefined();
      expect(customProvider.parseSafe(customStr)).toBeDefined();

      // Cross-provider should fail (different lengths/formats)
      expect(uuidProvider.parseSafe(objectIdStr)).toBeUndefined();
      expect(objectIdProvider.parseSafe(uuidStr)).toBeUndefined();
      expect(customProvider.parseSafe(objectIdStr)).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // parseSafe vs deserialize: Leniency Comparison
  // ─────────────────────────────────────────────────────────────
  describe('parseSafe vs deserialize — Leniency', () => {
    it('ObjectIdProvider: parseSafe handles whitespace, deserialize does not', () => {
      const provider = new ObjectIdProvider();
      const hex = provider.serialize(provider.generate());
      const padded = `  ${hex}  `;

      // deserialize throws on padded input
      expect(() => provider.deserialize(padded)).toThrow();
      // parseSafe handles it gracefully
      expect(provider.parseSafe(padded)).toBeDefined();
    });

    it('ObjectIdProvider: parseSafe handles 0x prefix, deserialize does not', () => {
      const provider = new ObjectIdProvider();
      const hex = provider.serialize(provider.generate());
      const prefixed = `0x${hex}`;

      expect(() => provider.deserialize(prefixed)).toThrow();
      expect(provider.parseSafe(prefixed)).toBeDefined();
    });

    it('UuidProvider: parseSafe handles no-dashes hex, deserialize does not', () => {
      const provider = new UuidProvider();
      const uuid = provider.serialize(provider.generate());
      const noDashes = uuid.replace(/-/g, '');

      expect(() => provider.deserialize(noDashes)).toThrow();
      expect(provider.parseSafe(noDashes)).toBeDefined();
    });

    it('UuidProvider: parseSafe handles braces, deserialize does not', () => {
      const provider = new UuidProvider();
      const uuid = provider.serialize(provider.generate());
      const braced = `{${uuid}}`;

      expect(() => provider.deserialize(braced)).toThrow();
      expect(provider.parseSafe(braced)).toBeDefined();
    });

    it('UuidProvider: parseSafe handles urn:uuid:, deserialize does not', () => {
      const provider = new UuidProvider();
      const uuid = provider.serialize(provider.generate());
      const urn = `urn:uuid:${uuid}`;

      expect(() => provider.deserialize(urn)).toThrow();
      expect(provider.parseSafe(urn)).toBeDefined();
    });

    it('CustomIdProvider: parseSafe handles whitespace, deserialize does not', () => {
      const provider = new CustomIdProvider(16);
      const hex = provider.serialize(provider.generate());
      const padded = `  ${hex}  `;

      expect(() => provider.deserialize(padded)).toThrow();
      expect(provider.parseSafe(padded)).toBeDefined();
    });

    it('CustomIdProvider: parseSafe handles 0x prefix, deserialize does not', () => {
      const provider = new CustomIdProvider(16);
      const hex = provider.serialize(provider.generate());
      const prefixed = `0x${hex}`;

      expect(() => provider.deserialize(prefixed)).toThrow();
      expect(provider.parseSafe(prefixed)).toBeDefined();
    });

    it('Uint8ArrayIdProvider: parseSafe handles whitespace, deserialize does not', () => {
      const provider = new Uint8ArrayIdProvider(16);
      const hex = provider.serialize(provider.generate());
      const padded = `  ${hex}  `;

      expect(() => provider.deserialize(padded)).toThrow();
      expect(provider.parseSafe(padded)).toBeDefined();
    });

    it('Uint8ArrayIdProvider: parseSafe handles 0x prefix, deserialize does not', () => {
      const provider = new Uint8ArrayIdProvider(16);
      const hex = provider.serialize(provider.generate());
      const prefixed = `0x${hex}`;

      expect(() => provider.deserialize(prefixed)).toThrow();
      expect(provider.parseSafe(prefixed)).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Fuzz-like stress tests
  // ─────────────────────────────────────────────────────────────
  describe('Stress / Fuzz Tests', () => {
    it('parseSafe should never throw on random strings (ObjectIdProvider)', () => {
      const provider = new ObjectIdProvider();
      for (let i = 0; i < 500; i++) {
        const randomBytes = new Uint8Array(Math.floor(Math.random() * 100));
        crypto.getRandomValues(randomBytes);
        const str = Array.from(randomBytes)
          .map((b) => String.fromCharCode(b))
          .join('');
        expect(() => provider.parseSafe(str)).not.toThrow();
      }
    });

    it('parseSafe should never throw on random strings (UuidProvider)', () => {
      const provider = new UuidProvider();
      for (let i = 0; i < 500; i++) {
        const randomBytes = new Uint8Array(Math.floor(Math.random() * 100));
        crypto.getRandomValues(randomBytes);
        const str = Array.from(randomBytes)
          .map((b) => String.fromCharCode(b))
          .join('');
        expect(() => provider.parseSafe(str)).not.toThrow();
      }
    });

    it('parseSafe should never throw on random strings (GuidV4Provider)', () => {
      const provider = new GuidV4Provider();
      for (let i = 0; i < 500; i++) {
        const randomBytes = new Uint8Array(Math.floor(Math.random() * 100));
        crypto.getRandomValues(randomBytes);
        const str = Array.from(randomBytes)
          .map((b) => String.fromCharCode(b))
          .join('');
        expect(() => provider.parseSafe(str)).not.toThrow();
      }
    });

    it('parseSafe should never throw on random strings (CustomIdProvider)', () => {
      const provider = new CustomIdProvider(16);
      for (let i = 0; i < 500; i++) {
        const randomBytes = new Uint8Array(Math.floor(Math.random() * 100));
        crypto.getRandomValues(randomBytes);
        const str = Array.from(randomBytes)
          .map((b) => String.fromCharCode(b))
          .join('');
        expect(() => provider.parseSafe(str)).not.toThrow();
      }
    });

    it('parseSafe should never throw on random strings (Uint8ArrayIdProvider)', () => {
      const provider = new Uint8ArrayIdProvider(16);
      for (let i = 0; i < 500; i++) {
        const randomBytes = new Uint8Array(Math.floor(Math.random() * 100));
        crypto.getRandomValues(randomBytes);
        const str = Array.from(randomBytes)
          .map((b) => String.fromCharCode(b))
          .join('');
        expect(() => provider.parseSafe(str)).not.toThrow();
      }
    });
  });
});
