import { Constants } from '../../../src/constants';
import { EciesCryptoCore } from '../../../src/services/ecies/crypto-core';
import { EciesMultiRecipient } from '../../../src/services/ecies/multi-recipient';
import { ECIESService } from '../../../src/services/ecies/service';
import { MultiRecipientProcessor } from '../../../src/services/multi-recipient-processor';

describe('Security and Architecture Review', () => {
  let cryptoCore: EciesCryptoCore;
  let multiRecipient: EciesMultiRecipient;
  let eciesService: ECIESService;

  beforeEach(() => {
    cryptoCore = new EciesCryptoCore();
    multiRecipient = new EciesMultiRecipient();
    eciesService = new ECIESService();
  });

  describe('EciesCryptoCore', () => {
    it('should handle invalid signature formats in verify gracefully', async () => {
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const message = new Uint8Array([1, 2, 3]);
      const invalidSignature = new Uint8Array([0, 0, 0]); // Too short/invalid DER

      const result = cryptoCore.verify(
        keyPair.publicKey,
        message,
        invalidSignature,
      );
      expect(result).toBe(false);
    });

    it('should derive different keys with different info contexts', () => {
      const sharedSecret = new Uint8Array(32).fill(1);
      const key1 = cryptoCore.deriveSharedKey(
        sharedSecret,
        undefined,
        new TextEncoder().encode('context1'),
      );
      const key2 = cryptoCore.deriveSharedKey(
        sharedSecret,
        undefined,
        new TextEncoder().encode('context2'),
      );

      expect(key1).not.toEqual(key2);
    });
  });

  describe('EciesMultiRecipient Header Integrity (AAD)', () => {
    it('should fail decryption if header (AAD) is tampered with', async () => {
      const recipient = await cryptoCore.generateEphemeralKeyPair();
      const message = new TextEncoder().encode('Secret Message');

      const encrypted = await multiRecipient.encryptMultiple(
        [{ id: new Uint8Array(12).fill(1), publicKey: recipient.publicKey }],
        message,
      );

      // Tamper with the header data that is used for AAD construction
      // We add a fake recipient, which changes the header structure
      // This should cause the AAD check to fail during decryption

      const tamperedInput = {
        ...encrypted,
        recipientIds: [...encrypted.recipientIds, new Uint8Array(12).fill(2)],
        recipientKeys: [...encrypted.recipientKeys, new Uint8Array(64).fill(0)],
        recipientCount: encrypted.recipientCount + 1,
      };

      await expect(
        multiRecipient.decryptMultipleForRecipient(
          tamperedInput,
          new Uint8Array(12).fill(1),
          recipient.privateKey,
        ),
      ).rejects.toThrow();
    });
  });

  describe('MultiRecipientProcessor Security', () => {
    it('should fail if chunk signature is invalid', async () => {
      const sender = await cryptoCore.generateEphemeralKeyPair();
      const recipient = await cryptoCore.generateEphemeralKeyPair();
      const recipientId = new Uint8Array(12).fill(1);
      const symmetricKey = cryptoCore.generatePrivateKey();

      const mockConfig = {
        ...Constants,
        idProvider: {
          byteLength: 12,
          generate: () => new Uint8Array(12),
          validate: () => true,
          serialize: () => '',
          deserialize: () => new Uint8Array(12),
          equals: () => false,
          clone: (id: Uint8Array) => id,
          toBytes: (_id: Uint8Array) => new Uint8Array(12),
          fromBytes: (bytes: Uint8Array) => bytes,
          name: 'Mock',
        },
      } as any;

      const processor = new MultiRecipientProcessor(
        mockConfig,
        mockConfig.ECIES_CONFIG,
        eciesService,
        mockConfig.idProvider,
      );

      const chunkData = new Uint8Array(100).fill(0xaa);

      // Encrypt chunk with signature
      const chunk = await processor.encryptChunk(
        chunkData,
        [{ id: recipientId, publicKey: recipient.publicKey }],
        0,
        true,
        symmetricKey,
        sender.privateKey,
      );

      // Decrypt should succeed with correct sender public key
      const decrypted = await processor.decryptChunk(
        chunk.data,
        recipientId,
        recipient.privateKey,
        sender.publicKey,
      );
      expect(decrypted.data).toEqual(chunkData);

      // Decrypt should fail with wrong sender public key
      const wrongSender = await cryptoCore.generateEphemeralKeyPair();
      await expect(
        processor.decryptChunk(
          chunk.data,
          recipientId,
          recipient.privateKey,
          wrongSender.publicKey,
        ),
      ).rejects.toThrow('Invalid sender signature');
    });

    it('should fail if chunk is too short for signature', async () => {
      // Mock a scenario where decrypted data is < 64 bytes but signature is expected
      const mockConfig = {
        ...Constants,
        idProvider: {
          byteLength: 12,
          generate: () => new Uint8Array(12),
          validate: () => true,
          serialize: () => '',
          deserialize: () => new Uint8Array(12),
          equals: () => false,
          clone: (id: Uint8Array) => id,
          toBytes: (_id: Uint8Array) => new Uint8Array(12),
          fromBytes: (bytes: Uint8Array) => bytes,
          name: 'Mock',
        },
      } as any;

      const processor = new MultiRecipientProcessor(
        mockConfig,
        mockConfig.ECIES_CONFIG,
        eciesService,
        mockConfig.idProvider,
      );
      const recipient = await cryptoCore.generateEphemeralKeyPair();
      const recipientId = new Uint8Array(12).fill(1);
      const sender = await cryptoCore.generateEphemeralKeyPair();

      // Create a valid encrypted chunk but with small data (no signature)
      const symmetricKey = cryptoCore.generatePrivateKey();
      const chunkData = new Uint8Array(10).fill(0xaa); // Small data

      // Encrypt WITHOUT signature
      const chunk = await processor.encryptChunk(
        chunkData,
        [{ id: recipientId, publicKey: recipient.publicKey }],
        0,
        true,
        symmetricKey,
        // No sender private key -> no signature
      );

      // Try to decrypt expecting a signature
      await expect(
        processor.decryptChunk(
          chunk.data,
          recipientId,
          recipient.privateKey,
          sender.publicKey, // Expecting signature
        ),
      ).rejects.toThrow('Decrypted chunk too short to contain signature');
    });
  });

  describe('Header Parsing Edge Cases', () => {
    it('should reject invalid version', () => {
      const header = new Uint8Array(50);
      header[0] = 0xff; // Invalid version
      expect(() => multiRecipient.parseHeader(header)).toThrow(
        /Invalid ECIES version/,
      );
    });

    it('should reject invalid cipher suite', () => {
      const header = new Uint8Array(50);
      header[0] = 0x01;
      header[1] = 0xff; // Invalid suite
      expect(() => multiRecipient.parseHeader(header)).toThrow(
        /Invalid ECIES cipher suite/,
      );
    });

    it('should reject invalid encryption type', () => {
      const header = new Uint8Array(50);
      header[0] = 0x01;
      header[1] = 0x01;
      header[2] = 0xff; // Invalid type
      expect(() => multiRecipient.parseHeader(header)).toThrow(
        /Invalid encryption type/,
      );
    });
  });
});
