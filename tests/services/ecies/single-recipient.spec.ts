import { ECIES } from '../../../src/constants';
import { EciesEncryptionTypeEnum } from '../../../src/enumerations';
import { IECIESConfig } from '../../../src/interfaces';
import { EciesCryptoCore } from '../../../src/services/ecies/crypto-core';
import { EciesSingleRecipient } from '../../../src/services/ecies/single-recipient';

const mockConfig: IECIESConfig = {
  curveName: ECIES.CURVE_NAME,
  primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
  mnemonicStrength: 128,
  symmetricAlgorithm: ECIES.SYMMETRIC_ALGORITHM_CONFIGURATION,
  symmetricKeyBits: 256,
  symmetricKeyMode: 'gcm',
};

describe('EciesSingleRecipient', () => {
  let cryptoCore: EciesCryptoCore;
  let singleRecipientService: EciesSingleRecipient;
  let recipientKeyPair: { privateKey: Uint8Array; publicKey: Uint8Array };

  beforeAll(async () => {
    cryptoCore = new EciesCryptoCore(mockConfig);
    singleRecipientService = new EciesSingleRecipient(mockConfig);
    recipientKeyPair = await cryptoCore.generateEphemeralKeyPair();
  });

  it('should encrypt and decrypt a message in simple mode', async () => {
    const message = new TextEncoder().encode(
      'This is a test for simple encryption',
    );

    const encrypted = await singleRecipientService.encrypt(
      EciesEncryptionTypeEnum.Basic, // simple mode
      recipientKeyPair.publicKey,
      message,
    );

    const decrypted = await singleRecipientService.decryptWithHeader(
      EciesEncryptionTypeEnum.Basic,
      recipientKeyPair.privateKey,
      encrypted,
    );

    expect(new TextDecoder().decode(decrypted)).toEqual(
      new TextDecoder().decode(message),
    );
  });

  it('should encrypt and decrypt a message in single mode', async () => {
    const message = new TextEncoder().encode(
      'This is a test for single encryption',
    );

    const encrypted = await singleRecipientService.encrypt(
      EciesEncryptionTypeEnum.WithLength, // single mode
      recipientKeyPair.publicKey,
      message,
    );

    const decrypted = await singleRecipientService.decryptWithHeader(
      EciesEncryptionTypeEnum.WithLength,
      recipientKeyPair.privateKey,
      encrypted,
    );

    expect(new TextDecoder().decode(decrypted)).toEqual(
      new TextDecoder().decode(message),
    );
  });

  it('should correctly parse the header of an encrypted message', () => {
    const message = new TextEncoder().encode('Header parsing test');

    // We need to create an encrypted message first to parse its header
    singleRecipientService
      .encrypt(
        EciesEncryptionTypeEnum.WithLength, // single mode
        recipientKeyPair.publicKey,
        message,
      )
      .then((encrypted) => {
        const { header } = singleRecipientService.parseEncryptedMessage(
          EciesEncryptionTypeEnum.WithLength,
          encrypted,
        );

        expect(header.encryptionType).toBe(EciesEncryptionTypeEnum.WithLength);
        expect(header.ephemeralPublicKey.length).toBe(ECIES.PUBLIC_KEY_LENGTH);
        expect(header.iv.length).toBe(ECIES.IV_SIZE);
        expect(header.authTag.length).toBe(ECIES.AUTH_TAG_SIZE);
        expect(header.dataLength).toBe(message.length);
      });
  });
});
