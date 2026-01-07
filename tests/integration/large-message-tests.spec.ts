/**
 * Large Message and Streaming Edge Case Tests
 * Addresses: Missing large message testing (>100MB), memory pressure scenarios
 */

import { ECIES } from '../../src/constants';
import { IECIESConfig } from '../../src/interfaces';
import { EciesCryptoCore } from '../../src/services/ecies/crypto-core';
import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';

const mockConfig: IECIESConfig = {
  curveName: ECIES.CURVE_NAME,
  primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
  mnemonicStrength: ECIES.MNEMONIC_STRENGTH,
  symmetricAlgorithm: ECIES.SYMMETRIC.ALGORITHM,
  symmetricKeyBits: ECIES.SYMMETRIC.KEY_BITS,
  symmetricKeyMode: ECIES.SYMMETRIC.MODE,
};

describe('Large Message and Streaming Tests', () => {
  let eciesService: ECIESService;
  let cryptoCore: EciesCryptoCore;
  let encryptionStream: EncryptionStream;

  beforeAll(() => {
    eciesService = new ECIESService(mockConfig);
    cryptoCore = new EciesCryptoCore(mockConfig);
    encryptionStream = new EncryptionStream(eciesService);
  });

  describe('Large Message Encryption', () => {
    it('should handle 10MB message encryption/decryption', async () => {
      const messageSize = 10 * 1024 * 1024; // 10MB
      const message = new Uint8Array(messageSize);
      
      // Fill with pattern to ensure compression doesn't affect test
      for (let i = 0; i < messageSize; i++) {
        message[i] = (i % 256) ^ ((i >> 8) % 256);
      }

      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const startTime = Date.now();
      
      const encrypted = await eciesService.encryptSimpleOrSingle(
        true,
        keyPair.publicKey,
        message,
      );
      
      const encryptTime = Date.now() - startTime;
      console.log(`10MB encryption time: ${encryptTime}ms`);
      
      const decryptStart = Date.now();
      const decrypted = await eciesService.decryptSimpleOrSingleWithHeader(
        true,
        keyPair.privateKey,
        encrypted,
      );
      
      const decryptTime = Date.now() - decryptStart;
      console.log(`10MB decryption time: ${decryptTime}ms`);
      
      expect(decrypted).toEqual(message);
      
      // Performance should be reasonable (less than 30 seconds for 10MB)
      expect(encryptTime + decryptTime).toBeLessThan(30000);
    }, 60000);

    it('should handle 100MB message encryption/decryption', async () => {
      const messageSize = 100 * 1024 * 1024; // 100MB
      const message = new Uint8Array(messageSize);
      
      // Fill with pseudo-random pattern
      let seed = 12345;
      for (let i = 0; i < messageSize; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        message[i] = seed % 256;
      }

      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const initialMemory = process.memoryUsage().heapUsed;
      
      const startTime = Date.now();
      const encrypted = await eciesService.encryptSimpleOrSingle(
        true,
        keyPair.publicKey,
        message,
      );
      
      const encryptTime = Date.now() - startTime;
      const afterEncryptMemory = process.memoryUsage().heapUsed;
      
      const decryptStart = Date.now();
      const decrypted = await eciesService.decryptSimpleOrSingleWithHeader(
        true,
        keyPair.privateKey,
        encrypted,
      );
      
      const decryptTime = Date.now() - decryptStart;
      const finalMemory = process.memoryUsage().heapUsed;
      
      console.log(`100MB encryption time: ${encryptTime}ms`);
      console.log(`100MB decryption time: ${decryptTime}ms`);
      console.log(`Memory increase: ${Math.round((finalMemory - initialMemory) / 1024 / 1024)}MB`);
      
      expect(decrypted).toEqual(message);
      
      // Memory usage should not exceed 500MB for 100MB message
      expect(finalMemory - initialMemory).toBeLessThan(500 * 1024 * 1024);
    }, 120000); // 2 minute timeout

    it('should handle boundary message sizes', async () => {
      const sizes = [
        255,           // UInt8 boundary
        256,           // UInt8 + 1
        65535,         // UInt16 boundary
        65536,         // UInt16 + 1
        1024 * 1024,   // 1MB
        16 * 1024 * 1024, // 16MB
      ];

      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      for (const size of sizes) {
        const message = new Uint8Array(size);
        // Fill with size-dependent pattern
        for (let i = 0; i < size; i++) {
          message[i] = (i + size) % 256;
        }

        const encrypted = await eciesService.encryptSimpleOrSingle(
          true,
          keyPair.publicKey,
          message,
        );

        const decrypted = await eciesService.decryptSimpleOrSingleWithHeader(
          true,
          keyPair.privateKey,
          encrypted,
        );

        expect(decrypted).toEqual(message);
        console.log(`Size ${size} bytes: OK`);
      }
    }, 90000);
  });

  describe('Streaming Large Data', () => {
    it('should stream encrypt/decrypt 50MB data', async () => {
      const totalSize = 50 * 1024 * 1024; // 50MB
      const chunkSize = 1024 * 1024; // 1MB chunks
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      // Create streaming source
      async function* generateData() {
        let offset = 0;
        while (offset < totalSize) {
          const currentChunkSize = Math.min(chunkSize, totalSize - offset);
          const chunk = new Uint8Array(currentChunkSize);
          
          // Fill with pattern based on offset
          for (let i = 0; i < currentChunkSize; i++) {
            chunk[i] = ((offset + i) % 256) ^ ((offset + i) >> 8) % 256;
          }
          
          offset += currentChunkSize;
          yield chunk;
        }
      }

      const encryptedChunks: Uint8Array[] = [];
      const startTime = Date.now();

      // Encrypt stream
      for await (const chunk of encryptionStream.encryptStream(
        generateData(),
        keyPair.publicKey,
        { chunkSize: chunkSize }
      )) {
        encryptedChunks.push(chunk.data);
      }

      const encryptTime = Date.now() - startTime;
      console.log(`50MB stream encryption time: ${encryptTime}ms`);

      // Decrypt stream
      async function* encryptedSource() {
        for (const chunk of encryptedChunks) {
          yield chunk;
        }
      }

      const decryptedChunks: Uint8Array[] = [];
      const decryptStart = Date.now();

      for await (const chunk of encryptionStream.decryptStream(
        encryptedSource(),
        keyPair.privateKey
      )) {
        decryptedChunks.push(chunk);
      }

      const decryptTime = Date.now() - decryptStart;
      console.log(`50MB stream decryption time: ${decryptTime}ms`);

      // Verify data integrity
      const decryptedData = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of decryptedChunks) {
        decryptedData.set(chunk, offset);
        offset += chunk.length;
      }

      // Verify against original pattern
      for (let i = 0; i < totalSize; i++) {
        const expected = (i % 256) ^ ((i >> 8) % 256);
        expect(decryptedData[i]).toBe(expected);
      }

      expect(offset).toBe(totalSize);
    }, 180000); // 3 minute timeout

    it('should handle streaming with variable chunk sizes', async () => {
      const chunkSizes = [1024, 4096, 16384, 65536, 1024 * 1024]; // 1KB to 1MB
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      for (const chunkSize of chunkSizes) {
        const totalSize = chunkSize * 10; // 10 chunks
        const originalData = new Uint8Array(totalSize);
        
        // Fill with chunk-size dependent pattern
        for (let i = 0; i < totalSize; i++) {
          originalData[i] = (i + chunkSize) % 256;
        }

        // Create source
        async function* dataSource() {
          let offset = 0;
          while (offset < totalSize) {
            const currentSize = Math.min(chunkSize, totalSize - offset);
            yield originalData.slice(offset, offset + currentSize);
            offset += currentSize;
          }
        }

        // Encrypt
        const encryptedChunks: Uint8Array[] = [];
        for await (const chunk of encryptionStream.encryptStream(
          dataSource(),
          keyPair.publicKey,
          { chunkSize }
        )) {
          encryptedChunks.push(chunk.data);
        }

        // Decrypt
        async function* encryptedSource() {
          for (const chunk of encryptedChunks) {
            yield chunk;
          }
        }

        const decryptedChunks: Uint8Array[] = [];
        for await (const chunk of encryptionStream.decryptStream(
          encryptedSource(),
          keyPair.privateKey
        )) {
          decryptedChunks.push(chunk);
        }

        // Reconstruct and verify
        const decryptedData = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of decryptedChunks) {
          decryptedData.set(chunk, offset);
          offset += chunk.length;
        }

        expect(decryptedData).toEqual(originalData);
        console.log(`Chunk size ${chunkSize}: OK`);
      }
    }, 60000);
  });

  describe('Memory Efficiency Tests', () => {
    it('should maintain constant memory usage during streaming', async () => {
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const chunkSize = 1024 * 1024; // 1MB chunks
      const numChunks = 20; // 20MB total
      
      const memoryReadings: number[] = [];

      async function* dataSource() {
        for (let i = 0; i < numChunks; i++) {
          const chunk = new Uint8Array(chunkSize);
          chunk.fill(i % 256);
          
          // Record memory usage
          memoryReadings.push(process.memoryUsage().heapUsed);
          
          yield chunk;
        }
      }

      const encryptedChunks: Uint8Array[] = [];
      
      for await (const chunk of encryptionStream.encryptStream(
        dataSource(),
        keyPair.publicKey,
        { chunkSize }
      )) {
        encryptedChunks.push(chunk.data);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Memory usage should not grow linearly with data size
      const initialMemory = memoryReadings[0];
      const finalMemory = memoryReadings[memoryReadings.length - 1];
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be less than 50MB for 20MB of data
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memory increase during streaming: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    }, 60000);

    it('should handle memory pressure gracefully', async () => {
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      
      // Create a large message that might cause memory pressure
      const messageSize = 200 * 1024 * 1024; // 200MB
      
      // Use streaming to avoid loading entire message into memory
      async function* largeDataSource() {
        const chunkSize = 1024 * 1024; // 1MB chunks
        let offset = 0;
        
        while (offset < messageSize) {
          const currentSize = Math.min(chunkSize, messageSize - offset);
          const chunk = new Uint8Array(currentSize);
          
          // Fill with pattern
          for (let i = 0; i < currentSize; i++) {
            chunk[i] = ((offset + i) % 256) ^ (((offset + i) >> 16) % 256);
          }
          
          offset += currentSize;
          yield chunk;
        }
      }

      const initialMemory = process.memoryUsage().heapUsed;
      let maxMemory = initialMemory;
      let chunkCount = 0;

      // Process in streaming fashion
      for await (const chunk of encryptionStream.encryptStream(
        largeDataSource(),
        keyPair.publicKey,
        { chunkSize: 1024 * 1024 }
      )) {
        chunkCount++;
        
        const currentMemory = process.memoryUsage().heapUsed;
        maxMemory = Math.max(maxMemory, currentMemory);
        
        // Periodically force garbage collection
        if (chunkCount % 10 === 0 && global.gc) {
          global.gc();
        }
        
        // Don't store all chunks to avoid memory buildup
        if (chunkCount > 10) {
          break; // Just test first 10MB worth
        }
      }

      const memoryIncrease = maxMemory - initialMemory;
      console.log(`Max memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    }, 120000);
  });

  describe('Error Handling with Large Data', () => {
    it('should handle corruption in large encrypted messages', async () => {
      const messageSize = 5 * 1024 * 1024; // 5MB
      const message = new Uint8Array(messageSize);
      message.fill(0xAA);

      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const encrypted = await eciesService.encryptSimpleOrSingle(
        true,
        keyPair.publicKey,
        message,
      );

      // Corrupt different parts of the encrypted message
      const corruptionTests = [
        { position: 10, description: 'header corruption' },
        { position: encrypted.length / 2, description: 'middle corruption' },
        { position: encrypted.length - 10, description: 'end corruption' },
      ];

      for (const test of corruptionTests) {
        const corruptedMessage = new Uint8Array(encrypted);
        corruptedMessage[Math.floor(test.position)] ^= 0xFF;

        await expect(
          eciesService.decryptSimpleOrSingleWithHeader(
            true,
            keyPair.privateKey,
            corruptedMessage,
          )
        ).rejects.toThrow();
      }
    });

    it('should handle streaming interruption gracefully', async () => {
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      
      async function* interruptedSource() {
        for (let i = 0; i < 5; i++) {
          const chunk = new Uint8Array(1024 * 1024);
          chunk.fill(i);
          yield chunk;
        }
        throw new Error('Simulated network interruption');
      }

      await expect(async () => {
        const chunks: Uint8Array[] = [];
        for await (const chunk of encryptionStream.encryptStream(
          interruptedSource(),
          keyPair.publicKey
        )) {
          chunks.push(chunk.data);
        }
      }).rejects.toThrow('Simulated network interruption');
    });
  });
});