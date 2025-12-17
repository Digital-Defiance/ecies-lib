import {
  ENCRYPTION_STATE_VERSION,
  IEncryptionState,
} from '../../src/interfaces/encryption-state';
import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { ResumableEncryption } from '../../src/services/resumable-encryption';
import { uint8ArrayToHex } from '../../src/utils';
import { StreamTestUtils } from '../support/stream-test-utils';

describe('ResumableEncryption Security Audit', () => {
  let ecies: ECIESService;
  let stream: EncryptionStream;
  let publicKey: Uint8Array;
  let _privateKey: Uint8Array;

  beforeEach(() => {
    ecies = new ECIESService();
    stream = new EncryptionStream(ecies);
    const mnemonic = ecies.generateNewMnemonic();
    const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  });

  describe('state validation', () => {
    it('should reject state with wrong public key', async () => {
      const wrongKey = ecies.mnemonicToSimpleKeyPair(
        ecies.generateNewMnemonic(),
      ).publicKey;
      const state: IEncryptionState = {
        version: ENCRYPTION_STATE_VERSION,
        chunkIndex: 1,
        bytesProcessed: 1024 * 1024,
        publicKey: uint8ArrayToHex(wrongKey),
        encryptionType: 0,
        chunkSize: 1024 * 1024,
        includeChecksums: false,
        timestamp: Date.now(),
      };

      const resumable = ResumableEncryption.resume(stream, state);
      const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      await expect(async () => {
        for await (const _chunk of resumable.encrypt(source, publicKey)) {
          // Should throw
        }
      }).rejects.toThrow('Public key mismatch');
    });

    it('should reject very old state (>24 hours)', () => {
      const oldState: IEncryptionState = {
        version: ENCRYPTION_STATE_VERSION,
        chunkIndex: 1,
        bytesProcessed: 1024 * 1024,
        publicKey: uint8ArrayToHex(publicKey),
        encryptionType: 0,
        chunkSize: 1024 * 1024,
        includeChecksums: false,
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };

      expect(() => new ResumableEncryption(stream, oldState)).toThrow(
        'State too old',
      );
    });

    it('should validate autoSaveInterval', async () => {
      const resumable = new ResumableEncryption(stream);
      const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      await expect(async () => {
        for await (const _chunk of resumable.encrypt(source, publicKey, {
          autoSaveInterval: -1,
        })) {
          // Process
        }
      }).rejects.toThrow();
    });

    it('should validate zero autoSaveInterval', async () => {
      const resumable = new ResumableEncryption(stream);
      const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      await expect(async () => {
        for await (const _chunk of resumable.encrypt(source, publicKey, {
          autoSaveInterval: 0,
        })) {
          // Process
        }
      }).rejects.toThrow();
    });
  });

  describe('state mutation protection', () => {
    it('should not allow callback to mutate state', async () => {
      const resumable = new ResumableEncryption(stream);
      const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      let _capturedState: IEncryptionState | null = null;
      for await (const _chunk of resumable.encrypt(source, publicKey, {
        autoSaveInterval: 1,
        onStateSaved: (state) => {
          _capturedState = state;
          state.chunkIndex = 999; // Try to mutate
        },
      })) {
        // Process
      }

      const finalState = resumable.saveState();
      expect(finalState.chunkIndex).not.toBe(999);
    });
  });

  describe('chunk skipping correctness', () => {
    it('should document chunk skipping limitation', async () => {
      const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);

      const resumable1 = new ResumableEncryption(stream);
      const source1 = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      const chunks = [];
      for await (const chunk of resumable1.encrypt(source1, publicKey)) {
        chunks.push(chunk);
      }

      const state = resumable1.saveState();
      expect(state.chunkIndex).toBe(3);
    });
  });

  describe('state size limits', () => {
    it('should limit state serialization size', async () => {
      const resumable = new ResumableEncryption(stream);
      const data = StreamTestUtils.generateRandomData(1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      for await (const _chunk of resumable.encrypt(source, publicKey)) {
        // Process
      }

      const state = resumable.saveState();
      const serialized = JSON.stringify(state);

      // State should be small (<1KB)
      expect(serialized.length).toBeLessThan(1024);
    });
  });

  describe('concurrent resumption', () => {
    it('should allow multiple resumptions from same state', () => {
      const state: IEncryptionState = {
        version: ENCRYPTION_STATE_VERSION,
        chunkIndex: 1,
        bytesProcessed: 1024 * 1024,
        publicKey: uint8ArrayToHex(publicKey),
        encryptionType: 0,
        chunkSize: 1024 * 1024,
        includeChecksums: false,
        timestamp: Date.now(),
      };

      const resumable2 = ResumableEncryption.resume(stream, state);
      const resumable3 = ResumableEncryption.resume(stream, state);

      expect(resumable2).toBeDefined();
      expect(resumable3).toBeDefined();
    });
  });

  describe('metadata handling', () => {
    it('should handle missing chunk metadata', async () => {
      const resumable = new ResumableEncryption(stream);
      const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      for await (const _chunk of resumable.encrypt(source, publicKey)) {
        // Process
      }

      const state = resumable.saveState();
      expect(state.bytesProcessed).toBeGreaterThan(0);
    });
  });

  describe('error propagation', () => {
    it('should propagate callback errors', async () => {
      const resumable = new ResumableEncryption(stream);
      const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      await expect(async () => {
        for await (const _chunk of resumable.encrypt(source, publicKey, {
          autoSaveInterval: 1,
          onStateSaved: () => {
            throw new Error('Callback error');
          },
        })) {
          // Process
        }
      }).rejects.toThrow('Callback error');
    });

    it('should handle async callback rejection', async () => {
      const resumable = new ResumableEncryption(stream);
      const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      await expect(async () => {
        for await (const _chunk of resumable.encrypt(source, publicKey, {
          autoSaveInterval: 1,
          onStateSaved: async () => {
            throw new Error('Async callback error');
          },
        })) {
          // Process
        }
      }).rejects.toThrow('Async callback error');
    });
  });
});
