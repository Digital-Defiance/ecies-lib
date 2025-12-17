import { IStreamProgress } from '../../src/interfaces/stream-progress';
import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { StreamTestUtils } from '../support/stream-test-utils';

describe('Progress Edge Cases', () => {
  let ecies: ECIESService;
  let stream: EncryptionStream;
  let publicKey: Uint8Array;
  let privateKey: Uint8Array;

  beforeEach(() => {
    ecies = new ECIESService();
    stream = new EncryptionStream(ecies);
    const mnemonic = ecies.generateNewMnemonic();
    const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  });

  describe('callback errors', () => {
    it('should handle callback throwing error', async () => {
      const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      let callCount = 0;
      await expect(async () => {
        for await (const _chunk of stream.encryptStream(source, publicKey, {
          onProgress: () => {
            callCount++;
            if (callCount === 2) {
              throw new Error('Callback error');
            }
          },
        })) {
          // Process chunk
        }
      }).rejects.toThrow('Callback error');
    });

    it('should handle async callback', async () => {
      const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      const progressUpdates: IStreamProgress[] = [];
      for await (const _chunk of stream.encryptStream(source, publicKey, {
        onProgress: async (progress) => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          progressUpdates.push({ ...progress });
        },
      })) {
        // Process chunk
      }

      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('progress with cancellation', () => {
    it('should report progress before cancellation', async () => {
      const data = StreamTestUtils.generateRandomData(10 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);
      const controller = new AbortController();

      const progressUpdates: IStreamProgress[] = [];
      let chunkCount = 0;

      try {
        for await (const _chunk of stream.encryptStream(source, publicKey, {
          signal: controller.signal,
          onProgress: (progress) => {
            progressUpdates.push({ ...progress });
          },
        })) {
          chunkCount++;
          if (chunkCount === 3) {
            controller.abort();
          }
        }
      } catch (error: unknown) {
        expect(error.name).toBe('AbortError');
      }

      expect(progressUpdates.length).toBe(3);
      expect(progressUpdates[2].chunksProcessed).toBe(3);
    });
  });

  describe('empty and small data', () => {
    it('should not call progress for empty stream', async () => {
      const data = new Uint8Array(0);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      let progressCalled = false;
      const chunks: Uint8Array[] = [];
      for await (const _chunk of stream.encryptStream(source, publicKey, {
        onProgress: () => {
          progressCalled = true;
        },
      })) {
        chunks.push(chunk.data);
      }

      expect(chunks.length).toBe(0);
      expect(progressCalled).toBe(false);
    });

    it('should call progress for single byte', async () => {
      const data = new Uint8Array([42]);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      let progressCalled = false;
      for await (const _chunk of stream.encryptStream(source, publicKey, {
        onProgress: () => {
          progressCalled = true;
        },
      })) {
        // Process chunk
      }

      expect(progressCalled).toBe(true);
    });
  });

  describe('throughput accuracy', () => {
    it('should report reasonable throughput', async () => {
      const data = StreamTestUtils.generateRandomData(5 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      const throughputs: number[] = [];
      for await (const _chunk of stream.encryptStream(source, publicKey, {
        onProgress: (progress) => {
          if (progress.throughputBytesPerSec > 0) {
            throughputs.push(progress.throughputBytesPerSec);
          }
        },
      })) {
        // Process chunk
      }

      expect(throughputs.length).toBeGreaterThan(0);
      throughputs.forEach((t) => {
        expect(t).toBeGreaterThan(0);
        expect(t).toBeLessThan(10 * 1024 * 1024 * 1024); // <10GB/s
        expect(isFinite(t)).toBe(true);
      });
    });
  });

  describe('progress consistency', () => {
    it('should have monotonically increasing bytes', async () => {
      const data = StreamTestUtils.generateRandomData(5 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      const bytesProcessed: number[] = [];
      for await (const _chunk of stream.encryptStream(source, publicKey, {
        onProgress: (progress) => {
          bytesProcessed.push(progress.bytesProcessed);
        },
      })) {
        // Process chunk
      }

      for (let i = 1; i < bytesProcessed.length; i++) {
        expect(bytesProcessed[i]).toBeGreaterThan(bytesProcessed[i - 1]);
      }
    });

    it('should have monotonically increasing chunks', async () => {
      const data = StreamTestUtils.generateRandomData(5 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      const chunksProcessed: number[] = [];
      for await (const _chunk of stream.encryptStream(source, publicKey, {
        onProgress: (progress) => {
          chunksProcessed.push(progress.chunksProcessed);
        },
      })) {
        // Process chunk
      }

      for (let i = 1; i < chunksProcessed.length; i++) {
        expect(chunksProcessed[i]).toBe(chunksProcessed[i - 1] + 1);
      }
    });
  });

  describe('decryption progress', () => {
    it('should track decryption progress accurately', async () => {
      const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }

      const progressUpdates: IStreamProgress[] = [];
      const _decryptedChunks = await StreamTestUtils.collectChunks(
        stream.decryptStream(
          (async function* () {
            for (const chunk of encryptedChunks) yield chunk;
          })(),
          privateKey,
          {
            onProgress: (progress) => {
              progressUpdates.push({ ...progress });
            },
          },
        ),
      );

      expect(progressUpdates.length).toBe(3);
      expect(progressUpdates[2].bytesProcessed).toBe(3 * 1024 * 1024);
      expect(progressUpdates[2].chunksProcessed).toBe(3);
    });
  });
});
