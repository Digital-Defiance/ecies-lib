import {
  CustomIdProvider,
  GuidV4Provider,
  ObjectIdProvider,
  Uint8ArrayIdProvider,
  UuidProvider,
} from '../../../src/lib/id-providers';

/**
 * Tests for the toString(id, format) method on all ID providers.
 *
 * Each provider must support three formats:
 *   - 'hex': lowercase hex string of the raw bytes
 *   - 'base64': standard base64 encoding of the raw bytes
 *   - 'int': big-endian unsigned integer string of the raw bytes
 *
 * We verify:
 *   1. Output format correctness (regex, length)
 *   2. Determinism (same id → same output)
 *   3. Cross-format consistency (all formats decode to the same bytes)
 *   4. Invalid format throws
 */

// Helper: decode hex string to byte values
function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

// Helper: decode base64 to byte values
function base64ToBytes(b64: string): number[] {
  const bin = atob(b64);
  return Array.from(bin, (ch) => ch.charCodeAt(0));
}

// Helper: convert big-endian integer string back to byte array of given length
function intToBytes(intStr: string, byteLength: number): number[] {
  let n = BigInt(intStr);
  const bytes: number[] = new Array(byteLength).fill(0);
  for (let i = byteLength - 1; i >= 0; i--) {
    bytes[i] = Number(n & BigInt(0xff));
    n >>= BigInt(8);
  }
  return bytes;
}

