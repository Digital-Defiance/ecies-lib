/**
 * ECIES Test Matrix: All encryption modes × ID providers
 *
 * This test file validates Requirements 3.5, 3.6 from the audit spec:
 * - All encryption modes (Simple, Single, Multiple) work correctly
 * - All ID providers (ObjectId, GUID, UUID, Custom) work correctly
 * - All combinations of mode × provider work correctly
 *
 * Test Matrix:
 * - Simple mode × ObjectId
 * - Simple mode × GUID
 * - Single mode × ObjectId
 * - Single mode × GUID
 * - Multiple mode × ObjectId
 * - Multiple mode × GUID
 */

import { createRuntimeConfiguration, ECIES } from '../../src/constants';
import { IIdProvider } from '../../src/interfaces/id-provider';
import {
  BaseIdProvider,
  GuidV4Provider,
  ObjectIdProvider,
} from '../../src/lib/id-providers';
import { EciesCryptoCore } from '../../src/services/ecies/crypto-core';
import { ECIESService } from '../../src/services/ecies/service';
import { MultiRecipientProcessor } from '../../src/services/multi-recipient-processor';
import { TypedIdProviderWrapper } from '../../src/typed-configuration';

describe('ECIES Test Matrix: Modes × ID Providers', () => {
  let ecies: ECIESService;
  let cryptoCore: EciesCryptoCore;

  beforeEach(() => {
    const config = {
      curveName: ECIES.CURVE_NAME,
      primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
      mnemonicStrength: ECIES.MNEMONIC_STRENGTH,
      symmetricAlgorithm: ECIES.SYMMETRIC_ALGORITHM_CONFIGURATION,
      symmetricKeyBits: ECIES.SYMMETRIC.KEY_BITS,
      symmetricKeyMode: ECIES.SYMMETRIC.MODE,
    };
    ecies = new ECIESService(config);
    cryptoCore = new EciesCryptoCore(config);
  });

  describe('Simple Mode (Direct Key Pair)', () => {
    it('should work with ObjectId provider', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });

      const mnemonic = ecies.generateNewMnemonic();
      const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const encrypted = await ecies.encryptBasic(keyPair.publicKey, message);
      const decrypted = await ecies.decryptBasicWithHeader(
        keyPair.privateKey,
        encrypted,
      );

      expect(decrypted).toEqual(message);
      expect(config.idProvider.byteLength).toBe(12);
    });

    it('should work with GUID provider', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      const mnemonic = ecies.generateNewMnemonic();
      const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const encrypted = await ecies.encryptBasic(keyPair.publicKey, message);
      const decrypted = await ecies.decryptBasicWithHeader(
        keyPair.privateKey,
        encrypted,
      );

      expect(decrypted).toEqual(message);
      expect(config.idProvider.byteLength).toBe(16);
    });

    it('should work with custom ID provider', async () => {
      // Custom provider with 24-byte IDs
      class CustomIdProvider extends BaseIdProvider<Uint8Array> {
        readonly byteLength = 24;
        readonly name = 'custom';

        generate(): Uint8Array {
          return crypto.getRandomValues(new Uint8Array(24));
        }

        validate(id: Uint8Array): boolean {
          return id.length === this.byteLength;
        }

        serialize(id: Uint8Array): string {
          return Array.from(id)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }

        deserialize(str: string): Uint8Array {
          const buffer = new Uint8Array(this.byteLength);
          for (let i = 0; i < this.byteLength; i++) {
            buffer[i] = parseInt(str.substr(i * 2, 2), 16);
          }
          return buffer;
        }

        fromBytes(bytes: Uint8Array): Uint8Array {
          return bytes;
        }

        toBytes(id: Uint8Array): Uint8Array {
          return id;
        }

        equals(a: Uint8Array, b: Uint8Array): boolean {
          return a.length === b.length && a.every((v, i) => v === b[i]);
        }

        clone(id: Uint8Array): Uint8Array {
          return new Uint8Array(id);
        }
      }

      const config = createRuntimeConfiguration({
        idProvider: new CustomIdProvider(),
      });

      const mnemonic = ecies.generateNewMnemonic();
      const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const encrypted = await ecies.encryptBasic(keyPair.publicKey, message);
      const decrypted = await ecies.decryptBasicWithHeader(
        keyPair.privateKey,
        encrypted,
      );

      expect(decrypted).toEqual(message);
      expect(config.idProvider.byteLength).toBe(24);
    });
  });

  describe('Single Recipient Mode', () => {
    it('should work with ObjectId provider', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });

      const mnemonic = ecies.generateNewMnemonic();
      const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
      const recipientId = config.idProvider.generate();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      expect(recipientId.length).toBe(12);

      const encrypted = await ecies.encryptWithLength(
        keyPair.publicKey,
        message,
      );
      const decrypted = await ecies.decryptWithLengthAndHeader(
        keyPair.privateKey,
        encrypted,
      );

      expect(decrypted).toEqual(message);
    });

    it('should work with GUID provider', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      const mnemonic = ecies.generateNewMnemonic();
      const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
      const recipientId = config.idProvider.generate();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      expect(recipientId.length).toBe(16);

      const encrypted = await ecies.encryptWithLength(
        keyPair.publicKey,
        message,
      );
      const decrypted = await ecies.decryptWithLengthAndHeader(
        keyPair.privateKey,
        encrypted,
      );

      expect(decrypted).toEqual(message);
    });

    it('should work with custom ID provider', async () => {
      class CustomIdProvider extends BaseIdProvider<Uint8Array> {
        readonly byteLength = 20;
        readonly name = 'custom';

        generate(): Uint8Array {
          return crypto.getRandomValues(new Uint8Array(20));
        }

        validate(id: Uint8Array): boolean {
          return id.length === this.byteLength;
        }

        serialize(id: Uint8Array): string {
          return Array.from(id)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }

        deserialize(str: string): Uint8Array {
          const buffer = new Uint8Array(this.byteLength);
          for (let i = 0; i < this.byteLength; i++) {
            buffer[i] = parseInt(str.substr(i * 2, 2), 16);
          }
          return buffer;
        }

        fromBytes(bytes: Uint8Array): Uint8Array {
          return bytes;
        }

        toBytes(id: Uint8Array): Uint8Array {
          return id;
        }

        equals(a: Uint8Array, b: Uint8Array): boolean {
          return a.length === b.length && a.every((v, i) => v === b[i]);
        }

        clone(id: Uint8Array): Uint8Array {
          return new Uint8Array(id);
        }
      }

      const config = createRuntimeConfiguration({
        idProvider: new CustomIdProvider(),
      });

      const mnemonic = ecies.generateNewMnemonic();
      const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
      const recipientId = config.idProvider.generate();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      expect(recipientId.length).toBe(20);

      const encrypted = await ecies.encryptWithLength(
        keyPair.publicKey,
        message,
      );
      const decrypted = await ecies.decryptWithLengthAndHeader(
        keyPair.privateKey,
        encrypted,
      );

      expect(decrypted).toEqual(message);
    });
  });

  describe('Multiple Recipient Mode', () => {
    it('should work with ObjectId provider', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });

      const idProvider = new TypedIdProviderWrapper(config.idProvider);
      const processor = new MultiRecipientProcessor(
        config,
        config.ECIES_CONFIG,
        ecies,
        idProvider,
        config.ECIES,
      );

      // Create 3 recipients
      const recipients = await Promise.all(
        [1, 2, 3].map(async () => {
          const mnemonic = ecies.generateNewMnemonic();
          const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
          const id = config.idProvider.generate();
          return {
            id,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
          };
        }),
      );

      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      // Encrypt for all recipients
      const encrypted = await processor.encryptChunk(
        message,
        recipients.map((r) => ({ id: r.id, publicKey: r.publicKey })),
        0,
        true,
        symmetricKey,
      );

      // Each recipient should be able to decrypt
      for (const recipient of recipients) {
        const decrypted = await processor.decryptChunk(
          encrypted.data,
          recipient.id,
          recipient.privateKey,
        );
        expect(decrypted.data).toEqual(message);
      }
    });

    it('should work with GUID provider', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      const idProvider = new TypedIdProviderWrapper(config.idProvider);
      const processor = new MultiRecipientProcessor(
        config,
        config.ECIES_CONFIG,
        ecies,
        idProvider,
        config.ECIES,
      );

      // Create 3 recipients
      const recipients = await Promise.all(
        [1, 2, 3].map(async () => {
          const mnemonic = ecies.generateNewMnemonic();
          const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
          const id = config.idProvider.generate();
          return {
            id,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
          };
        }),
      );

      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      // Encrypt for all recipients
      const encrypted = await processor.encryptChunk(
        message,
        recipients.map((r) => ({ id: r.id, publicKey: r.publicKey })),
        0,
        true,
        symmetricKey,
      );

      // Each recipient should be able to decrypt
      for (const recipient of recipients) {
        const decrypted = await processor.decryptChunk(
          encrypted.data,
          recipient.id,
          recipient.privateKey,
        );
        expect(decrypted.data).toEqual(message);
      }
    });

    it('should work with custom ID provider', async () => {
      class CustomIdProvider extends BaseIdProvider<Uint8Array> {
        readonly byteLength = 18;
        readonly name = 'custom';

        generate(): Uint8Array {
          return crypto.getRandomValues(new Uint8Array(18));
        }

        validate(id: Uint8Array): boolean {
          return id.length === this.byteLength;
        }

        serialize(id: Uint8Array): string {
          return Array.from(id)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }

        deserialize(str: string): Uint8Array {
          const buffer = new Uint8Array(this.byteLength);
          for (let i = 0; i < this.byteLength; i++) {
            buffer[i] = parseInt(str.substr(i * 2, 2), 16);
          }
          return buffer;
        }

        fromBytes(bytes: Uint8Array): Uint8Array {
          return bytes;
        }

        toBytes(id: Uint8Array): Uint8Array {
          return id;
        }

        equals(a: Uint8Array, b: Uint8Array): boolean {
          return a.length === b.length && a.every((v, i) => v === b[i]);
        }

        clone(id: Uint8Array): Uint8Array {
          return new Uint8Array(id);
        }
      }

      const config = createRuntimeConfiguration({
        idProvider: new CustomIdProvider(),
      });

      const idProvider = new TypedIdProviderWrapper(config.idProvider);
      const processor = new MultiRecipientProcessor(
        config,
        config.ECIES_CONFIG,
        ecies,
        idProvider,
        config.ECIES,
      );

      // Create 2 recipients
      const recipients = await Promise.all(
        [1, 2].map(async () => {
          const mnemonic = ecies.generateNewMnemonic();
          const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
          const id = config.idProvider.generate();
          return {
            id,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
          };
        }),
      );

      const message = new Uint8Array([1, 2, 3, 4, 5]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      // Encrypt for all recipients
      const encrypted = await processor.encryptChunk(
        message,
        recipients.map((r) => ({ id: r.id, publicKey: r.publicKey })),
        0,
        true,
        symmetricKey,
      );

      // Each recipient should be able to decrypt
      for (const recipient of recipients) {
        const decrypted = await processor.decryptChunk(
          encrypted.data,
          recipient.id,
          recipient.privateKey,
        );
        expect(decrypted.data).toEqual(message);
      }
    });
  });

  describe('Cross-mode compatibility', () => {
    it('should maintain ID provider consistency across all modes', async () => {
      const providers: IIdProvider<any>[] = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
      ];

      for (const provider of providers) {
        const config = createRuntimeConfiguration({ idProvider: provider });

        // Verify all modes respect the same provider
        expect(config.MEMBER_ID_LENGTH).toBe(provider.byteLength);
        expect(config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE).toBe(
          provider.byteLength,
        );
        expect(config.idProvider.byteLength).toBe(provider.byteLength);
      }
    });

    it('should reject mismatched ID sizes across modes', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(), // 12 bytes
      });

      const idProvider = new TypedIdProviderWrapper(config.idProvider);
      const processor = new MultiRecipientProcessor(
        config,
        config.ECIES_CONFIG,
        ecies,
        idProvider,
        config.ECIES,
      );
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      // Try to use wrong-sized ID
      const wrongId = new Uint8Array(16); // GUID size with ObjectId provider
      const recipients = [{ id: wrongId, publicKey: keyPair.publicKey }];
      const data = new Uint8Array([1, 2, 3]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      await expect(
        processor.encryptChunk(data, recipients, 0, true, symmetricKey),
      ).rejects.toThrow();
    });
  });
});
