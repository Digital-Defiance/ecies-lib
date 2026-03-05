/**
 * Tests for IMemberECIESService interface contract and its usage
 * across ChunkProcessor, EncryptionStream, and Member.
 *
 * These tests verify that the architectural change from concrete ECIESService
 * to the IMemberECIESService interface works correctly for single-recipient
 * encrypt/decrypt operations, and that multi-recipient operations properly
 * require the full ECIESService.
 */
import { EmailString } from '../../src/email-string';
import { MemberType } from '../../src/enumerations/member-type';
import { getEciesI18nEngine } from '../../src/i18n-setup';
import { IMemberECIESService } from '../../src/interfaces/member-ecies-service';
import { Member } from '../../src/member';
import { ChunkProcessor } from '../../src/services/chunk-processor';
import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { StreamTestUtils } from '../support/stream-test-utils';

describe('IMemberECIESService', () => {
  let ecies: ECIESService;
  let publicKey: Uint8Array;
  let privateKey: Uint8Array;

  beforeAll(() => {
    getEciesI18nEngine();
  });

  beforeEach(() => {
    ecies = new ECIESService();
    const mnemonic = ecies.generateNewMnemonic();
    const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  });

  describe('interface contract', () => {
    it('ECIESService should structurally satisfy IMemberECIESService', () => {
      // This is a compile-time check — if it compiles, the contract is satisfied.
      // We also verify at runtime that the required methods exist.
      const service: IMemberECIESService<Uint8Array> = ecies;

      expect(service.constants).toBeDefined();
      expect(service.constants.idProvider).toBeDefined();
      expect(typeof service.generateNewMnemonic).toBe('function');
      expect(typeof service.walletAndSeedFromMnemonic).toBe('function');
      expect(typeof service.getPublicKey).toBe('function');
      expect(typeof service.signMessage).toBe('function');
      expect(typeof service.verifyMessage).toBe('function');
      expect(typeof service.encryptWithLength).toBe('function');
      expect(typeof service.decryptWithLengthAndHeader).toBe('function');
    });

    it('should work when passed as IMemberECIESService parameter', () => {
      // Simulate what Member constructor does — accept the interface type
      function acceptService(svc: IMemberECIESService<Uint8Array>): boolean {
        return svc.constants !== undefined;
      }

      expect(acceptService(ecies)).toBe(true);
    });
  });

  describe('ChunkProcessor with IMemberECIESService', () => {
    let processor: ChunkProcessor;

    beforeEach(() => {
      // Pass ECIESService as IMemberECIESService — no cast needed
      const service: IMemberECIESService<Uint8Array> = ecies;
      processor = new ChunkProcessor(service);
    });

    it('should encrypt a chunk via the interface', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const chunk = await processor.encryptChunk(
        data,
        publicKey,
        0,
        false,
        false,
      );

      expect(chunk.index).toBe(0);
      expect(chunk.isLast).toBe(false);
      expect(chunk.data.length).toBeGreaterThan(0);
      expect(chunk.metadata?.originalSize).toBe(1024);
    });

    it('should round-trip encrypt/decrypt via the interface', async () => {
      const original = StreamTestUtils.generateRandomData(2048);
      const encrypted = await processor.encryptChunk(
        original,
        publicKey,
        0,
        true,
        false,
      );
      const { data, header } = await processor.decryptChunk(
        encrypted.data,
        privateKey,
      );

      expect(StreamTestUtils.arraysEqual(data, original)).toBe(true);
      expect(header.index).toBe(0);
      expect(header.originalSize).toBe(2048);
    });

    it('should encrypt with checksum via the interface', async () => {
      const data = StreamTestUtils.generateRandomData(512);
      const chunk = await processor.encryptChunk(
        data,
        publicKey,
        3,
        true,
        true,
      );

      expect(chunk.metadata?.checksum).toBeDefined();
      expect(chunk.metadata?.checksum?.length).toBe(32); // SHA-256

      // Verify round-trip with checksum verification
      const { data: decrypted } = await processor.decryptChunk(
        chunk.data,
        privateKey,
      );
      expect(StreamTestUtils.arraysEqual(decrypted, data)).toBe(true);
    });
  });
  describe('EncryptionStream with IMemberECIESService', () => {
    it('should encrypt and decrypt a stream via the interface', async () => {
      // Construct EncryptionStream with IMemberECIESService (no cast)
      const service: IMemberECIESService<Uint8Array> = ecies;
      const stream = new EncryptionStream(service);

      const original = StreamTestUtils.generateRandomData(4096);
      const source = StreamTestUtils.createAsyncIterable(original, 1024);

      // Encrypt
      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }
      expect(encryptedChunks.length).toBeGreaterThan(0);

      // Decrypt — feed each encrypted chunk as a separate iteration
      const decryptedChunks: Uint8Array[] = [];
      const decryptSource =
        StreamTestUtils.createAsyncIterableFromChunks(encryptedChunks);
      for await (const chunk of stream.decryptStream(
        decryptSource,
        privateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      const result = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(StreamTestUtils.arraysEqual(result, original)).toBe(true);
    });

    it('should handle single-chunk data', async () => {
      const service: IMemberECIESService<Uint8Array> = ecies;
      const stream = new EncryptionStream(service);

      const original = StreamTestUtils.generateRandomData(256);
      const source = StreamTestUtils.createAsyncIterable(original, 256);

      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }
      expect(encryptedChunks.length).toBe(1);

      const decryptedChunks: Uint8Array[] = [];
      const decryptSource =
        StreamTestUtils.createAsyncIterableFromChunks(encryptedChunks);
      for await (const chunk of stream.decryptStream(
        decryptSource,
        privateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      const result = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(StreamTestUtils.arraysEqual(result, original)).toBe(true);
    });
  });

  describe('EncryptionStream lazy MultiRecipientProcessor', () => {
    it('should throw when multi-recipient encrypt is called with only IMemberECIESService', async () => {
      // Create a minimal object that satisfies IMemberECIESService but is NOT an ECIESService instance
      const minimalService: IMemberECIESService<Uint8Array> = {
        constants: ecies.constants,
        generateNewMnemonic: ecies.generateNewMnemonic.bind(ecies),
        walletAndSeedFromMnemonic: ecies.walletAndSeedFromMnemonic.bind(ecies),
        getPublicKey: ecies.getPublicKey.bind(ecies),
        signMessage: ecies.signMessage.bind(ecies),
        verifyMessage: ecies.verifyMessage.bind(ecies),
        encryptWithLength: ecies.encryptWithLength.bind(ecies),
        decryptWithLengthAndHeader:
          ecies.decryptWithLengthAndHeader.bind(ecies),
      };

      const stream = new EncryptionStream(minimalService);

      const data = StreamTestUtils.generateRandomData(256);
      const source = StreamTestUtils.createAsyncIterable(data, 256);

      // Multi-recipient encrypt should throw because minimalService is not instanceof ECIESService
      // Use correct MEMBER_ID_LENGTH (12 bytes default) to pass validation and hit the lazy init error
      const fakeRecipient = {
        id: new Uint8Array(ecies.constants.MEMBER_ID_LENGTH),
        publicKey,
      };

      await expect(async () => {
        for await (const _chunk of stream.encryptStreamMultiple(source, [
          fakeRecipient,
        ])) {
          // should not reach here
        }
      }).rejects.toThrow(
        'Multi-recipient streaming requires a full ECIESService instance',
      );
    });

    it('should NOT throw for single-recipient encrypt with only IMemberECIESService', async () => {
      // Same minimal service — single-recipient should work fine
      const minimalService: IMemberECIESService<Uint8Array> = {
        constants: ecies.constants,
        generateNewMnemonic: ecies.generateNewMnemonic.bind(ecies),
        walletAndSeedFromMnemonic: ecies.walletAndSeedFromMnemonic.bind(ecies),
        getPublicKey: ecies.getPublicKey.bind(ecies),
        signMessage: ecies.signMessage.bind(ecies),
        verifyMessage: ecies.verifyMessage.bind(ecies),
        encryptWithLength: ecies.encryptWithLength.bind(ecies),
        decryptWithLengthAndHeader:
          ecies.decryptWithLengthAndHeader.bind(ecies),
      };

      const stream = new EncryptionStream(minimalService);

      const original = StreamTestUtils.generateRandomData(256);
      const source = StreamTestUtils.createAsyncIterable(original, 256);

      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encryptedChunks.push(chunk.data);
      }
      expect(encryptedChunks.length).toBe(1);
    });
  });

  describe('Member streaming via IMemberECIESService', () => {
    let member: Member;

    beforeEach(() => {
      // Member.newMember accepts IMemberECIESService — no cast needed
      const result = Member.newMember(
        ecies,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );
      member = result.member;
    });

    it('should encrypt and decrypt a data stream end-to-end', async () => {
      const original = StreamTestUtils.generateRandomData(4096);
      const source = StreamTestUtils.createAsyncIterable(original, 1024);

      // Encrypt via Member (internally uses EncryptionStream with IMemberECIESService)
      const encryptedChunks: { data: Uint8Array }[] = [];
      for await (const chunk of member.encryptDataStream(source)) {
        encryptedChunks.push(chunk);
      }
      expect(encryptedChunks.length).toBeGreaterThan(0);

      // Decrypt via Member
      const decryptedChunks: Uint8Array[] = [];
      const decryptSource = StreamTestUtils.createAsyncIterableFromChunks(
        encryptedChunks.map((c) => c.data),
      );
      for await (const chunk of member.decryptDataStream(decryptSource)) {
        decryptedChunks.push(chunk);
      }

      const result = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(StreamTestUtils.arraysEqual(result, original)).toBe(true);
    });

    it('should encrypt for a different recipient and decrypt with their key', async () => {
      const recipientResult = Member.newMember(
        ecies,
        MemberType.User,
        'Recipient',
        new EmailString('recipient@example.com'),
      );
      const recipient = recipientResult.member;

      const original = StreamTestUtils.generateRandomData(2048);
      const source = StreamTestUtils.createAsyncIterable(original, 1024);

      // Encrypt for recipient
      const encryptedChunks: { data: Uint8Array }[] = [];
      for await (const chunk of member.encryptDataStream(source, {
        recipientPublicKey: recipient.publicKey,
      })) {
        encryptedChunks.push(chunk);
      }

      // Recipient decrypts
      const decryptedChunks: Uint8Array[] = [];
      const decryptSource = StreamTestUtils.createAsyncIterableFromChunks(
        encryptedChunks.map((c) => c.data),
      );
      for await (const chunk of recipient.decryptDataStream(decryptSource)) {
        decryptedChunks.push(chunk);
      }

      const result = StreamTestUtils.concatenateChunks(decryptedChunks);
      expect(StreamTestUtils.arraysEqual(result, original)).toBe(true);
    });
  });
});
