import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { ResumableEncryption } from '../../src/services/resumable-encryption';
import { IEncryptionState, ENCRYPTION_STATE_VERSION } from '../../src/interfaces/encryption-state';
import { StreamTestUtils } from '../support/stream-test-utils';
import { uint8ArrayToHex } from '../../src/utils';

describe('Security Fixes', () => {
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

  describe('key validation', () => {
    it('should reject invalid public key (empty)', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      await expect(async () => {
        for await (const chunk of stream.encryptStream(source, new Uint8Array(0))) {
          // Should throw
        }
      }).rejects.toThrow('Invalid public key');
    });

    it('should reject invalid public key (wrong length)', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      await expect(async () => {
        for await (const chunk of stream.encryptStream(source, new Uint8Array(32))) {
          // Should throw
        }
      }).rejects.toThrow('Invalid public key');
    });

    it('should reject invalid private key (empty)', async () => {
      const data = new Uint8Array(100);
      const source = StreamTestUtils.createAsyncIterable(data, 100);

      await expect(async () => {
        for await (const chunk of stream.decryptStream(source, new Uint8Array(0))) {
          // Should throw
        }
      }).rejects.toThrow('Invalid private key');
    });

    it('should reject invalid private key (wrong length)', async () => {
      const data = new Uint8Array(100);
      const source = StreamTestUtils.createAsyncIterable(data, 100);

      await expect(async () => {
        for await (const chunk of stream.decryptStream(source, new Uint8Array(33))) {
          // Should throw
        }
      }).rejects.toThrow('Invalid private key');
    });
  });

  describe('buffer exhaustion protection', () => {
    it('should reject source that exceeds buffer limit', async () => {
      const maxSingleChunk = 100 * 1024 * 1024; // 100MB
      
      // Create source that sends data larger than maxSingleChunk
      const source = (async function* () {
        yield new Uint8Array(maxSingleChunk + 1);
      })();

      await expect(async () => {
        for await (const chunk of stream.encryptStream(source, publicKey)) {
          // Should throw
        }
      }).rejects.toThrow('Buffer overflow');
    });
  });

  describe('state integrity', () => {
    it('should add HMAC to saved state', async () => {
      const resumable = new ResumableEncryption(stream);
      const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      for await (const chunk of resumable.encrypt(source, publicKey)) {
        // Process
      }

      const state = resumable.saveState();
      expect(state.hmac).toBeDefined();
      expect(state.hmac?.length).toBeGreaterThan(0);
    });

    it('should reject tampered state', () => {
      const state: IEncryptionState = {
        version: ENCRYPTION_STATE_VERSION,
        chunkIndex: 1,
        bytesProcessed: 1024 * 1024,
        publicKey: uint8ArrayToHex(publicKey),
        encryptionType: 0,
        chunkSize: 1024 * 1024,
        includeChecksums: false,
        timestamp: Date.now(),
        hmac: 'invalid_hmac',
      };

      expect(() => new ResumableEncryption(stream, state)).toThrow('State integrity check failed');
    });
  });

  describe('parameter validation on resume', () => {
    it('should reject chunk size mismatch', async () => {
      const resumable1 = new ResumableEncryption(stream);
      const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source1 = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      for await (const chunk of resumable1.encrypt(source1, publicKey, { chunkSize: 1024 * 1024 })) {
        // Process
      }

      const state = resumable1.saveState();
      const resumable2 = ResumableEncryption.resume(stream, state);
      const source2 = StreamTestUtils.createAsyncIterable(data, 512 * 1024);

      await expect(async () => {
        for await (const chunk of resumable2.encrypt(source2, publicKey, { chunkSize: 512 * 1024 })) {
          // Should throw
        }
      }).rejects.toThrow('Chunk size mismatch');
    });

    it('should reject includeChecksums mismatch', async () => {
      const resumable1 = new ResumableEncryption(stream);
      const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source1 = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      for await (const chunk of resumable1.encrypt(source1, publicKey, { includeChecksums: false })) {
        // Process
      }

      const state = resumable1.saveState();
      const resumable2 = ResumableEncryption.resume(stream, state);
      const source2 = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      await expect(async () => {
        for await (const chunk of resumable2.encrypt(source2, publicKey, { includeChecksums: true })) {
          // Should throw
        }
      }).rejects.toThrow('includeChecksums mismatch');
    });
  });
});
