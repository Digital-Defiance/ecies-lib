import { ECIES } from '../../../src/constants';
import { IECIESConfig } from '../../../src/interfaces/ecies-config';
import { EciesCryptoCore } from '../../../src/services/ecies/crypto-core';
import {
  IMultiEncryptedMessage,
  IMultiRecipient,
} from '../../../src/services/ecies/interfaces';
import { EciesMultiRecipient } from '../../../src/services/ecies/multi-recipient';
import { concatUint8Arrays } from '../../../src/utils';
import { withConsoleMocks } from '../../support/console';
import { getEciesI18nEngine } from '../../../src/i18n-setup';

describe('EciesMultiRecipient', () => {
  let multiRecipientService: EciesMultiRecipient;
  let cryptoCore: EciesCryptoCore;
  let recipient1: {
    id: Uint8Array;
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  };
  let recipient2: {
    id: Uint8Array;
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  };

  beforeAll(async () => {
    getEciesI18nEngine(); // Initialize i18n engine
    const config: IECIESConfig = {
      curveName: ECIES.CURVE_NAME,
      primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
      mnemonicStrength: ECIES.MNEMONIC_STRENGTH,
      symmetricAlgorithm: ECIES.SYMMETRIC.ALGORITHM,
      symmetricKeyBits: ECIES.SYMMETRIC.KEY_BITS,
      symmetricKeyMode: ECIES.SYMMETRIC.MODE,
    } as const;
    multiRecipientService = new EciesMultiRecipient(config);
    cryptoCore = new EciesCryptoCore(config);

    const r1Keys = await cryptoCore.generateEphemeralKeyPair();
    const r2Keys = await cryptoCore.generateEphemeralKeyPair();

    recipient1 = {
      id: crypto.getRandomValues(new Uint8Array(ECIES.MULTIPLE.RECIPIENT_ID_SIZE)),
      privateKey: r1Keys.privateKey,
      publicKey: r1Keys.publicKey,
    };

    recipient2 = {
      id: crypto.getRandomValues(new Uint8Array(ECIES.MULTIPLE.RECIPIENT_ID_SIZE)),
      privateKey: r2Keys.privateKey,
      publicKey: r2Keys.publicKey,
    };
  });

  describe('encryptKey / decryptKey', () => {
    it('should encrypt and decrypt a symmetric key for a recipient', async () => {
      const symmetricKey = cryptoCore.generatePrivateKey(); // 32-byte key

      const encryptedKey = await multiRecipientService.encryptKey(
        recipient1.publicKey,
        symmetricKey,
      );

      expect(encryptedKey).toBeInstanceOf(Uint8Array);
      expect(encryptedKey.length).toBe(ECIES.MULTIPLE.ENCRYPTED_KEY_SIZE);

      const decryptedKey = await multiRecipientService.decryptKey(
        recipient1.privateKey,
        encryptedKey,
      );

      expect(decryptedKey).toEqual(symmetricKey);
    });

    it('should fail to decrypt a key with the wrong private key', async () => {
      await withConsoleMocks({ mute: true }, async () => {
        const symmetricKey = cryptoCore.generatePrivateKey();

        const encryptedKey = await multiRecipientService.encryptKey(
          recipient1.publicKey,
          symmetricKey,
        );

        // Attempt to decrypt with recipient2's private key
        await expect(
          multiRecipientService.decryptKey(recipient2.privateKey, encryptedKey),
        ).rejects.toThrow('Failed to decrypt key');
      });
    });

    it('should reject keys with incorrect serialized length', async () => {
      const symmetricKey = cryptoCore.generatePrivateKey();
      const encryptedKey = await multiRecipientService.encryptKey(
        recipient1.publicKey,
        symmetricKey,
      );

      const truncatedKey = encryptedKey.slice(0, encryptedKey.length - 1);

      await expect(
        multiRecipientService.decryptKey(recipient1.privateKey, truncatedKey),
      ).rejects.toThrow(
        `Invalid encrypted key length: expected ${ECIES.MULTIPLE.ENCRYPTED_KEY_SIZE}, got ${truncatedKey.length}`,
      );
    });
  });

  describe('encryptMultiple / decryptMultipleForRecipient', () => {
    it('should encrypt and decrypt a message for multiple recipients', async () => {
      const message = new TextEncoder().encode('Hello, world!');
      const recipients: IMultiRecipient[] = [
        { id: recipient1.id, publicKey: recipient1.publicKey },
        { id: recipient2.id, publicKey: recipient2.publicKey },
      ];

      const encryptedData = await multiRecipientService.encryptMultiple(
        recipients,
        message,
      );

      // Decrypt for recipient 1
      const decryptedMessage1 =
        await multiRecipientService.decryptMultipleForRecipient(
          encryptedData,
          recipient1.id,
          recipient1.privateKey,
        );

      expect(new TextDecoder().decode(decryptedMessage1)).toBe('Hello, world!');

      // Decrypt for recipient 2
      const decryptedMessage2 =
        await multiRecipientService.decryptMultipleForRecipient(
          encryptedData,
          recipient2.id,
          recipient2.privateKey,
        );

      expect(new TextDecoder().decode(decryptedMessage2)).toBe('Hello, world!');
    });

    it('should throw an error if recipient is not found', async () => {
      const message = new TextEncoder().encode('Hello, world!');
      const recipients: IMultiRecipient[] = [
        { id: recipient1.id, publicKey: recipient1.publicKey },
      ];

      const encryptedData = await multiRecipientService.encryptMultiple(
        recipients,
        message,
      );

      const nonExistentRecipientId = crypto.getRandomValues(new Uint8Array(ECIES.MULTIPLE.RECIPIENT_ID_SIZE));

      await expect(
        multiRecipientService.decryptMultipleForRecipient(
          encryptedData,
          nonExistentRecipientId,
          recipient2.privateKey, // A valid key, but for the wrong recipient
        ),
      ).rejects.toThrow('Recipient not found');
    });

    it('should reject requests that exceed the recipient limit', async () => {
      const baseRecipient: IMultiRecipient = {
        id: recipient1.id,
        publicKey: recipient1.publicKey,
      };

      const recipients = Array.from(
        { length: ECIES.MULTIPLE.MAX_RECIPIENTS + 1 },
        () => baseRecipient,
      );

      await expect(
        multiRecipientService.encryptMultiple(
          recipients,
          new Uint8Array([1, 2, 3]),
        ),
      ).rejects.toThrow(
        `Too many recipients: ${ECIES.MULTIPLE.MAX_RECIPIENTS + 1}`,
      );
    });
  });

  describe('buildHeader / parseHeader', () => {
    it('should correctly build and parse a multi-recipient header', async () => {
      const message = new TextEncoder().encode('This is a test message.');
      const recipients: IMultiRecipient[] = [
        { id: recipient1.id, publicKey: recipient1.publicKey },
        { id: recipient2.id, publicKey: recipient2.publicKey },
      ];

      const encryptedData = await multiRecipientService.encryptMultiple(
        recipients,
        message,
      );

      const header = multiRecipientService.buildHeader(encryptedData);
      const parsedHeader = multiRecipientService.parseHeader(header);

      expect(parsedHeader.dataLength).toBe(message.length);
      expect(parsedHeader.recipientCount).toBe(recipients.length);
      expect(parsedHeader.recipientIds).toEqual(recipients.map((r) => r.id));
      // Cannot directly compare recipientKeys as they are newly encrypted
      expect(parsedHeader.recipientKeys.length).toBe(recipients.length);
    });

    it('should correctly parse the header size', async () => {
      const message = new TextEncoder().encode('Another test.');
      const recipients: IMultiRecipient[] = [
        { id: recipient1.id, publicKey: recipient1.publicKey },
        { id: recipient2.id, publicKey: recipient2.publicKey },
      ];

      const encryptedData = await multiRecipientService.encryptMultiple(
        recipients,
        message,
      );

      const header = multiRecipientService.buildHeader(encryptedData);
      const parsedHeader = multiRecipientService.parseHeader(header);

      const expectedHeaderSize = multiRecipientService.getHeaderSize(
        recipients.length,
      );
      expect(parsedHeader.headerSize).toBe(expectedHeaderSize);
      expect(parsedHeader.headerSize).toBe(header.length);
    });

    it('should throw when recipient metadata is inconsistent', async () => {
      const message = new TextEncoder().encode('Mismatch test.');
      const recipients: IMultiRecipient[] = [
        { id: recipient1.id, publicKey: recipient1.publicKey },
        { id: recipient2.id, publicKey: recipient2.publicKey },
      ];

      const encryptedData = await multiRecipientService.encryptMultiple(
        recipients,
        message,
      );

      const tampered: IMultiEncryptedMessage = {
        ...encryptedData,
        recipientKeys: encryptedData.recipientKeys.slice(1),
      };

      expect(() => multiRecipientService.buildHeader(tampered)).toThrow(
        'Recipient count mismatch',
      );
    });

    it('should reject headers that are too small', () => {
      expect(() =>
        multiRecipientService.parseHeader(new Uint8Array(5)),
      ).toThrow('Data too short for multi-recipient header');
    });

    it('should reject headers with invalid data length', () => {
      const header = new Uint8Array(10);
      const view = new DataView(header.buffer);
      view.setBigUint64(0, 0n, false); // invalid length
      view.setUint16(8, 1, false);

      expect(() => multiRecipientService.parseHeader(header)).toThrow(
        'Invalid data length',
      );
    });

    it('should reject headers with invalid recipient count', () => {
      const header = new Uint8Array(10);
      const view = new DataView(header.buffer);
      view.setBigUint64(0, 1n, false);
      view.setUint16(8, 0, false); // invalid count

      expect(() => multiRecipientService.parseHeader(header)).toThrow(
        'Invalid recipient count',
      );
    });
  });

  describe('utility helpers', () => {
    it('should compute header size based on recipient count', () => {
      const recipientCount = 3;
      const expectedSize =
        ECIES.MULTIPLE.DATA_LENGTH_SIZE +
        ECIES.MULTIPLE.RECIPIENT_COUNT_SIZE +
        recipientCount * ECIES.MULTIPLE.RECIPIENT_ID_SIZE +
        recipientCount * ECIES.MULTIPLE.ENCRYPTED_KEY_SIZE;

      expect(multiRecipientService.getHeaderSize(recipientCount)).toBe(
        expectedSize,
      );
    });

    it('should parse a full message into header and payload segments', async () => {
      const message = new TextEncoder().encode('Payload segmentation test');
      const recipients: IMultiRecipient[] = [
        { id: recipient1.id, publicKey: recipient1.publicKey },
        { id: recipient2.id, publicKey: recipient2.publicKey },
      ];

      const encryptedData = await multiRecipientService.encryptMultiple(
        recipients,
        message,
      );

      const fullMessage = concatUint8Arrays(
        multiRecipientService.buildHeader(encryptedData),
        encryptedData.encryptedMessage,
      );

      const parsed = multiRecipientService.parseMessage(fullMessage);

      expect(parsed.dataLength).toBe(message.length);
      expect(parsed.recipientCount).toBe(recipients.length);
      expect(parsed.encryptedMessage).toEqual(encryptedData.encryptedMessage);
    });
  });

  // These tests are removed because EciesMultiRecipient does not have `encrypt` and `decrypt` methods.
  // The functionality is tested in the `encryptMultiple / decryptMultipleForRecipient` describe block.
  /*
  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a message for multiple recipients', async () => {
      const message = new TextEncoder().encode('Hello, world!');
      const recipients = [
        { id: recipient1.id, publicKey: recipient1.publicKey },
        { id: recipient2.id, publicKey: recipient2.publicKey },
      ];

      const encryptedData = await multiRecipientService.encrypt(
        recipients,
        message,
      );

      // Decrypt for recipient 1
      const decryptedMessage1 = await multiRecipientService.decrypt(
        encryptedData,
        recipient1.id,
        recipient1.privateKey,
      );

      expect(new TextDecoder().decode(decryptedMessage1)).toBe('Hello, world!');

      // Decrypt for recipient 2
      const decryptedMessage2 = await multiRecipientService.decrypt(
        encryptedData,
        recipient2.id,
        recipient2.privateKey,
      );

      expect(new TextDecoder().decode(decryptedMessage2)).toBe('Hello, world!');
    });

    it('should throw an error if recipient is not found', async () => {
      const message = new TextEncoder().encode('Hello, world!');
      const recipients = [
        { id: recipient1.id, publicKey: recipient1.publicKey },
      ];

      const encryptedData = await multiRecipientService.encrypt(
        recipients,
        message,
      );

      const nonExistentRecipientId = crypto.getRandomValues(new Uint8Array(ECIES.MULTIPLE.RECIPIENT_ID_SIZE));

      await expect(
        multiRecipientService.decrypt(
          encryptedData,
          nonExistentRecipientId,
          recipient2.privateKey, // A valid key, but for the wrong recipient
        ),
      ).rejects.toThrow('Recipient not found');
    });
  });
  */
});
