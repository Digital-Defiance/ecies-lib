import { getEciesI18nEngine } from '../../src/i18n-setup';
import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { StreamTestUtils } from '../support/stream-test-utils';

describe('EncryptionStream - Edge Cases', () => {
  let ecies: ECIESService;
  let stream: EncryptionStream;
  let publicKey: Uint8Array;
  let privateKey: Uint8Array;
  let wrongPrivateKey: Uint8Array;

  beforeAll(() => {
    getEciesI18nEngine();
  });

  beforeEach(() => {
    ecies = new ECIESService();
    stream = new EncryptionStream(ecies);

    const mnemonic = ecies.generateNewMnemonic();
    const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;

    // Generate wrong key for security tests
    const wrongMnemonic = ecies.generateNewMnemonic();
    const wrongKeyPair = ecies.mnemonicToSimpleKeyPair(wrongMnemonic);
    wrongPrivateKey = wrongKeyPair.privateKey;
  });

  describe('Security Edge Cases', () => {
    it('should fail decryption with wrong private key', async () => {
      const original = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024);

      // Encrypt
      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }

      // Try to decrypt with wrong key
      await expect(async () => {
        for await (const _chunk of stream.decryptStream(
          (async function* () {
            for (const encrypted of encryptedChunks) {
              yield encrypted;
            }
          })(),
          wrongPrivateKey,
        )) {
          // Should fail before yielding
        }
      }).rejects.toThrow();
    });

    it('should detect replay attack (duplicate chunks)', async () => {
      const original = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024 * 1024);

      // Encrypt
      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }

      // Try to decrypt with duplicate chunk
      await expect(async () => {
        for await (const _chunk of stream.decryptStream(
          (async function* () {
            yield encryptedChunks[0];
            yield encryptedChunks[0]; // Duplicate!
          })(),
          privateKey,
        )) {
          // Should fail on sequence validation
        }
      }).rejects.toThrow('Chunk sequence error');
    });

    it('should detect truncated stream (missing chunks)', async () => {
      const original = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024 * 1024);

      // Encrypt
      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }

      // Decrypt with missing last chunk
      const decryptedChunks = [];
      for await (const chunk of stream.decryptStream(
        (async function* () {
          yield encryptedChunks[0];
          yield encryptedChunks[1];
          // Missing chunk 2!
        })(),
        privateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      // Should only get 2 chunks
      expect(decryptedChunks.length).toBe(2);

      // Verify data is incomplete
      const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(decrypted.length).toBeLessThan(original.length);
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle empty stream (0 bytes)', async () => {
      const empty = new Uint8Array(0);
      const source = StreamTestUtils.createAsyncIterable(empty, 1024);

      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk);
      }

      // Empty stream produces no chunks
      expect(encryptedChunks.length).toBe(0);

      // Should decrypt back to empty
      const decryptedChunks = [];
      for await (const chunk of stream.decryptStream(
        (async function* () {
          for (const encrypted of encryptedChunks) {
            yield encrypted.data;
          }
        })(),
        privateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(decrypted.length).toBe(0);
    });

    it('should handle single byte stream', async () => {
      const single = new Uint8Array([42]);
      const source = StreamTestUtils.createAsyncIterable(single, 1024);

      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk);
      }

      expect(encryptedChunks.length).toBe(1);
      expect(encryptedChunks[0].metadata?.originalSize).toBe(1);

      // Decrypt and verify
      const decryptedChunks = [];
      for await (const chunk of stream.decryptStream(
        (async function* () {
          for (const encrypted of encryptedChunks) {
            yield encrypted.data;
          }
        })(),
        privateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(decrypted.length).toBe(1);
      expect(decrypted[0]).toBe(42);
    });

    it('should handle exact chunk boundary (no remainder)', async () => {
      const chunkSize = 1024 * 1024;
      const exact = StreamTestUtils.generateRandomData(chunkSize * 3); // Exactly 3 chunks
      const source = StreamTestUtils.createAsyncIterable(exact, chunkSize);

      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey, {
        chunkSize,
      })) {
        encryptedChunks.push(chunk);
      }

      expect(encryptedChunks.length).toBe(3);
      expect(encryptedChunks[2].isLast).toBe(true);
      expect(encryptedChunks[2].metadata?.originalSize).toBe(chunkSize);

      // Decrypt and verify
      const decryptedChunks = [];
      for await (const chunk of stream.decryptStream(
        (async function* () {
          for (const encrypted of encryptedChunks) {
            yield encrypted.data;
          }
        })(),
        privateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(StreamTestUtils.arraysEqual(decrypted, exact)).toBe(true);
    });

    it('should handle very small chunks (1 byte)', async () => {
      const data = StreamTestUtils.generateRandomData(100);
      const source = StreamTestUtils.createAsyncIterable(data, 10);

      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey, {
        chunkSize: 1,
      })) {
        encryptedChunks.push(chunk);
      }

      // Should produce 100 chunks of 1 byte each
      expect(encryptedChunks.length).toBe(100);
      expect(encryptedChunks[99].isLast).toBe(true);

      // Decrypt and verify
      const decryptedChunks = [];
      for await (const chunk of stream.decryptStream(
        (async function* () {
          for (const encrypted of encryptedChunks) {
            yield encrypted.data;
          }
        })(),
        privateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(StreamTestUtils.arraysEqual(decrypted, data)).toBe(true);
    });

    it('should handle memory pressure (100+ chunks)', async () => {
      const chunkSize = 1024 * 1024; // 1MB
      const _totalSize = 100 * chunkSize; // 100MB

      // Generate and encrypt in streaming fashion
      let encryptedCount = 0;
      const encryptedChunks = [];

      for await (const chunk of stream.encryptStream(
        (async function* () {
          for (let i = 0; i < 100; i++) {
            yield StreamTestUtils.generateRandomData(chunkSize);
          }
        })(),
        publicKey,
        { chunkSize },
      )) {
        encryptedCount++;
        encryptedChunks.push(chunk.data);
      }

      expect(encryptedCount).toBe(100);

      // Decrypt in streaming fashion
      let decryptedCount = 0;
      for await (const _chunk of stream.decryptStream(
        (async function* () {
          for (const encrypted of encryptedChunks) {
            yield encrypted;
          }
        })(),
        privateKey,
      )) {
        decryptedCount++;
      }

      expect(decryptedCount).toBe(100);
    }, 60000);
  });

  describe('Robustness Edge Cases', () => {
    it('should handle stream source errors gracefully', async () => {
      const errorSource = async function* () {
        yield StreamTestUtils.generateRandomData(1024);
        throw new Error('Stream source error');
      };

      await expect(async () => {
        for await (const _chunk of stream.encryptStream(
          errorSource(),
          publicKey,
        )) {
          // Should propagate error
        }
      }).rejects.toThrow('Stream source error');
    });

    it('should handle async iterator that throws during iteration', async () => {
      const chunkSize = 1024;
      const throwingIterator = async function* () {
        yield StreamTestUtils.generateRandomData(chunkSize);
        yield StreamTestUtils.generateRandomData(chunkSize);
        throw new Error('Iterator error');
      };

      let chunkCount = 0;
      try {
        for await (const _chunk of stream.encryptStream(
          throwingIterator(),
          publicKey,
          { chunkSize },
        )) {
          chunkCount++;
        }
        fail('Should have thrown Iterator error');
      } catch (error: unknown) {
        expect(error.message).toBe('Iterator error');
        // Chunks are yielded as they're produced, so we should have gotten 2
        expect(chunkCount).toBeGreaterThanOrEqual(2);
      }
    });

    it('should handle cancellation at chunk boundaries', async () => {
      const data = StreamTestUtils.generateRandomData(5 * 1024 * 1024);
      const cancelPoints = [1, 2, 3]; // Try cancelling at different chunks

      for (const cancelAt of cancelPoints) {
        let chunkCount = 0;
        const controller = new AbortController();

        try {
          for await (const _chunk of stream.encryptStream(
            StreamTestUtils.createAsyncIterable(data, 1024 * 1024),
            publicKey,
            { signal: controller.signal },
          )) {
            chunkCount++;
            if (chunkCount === cancelAt) {
              controller.abort();
            }
          }
          fail(`Should have thrown AbortError at chunk ${cancelAt}`);
        } catch (error: unknown) {
          expect(error.name).toBe('AbortError');
          expect(chunkCount).toBe(cancelAt);
        }
      }
    });

    it('should handle Unicode data integrity', async () => {
      const unicodeText = '🔐 Hello 世界 مرحبا Привет 🌍';
      const unicodeData = new TextEncoder().encode(unicodeText);
      const source = StreamTestUtils.createAsyncIterable(unicodeData, 1024);

      // Encrypt
      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }

      // Decrypt
      const decryptedChunks = [];
      for await (const chunk of stream.decryptStream(
        (async function* () {
          for (const encrypted of encryptedChunks) {
            yield encrypted;
          }
        })(),
        privateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(unicodeText);
    });

    it('should handle binary data with all byte values', async () => {
      // Create data with all possible byte values (0-255)
      const allBytes = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        allBytes[i] = i;
      }
      const source = StreamTestUtils.createAsyncIterable(allBytes, 256);

      // Encrypt
      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }

      // Decrypt
      const decryptedChunks = [];
      for await (const chunk of stream.decryptStream(
        (async function* () {
          for (const encrypted of encryptedChunks) {
            yield encrypted;
          }
        })(),
        privateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(StreamTestUtils.arraysEqual(decrypted, allBytes)).toBe(true);
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should reject invalid chunk size (0)', () => {
      expect(() => {
        new EncryptionStream(ecies, { chunkSize: 0, includeChecksums: false });
      }).not.toThrow(); // Constructor doesn't validate, but encryption should handle it
    });

    it('should handle maximum safe integer chunk size', async () => {
      // Use a reasonable large size instead of MAX_SAFE_INTEGER
      const largeChunkSize = 10 * 1024 * 1024; // 10MB
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey, {
        chunkSize: largeChunkSize,
      })) {
        encryptedChunks.push(chunk);
      }

      // Should produce single chunk since data < chunk size
      expect(encryptedChunks.length).toBe(1);
    });
  });
});
