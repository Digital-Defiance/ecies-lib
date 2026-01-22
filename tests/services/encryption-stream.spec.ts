import { EciesEncryptionTypeEnum } from '../../src/enumerations/ecies-encryption-type';
import { getEciesI18nEngine } from '../../src/i18n-setup';
import { STREAM_HEADER_CONSTANTS } from '../../src/interfaces/stream-header';
import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { StreamTestUtils } from '../support/stream-test-utils';

describe('EncryptionStream', () => {
  let ecies: ECIESService;
  let stream: EncryptionStream;
  let publicKey: Uint8Array;
  let privateKey: Uint8Array;

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
  });

  describe('stream header', () => {
    it('should build stream header with correct magic bytes', () => {
      const header = stream.buildStreamHeader({
        magic: STREAM_HEADER_CONSTANTS.MAGIC,
        version: STREAM_HEADER_CONSTANTS.VERSION,
        encryptionType: EciesEncryptionTypeEnum.WithLength,
        chunkSize: 1024 * 1024,
        totalChunks: 10,
        totalBytes: 10 * 1024 * 1024,
        timestamp: Date.now(),
      });

      expect(header.length).toBe(STREAM_HEADER_CONSTANTS.HEADER_SIZE);
      const view = new DataView(header.buffer);
      expect(view.getUint32(0, false)).toBe(STREAM_HEADER_CONSTANTS.MAGIC);
    });

    it('should parse valid stream header', () => {
      const original = {
        magic: STREAM_HEADER_CONSTANTS.MAGIC,
        version: STREAM_HEADER_CONSTANTS.VERSION,
        encryptionType: EciesEncryptionTypeEnum.WithLength,
        chunkSize: 1024 * 1024,
        totalChunks: 5,
        totalBytes: 5000000,
        timestamp: Date.now(),
      };

      const headerData = stream.buildStreamHeader(original);
      const parsed = stream.parseStreamHeader(headerData);

      expect(parsed.magic).toBe(original.magic);
      expect(parsed.version).toBe(original.version);
      expect(parsed.encryptionType).toBe(original.encryptionType);
      expect(parsed.chunkSize).toBe(original.chunkSize);
      expect(parsed.totalChunks).toBe(original.totalChunks);
      expect(parsed.totalBytes).toBe(original.totalBytes);
    });

    it('should throw on invalid magic bytes', () => {
      const headerData = new Uint8Array(STREAM_HEADER_CONSTANTS.HEADER_SIZE);
      const view = new DataView(headerData.buffer);
      view.setUint32(0, 0xdeadbeef, false); // Invalid magic

      expect(() => stream.parseStreamHeader(headerData)).toThrow(
        'Invalid stream magic bytes',
      );
    });

    it('should throw on unsupported version', () => {
      const headerData = new Uint8Array(STREAM_HEADER_CONSTANTS.HEADER_SIZE);
      const view = new DataView(headerData.buffer);
      view.setUint32(0, STREAM_HEADER_CONSTANTS.MAGIC, false);
      view.setUint16(4, 0x9999, false); // Unsupported version

      expect(() => stream.parseStreamHeader(headerData)).toThrow(
        'Unsupported stream version',
      );
    });

    it('should throw on data too short', () => {
      const shortData = new Uint8Array(10);

      expect(() => stream.parseStreamHeader(shortData)).toThrow(
        'Data too short for stream header',
      );
    });
  });

  describe('encryptStream', () => {
    it('should encrypt single chunk', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      const chunks = await StreamTestUtils.collectChunks(
        (async function* () {
          for await (const chunk of stream.encryptStream(source, publicKey)) {
            yield chunk.data;
          }
        })(),
      );

      expect(chunks.length).toBe(1);
      expect(chunks[0].length).toBeGreaterThan(1024);
    });

    it('should encrypt multiple chunks', async () => {
      const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024); // 3MB
      const source = StreamTestUtils.createAsyncIterable(data, 512 * 1024);

      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey, {
        chunkSize: 1024 * 1024,
      })) {
        encryptedChunks.push(chunk);
      }

      expect(encryptedChunks.length).toBe(3);
      expect(encryptedChunks[0].index).toBe(0);
      expect(encryptedChunks[1].index).toBe(1);
      expect(encryptedChunks[2].index).toBe(2);
      expect(encryptedChunks[2].isLast).toBe(true);
    });

    it('should handle partial last chunk', async () => {
      const data = StreamTestUtils.generateRandomData(2.5 * 1024 * 1024); // 2.5MB
      const source = StreamTestUtils.createAsyncIterable(data, 512 * 1024);

      const encryptedChunks = [];
      for await (const chunk of stream.encryptStream(source, publicKey, {
        chunkSize: 1024 * 1024,
      })) {
        encryptedChunks.push(chunk);
      }

      expect(encryptedChunks.length).toBe(3);
      expect(encryptedChunks[2].isLast).toBe(true);
      expect(encryptedChunks[2].metadata?.originalSize).toBe(0.5 * 1024 * 1024);
    });

    it('should support cancellation', async () => {
      const data = StreamTestUtils.generateRandomData(10 * 1024 * 1024); // 10MB
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);
      const controller = new AbortController();

      let chunkCount = 0;
      try {
        for await (const _chunk of stream.encryptStream(source, publicKey, {
          signal: controller.signal,
        })) {
          chunkCount++;
          if (chunkCount === 2) {
            controller.abort();
          }
        }
        fail('Should have thrown AbortError');
      } catch (error: unknown) {
        expect((error as Error).name).toBe('AbortError');
        expect(chunkCount).toBe(2);
      }
    });
  });

  describe('decryptStream', () => {
    it('should decrypt single chunk', async () => {
      const original = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024);

      // Encrypt
      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }

      // Decrypt
      const decryptedChunks = await StreamTestUtils.collectChunks(
        stream.decryptStream(
          StreamTestUtils.createAsyncIterable(
            StreamTestUtils.concatenateChunks(encryptedChunks),
            encryptedChunks[0].length,
          ),
          privateKey,
        ),
      );

      const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(StreamTestUtils.arraysEqual(decrypted, original)).toBe(true);
    });

    it('should decrypt multiple chunks', async () => {
      const original = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(original, 512 * 1024);

      // Encrypt
      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.encryptStream(source, publicKey, {
        chunkSize: 1024 * 1024,
      })) {
        encryptedChunks.push(chunk.data);
      }

      // Decrypt
      const decryptedChunks: Uint8Array[] = [];
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
      expect(StreamTestUtils.arraysEqual(decrypted, original)).toBe(true);
    });

    it('should validate chunk sequence', async () => {
      const original = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024 * 1024);

      // Encrypt
      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }

      // Try to decrypt in wrong order (swap chunks 0 and 1)
      await expect(async () => {
        const decrypted: Uint8Array[] = [];
        for await (const chunk of stream.decryptStream(
          (async function* () {
            yield encryptedChunks[1]; // Wrong! Should be 0
            yield encryptedChunks[0];
            yield encryptedChunks[2];
          })(),
          privateKey,
        )) {
          decrypted.push(chunk);
        }
      }).rejects.toThrow('Chunk sequence error');
    });

    it('should support cancellation', async () => {
      const original = StreamTestUtils.generateRandomData(10 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024 * 1024);

      // Encrypt
      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }

      // Decrypt with cancellation
      const controller = new AbortController();
      let chunkCount = 0;

      try {
        for await (const _chunk of stream.decryptStream(
          (async function* () {
            for (const encrypted of encryptedChunks) {
              yield encrypted;
            }
          })(),
          privateKey,
          { signal: controller.signal },
        )) {
          chunkCount++;
          if (chunkCount === 2) {
            controller.abort();
          }
        }
        fail('Should have thrown AbortError');
      } catch (error: unknown) {
        expect((error as Error).name).toBe('AbortError');
        expect(chunkCount).toBe(2);
      }
    });
  });
});
