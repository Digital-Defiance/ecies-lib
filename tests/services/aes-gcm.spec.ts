import { ECIES } from '../../src/constants';
import { getEciesI18nEngine } from '../../src/i18n-setup';
import { AESGCMService } from '../../src/services/aes-gcm';

describe('AESGCMService', () => {
  let service: AESGCMService;

  beforeAll(() => {
    getEciesI18nEngine(); // Initialize i18n engine
  });

  beforeEach(() => {
    service = new AESGCMService();
  });

  const testData = new TextEncoder().encode('Hello, World!');
  const key128 = crypto.getRandomValues(new Uint8Array(16)); // 128-bit key
  const key256 = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key

  describe('Constants', () => {
    it('should have correct algorithm name', () => {
      expect(AESGCMService.ALGORITHM_NAME).toBe('AES-GCM');
    });
  });

  describe('encrypt', () => {
    it('should encrypt data without auth tag', async () => {
      const result = await service.encrypt(testData, key256, false, ECIES);

      expect(result.encrypted).toBeInstanceOf(Uint8Array);
      expect(result.iv).toBeInstanceOf(Uint8Array);
      expect(result.iv.length).toBe(ECIES.IV_SIZE);
      expect(result.tag).toBeUndefined();
      expect(result.encrypted.length).toBeGreaterThan(0);
    });

    it('should encrypt data with auth tag', async () => {
      const result = await service.encrypt(testData, key256, true, ECIES);

      expect(result.encrypted).toBeInstanceOf(Uint8Array);
      expect(result.iv).toBeInstanceOf(Uint8Array);
      expect(result.tag).toBeInstanceOf(Uint8Array);
      expect(result.iv.length).toBe(ECIES.IV_SIZE);
      expect(result.tag!.length).toBe(ECIES.AUTH_TAG_SIZE); // 128 bits = 16 bytes
    });

    it('should work with 128-bit key', async () => {
      const result = await service.encrypt(testData, key128, false, ECIES);

      expect(result.encrypted).toBeInstanceOf(Uint8Array);
      expect(result.iv).toBeInstanceOf(Uint8Array);
    });

    it('should generate different IVs for each encryption', async () => {
      const result1 = await service.encrypt(testData, key256, false, ECIES);
      const result2 = await service.encrypt(testData, key256, false);

      expect(result1.iv).not.toEqual(result2.iv);
    });

    it('should produce different ciphertext with different IVs', async () => {
      const result1 = await service.encrypt(testData, key256, false, ECIES);
      const result2 = await service.encrypt(testData, key256, false, ECIES);

      expect(result1.encrypted).not.toEqual(result2.encrypted);
    });

    it('should handle empty data', async () => {
      const emptyData = new Uint8Array(0);
      const result = await service.encrypt(emptyData, key256, false, ECIES);

      expect(result.encrypted).toBeInstanceOf(Uint8Array);
      expect(result.iv).toBeInstanceOf(Uint8Array);
    });

    it('should reject invalid key sizes', async () => {
      const invalidKey = new Uint8Array(15); // Invalid key size

      await expect(
        service.encrypt(testData, invalidKey, false, ECIES),
      ).rejects.toThrow();
    });
  });

  describe('decrypt', () => {
    it('should decrypt data without auth tag', async () => {
      const { encrypted, iv } = await service.encrypt(
        testData,
        key256,
        false,
        ECIES,
      );
      const decrypted = await service.decrypt(
        iv,
        encrypted,
        key256,
        false,
        ECIES,
      );

      expect(decrypted).toEqual(testData);
    });

    it('should decrypt data with auth tag', async () => {
      const { encrypted, iv, tag } = await service.encrypt(
        testData,
        key256,
        true,
        ECIES,
      );
      const encryptedWithTag = service.combineEncryptedDataAndTag(
        encrypted,
        tag!,
      );
      const decrypted = await service.decrypt(
        iv,
        encryptedWithTag,
        key256,
        true,
        ECIES,
      );

      expect(decrypted).toEqual(testData);
    });

    it('should work with 128-bit key', async () => {
      const { encrypted, iv } = await service.encrypt(
        testData,
        key128,
        false,
        ECIES,
      );
      const decrypted = await service.decrypt(
        iv,
        encrypted,
        key128,
        false,
        ECIES,
      );

      expect(decrypted).toEqual(testData);
    });

    it('should handle empty data', async () => {
      const emptyData = new Uint8Array(0);
      const { encrypted, iv } = await service.encrypt(
        emptyData,
        key256,
        false,
        ECIES,
      );
      const decrypted = await service.decrypt(
        iv,
        encrypted,
        key256,
        false,
        ECIES,
      );

      expect(decrypted).toEqual(emptyData);
    });

    it('should fail with wrong key', async () => {
      const { encrypted, iv } = await service.encrypt(
        testData,
        key256,
        false,
        ECIES,
      );
      const wrongKey = crypto.getRandomValues(new Uint8Array(32));

      await expect(
        service.decrypt(iv, encrypted, wrongKey, false, ECIES),
      ).rejects.toThrow();
    });

    it('should fail with wrong IV', async () => {
      const { encrypted } = await service.encrypt(
        testData,
        key256,
        false,
        ECIES,
      );
      const wrongIv = crypto.getRandomValues(new Uint8Array(ECIES.IV_SIZE));

      await expect(
        service.decrypt(wrongIv, encrypted, key256, false, ECIES),
      ).rejects.toThrow();
    });

    it('should fail with corrupted ciphertext', async () => {
      const { encrypted, iv } = await service.encrypt(
        testData,
        key256,
        false,
        ECIES,
      );
      const corrupted = new Uint8Array(encrypted);
      corrupted[0] ^= 1; // Flip a bit

      await expect(
        service.decrypt(iv, corrupted, key256, false, ECIES),
      ).rejects.toThrow();
    });

    it('should fail with wrong auth tag', async () => {
      const {
        encrypted,
        iv,
        tag: _tag,
      } = await service.encrypt(testData, key256, true, ECIES);
      const wrongTag = crypto.getRandomValues(
        new Uint8Array(ECIES.AUTH_TAG_SIZE),
      );
      const encryptedWithWrongTag = service.combineEncryptedDataAndTag(
        encrypted,
        wrongTag,
      );

      await expect(
        service.decrypt(iv, encryptedWithWrongTag, key256, true, ECIES),
      ).rejects.toThrow();
    });

    it('should fail with corrupted auth tag', async () => {
      const { encrypted, iv, tag } = await service.encrypt(
        testData,
        key256,
        true,
      );
      const corruptedTag = new Uint8Array(tag!);
      corruptedTag[0] ^= 1; // Flip a bit
      const encryptedWithCorruptedTag = service.combineEncryptedDataAndTag(
        encrypted,
        corruptedTag,
      );

      await expect(
        service.decrypt(iv, encryptedWithCorruptedTag, key256, true, ECIES),
      ).rejects.toThrow();
    });
  });

  describe('combineEncryptedDataAndTag', () => {
    it('should combine encrypted data and auth tag', () => {
      const encrypted = new Uint8Array([1, 2, 3, 4]);
      const tag = new Uint8Array([5, 6, 7, 8]);

      const combined = service.combineEncryptedDataAndTag(encrypted, tag);

      expect(combined).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
      expect(combined.length).toBe(encrypted.length + tag.length);
    });

    it('should handle empty encrypted data', () => {
      const encrypted = new Uint8Array(0);
      const tag = new Uint8Array([1, 2, 3, 4]);

      const combined = service.combineEncryptedDataAndTag(encrypted, tag);

      expect(combined).toEqual(tag);
    });

    it('should handle empty tag', () => {
      const encrypted = new Uint8Array([1, 2, 3, 4]);
      const tag = new Uint8Array(0);

      const combined = service.combineEncryptedDataAndTag(encrypted, tag);

      expect(combined).toEqual(encrypted);
    });
  });

  describe('combineIvAndEncryptedData', () => {
    it('should combine IV and encrypted data with tag', () => {
      const iv = new Uint8Array([1, 2, 3]);
      const encryptedWithTag = new Uint8Array([4, 5, 6, 7, 8, 9]);

      const combined = service.combineIvAndEncryptedData(iv, encryptedWithTag);

      expect(combined).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
      expect(combined.length).toBe(iv.length + encryptedWithTag.length);
    });

    it('should handle empty encrypted data', () => {
      const iv = new Uint8Array([1, 2, 3]);
      const encryptedWithTag = new Uint8Array(0);

      const combined = service.combineIvAndEncryptedData(iv, encryptedWithTag);

      expect(combined).toEqual(new Uint8Array([1, 2, 3]));
    });
  });

  describe('combineIvTagAndEncryptedData', () => {
    it('should combine IV, encrypted data and auth tag', () => {
      const iv = new Uint8Array([1, 2, 3]);
      const encrypted = new Uint8Array([4, 5, 6]);
      const tag = new Uint8Array([7, 8, 9]);

      const combined = service.combineIvTagAndEncryptedData(iv, encrypted, tag);

      expect(combined).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
      expect(combined.length).toBe(iv.length + encrypted.length + tag.length);
    });

    it('should handle empty components', () => {
      const iv = new Uint8Array([1, 2, 3]);
      const encrypted = new Uint8Array(0);
      const tag = new Uint8Array([7, 8, 9]);

      const combined = service.combineIvTagAndEncryptedData(iv, encrypted, tag);

      expect(combined).toEqual(new Uint8Array([1, 2, 3, 7, 8, 9]));
    });
  });

  describe('splitEncryptedData', () => {
    it('should split combined data with auth tag', () => {
      const originalIv = crypto.getRandomValues(new Uint8Array(ECIES.IV_SIZE));
      const originalEncrypted = new Uint8Array([1, 2, 3, 4, 5]);
      const originalTag = crypto.getRandomValues(
        new Uint8Array(ECIES.AUTH_TAG_SIZE),
      );

      const combined = service.combineIvTagAndEncryptedData(
        originalIv,
        originalEncrypted,
        originalTag,
      );
      const { iv, encryptedDataWithTag } = service.splitEncryptedData(
        combined,
        true,
        ECIES,
      );

      expect(iv).toEqual(originalIv);
      expect(encryptedDataWithTag).toEqual(
        service.combineEncryptedDataAndTag(originalEncrypted, originalTag),
      );
    });

    it('should split combined data without auth tag', () => {
      const originalIv = crypto.getRandomValues(new Uint8Array(ECIES.IV_SIZE));
      const originalEncrypted = new Uint8Array([1, 2, 3, 4, 5]);

      const combined = service.combineIvAndEncryptedData(
        originalIv,
        originalEncrypted,
      );
      const { iv, encryptedDataWithTag } = service.splitEncryptedData(
        combined,
        false,
        ECIES,
      );

      expect(iv).toEqual(originalIv);
      expect(encryptedDataWithTag).toEqual(originalEncrypted);
    });

    it('should handle empty encrypted data with auth tag', () => {
      const originalIv = crypto.getRandomValues(new Uint8Array(ECIES.IV_SIZE));
      const originalEncrypted = new Uint8Array(0);
      const originalTag = crypto.getRandomValues(
        new Uint8Array(ECIES.AUTH_TAG_SIZE),
      );

      const combined = service.combineIvTagAndEncryptedData(
        originalIv,
        originalEncrypted,
        originalTag,
      );
      const { iv, encryptedDataWithTag } = service.splitEncryptedData(
        combined,
        true,
        ECIES,
      );

      expect(iv).toEqual(originalIv);
      expect(encryptedDataWithTag).toEqual(originalTag); // Only tag since encrypted data is empty
    });

    it('should throw error for data too short', () => {
      const tooShort = new Uint8Array(10); // Less than IV length (16)

      expect(() => {
        service.splitEncryptedData(tooShort, true, ECIES);
      }).toThrow('Combined data is too short to contain required components');
    });

    it('should throw error for data too short with auth tag', () => {
      const tooShort = new Uint8Array(20); // Less than IV (16) + tag (16) = 32

      expect(() => {
        service.splitEncryptedData(tooShort, true, ECIES);
      }).toThrow('Combined data is too short to contain required components');
    });
  });

  describe('Integration tests', () => {
    it('should encrypt and decrypt large data', async () => {
      const largeData = crypto.getRandomValues(new Uint8Array(64 * 1024)); // 64KB

      const { encrypted, iv, tag } = await service.encrypt(
        largeData,
        key256,
        true,
        ECIES,
      );
      const encryptedWithTag = service.combineEncryptedDataAndTag(
        encrypted,
        tag!,
      );
      const decrypted = await service.decrypt(
        iv,
        encryptedWithTag,
        key256,
        true,
        ECIES,
      );

      expect(decrypted).toEqual(largeData);
    });

    it('should work with combined data format', async () => {
      const { encrypted, iv, tag } = await service.encrypt(
        testData,
        key256,
        true,
        ECIES,
      );
      const encryptedWithTag = service.combineEncryptedDataAndTag(
        encrypted,
        tag!,
      );
      const decrypted = await service.decrypt(
        iv,
        encryptedWithTag,
        key256,
        true,
        ECIES,
      );

      expect(decrypted).toEqual(testData);
    });

    it('should work with full combined format', async () => {
      const { encrypted, iv, tag } = await service.encrypt(
        testData,
        key256,
        true,
        ECIES,
      );
      const fullCombined = service.combineIvTagAndEncryptedData(
        iv,
        encrypted,
        tag!,
      );

      // Extract components back using new split method
      const { iv: extractedIv, encryptedDataWithTag } =
        service.splitEncryptedData(fullCombined, true, ECIES);
      const decrypted = await service.decrypt(
        extractedIv,
        encryptedDataWithTag,
        key256,
        true,
        ECIES,
      );

      expect(decrypted).toEqual(testData);
    });

    it('should work with splitEncryptedData for data without auth tag', async () => {
      const { encrypted, iv } = await service.encrypt(
        testData,
        key256,
        false,
        ECIES,
      );
      const combined = service.combineIvAndEncryptedData(iv, encrypted);

      // Split using new method
      const { iv: extractedIv, encryptedDataWithTag } =
        service.splitEncryptedData(combined, false, ECIES);
      const decrypted = await service.decrypt(
        extractedIv,
        encryptedDataWithTag,
        key256,
        false,
        ECIES,
      );

      expect(decrypted).toEqual(testData);
    });

    it('should maintain data integrity across multiple encrypt/decrypt cycles', async () => {
      let data: Uint8Array = testData;

      for (let i = 0; i < 5; i++) {
        const { encrypted, iv, tag } = await service.encrypt(
          data,
          key256,
          true,
          ECIES,
        );
        const encryptedWithTag = service.combineEncryptedDataAndTag(
          encrypted,
          tag!,
        );
        data = await service.decrypt(iv, encryptedWithTag, key256, true, ECIES);
      }

      expect(data).toEqual(testData);
    });

    it('should handle different key sizes correctly', async () => {
      const key192 = crypto.getRandomValues(new Uint8Array(24)); // 192-bit key

      const { encrypted, iv } = await service.encrypt(
        testData,
        key192,
        false,
        ECIES,
      );
      const decrypted = await service.decrypt(
        iv,
        encrypted,
        key192,
        false,
        ECIES,
      );

      expect(decrypted).toEqual(testData);
    });
  });

  describe('encryptJson and decryptJson', () => {
    it('should encrypt and decrypt simple object', async () => {
      const data = { name: 'Alice', age: 30 };
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<typeof data>(encrypted, key);

      expect(decrypted).toEqual(data);
    });

    it('should encrypt and decrypt complex nested object', async () => {
      const data = {
        user: { name: 'Bob', email: 'bob@example.com' },
        settings: { theme: 'dark', notifications: true },
        items: [1, 2, 3, 4, 5],
      };
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<typeof data>(encrypted, key);

      expect(decrypted).toEqual(data);
    });

    it('should encrypt and decrypt array', async () => {
      const data = [1, 2, 3, 'test', { key: 'value' }];
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<typeof data>(encrypted, key);

      expect(decrypted).toEqual(data);
    });

    it('should encrypt and decrypt string', async () => {
      const data = 'Hello, World!';
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<string>(encrypted, key);

      expect(decrypted).toBe(data);
    });

    it('should encrypt and decrypt number', async () => {
      const data = 42;
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<number>(encrypted, key);

      expect(decrypted).toBe(data);
    });

    it('should encrypt and decrypt boolean', async () => {
      const data = true;
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<boolean>(encrypted, key);

      expect(decrypted).toBe(data);
    });

    it('should encrypt and decrypt null', async () => {
      const data = null;
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<null>(encrypted, key);

      expect(decrypted).toBe(data);
    });

    it('should encrypt and decrypt empty object', async () => {
      const data = {};
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<typeof data>(encrypted, key);

      expect(decrypted).toEqual(data);
    });

    it('should encrypt and decrypt empty array', async () => {
      const data: any[] = [];
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<typeof data>(encrypted, key);

      expect(decrypted).toEqual(data);
    });

    it('should fail to decrypt with wrong key', async () => {
      const data = { secret: 'data' };
      const key = crypto.getRandomValues(new Uint8Array(32));
      const wrongKey = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);

      await expect(service.decryptJson(encrypted, wrongKey)).rejects.toThrow();
    });

    it('should fail to decrypt corrupted data', async () => {
      const data = { test: 'value' };
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const corrupted = new Uint8Array(encrypted);
      corrupted[corrupted.length - 1] ^= 1; // Flip a bit

      await expect(service.decryptJson(corrupted, key)).rejects.toThrow();
    });

    it('should produce different ciphertext for same data', async () => {
      const data = { test: 'value' };
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted1 = await service.encryptJson(data, key);
      const encrypted2 = await service.encryptJson(data, key);

      expect(encrypted1).not.toEqual(encrypted2);
    });

    it('should handle large JSON objects', async () => {
      const data = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random(),
        })),
      };
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<typeof data>(encrypted, key);

      expect(decrypted).toEqual(data);
    });

    it('should handle special characters in strings', async () => {
      const data = {
        text: 'Hello 世界 🌍 \n\t\r',
        emoji: '😀😃😄😁',
        unicode: '\u0048\u0065\u006C\u006C\u006F',
      };
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<typeof data>(encrypted, key);

      expect(decrypted).toEqual(data);
    });

    it('should work with custom ECIES params', async () => {
      const data = { test: 'custom params' };
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key, ECIES);
      const decrypted = await service.decryptJson<typeof data>(
        encrypted,
        key,
        ECIES,
      );

      expect(decrypted).toEqual(data);
    });

    it('should fail with invalid JSON during decryption', async () => {
      const key = crypto.getRandomValues(new Uint8Array(32));
      const invalidData = new TextEncoder().encode('not valid json {');

      const { iv, encrypted, tag } = await service.encrypt(
        invalidData,
        key,
        true,
        ECIES,
      );
      const combined = service.combineIvTagAndEncryptedData(
        iv,
        encrypted,
        tag!,
      );

      await expect(service.decryptJson(combined, key)).rejects.toThrow();
    });

    it('should maintain type safety with TypeScript generics', async () => {
      interface User {
        id: number;
        name: string;
        active: boolean;
      }

      const data: User = { id: 1, name: 'Alice', active: true };
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(data, key);
      const decrypted = await service.decryptJson<User>(encrypted, key);

      expect(decrypted.id).toBe(1);
      expect(decrypted.name).toBe('Alice');
      expect(decrypted.active).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid key inputs', async () => {
      await expect(
        service.encrypt(testData, null as any, false, ECIES),
      ).rejects.toThrow();
    });

    it('should handle invalid IV length', async () => {
      const { encrypted } = await service.encrypt(
        testData,
        key256,
        false,
        ECIES,
      );
      const invalidIv = new Uint8Array(10); // Wrong length

      await expect(
        service.decrypt(invalidIv, encrypted, key256, false, ECIES),
      ).rejects.toThrow();
    });

    it('should handle invalid tag length', async () => {
      const { encrypted, iv } = await service.encrypt(
        testData,
        key256,
        true,
        ECIES,
      );
      const invalidTag = new Uint8Array(10); // Wrong length
      const encryptedWithInvalidTag = service.combineEncryptedDataAndTag(
        encrypted,
        invalidTag,
      );

      await expect(
        service.decrypt(iv, encryptedWithInvalidTag, key256, true, ECIES),
      ).rejects.toThrow();
    });

    it('should handle multiple invalid key sizes', async () => {
      const invalidKeys = [
        new Uint8Array(15), // Too short
        new Uint8Array(17), // Invalid length
        new Uint8Array(23), // Invalid length
        new Uint8Array(31), // Too short for 256-bit
        new Uint8Array(33), // Too long
      ];

      for (const invalidKey of invalidKeys) {
        await expect(
          service.encrypt(testData, invalidKey, false, ECIES),
        ).rejects.toThrow();
      }
    });
  });
});
