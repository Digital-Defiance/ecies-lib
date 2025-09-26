import { XorService } from '../src/services/xor';

describe('XorService', () => {
  it('should correctly xor data with a key', () => {
    const data = new Uint8Array([1, 2, 3]);
    const key = new Uint8Array([4, 5, 6]);
    const expected = new Uint8Array([1 ^ 4, 2 ^ 5, 3 ^ 6]);
    const result = XorService.xor(data, key);
    expect(result).toEqual(expected);
  });

  it('should return the original data when xor is applied twice', () => {
    const data = new Uint8Array([10, 20, 30, 40, 50]);
    const key = new Uint8Array([5, 15, 25]);
    const encrypted = XorService.xor(data, key);
    const decrypted = XorService.xor(encrypted, key);
    expect(decrypted).toEqual(data);
  });

  it('should handle key shorter than data by repeating the key', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const key = new Uint8Array([10, 20]);
    const expected = new Uint8Array([1 ^ 10, 2 ^ 20, 3 ^ 10, 4 ^ 20, 5 ^ 10]);
    const result = XorService.xor(data, key);
    expect(result).toEqual(expected);
  });

  it('should handle empty data', () => {
    const data = new Uint8Array([]);
    const key = new Uint8Array([1, 2, 3]);
    const result = XorService.xor(data, key);
    expect(result).toEqual(new Uint8Array([]));
  });

  it('should generate a random key of the specified length', () => {
    const keyLength = 32;
    const key = XorService.generateKey(keyLength);
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(keyLength);
  });

  it('should convert a string to a Uint8Array and back', () => {
    const originalString = 'hello world';
    const bytes = XorService.stringToBytes(originalString);
    expect(bytes).toBeInstanceOf(Uint8Array);
    const resultString = XorService.bytesToString(bytes);
    expect(resultString).toBe(originalString);
  });
});
