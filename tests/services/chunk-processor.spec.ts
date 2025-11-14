import { ChunkProcessor } from '../../src/services/chunk-processor';
import { ECIESService } from '../../src/services/ecies/service';
import { CHUNK_CONSTANTS } from '../../src/interfaces/encrypted-chunk';
import { StreamTestUtils } from '../support/stream-test-utils';
import { getEciesI18nEngine } from '../../src/i18n-setup';

describe('ChunkProcessor', () => {
  let ecies: ECIESService;
  let processor: ChunkProcessor;
  let publicKey: Uint8Array;
  let privateKey: Uint8Array;

  beforeAll(() => {
    getEciesI18nEngine();
  });

  beforeEach(() => {
    ecies = new ECIESService();
    processor = new ChunkProcessor(ecies);
    const mnemonic = ecies.generateNewMnemonic();
    const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  });

  describe('encryption', () => {
    it('should encrypt chunk with correct header', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const chunk = await processor.encryptChunk(data, publicKey, 0, false, false);

      expect(chunk.index).toBe(0);
      expect(chunk.isLast).toBe(false);
      expect(chunk.data.length).toBeGreaterThan(CHUNK_CONSTANTS.HEADER_SIZE);
      expect(chunk.metadata?.originalSize).toBe(1024);
    });

    it('should handle chunk at max size (1MB)', async () => {
      const data = StreamTestUtils.generateRandomData(1024 * 1024);
      const chunk = await processor.encryptChunk(data, publicKey, 0, false, false);

      expect(chunk.metadata?.originalSize).toBe(1024 * 1024);
      expect(chunk.data.length).toBeGreaterThan(1024 * 1024);
    });

    it('should handle chunk smaller than max size', async () => {
      const data = StreamTestUtils.generateRandomData(512);
      const chunk = await processor.encryptChunk(data, publicKey, 0, false, false);

      expect(chunk.metadata?.originalSize).toBe(512);
    });

    it('should include chunk index in header', async () => {
      const data = StreamTestUtils.generateRandomData(100);
      const chunk = await processor.encryptChunk(data, publicKey, 42, false, false);

      expect(chunk.index).toBe(42);
    });

    it('should mark last chunk with isLast flag', async () => {
      const data = StreamTestUtils.generateRandomData(100);
      const chunk = await processor.encryptChunk(data, publicKey, 0, true, false);

      expect(chunk.isLast).toBe(true);
      
      // Verify flag in header
      const view = new DataView(chunk.data.buffer, chunk.data.byteOffset);
      const flags = view.getUint16(18, false);
      expect(flags & CHUNK_CONSTANTS.FLAG_IS_LAST).toBeTruthy();
    });

    it('should include checksum when requested', async () => {
      const data = StreamTestUtils.generateRandomData(100);
      const chunk = await processor.encryptChunk(data, publicKey, 0, false, true);

      expect(chunk.metadata?.checksum).toBeDefined();
      expect(chunk.metadata?.checksum?.length).toBe(CHUNK_CONSTANTS.CHECKSUM_SIZE);
      
      // Verify checksum is appended to data
      expect(chunk.data.length).toBe(
        CHUNK_CONSTANTS.HEADER_SIZE +
        chunk.metadata!.encryptedSize +
        CHUNK_CONSTANTS.CHECKSUM_SIZE
      );
    });
  });

  describe('decryption', () => {
    it('should decrypt chunk and verify header', async () => {
      const original = StreamTestUtils.generateRandomData(1024);
      const encrypted = await processor.encryptChunk(original, publicKey, 5, false, false);
      
      const { data, header } = await processor.decryptChunk(encrypted.data, privateKey);

      expect(StreamTestUtils.arraysEqual(data, original)).toBe(true);
      expect(header.index).toBe(5);
      expect(header.originalSize).toBe(1024);
    });

    it('should validate chunk index sequence', async () => {
      const data1 = StreamTestUtils.generateRandomData(100);
      const data2 = StreamTestUtils.generateRandomData(100);
      
      const chunk1 = await processor.encryptChunk(data1, publicKey, 0, false, false);
      const chunk2 = await processor.encryptChunk(data2, publicKey, 1, false, false);

      const { header: header1 } = await processor.decryptChunk(chunk1.data, privateKey);
      const { header: header2 } = await processor.decryptChunk(chunk2.data, privateKey);

      expect(header1.index).toBe(0);
      expect(header2.index).toBe(1);
    });

    it('should detect corrupted chunk header', async () => {
      const original = StreamTestUtils.generateRandomData(100);
      const encrypted = await processor.encryptChunk(original, publicKey, 0, false, false);
      
      // Corrupt magic bytes
      encrypted.data[0] = 0xFF;

      await expect(
        processor.decryptChunk(encrypted.data, privateKey)
      ).rejects.toThrow('Invalid chunk magic bytes');
    });

    it('should detect tampered encrypted data', async () => {
      const original = StreamTestUtils.generateRandomData(100);
      const encrypted = await processor.encryptChunk(original, publicKey, 0, false, false);
      
      // Tamper with encrypted data (after header)
      encrypted.data[CHUNK_CONSTANTS.HEADER_SIZE + 10] ^= 0xFF;

      await expect(
        processor.decryptChunk(encrypted.data, privateKey)
      ).rejects.toThrow();
    });

    it('should handle last chunk correctly', async () => {
      const original = StreamTestUtils.generateRandomData(100);
      const encrypted = await processor.encryptChunk(original, publicKey, 0, true, false);
      
      const { data, header } = await processor.decryptChunk(encrypted.data, privateKey);

      expect(StreamTestUtils.arraysEqual(data, original)).toBe(true);
      expect(header.flags & CHUNK_CONSTANTS.FLAG_IS_LAST).toBeTruthy();
    });

    it('should verify checksum when present', async () => {
      const original = StreamTestUtils.generateRandomData(100);
      const encrypted = await processor.encryptChunk(original, publicKey, 0, false, true);
      
      const { data } = await processor.decryptChunk(encrypted.data, privateKey);

      expect(StreamTestUtils.arraysEqual(data, original)).toBe(true);
    });

    it('should throw on checksum mismatch', async () => {
      const original = StreamTestUtils.generateRandomData(100);
      const encrypted = await processor.encryptChunk(original, publicKey, 0, false, true);
      
      // Corrupt checksum
      encrypted.data[encrypted.data.length - 1] ^= 0xFF;

      await expect(
        processor.decryptChunk(encrypted.data, privateKey)
      ).rejects.toThrow('Chunk checksum mismatch');
    });

    it('should throw on invalid chunk format', async () => {
      const invalidData = StreamTestUtils.generateRandomData(10); // Too short

      await expect(
        processor.decryptChunk(invalidData, privateKey)
      ).rejects.toThrow('Data too short for chunk header');
    });
  });
});
