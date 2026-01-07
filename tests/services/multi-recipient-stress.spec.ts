/**
 * Multi-Recipient Stress and Edge Case Tests
 * Addresses: Missing maximum recipient count testing, memory pressure scenarios
 */

import { withConsoleMocks } from '@digitaldefiance/express-suite-test-utils';
import { ECIES, createRuntimeConfiguration } from '../../src/constants';
import { getEciesI18nEngine } from '../../src/i18n-setup';
import { IECIESConfig } from '../../src/interfaces/ecies-config';
import { CustomIdProvider, ObjectIdProvider } from '../../src/lib/id-providers';
import { EciesCryptoCore } from '../../src/services/ecies/crypto-core';
import { ECIESService } from '../../src/services/ecies/service';
import { MultiRecipientProcessor } from '../../src/services/multi-recipient-processor';

describe('Multi-Recipient Stress Tests', () => {
  let eciesService: ECIESService;
  let cryptoCore: EciesCryptoCore;
  let processor: MultiRecipientProcessor;

  beforeAll(() => {
    getEciesI18nEngine();
    const config: IECIESConfig = {
      curveName: ECIES.CURVE_NAME,
      primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
      mnemonicStrength: ECIES.MNEMONIC_STRENGTH,
      symmetricAlgorithm: ECIES.SYMMETRIC.ALGORITHM,
      symmetricKeyBits: ECIES.SYMMETRIC.KEY_BITS,
      symmetricKeyMode: ECIES.SYMMETRIC.MODE,
    };
    
    eciesService = new ECIESService(config);
    cryptoCore = new EciesCryptoCore(config);
    
    const runtimeConfig = createRuntimeConfiguration({
      idProvider: new ObjectIdProvider(),
    });
    processor = new MultiRecipientProcessor(eciesService, runtimeConfig);
  });

  describe('Maximum Recipient Count Testing', () => {
    it('should handle maximum allowed recipients (1000)', async () => {
      const maxRecipients = 1000;
      const recipients = [];
      const message = new Uint8Array([1, 2, 3, 4, 5]);
      
      // Generate recipients
      for (let i = 0; i < maxRecipients; i++) {
        const keyPair = await cryptoCore.generateEphemeralKeyPair();
        const id = new Uint8Array(12);
        // Create unique ID
        const idView = new DataView(id.buffer);
        idView.setUint32(0, Math.floor(Date.now() / 1000)); // Timestamp
        idView.setUint32(4, i); // Counter
        idView.setUint32(8, Math.random() * 0xFFFFFFFF); // Random
        
        recipients.push({
          id,
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
        });
      }

      const symmetricKey = cryptoCore.generatePrivateKey();
      const startTime = Date.now();
      
      const encrypted = await processor.encryptChunk(
        message,
        recipients.map(r => ({ id: r.id, publicKey: r.publicKey })),
        0,
        true,
        symmetricKey,
      );
      
      const encryptTime = Date.now() - startTime;
      console.log(`Encryption time for ${maxRecipients} recipients: ${encryptTime}ms`);
      
      expect(encrypted.recipientCount).toBe(maxRecipients);
      
      // Test decryption for first and last recipients
      const firstDecrypted = await processor.decryptChunk(
        encrypted.data,
        recipients[0].id,
        recipients[0].privateKey,
      );
      expect(firstDecrypted.data).toEqual(message);
      
      const lastDecrypted = await processor.decryptChunk(
        encrypted.data,
        recipients[maxRecipients - 1].id,
        recipients[maxRecipients - 1].privateKey,
      );
      expect(lastDecrypted.data).toEqual(message);
    }, 60000); // 60 second timeout

    it('should reject recipient count exceeding maximum', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      
      // Override max recipients to a smaller number for testing
      const testProcessor = new MultiRecipientProcessor(eciesService, {
        ...config,
        ECIES: {
          ...config.ECIES,
          MULTIPLE: {
            ...config.ECIES.MULTIPLE,
            MAX_RECIPIENTS: 5,
          },
        },
      });

      const recipients = [];
      for (let i = 0; i < 6; i++) { // One more than max
        const keyPair = await cryptoCore.generateEphemeralKeyPair();
        recipients.push({
          id: new Uint8Array(12).fill(i),
          publicKey: keyPair.publicKey,
        });
      }

      const message = new Uint8Array([1, 2, 3]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      await expect(
        testProcessor.encryptChunk(message, recipients, 0, true, symmetricKey)
      ).rejects.toThrow(/Too many recipients/);
    });
  });

  describe('Memory Pressure Testing', () => {
    it('should handle large message with many recipients without memory exhaustion', async () => {
      const recipientCount = 100;
      const messageSize = 1024 * 1024; // 1MB message
      const message = new Uint8Array(messageSize);
      
      // Fill with pattern to ensure it's not optimized away
      for (let i = 0; i < messageSize; i++) {
        message[i] = i % 256;
      }

      const recipients = [];
      for (let i = 0; i < recipientCount; i++) {
        const keyPair = await cryptoCore.generateEphemeralKeyPair();
        recipients.push({
          id: new Uint8Array(12).fill(i),
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
        });
      }

      const initialMemory = process.memoryUsage().heapUsed;
      const symmetricKey = cryptoCore.generatePrivateKey();
      
      const encrypted = await processor.encryptChunk(
        message,
        recipients.map(r => ({ id: r.id, publicKey: r.publicKey })),
        0,
        true,
        symmetricKey,
      );

      const afterEncryptMemory = process.memoryUsage().heapUsed;
      
      // Decrypt a few recipients to ensure it works
      for (let i = 0; i < 3; i++) {
        const decrypted = await processor.decryptChunk(
          encrypted.data,
          recipients[i].id,
          recipients[i].privateKey,
        );
        expect(decrypted.data).toEqual(message);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB for this test)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    }, 30000);

    it('should handle rapid encryption/decryption cycles', async () => {
      const cycles = 50;
      const recipientCount = 10;
      const message = new Uint8Array(1024).fill(0xAA);

      for (let cycle = 0; cycle < cycles; cycle++) {
        const recipients = [];
        for (let i = 0; i < recipientCount; i++) {
          const keyPair = await cryptoCore.generateEphemeralKeyPair();
          recipients.push({
            id: new Uint8Array(12).fill(cycle * recipientCount + i),
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
          });
        }

        const symmetricKey = cryptoCore.generatePrivateKey();
        const encrypted = await processor.encryptChunk(
          message,
          recipients.map(r => ({ id: r.id, publicKey: r.publicKey })),
          0,
          true,
          symmetricKey,
        );

        // Decrypt one recipient per cycle
        const decrypted = await processor.decryptChunk(
          encrypted.data,
          recipients[0].id,
          recipients[0].privateKey,
        );
        expect(decrypted.data).toEqual(message);
      }
    }, 30000);
  });

  describe('Performance Degradation Testing', () => {
    it('should maintain reasonable performance as recipient count increases', async () => {
      const recipientCounts = [10, 50, 100, 200];
      const message = new Uint8Array(1024);
      const performanceResults = [];

      for (const count of recipientCounts) {
        const recipients = [];
        for (let i = 0; i < count; i++) {
          const keyPair = await cryptoCore.generateEphemeralKeyPair();
          recipients.push({
            id: new Uint8Array(12).fill(i),
            publicKey: keyPair.publicKey,
          });
        }

        const symmetricKey = cryptoCore.generatePrivateKey();
        const startTime = process.hrtime.bigint();
        
        await processor.encryptChunk(
          message,
          recipients,
          0,
          true,
          symmetricKey,
        );
        
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
        
        performanceResults.push({ count, duration });
        console.log(`${count} recipients: ${duration.toFixed(2)}ms`);
      }

      // Performance should scale roughly linearly (not exponentially)
      // Check that doubling recipients doesn't more than triple the time
      for (let i = 1; i < performanceResults.length; i++) {
        const prev = performanceResults[i - 1];
        const curr = performanceResults[i];
        const ratio = curr.duration / prev.duration;
        const recipientRatio = curr.count / prev.count;
        
        // Performance ratio should not be more than 3x the recipient ratio
        expect(ratio).toBeLessThan(recipientRatio * 3);
      }
    }, 60000);
  });

  describe('ID Provider Stress Testing', () => {
    it('should handle different ID sizes under stress', async () => {
      const idSizes = [12, 16, 20, 24, 32];
      const recipientCount = 50;
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      for (const idSize of idSizes) {
        const config = createRuntimeConfiguration({
          idProvider: new CustomIdProvider(idSize),
        });
        const testProcessor = new MultiRecipientProcessor(eciesService, config);

        const recipients = [];
        for (let i = 0; i < recipientCount; i++) {
          const keyPair = await cryptoCore.generateEphemeralKeyPair();
          const id = new Uint8Array(idSize);
          // Fill with unique pattern
          for (let j = 0; j < idSize; j++) {
            id[j] = (i * idSize + j) % 256;
          }
          
          recipients.push({
            id,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
          });
        }

        const symmetricKey = cryptoCore.generatePrivateKey();
        const encrypted = await testProcessor.encryptChunk(
          message,
          recipients.map(r => ({ id: r.id, publicKey: r.publicKey })),
          0,
          true,
          symmetricKey,
        );

        // Verify a few recipients can decrypt
        for (let i = 0; i < 3; i++) {
          const decrypted = await testProcessor.decryptChunk(
            encrypted.data,
            recipients[i].id,
            recipients[i].privateKey,
          );
          expect(decrypted.data).toEqual(message);
        }
      }
    }, 45000);
  });

  describe('Error Handling Under Stress', () => {
    it('should handle partial recipient failures gracefully', async () => {
      await withConsoleMocks({ mute: true }, async () => {
        const validRecipients = [];
        const invalidRecipients = [];
        
        // Create valid recipients
        for (let i = 0; i < 5; i++) {
          const keyPair = await cryptoCore.generateEphemeralKeyPair();
          validRecipients.push({
            id: new Uint8Array(12).fill(i),
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
          });
        }

        // Create invalid recipients (malformed public keys)
        for (let i = 0; i < 3; i++) {
          const invalidPublicKey = new Uint8Array(33);
          invalidPublicKey[0] = 0x01; // Invalid prefix
          invalidRecipients.push({
            id: new Uint8Array(12).fill(i + 10),
            publicKey: invalidPublicKey,
          });
        }

        const allRecipients = [...validRecipients, ...invalidRecipients];
        const message = new Uint8Array([1, 2, 3]);
        const symmetricKey = cryptoCore.generatePrivateKey();

        // This should fail due to invalid recipients
        await expect(
          processor.encryptChunk(
            message,
            allRecipients.map(r => ({ id: r.id, publicKey: r.publicKey })),
            0,
            true,
            symmetricKey,
          )
        ).rejects.toThrow();
      });
    });

    it('should handle concurrent encryption attempts', async () => {
      const concurrentCount = 10;
      const recipientCount = 20;
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const encryptionPromises = [];

      for (let i = 0; i < concurrentCount; i++) {
        const promise = (async () => {
          const recipients = [];
          for (let j = 0; j < recipientCount; j++) {
            const keyPair = await cryptoCore.generateEphemeralKeyPair();
            recipients.push({
              id: new Uint8Array(12).fill(i * recipientCount + j),
              publicKey: keyPair.publicKey,
              privateKey: keyPair.privateKey,
            });
          }

          const symmetricKey = cryptoCore.generatePrivateKey();
          const encrypted = await processor.encryptChunk(
            message,
            recipients.map(r => ({ id: r.id, publicKey: r.publicKey })),
            0,
            true,
            symmetricKey,
          );

          // Verify one recipient can decrypt
          const decrypted = await processor.decryptChunk(
            encrypted.data,
            recipients[0].id,
            recipients[0].privateKey,
          );
          
          return decrypted.data;
        })();

        encryptionPromises.push(promise);
      }

      const results = await Promise.all(encryptionPromises);
      
      // All should succeed and return the original message
      for (const result of results) {
        expect(result).toEqual(message);
      }
    }, 30000);
  });
});