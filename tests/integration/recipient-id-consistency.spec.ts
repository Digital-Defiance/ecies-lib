/**
 * Integration tests to ensure recipient ID consistency across all encryption algorithms.
 * These tests are designed to catch discrepancies like the 12 vs 32 byte issue.
 */

import { Constants, createRuntimeConfiguration, ECIES } from '../../src/constants';
import {
  ObjectIdProvider,
  GuidV4Provider,
  Legacy32ByteProvider,
} from '../../src/lib/id-providers';
import { getMultiRecipientConstants } from '../../src/interfaces/multi-recipient-chunk';
import { MultiRecipientProcessor } from '../../src/services/multi-recipient-processor';
import { ECIESService } from '../../src/services/ecies/service';
import { EciesCryptoCore } from '../../src/services/ecies/crypto-core';

describe('Recipient ID Consistency Integration Tests', () => {
  describe('Critical: All constants must align with ID provider', () => {
    it('should enforce ECIES.MULTIPLE.RECIPIENT_ID_SIZE matches idProvider.byteLength', () => {
      // This test ensures the 12 vs 32 discrepancy never happens again
      const config = Constants;

      expect(config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE).toBe(
        config.idProvider.byteLength
      );
      expect(config.MEMBER_ID_LENGTH).toBe(config.idProvider.byteLength);
      expect(config.OBJECT_ID_LENGTH).toBe(12); // Hardcoded reference value
      expect(config.idProvider.byteLength).toBe(12); // Default is ObjectID
    });

    it('should enforce getMultiRecipientConstants matches idProvider', () => {
      const config = Constants;
      const mrConstants = getMultiRecipientConstants(
        config.idProvider.byteLength
      );

      expect(mrConstants.RECIPIENT_ID_SIZE).toBe(config.idProvider.byteLength);
      expect(mrConstants.RECIPIENT_ID_SIZE).toBe(
        config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE
      );
    });

    it('should fail validation if ECIES constant does not match ID provider', () => {
      // This would have caught the 12 vs 32 issue
      expect(() => {
        createRuntimeConfiguration({
          ECIES: {
            ...ECIES,
            MULTIPLE: {
              ...ECIES.MULTIPLE,
              RECIPIENT_ID_SIZE: 999, // Wrong size!
            },
          },
        });
      }).toThrow('Invalid ECIES multiple recipient ID size');
    });

    it('should fail validation if MEMBER_ID_LENGTH does not match ID provider', () => {
      expect(() => {
        createRuntimeConfiguration({
          MEMBER_ID_LENGTH: 999, // Wrong size!
        });
      }).toThrow('MEMBER_ID_LENGTH');
    });
  });

  describe('Integration: Multi-recipient encryption with ID providers', () => {
    let ecies: ECIESService;
    let cryptoCore: EciesCryptoCore;

    beforeEach(async () => {
      const config = {
        curveName: ECIES.CURVE_NAME,
        primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
        mnemonicStrength: ECIES.MNEMONIC_STRENGTH,
        symmetricAlgorithm: ECIES.SYMMETRIC.ALGORITHM,
        symmetricKeyBits: ECIES.SYMMETRIC.KEY_BITS,
        symmetricKeyMode: ECIES.SYMMETRIC.MODE,
      };
      ecies = new ECIESService(config);
      cryptoCore = new EciesCryptoCore(config);
    });

    it('should encrypt and decrypt with ObjectID provider (12 bytes)', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });

      const processor = new MultiRecipientProcessor(ecies, config);
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      // Generate ID using the provider
      const recipientId = config.idProvider.generate();
      expect(recipientId.length).toBe(12);

      const recipients = [{ id: recipientId, publicKey: keyPair.publicKey }];
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      const encrypted = await processor.encryptChunk(
        data,
        recipients,
        0,
        true,
        symmetricKey
      );

      const decrypted = await processor.decryptChunk(
        encrypted.data,
        recipientId,
        keyPair.privateKey
      );

      expect(decrypted.data).toEqual(data);
    });

    it('should encrypt and decrypt with GUID provider (16 bytes)', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      const processor = new MultiRecipientProcessor(ecies, config);
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      const recipientId = config.idProvider.generate();
      expect(recipientId.length).toBe(16);

      const recipients = [{ id: recipientId, publicKey: keyPair.publicKey }];
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      const encrypted = await processor.encryptChunk(
        data,
        recipients,
        0,
        true,
        symmetricKey
      );

      const decrypted = await processor.decryptChunk(
        encrypted.data,
        recipientId,
        keyPair.privateKey
      );

      expect(decrypted.data).toEqual(data);
    });

    it('should encrypt and decrypt with Legacy32Byte provider', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new Legacy32ByteProvider(),
      });

      const processor = new MultiRecipientProcessor(ecies, config);
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      const recipientId = config.idProvider.generate();
      expect(recipientId.length).toBe(32);

      const recipients = [{ id: recipientId, publicKey: keyPair.publicKey }];
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      const encrypted = await processor.encryptChunk(
        data,
        recipients,
        0,
        true,
        symmetricKey
      );

      const decrypted = await processor.decryptChunk(
        encrypted.data,
        recipientId,
        keyPair.privateKey
      );

      expect(decrypted.data).toEqual(data);
    });

    it('should reject recipient ID with wrong length for configured provider', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(), // 12 bytes
      });

      const processor = new MultiRecipientProcessor(ecies, config);
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      // Try to use 32-byte ID with 12-byte provider
      const wrongSizeId = new Uint8Array(32);
      const recipients = [{ id: wrongSizeId, publicKey: keyPair.publicKey }];
      const data = new Uint8Array([1, 2, 3]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      await expect(
        processor.encryptChunk(data, recipients, 0, true, symmetricKey)
      ).rejects.toThrow('must be 12 bytes');
    });

    it('should prevent mixing different provider configs in same operation', async () => {
      const objectIdConfig = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      const guidConfig = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      const processor = new MultiRecipientProcessor(ecies, objectIdConfig);
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      // Try to use GUID (16 bytes) with ObjectID processor (12 bytes)
      const guidId = guidConfig.idProvider.generate();
      const recipients = [{ id: guidId, publicKey: keyPair.publicKey }];
      const data = new Uint8Array([1, 2, 3]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      await expect(
        processor.encryptChunk(data, recipients, 0, true, symmetricKey)
      ).rejects.toThrow('must be 12 bytes');
    });
  });

  describe('Cross-algorithm consistency validation', () => {
    it('should enforce same recipient ID size across all ECIES modes', () => {
      const config = Constants;

      // All modes should respect the same ID provider
      const idLength = config.idProvider.byteLength;

      expect(config.MEMBER_ID_LENGTH).toBe(idLength);
      expect(config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE).toBe(idLength);

      // Multi-recipient constants should match
      const mrConstants = getMultiRecipientConstants(idLength);
      expect(mrConstants.RECIPIENT_ID_SIZE).toBe(idLength);
    });

    it('should maintain consistency when switching providers', () => {
      const providers = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
        new Legacy32ByteProvider(),
      ];

      for (const provider of providers) {
        const config = createRuntimeConfiguration({ idProvider: provider });

        expect(config.MEMBER_ID_LENGTH).toBe(provider.byteLength);
        expect(config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE).toBe(
          provider.byteLength
        );
        expect(config.idProvider.byteLength).toBe(provider.byteLength);

        const mrConstants = getMultiRecipientConstants(provider.byteLength);
        expect(mrConstants.RECIPIENT_ID_SIZE).toBe(provider.byteLength);
      }
    });
  });

  describe('Regression: Prevent 12 vs 32 byte discrepancy', () => {
    let ecies: ECIESService;
    let cryptoCore: EciesCryptoCore;

    beforeEach(async () => {
      const config = {
        curveName: ECIES.CURVE_NAME,
        primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
        mnemonicStrength: ECIES.MNEMONIC_STRENGTH,
        symmetricAlgorithm: ECIES.SYMMETRIC.ALGORITHM,
        symmetricKeyBits: ECIES.SYMMETRIC.KEY_BITS,
        symmetricKeyMode: ECIES.SYMMETRIC.MODE,
      };
      ecies = new ECIESService(config);
      cryptoCore = new EciesCryptoCore(config);
    });

    it('should fail if MULTI_RECIPIENT_CONSTANTS does not match ECIES.MULTIPLE', () => {
      // This is the core issue that slipped through
      const config = Constants;
      const mrConstants = getMultiRecipientConstants(
        config.idProvider.byteLength
      );

      // These MUST match
      expect(mrConstants.RECIPIENT_ID_SIZE).toBe(
        config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE
      );
    });

    it('should fail if any hardcoded 32-byte ID is used with default config', async () => {
      const config = Constants; // Default: ObjectID (12 bytes)
      const processor = new MultiRecipientProcessor(ecies, config);
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      // This is what some old tests were doing - hardcoding 32 bytes
      const hardcoded32ByteId = new Uint8Array(32);
      const recipients = [
        { id: hardcoded32ByteId, publicKey: keyPair.publicKey },
      ];
      const data = new Uint8Array([1, 2, 3]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      // Should reject because config expects 12 bytes
      await expect(
        processor.encryptChunk(data, recipients, 0, true, symmetricKey)
      ).rejects.toThrow();
    });

    it('should document that old encrypted data needs Legacy32ByteProvider', async () => {
      // If you have data encrypted with 32-byte IDs, you must use:
      const legacyConfig = createRuntimeConfiguration({
        idProvider: new Legacy32ByteProvider(),
      });

      expect(legacyConfig.idProvider.byteLength).toBe(32);
      expect(legacyConfig.ECIES.MULTIPLE.RECIPIENT_ID_SIZE).toBe(32);
    });
  });
});