describe('IIdProvider.toString(id, format)', () => {
  describe('ObjectIdProvider', () => {
    const provider = new ObjectIdProvider();

    it('hex: should return 24-char lowercase hex string', () => {
      const id = provider.fromBytes(provider.generate());
      const hex = provider.toString(id, 'hex');
      expect(hex).toMatch(/^[0-9a-f]{24}$/);
      expect(hex.length).toBe(24);
    });

    it('base64: should return valid base64 of 12 bytes', () => {
      const id = provider.fromBytes(provider.generate());
      const b64 = provider.toString(id, 'base64');
      // 12 bytes → 16 base64 chars (with padding)
      expect(b64.length).toBe(16);
      expect(() => atob(b64)).not.toThrow();
    });

    it('int: should return a decimal integer string', () => {
      const id = provider.fromBytes(provider.generate());
      const intStr = provider.toString(id, 'int');
      expect(intStr).toMatch(/^\d+$/);
      // 12 bytes max = 2^96 - 1 ≈ 7.9e28, so at most 29 digits
      expect(intStr.length).toBeLessThanOrEqual(29);
    });

    it('all formats should decode to the same bytes', () => {
      const id = provider.fromBytes(provider.generate());
      const hex = provider.toString(id, 'hex');
      const b64 = provider.toString(id, 'base64');
      const intStr = provider.toString(id, 'int');

      const fromHex = hexToBytes(hex);
      const fromB64 = base64ToBytes(b64);
      const fromInt = intToBytes(intStr, 12);

      expect(fromHex).toEqual(fromB64);
      expect(fromHex).toEqual(fromInt);
    });

    it('should be deterministic', () => {
      const id = provider.fromBytes(provider.generate());
      expect(provider.toString(id, 'hex')).toBe(provider.toString(id, 'hex'));
      expect(provider.toString(id, 'base64')).toBe(
        provider.toString(id, 'base64'),
      );
      expect(provider.toString(id, 'int')).toBe(provider.toString(id, 'int'));
    });

    it('should throw on invalid format', () => {
      const id = provider.fromBytes(provider.generate());
      expect(() => provider.toString(id, 'binary' as any)).toThrow();
    });
  });

  describe('GuidV4Provider', () => {
    const provider = new GuidV4Provider();

    it('hex: should return 32-char lowercase hex string', () => {
      const id = provider.fromBytes(provider.generate());
      const hex = provider.toString(id, 'hex');
      expect(hex).toMatch(/^[0-9a-f]{32}$/);
      expect(hex.length).toBe(32);
    });

    it('base64: should return valid base64 of 16 bytes', () => {
      const id = provider.fromBytes(provider.generate());
      const b64 = provider.toString(id, 'base64');
      // 16 bytes → 24 base64 chars (with padding)
      expect(b64.length).toBe(24);
      expect(() => atob(b64)).not.toThrow();
    });

    it('int: should return a decimal integer string', () => {
      const id = provider.fromBytes(provider.generate());
      const intStr = provider.toString(id, 'int');
      expect(intStr).toMatch(/^\d+$/);
      // 16 bytes max = 2^128 - 1 ≈ 3.4e38, so at most 39 digits
      expect(intStr.length).toBeLessThanOrEqual(39);
    });

    it('all formats should decode to the same bytes', () => {
      const id = provider.fromBytes(provider.generate());
      const hex = provider.toString(id, 'hex');
      const b64 = provider.toString(id, 'base64');
      const intStr = provider.toString(id, 'int');

      const fromHex = hexToBytes(hex);
      const fromB64 = base64ToBytes(b64);
      const fromInt = intToBytes(intStr, 16);

      expect(fromHex).toEqual(fromB64);
      expect(fromHex).toEqual(fromInt);
    });

    it('should be deterministic', () => {
      const id = provider.fromBytes(provider.generate());
      expect(provider.toString(id, 'hex')).toBe(provider.toString(id, 'hex'));
      expect(provider.toString(id, 'base64')).toBe(
        provider.toString(id, 'base64'),
      );
      expect(provider.toString(id, 'int')).toBe(provider.toString(id, 'int'));
    });

    it('hex output should match idToString short hex', () => {
      const id = provider.fromBytes(provider.generate());
      const hex = provider.toString(id, 'hex');
      // idToString now returns short hex (32 chars, no dashes) — same as toString(id, 'hex')
      const shortHex = provider.idToString(id);
      expect(hex).toBe(shortHex);
    });

    it('should throw on invalid format', () => {
      const id = provider.fromBytes(provider.generate());
      expect(() => provider.toString(id, 'octal' as any)).toThrow();
    });
  });

  describe('UuidProvider', () => {
    const provider = new UuidProvider();

    it('hex: should return 32-char lowercase hex string', () => {
      const id = provider.fromBytes(provider.generate());
      const hex = provider.toString(id, 'hex');
      expect(hex).toMatch(/^[0-9a-f]{32}$/);
      expect(hex.length).toBe(32);
    });

    it('base64: should return valid base64 of 16 bytes', () => {
      const id = provider.fromBytes(provider.generate());
      const b64 = provider.toString(id, 'base64');
      expect(b64.length).toBe(24);
      expect(() => atob(b64)).not.toThrow();
    });

    it('int: should return a decimal integer string', () => {
      const id = provider.fromBytes(provider.generate());
      const intStr = provider.toString(id, 'int');
      expect(intStr).toMatch(/^\d+$/);
      expect(intStr.length).toBeLessThanOrEqual(39);
    });

    it('all formats should decode to the same bytes', () => {
      const id = provider.fromBytes(provider.generate());
      const hex = provider.toString(id, 'hex');
      const b64 = provider.toString(id, 'base64');
      const intStr = provider.toString(id, 'int');

      const fromHex = hexToBytes(hex);
      const fromB64 = base64ToBytes(b64);
      const fromInt = intToBytes(intStr, 16);

      expect(fromHex).toEqual(fromB64);
      expect(fromHex).toEqual(fromInt);
    });

    it('hex output should match UUID without dashes', () => {
      const id = provider.fromBytes(provider.generate());
      const hex = provider.toString(id, 'hex');
      // The native UUID string has dashes; hex format strips them
      expect(hex).toBe(id.replace(/-/g, ''));
    });

    it('should be deterministic', () => {
      const id = provider.fromBytes(provider.generate());
      expect(provider.toString(id, 'hex')).toBe(provider.toString(id, 'hex'));
      expect(provider.toString(id, 'base64')).toBe(
        provider.toString(id, 'base64'),
      );
      expect(provider.toString(id, 'int')).toBe(provider.toString(id, 'int'));
    });

    it('should throw on invalid format', () => {
      const id = provider.fromBytes(provider.generate());
      expect(() => provider.toString(id, 'utf8' as any)).toThrow();
    });
  });

  describe('CustomIdProvider', () => {
    const provider = new CustomIdProvider(20, 'SHA1Hash');

    it('hex: should return 40-char lowercase hex string for 20-byte provider', () => {
      const id = provider.generate();
      const hex = provider.toString(id, 'hex');
      expect(hex).toMatch(/^[0-9a-f]{40}$/);
      expect(hex.length).toBe(40);
    });

    it('base64: should return valid base64 of 20 bytes', () => {
      const id = provider.generate();
      const b64 = provider.toString(id, 'base64');
      // 20 bytes → ceil(20/3)*4 = 28 base64 chars (with padding)
      expect(b64.length).toBe(28);
      expect(() => atob(b64)).not.toThrow();
    });

    it('int: should return a decimal integer string', () => {
      const id = provider.generate();
      const intStr = provider.toString(id, 'int');
      expect(intStr).toMatch(/^\d+$/);
    });

    it('all formats should decode to the same bytes', () => {
      const id = provider.generate();
      const hex = provider.toString(id, 'hex');
      const b64 = provider.toString(id, 'base64');
      const intStr = provider.toString(id, 'int');

      const fromHex = hexToBytes(hex);
      const fromB64 = base64ToBytes(b64);
      const fromInt = intToBytes(intStr, 20);

      expect(fromHex).toEqual(fromB64);
      expect(fromHex).toEqual(fromInt);
    });

    it('should work with different byte lengths', () => {
      for (const len of [1, 4, 8, 16, 32, 64]) {
        const p = new CustomIdProvider(len);
        const id = p.generate();

        const hex = p.toString(id, 'hex');
        expect(hex.length).toBe(len * 2);

        const b64 = p.toString(id, 'base64');
        expect(() => atob(b64)).not.toThrow();

        const intStr = p.toString(id, 'int');
        expect(intStr).toMatch(/^\d+$/);
      }
    });

    it('should be deterministic', () => {
      const id = provider.generate();
      expect(provider.toString(id, 'hex')).toBe(provider.toString(id, 'hex'));
      expect(provider.toString(id, 'base64')).toBe(
        provider.toString(id, 'base64'),
      );
      expect(provider.toString(id, 'int')).toBe(provider.toString(id, 'int'));
    });

    it('should throw on invalid format', () => {
      const id = provider.generate();
      expect(() => provider.toString(id, 'raw' as any)).toThrow();
    });
  });

  describe('Uint8ArrayIdProvider', () => {
    const provider = new Uint8ArrayIdProvider(16, 'Test16');

    it('hex: should return 32-char lowercase hex string for 16-byte provider', () => {
      const id = provider.generate();
      const hex = provider.toString(id, 'hex');
      expect(hex).toMatch(/^[0-9a-f]{32}$/);
      expect(hex.length).toBe(32);
    });

    it('base64: should return valid base64 of 16 bytes', () => {
      const id = provider.generate();
      const b64 = provider.toString(id, 'base64');
      expect(b64.length).toBe(24);
      expect(() => atob(b64)).not.toThrow();
    });

    it('int: should return a decimal integer string', () => {
      const id = provider.generate();
      const intStr = provider.toString(id, 'int');
      expect(intStr).toMatch(/^\d+$/);
    });

    it('all formats should decode to the same bytes', () => {
      const id = provider.generate();
      const hex = provider.toString(id, 'hex');
      const b64 = provider.toString(id, 'base64');
      const intStr = provider.toString(id, 'int');

      const fromHex = hexToBytes(hex);
      const fromB64 = base64ToBytes(b64);
      const fromInt = intToBytes(intStr, 16);

      expect(fromHex).toEqual(fromB64);
      expect(fromHex).toEqual(fromInt);
    });

    it('should be deterministic', () => {
      const id = provider.generate();
      expect(provider.toString(id, 'hex')).toBe(provider.toString(id, 'hex'));
      expect(provider.toString(id, 'base64')).toBe(
        provider.toString(id, 'base64'),
      );
      expect(provider.toString(id, 'int')).toBe(provider.toString(id, 'int'));
    });

    it('should throw on invalid format', () => {
      const id = provider.generate();
      expect(() => provider.toString(id, 'xml' as any)).toThrow();
    });
  });

  describe('Known-value tests', () => {
    it('CustomIdProvider: all-zeros should produce "0" for int format', () => {
      const provider = new CustomIdProvider(4);
      const zeros = new Uint8Array(4);
      expect(provider.toString(zeros, 'int')).toBe('0');
      expect(provider.toString(zeros, 'hex')).toBe('00000000');
    });

    it('CustomIdProvider: known bytes should produce expected hex', () => {
      const provider = new CustomIdProvider(4);
      const id = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      expect(provider.toString(id, 'hex')).toBe('deadbeef');
      expect(provider.toString(id, 'int')).toBe('3735928559'); // 0xDEADBEEF
    });

    it('Uint8ArrayIdProvider: known bytes should produce expected hex', () => {
      const provider = new Uint8ArrayIdProvider(4, 'Test4');
      const id = new Uint8Array([0xca, 0xfe, 0xba, 0xbe]);
      expect(provider.toString(id, 'hex')).toBe('cafebabe');
      expect(provider.toString(id, 'int')).toBe('3405691582'); // 0xCAFEBABE
    });

    it('ObjectIdProvider: hex format should match idToString', () => {
      const provider = new ObjectIdProvider();
      const id = provider.fromBytes(provider.generate());
      expect(provider.toString(id, 'hex')).toBe(provider.idToString(id));
    });
  });

  describe('Cross-provider format consistency', () => {
    it('all providers should produce the same hex for the same raw bytes', () => {
      // Use 16 bytes so GuidV4, UUID, Custom, and Uint8Array can all handle it
      const rawBytes = new Uint8Array([
        0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4, 0xa7, 0x16, 0x44, 0x66,
        0x55, 0x44, 0x00, 0x00,
      ]);

      const custom = new CustomIdProvider(16);
      const uint8 = new Uint8ArrayIdProvider(16);

      // Custom and Uint8Array use Uint8Array as native type — direct pass
      const customHex = custom.toString(rawBytes, 'hex');
      const uint8Hex = uint8.toString(rawBytes, 'hex');

      expect(customHex).toBe(uint8Hex);
      expect(customHex).toBe('550e8400e29b41d4a716446655440000');
    });
  });
});
