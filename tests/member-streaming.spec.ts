import { EmailString } from '../src/email-string';
import { MemberType } from '../src/enumerations/member-type';
import { getEciesI18nEngine } from '../src/i18n-setup';
import type { IStreamProgress } from '../src/interfaces/stream-progress';
import { Member } from '../src/member';
import { ECIESService } from '../src/services/ecies/service';
import { StreamTestUtils } from './support/stream-test-utils';

describe('Member - Streaming Methods', () => {
  let ecies: ECIESService;
  let member: Member;
  let _mnemonic: string;

  beforeAll(() => {
    getEciesI18nEngine();
  });

  beforeEach(() => {
    ecies = new ECIESService();
    const result = Member.newMember(
      ecies,
      MemberType.User,
      'Test User',
      new EmailString('test@example.com'),
    );
    member = result.member;
    mnemonic = result.mnemonic;
  });

  describe('encryptDataStream', () => {
    it('should encrypt data stream', async () => {
      const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      const encrypted = [];
      for await (const chunk of member.encryptDataStream(source)) {
        encrypted.push(chunk);
      }

      expect(encrypted.length).toBeGreaterThan(0);
      expect(encrypted[0].data.length).toBeGreaterThan(0);
    });

    it('should support progress callbacks', async () => {
      const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

      const progressUpdates: IStreamProgress[] = [];
      const encrypted = [];

      for await (const chunk of member.encryptDataStream(source, {
        onProgress: (progress) => progressUpdates.push({ ...progress }),
      })) {
        encrypted.push(chunk);
      }

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].bytesProcessed).toBeGreaterThan(0);
      expect(progressUpdates[0].chunksProcessed).toBeGreaterThan(0);
    });

    it('should support cancellation', async () => {
      const data = StreamTestUtils.generateRandomData(10 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);
      const controller = new AbortController();

      let chunkCount = 0;
      try {
        for await (const _chunk of member.encryptDataStream(source, {
          signal: controller.signal,
        })) {
          chunkCount++;
          if (chunkCount === 2) {
            controller.abort();
          }
        }
        fail('Should have thrown AbortError');
      } catch (error: unknown) {
        expect(error.name).toBe('AbortError');
        expect(chunkCount).toBe(2);
      }
    });

    it('should encrypt for recipient public key', async () => {
      const recipient = Member.newMember(
        ecies,
        MemberType.User,
        'Recipient',
        new EmailString('recipient@example.com'),
      );

      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      const encrypted = [];
      for await (const chunk of member.encryptDataStream(source, {
        recipientPublicKey: recipient.member.publicKey,
      })) {
        encrypted.push(chunk);
      }

      expect(encrypted.length).toBe(1);

      // Recipient should be able to decrypt
      const decrypted = [];
      for await (const chunk of recipient.member.decryptDataStream(
        StreamTestUtils.createAsyncIterable(
          StreamTestUtils.concatenateChunks(encrypted.map((c) => c.data)),
          encrypted[0].data.length,
        ),
      )) {
        decrypted.push(chunk);
      }

      const result = StreamTestUtils.concatenateChunks(decrypted);
      expect(StreamTestUtils.arraysEqual(result, data)).toBe(true);
    });

    it('should throw if no private key and no recipient', async () => {
      member.unloadPrivateKey();

      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      await expect(async () => {
        for await (const _chunk of member.encryptDataStream(source)) {
          // Should throw
        }
      }).rejects.toThrow();
    });
  });

  describe('decryptDataStream', () => {
    it('should decrypt data stream', async () => {
      const original = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024 * 1024);

      // Encrypt
      const encrypted = [];
      for await (const chunk of member.encryptDataStream(source)) {
        encrypted.push(chunk);
      }

      // Decrypt
      const decrypted = [];
      for await (const chunk of member.decryptDataStream(
        StreamTestUtils.createAsyncIterable(
          StreamTestUtils.concatenateChunks(encrypted.map((c) => c.data)),
          encrypted[0].data.length,
        ),
      )) {
        decrypted.push(chunk);
      }

      const result = StreamTestUtils.concatenateChunks(decrypted);
      expect(StreamTestUtils.arraysEqual(result, original)).toBe(true);
    });

    it('should support progress callbacks', async () => {
      const original = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024 * 1024);

      // Encrypt
      const encrypted = [];
      for await (const chunk of member.encryptDataStream(source)) {
        encrypted.push(chunk);
      }

      // Decrypt with progress
      const progressUpdates: IStreamProgress[] = [];
      const decrypted = [];

      for await (const chunk of member.decryptDataStream(
        StreamTestUtils.createAsyncIterable(
          StreamTestUtils.concatenateChunks(encrypted.map((c) => c.data)),
          encrypted[0].data.length,
        ),
        {
          onProgress: (progress) => progressUpdates.push({ ...progress }),
        },
      )) {
        decrypted.push(chunk);
      }

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].bytesProcessed).toBeGreaterThan(0);
      expect(progressUpdates[0].chunksProcessed).toBeGreaterThan(0);
    });

    it('should support cancellation', async () => {
      const original = StreamTestUtils.generateRandomData(10 * 1024 * 1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024 * 1024);

      // Encrypt
      const encrypted = [];
      for await (const chunk of member.encryptDataStream(source)) {
        encrypted.push(chunk);
      }

      // Decrypt with cancellation
      const controller = new AbortController();
      let chunkCount = 0;

      try {
        for await (const _chunk of member.decryptDataStream(
          (async function* () {
            for (const enc of encrypted) {
              yield enc.data;
            }
          })(),
          { signal: controller.signal },
        )) {
          chunkCount++;
          if (chunkCount === 2) {
            controller.abort();
          }
        }
        fail('Should have thrown AbortError');
      } catch (error: unknown) {
        expect(error.name).toBe('AbortError');
        expect(chunkCount).toBe(2);
      }
    });

    it('should throw if no private key', async () => {
      member.unloadPrivateKey();

      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      await expect(async () => {
        for await (const _chunk of member.decryptDataStream(source)) {
          // Should throw
        }
      }).rejects.toThrow();
    });
  });

  describe('ReadableStream support', () => {
    it('should handle ReadableStream input for encryption', async () => {
      const data = StreamTestUtils.generateRandomData(1024);

      // Create ReadableStream
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        },
      });

      const encrypted = [];
      for await (const chunk of member.encryptDataStream(readableStream)) {
        encrypted.push(chunk);
      }

      expect(encrypted.length).toBe(1);
    });

    it('should handle ReadableStream input for decryption', async () => {
      const original = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(original, 1024);

      // Encrypt
      const encrypted = [];
      for await (const chunk of member.encryptDataStream(source)) {
        encrypted.push(chunk);
      }

      // Create ReadableStream for decryption
      const encryptedData = StreamTestUtils.concatenateChunks(
        encrypted.map((c) => c.data),
      );
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encryptedData);
          controller.close();
        },
      });

      const decrypted = [];
      for await (const chunk of member.decryptDataStream(readableStream)) {
        decrypted.push(chunk);
      }

      const result = StreamTestUtils.concatenateChunks(decrypted);
      expect(StreamTestUtils.arraysEqual(result, original)).toBe(true);
    });
  });
});
