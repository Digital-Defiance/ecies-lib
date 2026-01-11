import { ECIES } from '../../src/constants';
import { AESGCMService } from '../../src/services/aes-gcm';

describe('AES-GCM E2E Integration Tests', () => {
  let service: AESGCMService;

  beforeEach(() => {
    service = new AESGCMService();
  });

  describe('Real-world encryption scenarios', () => {
    it('should encrypt and decrypt user credentials', async () => {
      const userCredentials = JSON.stringify({
        username: 'testuser@example.com',
        password: 'SecurePassword123!',
        timestamp: Date.now(),
      });
      const data = new TextEncoder().encode(userCredentials);
      const key = crypto.getRandomValues(new Uint8Array(32));

      const { encrypted, iv, tag } = await service.encrypt(
        data,
        key,
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
        key,
        true,
        ECIES,
      );
      const decryptedCredentials = new TextDecoder().decode(decrypted);

      expect(JSON.parse(decryptedCredentials)).toEqual(
        JSON.parse(userCredentials),
      );
    });

    it('should handle file-like data encryption', async () => {
      // Simulate a small file
      const fileContent =
        'This is a test file content with some sensitive information.\n'.repeat(
          100,
        );
      const data = new TextEncoder().encode(fileContent);
      const key = crypto.getRandomValues(new Uint8Array(32));

      const { encrypted, iv, tag } = await service.encrypt(
        data,
        key,
        true,
        ECIES,
      );
      const combined = service.combineIvTagAndEncryptedData(
        iv,
        encrypted,
        tag!,
      );

      // Simulate storage/transmission
      const storedData = new Uint8Array(combined);

      // Extract and decrypt using splitEncryptedData
      const { iv: extractedIv, encryptedDataWithTag } =
        service.splitEncryptedData(storedData, true, ECIES);

      const decrypted = await service.decrypt(
        extractedIv,
        encryptedDataWithTag,
        key,
        true,
        ECIES,
      );
      const decryptedContent = new TextDecoder().decode(decrypted);

      expect(decryptedContent).toBe(fileContent);
    });

    it('should work with binary data', async () => {
      // Create binary data (simulating an image or other binary file)
      const binaryData = new Uint8Array(1000);
      for (let i = 0; i < binaryData.length; i++) {
        binaryData[i] = i % 256;
      }

      const key = crypto.getRandomValues(new Uint8Array(32));

      const { encrypted, iv, tag } = await service.encrypt(
        binaryData,
        key,
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
        key,
        true,
        ECIES,
      );

      expect(decrypted).toEqual(binaryData);
    });
  });

  describe('Multi-user encryption scenarios', () => {
    it('should handle multiple users with different keys', async () => {
      const message = 'Shared secret message';
      const data = new TextEncoder().encode(message);

      const user1Key = crypto.getRandomValues(new Uint8Array(32));
      const user2Key = crypto.getRandomValues(new Uint8Array(32));
      const user3Key = crypto.getRandomValues(new Uint8Array(32));

      // Encrypt for each user
      const user1Encrypted = await service.encrypt(data, user1Key, true, ECIES);
      const user2Encrypted = await service.encrypt(data, user2Key, true, ECIES);
      const user3Encrypted = await service.encrypt(data, user3Key, true, ECIES);

      // Each user can decrypt their own version
      const user1EncryptedWithTag = service.combineEncryptedDataAndTag(
        user1Encrypted.encrypted,
        user1Encrypted.tag!,
      );
      const user2EncryptedWithTag = service.combineEncryptedDataAndTag(
        user2Encrypted.encrypted,
        user2Encrypted.tag!,
      );
      const user3EncryptedWithTag = service.combineEncryptedDataAndTag(
        user3Encrypted.encrypted,
        user3Encrypted.tag!,
      );

      const user1Decrypted = await service.decrypt(
        user1Encrypted.iv,
        user1EncryptedWithTag,
        user1Key,
        true,
        ECIES,
      );
      const user2Decrypted = await service.decrypt(
        user2Encrypted.iv,
        user2EncryptedWithTag,
        user2Key,
        true,
        ECIES,
      );
      const user3Decrypted = await service.decrypt(
        user3Encrypted.iv,
        user3EncryptedWithTag,
        user3Key,
        true,
        ECIES,
      );

      expect(new TextDecoder().decode(user1Decrypted)).toBe(message);
      expect(new TextDecoder().decode(user2Decrypted)).toBe(message);
      expect(new TextDecoder().decode(user3Decrypted)).toBe(message);

      // Users cannot decrypt each other's data
      await expect(
        service.decrypt(
          user1Encrypted.iv,
          user1EncryptedWithTag,
          user2Key,
          true,
        ),
      ).rejects.toThrow();
    });
  });

  describe('Performance and stress tests', () => {
    it('should handle large data efficiently', async () => {
      const largeData = crypto.getRandomValues(new Uint8Array(64 * 1024)); // 64KB
      const key = crypto.getRandomValues(new Uint8Array(32));

      const startTime = performance.now();
      const { encrypted, iv, tag } = await service.encrypt(
        largeData,
        key,
        true,
        ECIES,
      );
      const encryptTime = performance.now() - startTime;

      const encryptedWithTag = service.combineEncryptedDataAndTag(
        encrypted,
        tag!,
      );
      const decryptStartTime = performance.now();
      const decrypted = await service.decrypt(
        iv,
        encryptedWithTag,
        key,
        true,
        ECIES,
      );
      const decryptTime = performance.now() - decryptStartTime;

      expect(decrypted).toEqual(largeData);
      expect(encryptTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(decryptTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent operations', async () => {
      const data = new TextEncoder().encode('Concurrent test data');
      const operations = [];

      for (let i = 0; i < 10; i++) {
        const key = crypto.getRandomValues(new Uint8Array(32));
        operations.push(
          service.encrypt(data, key, true).then((result) => {
            const encryptedWithTag = service.combineEncryptedDataAndTag(
              result.encrypted,
              result.tag!,
            );
            return service.decrypt(
              result.iv,
              encryptedWithTag,
              key,
              true,
              ECIES,
            );
          }),
        );
      }

      const results = await Promise.all(operations);

      results.forEach((result) => {
        expect(result).toEqual(data);
      });
    });
  });

  describe('Data integrity and security tests', () => {
    it('should detect tampering with encrypted data', async () => {
      const sensitiveData = 'Top secret information';
      const data = new TextEncoder().encode(sensitiveData);
      const key = crypto.getRandomValues(new Uint8Array(32));

      const { encrypted, iv, tag } = await service.encrypt(
        data,
        key,
        true,
        ECIES,
      );
      const encryptedWithTag = service.combineEncryptedDataAndTag(
        encrypted,
        tag!,
      );

      // Tamper with encrypted data
      const tamperedEncrypted = new Uint8Array(encryptedWithTag);
      tamperedEncrypted[0] ^= 1; // Flip a bit

      await expect(
        service.decrypt(iv, tamperedEncrypted, key, true, ECIES),
      ).rejects.toThrow();
    });

    it('should detect tampering with authentication tag', async () => {
      const sensitiveData = 'Top secret information';
      const data = new TextEncoder().encode(sensitiveData);
      const key = crypto.getRandomValues(new Uint8Array(32));

      const { encrypted, iv, tag } = await service.encrypt(
        data,
        key,
        true,
        ECIES,
      );

      // Tamper with auth tag
      const tamperedTag = new Uint8Array(tag!);
      tamperedTag[0] ^= 1; // Flip a bit
      const encryptedWithTamperedTag = service.combineEncryptedDataAndTag(
        encrypted,
        tamperedTag,
      );

      await expect(
        service.decrypt(iv, encryptedWithTamperedTag, key, true, ECIES),
      ).rejects.toThrow();
    });

    it('should ensure IV uniqueness across multiple encryptions', async () => {
      const data = new TextEncoder().encode('Test data');
      const key = crypto.getRandomValues(new Uint8Array(32));
      const ivs = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const { iv } = await service.encrypt(data, key, false, ECIES);
        const ivString = Array.from(iv).join(',');

        expect(ivs.has(ivString)).toBe(false); // Should be unique
        ivs.add(ivString);
      }

      expect(ivs.size).toBe(100);
    });
  });

  describe('Cross-platform compatibility tests', () => {
    it('should produce consistent results across multiple runs', async () => {
      const data = new TextEncoder().encode('Consistency test');
      const key = new Uint8Array(32);
      key.fill(1); // Use a fixed key for consistency

      const iv = new Uint8Array(12);
      iv.fill(2); // Use a fixed IV for consistency

      // Mock crypto.getRandomValues to return our fixed IV
      const originalGetRandomValues = crypto.getRandomValues;
      crypto.getRandomValues = jest.fn().mockReturnValue(iv);

      try {
        const result1 = await service.encrypt(data, key, true, ECIES);
        const result2 = await service.encrypt(data, key, true, ECIES);

        // With same key and IV, results should be identical
        expect(result1.encrypted).toEqual(result2.encrypted);
        expect(result1.tag).toEqual(result2.tag);
      } finally {
        crypto.getRandomValues = originalGetRandomValues;
      }
    });
  });

  describe('splitEncryptedData integration tests', () => {
    it('should work with splitEncryptedData in real scenarios', async () => {
      const testMessage = 'This is a test message for splitEncryptedData';
      const data = new TextEncoder().encode(testMessage);
      const key = crypto.getRandomValues(new Uint8Array(32));

      // Encrypt and combine
      const { encrypted, iv, tag } = await service.encrypt(
        data,
        key,
        true,
        ECIES,
      );
      const combined = service.combineIvTagAndEncryptedData(
        iv,
        encrypted,
        tag!,
      );

      // Split and decrypt
      const { iv: splitIv, encryptedDataWithTag } = service.splitEncryptedData(
        combined,
        true,
        ECIES,
      );
      const decrypted = await service.decrypt(
        splitIv,
        encryptedDataWithTag,
        key,
        true,
        ECIES,
      );
      const decryptedMessage = new TextDecoder().decode(decrypted);

      expect(decryptedMessage).toBe(testMessage);
    });

    it('should handle splitEncryptedData without auth tag', async () => {
      const testMessage = 'Test without auth tag';
      const data = new TextEncoder().encode(testMessage);
      const key = crypto.getRandomValues(new Uint8Array(32));

      // Encrypt without auth tag
      const { encrypted, iv } = await service.encrypt(data, key, false);
      const combined = service.combineIvAndEncryptedData(iv, encrypted);

      // Split and decrypt
      const { iv: splitIv, encryptedDataWithTag } = service.splitEncryptedData(
        combined,
        false,
        ECIES,
      );
      const decrypted = await service.decrypt(
        splitIv,
        encryptedDataWithTag,
        key,
        false,
        ECIES,
      );
      const decryptedMessage = new TextDecoder().decode(decrypted);

      expect(decryptedMessage).toBe(testMessage);
    });

    it('should handle splitEncryptedData with large data', async () => {
      const largeData = crypto.getRandomValues(new Uint8Array(32 * 1024)); // 32KB
      const key = crypto.getRandomValues(new Uint8Array(32));

      // Encrypt and combine
      const { encrypted, iv, tag } = await service.encrypt(
        largeData,
        key,
        true,
      );
      const combined = service.combineIvTagAndEncryptedData(
        iv,
        encrypted,
        tag!,
      );

      // Split and decrypt
      const { iv: splitIv, encryptedDataWithTag } = service.splitEncryptedData(
        combined,
        true,
        ECIES,
      );
      const decrypted = await service.decrypt(
        splitIv,
        encryptedDataWithTag,
        key,
        true,
        ECIES,
      );

      expect(decrypted).toEqual(largeData);
    });
  });

  describe('JSON encryption real-world scenarios', () => {
    it('should encrypt and decrypt user credentials as JSON', async () => {
      const credentials = {
        username: 'testuser@example.com',
        password: 'SecurePassword123!',
        timestamp: Date.now(),
        metadata: {
          loginAttempts: 0,
          lastLogin: new Date().toISOString(),
        },
      };
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(credentials, key);
      const decrypted = await service.decryptJson<typeof credentials>(
        encrypted,
        key,
      );

      expect(decrypted).toEqual(credentials);
    });

    it('should encrypt and decrypt API response as JSON', async () => {
      const apiResponse = {
        status: 200,
        data: {
          users: [
            { id: 1, name: 'Alice', role: 'admin' },
            { id: 2, name: 'Bob', role: 'user' },
          ],
          pagination: { page: 1, total: 2, hasMore: false },
        },
        timestamp: Date.now(),
      };
      const key = crypto.getRandomValues(new Uint8Array(32));

      const encrypted = await service.encryptJson(apiResponse, key);
      const decrypted = await service.decryptJson<typeof apiResponse>(
        encrypted,
        key,
      );

      expect(decrypted).toEqual(apiResponse);
    });

    it('should handle JSON encryption in storage simulation', async () => {
      const sessionData = {
        userId: 'user-123',
        token: 'jwt-token-here',
        expiresAt: Date.now() + 3600000,
        permissions: ['read', 'write', 'delete'],
      };
      const key = crypto.getRandomValues(new Uint8Array(32));

      // Simulate storage
      const encrypted = await service.encryptJson(sessionData, key);
      const base64Stored = btoa(String.fromCharCode(...encrypted));

      // Simulate retrieval
      const retrieved = new Uint8Array(
        atob(base64Stored)
          .split('')
          .map((char) => char.charCodeAt(0)),
      );
      const decrypted = await service.decryptJson<typeof sessionData>(
        retrieved,
        key,
      );

      expect(decrypted).toEqual(sessionData);
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle zero-length data', async () => {
      const emptyData = new Uint8Array(0);
      const key = crypto.getRandomValues(new Uint8Array(32));

      const { encrypted, iv, tag } = await service.encrypt(
        emptyData,
        key,
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
        key,
        true,
        ECIES,
      );

      expect(decrypted).toEqual(emptyData);
      expect(decrypted.length).toBe(0);
    });

    it('should handle maximum practical data size', async () => {
      // Test with a reasonably large size (64KB)
      const largeData = crypto.getRandomValues(new Uint8Array(64 * 1024));
      const key = crypto.getRandomValues(new Uint8Array(32));

      const { encrypted, iv, tag } = await service.encrypt(
        largeData,
        key,
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
        key,
        true,
        ECIES,
      );

      expect(decrypted).toEqual(largeData);
    });

    it('should fail gracefully with invalid key lengths', async () => {
      const data = new TextEncoder().encode('Test data');
      const invalidKeys = [
        new Uint8Array(15), // Too short
        new Uint8Array(17), // Invalid length
        new Uint8Array(23), // Invalid length
        new Uint8Array(31), // Too short for 256-bit
        new Uint8Array(33), // Too long
      ];

      for (const invalidKey of invalidKeys) {
        await expect(
          service.encrypt(data, invalidKey, false, ECIES),
        ).rejects.toThrow();
      }
    });
  });

  describe('Real-world usage patterns', () => {
    it('should work in a typical message encryption workflow', async () => {
      // Simulate a complete message encryption/decryption workflow
      const originalMessage = {
        from: 'alice@example.com',
        to: 'bob@example.com',
        subject: 'Confidential Information',
        body: 'This message contains sensitive information that must be encrypted.',
        timestamp: new Date().toISOString(),
        attachments: ['document1.pdf', 'image1.jpg'],
      };

      const messageJson = JSON.stringify(originalMessage);
      const messageData = new TextEncoder().encode(messageJson);
      const encryptionKey = crypto.getRandomValues(new Uint8Array(32));

      // Encrypt the message
      const { encrypted, iv, tag } = await service.encrypt(
        messageData,
        encryptionKey,
        true,
        ECIES,
      );

      // Combine all components for storage/transmission
      const packagedMessage = service.combineIvTagAndEncryptedData(
        iv,
        encrypted,
        tag!,
      );

      // Simulate storage/transmission (convert to base64 and back)
      const base64Message = btoa(String.fromCharCode(...packagedMessage));
      const retrievedPackage = new Uint8Array(
        atob(base64Message)
          .split('')
          .map((char) => char.charCodeAt(0)),
      );

      // Extract components and decrypt using splitEncryptedData
      const { iv: extractedIv, encryptedDataWithTag } =
        service.splitEncryptedData(retrievedPackage, true, ECIES);

      const decryptedData = await service.decrypt(
        extractedIv,
        encryptedDataWithTag,
        encryptionKey,
        true,
        ECIES,
      );
      const decryptedMessage = JSON.parse(
        new TextDecoder().decode(decryptedData),
      );

      expect(decryptedMessage).toEqual(originalMessage);
    });

    it('should support key rotation scenario', async () => {
      const data = new TextEncoder().encode('Data that needs key rotation');
      const oldKey = crypto.getRandomValues(new Uint8Array(32));
      const newKey = crypto.getRandomValues(new Uint8Array(32));

      // Encrypt with old key
      const {
        encrypted: oldEncrypted,
        iv: oldIv,
        tag: oldTag,
      } = await service.encrypt(data, oldKey, true, ECIES);

      // Decrypt with old key
      const oldEncryptedWithTag = service.combineEncryptedDataAndTag(
        oldEncrypted,
        oldTag!,
      );
      const decryptedData = await service.decrypt(
        oldIv,
        oldEncryptedWithTag,
        oldKey,
        true,
        ECIES,
      );

      // Re-encrypt with new key
      const {
        encrypted: newEncrypted,
        iv: newIv,
        tag: newTag,
      } = await service.encrypt(decryptedData, newKey, true, ECIES);

      // Verify we can decrypt with new key
      const newEncryptedWithTag = service.combineEncryptedDataAndTag(
        newEncrypted,
        newTag!,
      );
      const finalDecrypted = await service.decrypt(
        newIv,
        newEncryptedWithTag,
        newKey,
        true,
        ECIES,
      );

      expect(finalDecrypted).toEqual(data);

      // Verify old key no longer works with new encryption
      await expect(
        service.decrypt(newIv, newEncryptedWithTag, oldKey, true, ECIES),
      ).rejects.toThrow();
    });
  });
});
