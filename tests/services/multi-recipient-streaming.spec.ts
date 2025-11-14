import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { StreamTestUtils } from '../support/stream-test-utils';
import { getEciesI18nEngine } from '../../src/i18n-setup';

describe('Multi-Recipient Streaming', () => {
  let ecies: ECIESService;
  let stream: EncryptionStream;

  beforeAll(() => {
    getEciesI18nEngine();
  });

  beforeEach(() => {
    ecies = new ECIESService();
    stream = new EncryptionStream(ecies);
  });

  describe('basic multi-recipient encryption', () => {
    it('should encrypt for 2 recipients', async () => {
      // Generate keys for 2 recipients
      const recipient1 = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());
      const recipient2 = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());

      const recipients = [
        { id: crypto.getRandomValues(new Uint8Array(32)), publicKey: recipient1.publicKey },
        { id: crypto.getRandomValues(new Uint8Array(32)), publicKey: recipient2.publicKey },
      ];

      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      const encryptedChunks = [];
      for await (const chunk of stream.encryptStreamMultiple(source, recipients)) {
        encryptedChunks.push(chunk);
        expect(chunk.recipientCount).toBe(2);
      }

      expect(encryptedChunks.length).toBeGreaterThan(0);
    });

    it('should allow both recipients to decrypt', async () => {
      const recipient1 = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());
      const recipient2 = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());

      const recipient1Id = crypto.getRandomValues(new Uint8Array(32));
      const recipient2Id = crypto.getRandomValues(new Uint8Array(32));

      const recipients = [
        { id: recipient1Id, publicKey: recipient1.publicKey },
        { id: recipient2Id, publicKey: recipient2.publicKey },
      ];

      const original = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024 * 1024);

      // Encrypt
      const encryptedChunks = [];
      for await (const chunk of stream.encryptStreamMultiple(source, recipients)) {
        encryptedChunks.push(chunk.data);
      }

      // Decrypt with recipient 1
      const decrypted1Chunks = [];
      for await (const chunk of stream.decryptStreamMultiple(
        (async function* () {
          for (const encrypted of encryptedChunks) {
            yield encrypted;
          }
        })(),
        recipient1Id,
        recipient1.privateKey
      )) {
        decrypted1Chunks.push(chunk);
      }

      const decrypted1 = StreamTestUtils.concatenateChunks(decrypted1Chunks);
      expect(StreamTestUtils.arraysEqual(decrypted1, original)).toBe(true);

      // Decrypt with recipient 2
      const decrypted2Chunks = [];
      for await (const chunk of stream.decryptStreamMultiple(
        (async function* () {
          for (const encrypted of encryptedChunks) {
            yield encrypted;
          }
        })(),
        recipient2Id,
        recipient2.privateKey
      )) {
        decrypted2Chunks.push(chunk);
      }

      const decrypted2 = StreamTestUtils.concatenateChunks(decrypted2Chunks);
      expect(StreamTestUtils.arraysEqual(decrypted2, original)).toBe(true);
    });

    it('should support up to 10 recipients', async () => {
      const recipients = [];
      const recipientKeys = [];

      for (let i = 0; i < 10; i++) {
        const keyPair = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());
        const id = crypto.getRandomValues(new Uint8Array(32));
        recipients.push({ id, publicKey: keyPair.publicKey });
        recipientKeys.push({ id, privateKey: keyPair.privateKey });
      }

      const original = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024);

      // Encrypt
      const encryptedChunks = [];
      for await (const chunk of stream.encryptStreamMultiple(source, recipients)) {
        encryptedChunks.push(chunk.data);
        expect(chunk.recipientCount).toBe(10);
      }

      // Verify all recipients can decrypt
      for (const recipient of recipientKeys) {
        const decryptedChunks = [];
        for await (const chunk of stream.decryptStreamMultiple(
          (async function* () {
            for (const encrypted of encryptedChunks) {
              yield encrypted;
            }
          })(),
          recipient.id,
          recipient.privateKey
        )) {
          decryptedChunks.push(chunk);
        }

        const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
        expect(StreamTestUtils.arraysEqual(decrypted, original)).toBe(true);
      }
    });
  });

  describe('validation', () => {
    it('should reject empty recipients', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      await expect(async () => {
        for await (const chunk of stream.encryptStreamMultiple(source, [])) {
          // Should throw
        }
      }).rejects.toThrow('At least one recipient required');
    });

    it('should reject invalid recipient public key', async () => {
      const recipients = [
        { id: crypto.getRandomValues(new Uint8Array(32)), publicKey: new Uint8Array(32) },
      ];

      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      await expect(async () => {
        for await (const chunk of stream.encryptStreamMultiple(source, recipients)) {
          // Should throw
        }
      }).rejects.toThrow('Invalid recipient public key');
    });

    it('should reject invalid recipient ID', async () => {
      const keyPair = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());
      const recipients = [
        { id: new Uint8Array(16), publicKey: keyPair.publicKey }, // Wrong ID size
      ];

      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      await expect(async () => {
        for await (const chunk of stream.encryptStreamMultiple(source, recipients)) {
          // Should throw
        }
      }).rejects.toThrow('Invalid recipient ID');
    });

    it('should reject wrong recipient ID on decrypt', async () => {
      const recipient = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());
      const recipientId = crypto.getRandomValues(new Uint8Array(32));
      const wrongId = crypto.getRandomValues(new Uint8Array(32));

      const recipients = [{ id: recipientId, publicKey: recipient.publicKey }];

      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      // Encrypt
      const encryptedChunks = [];
      for await (const chunk of stream.encryptStreamMultiple(source, recipients)) {
        encryptedChunks.push(chunk.data);
      }

      // Try to decrypt with wrong ID
      await expect(async () => {
        for await (const chunk of stream.decryptStreamMultiple(
          (async function* () {
            for (const encrypted of encryptedChunks) {
              yield encrypted;
            }
          })(),
          wrongId,
          recipient.privateKey
        )) {
          // Should throw
        }
      }).rejects.toThrow('Recipient not found');
    });
  });

  describe('progress tracking', () => {
    it('should report progress during multi-recipient encryption', async () => {
      const recipient = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());
      const recipients = [
        { id: crypto.getRandomValues(new Uint8Array(32)), publicKey: recipient.publicKey },
      ];

      const data = StreamTestUtils.generateRandomData(5 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      let progressCallCount = 0;
      for await (const chunk of stream.encryptStreamMultiple(source, recipients, {
        onProgress: (progress) => {
          progressCallCount++;
          expect(progress.bytesProcessed).toBeGreaterThan(0);
        },
      })) {
        // Process
      }

      expect(progressCallCount).toBeGreaterThan(0);
    });
  });

  describe('cancellation', () => {
    it('should support cancellation during multi-recipient encryption', async () => {
      const recipient = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());
      const recipients = [
        { id: crypto.getRandomValues(new Uint8Array(32)), publicKey: recipient.publicKey },
      ];

      const data = StreamTestUtils.generateRandomData(10 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      const controller = new AbortController();
      let chunkCount = 0;

      try {
        for await (const chunk of stream.encryptStreamMultiple(source, recipients, {
          signal: controller.signal,
        })) {
          chunkCount++;
          if (chunkCount === 3) {
            controller.abort();
          }
        }
        fail('Should have thrown AbortError');
      } catch (error: any) {
        expect(error.name).toBe('AbortError');
        expect(chunkCount).toBe(3);
      }
    });
  });
});
