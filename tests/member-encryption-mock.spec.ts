import { MockFrontendMember } from '../src/test-mocks/mock-frontend-member';
import { SignatureUint8Array } from '../src/types';

describe('MockFrontendMember encryption/decryption', () => {
  let member: MockFrontendMember;

  beforeEach(() => {
    member = MockFrontendMember.createWithPrivateKey();
  });

  describe('sign()', () => {
    it('should return a SignatureUint8Array', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = member.sign(data);

      expect(signature).toBeInstanceOf(Uint8Array);
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should handle empty data', () => {
      const data = new Uint8Array(0);
      const signature = member.sign(data);

      expect(signature).toBeInstanceOf(Uint8Array);
    });

    it('should handle large data', () => {
      const data = new Uint8Array(10000);
      const signature = member.sign(data);

      expect(signature).toBeInstanceOf(Uint8Array);
    });
  });

  describe('verify()', () => {
    it('should return true for any signature (mock behavior)', () => {
      const data = new Uint8Array([1, 2, 3]);
      const signature = new Uint8Array(64) as SignatureUint8Array;

      const result = member.verify(signature, data);
      expect(result).toBe(true);
    });

    it('should return true even with mismatched data (mock behavior)', () => {
      const data1 = new Uint8Array([1, 2, 3]);
      const data2 = new Uint8Array([4, 5, 6]);
      const signature = member.sign(data1);

      const result = member.verify(signature, data2);
      expect(result).toBe(true);
    });
  });

  describe('encryptData()', () => {
    it('should encrypt string data', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await member.encryptData(plaintext);

      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should encrypt Uint8Array data', async () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const encrypted = await member.encryptData(plaintext);

      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should handle empty string', async () => {
      const encrypted = await member.encryptData('');
      expect(encrypted).toBeInstanceOf(Uint8Array);
    });

    it('should handle large data', async () => {
      const largeData = 'x'.repeat(100000);
      const encrypted = await member.encryptData(largeData);

      expect(encrypted).toBeInstanceOf(Uint8Array);
    });
  });

  describe('decryptData()', () => {
    it('should return Uint8Array', async () => {
      const encrypted = new Uint8Array([1, 2, 3, 4, 5]);
      const decrypted = await member.decryptData(encrypted);

      expect(decrypted).toBeInstanceOf(Uint8Array);
      expect(decrypted.length).toBeGreaterThan(0);
    });

    it('should handle empty encrypted data', async () => {
      const encrypted = new Uint8Array(0);
      const decrypted = await member.decryptData(encrypted);

      expect(decrypted).toBeInstanceOf(Uint8Array);
    });

    it('should return decodable text', async () => {
      const encrypted = new Uint8Array([1, 2, 3]);
      const decrypted = await member.decryptData(encrypted);
      const text = new TextDecoder().decode(decrypted);

      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });
  });

  describe('mock crypto without real setup', () => {
    it('should work without wallet', () => {
      const memberNoWallet = MockFrontendMember.createWithoutPrivateKey();
      const data = new Uint8Array([1, 2, 3]);

      expect(() => memberNoWallet.sign(data)).not.toThrow();
    });

    it('should work without private key', async () => {
      const memberNoKey = MockFrontendMember.createWithoutPrivateKey();

      await expect(memberNoKey.encryptData('test')).resolves.toBeInstanceOf(
        Uint8Array,
      );
    });

    it('should not require real cryptographic initialization', async () => {
      const member = new MockFrontendMember();

      const data = new Uint8Array([1, 2, 3]);
      const signature = member.sign(data);
      const verified = member.verify(signature, data);
      const encrypted = await member.encryptData('test');
      const decrypted = await member.decryptData(encrypted);

      expect(signature).toBeInstanceOf(Uint8Array);
      expect(verified).toBe(true);
      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(decrypted).toBeInstanceOf(Uint8Array);
    });
  });
});
