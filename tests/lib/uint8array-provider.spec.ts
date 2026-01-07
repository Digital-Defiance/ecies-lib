/**
 * Uint8ArrayIdProvider Tests - Critical Gap Coverage
 */

import { Uint8ArrayIdProvider } from '../../src/lib/id-providers/uint8array-provider';

describe('Uint8ArrayIdProvider', () => {
  let provider: Uint8ArrayIdProvider;

  beforeEach(() => {
    provider = new Uint8ArrayIdProvider(16);
  });

  it('should generate ID of correct length', () => {
    const id = provider.generate();
    expect(id.length).toBe(16);
  });

  it('should validate correct length', () => {
    const id = new Uint8Array(16);
    expect(provider.validate(id)).toBe(true);
  });

  it('should reject incorrect length', () => {
    const id = new Uint8Array(8);
    expect(provider.validate(id)).toBe(false);
  });

  it('should compare IDs correctly', () => {
    const id1 = new Uint8Array([1, 2, 3]);
    const id2 = new Uint8Array([1, 2, 3]);
    const id3 = new Uint8Array([1, 2, 4]);

    expect(provider.equals(id1, id2)).toBe(true);
    expect(provider.equals(id1, id3)).toBe(false);
  });

  it('should clone ID', () => {
    const id = new Uint8Array([1, 2, 3]);
    const cloned = provider.clone(id);

    expect(cloned).toEqual(id);
    expect(cloned).not.toBe(id);
  });

  it('should convert to bytes', () => {
    const id = new Uint8Array([1, 2, 3]);
    const bytes = provider.toBytes(id);
    expect(bytes).toEqual(id);
  });

  it('should convert from bytes', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const id = provider.fromBytes(bytes);
    expect(id).toEqual(bytes);
  });
});
