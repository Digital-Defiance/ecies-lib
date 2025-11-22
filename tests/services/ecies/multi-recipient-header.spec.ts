import { ECIES } from '../../../src/constants';
import { IECIESConfig } from '../../../src/interfaces/ecies-config';
import { EciesCryptoCore } from '../../../src/services/ecies/crypto-core';
import {
  IMultiEncryptedMessage,
  IMultiRecipient,
} from '../../../src/services/ecies/interfaces';
import { EciesMultiRecipient } from '../../../src/services/ecies/multi-recipient';
import { getEciesI18nEngine } from '../../../src/i18n-setup';

describe('EciesMultiRecipient Header MSB Logic', () => {
  let multiRecipientService: EciesMultiRecipient;
  let cryptoCore: EciesCryptoCore;
  let recipient1: {
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

    recipient1 = {
      id: crypto.getRandomValues(new Uint8Array(ECIES.MULTIPLE.RECIPIENT_ID_SIZE)),
      privateKey: r1Keys.privateKey,
      publicKey: r1Keys.publicKey,
    };
  });

  it('should encode recipient ID size in the MSB of data length', async () => {
    const message = new TextEncoder().encode('Test message');
    const recipients: IMultiRecipient[] = [
      { id: recipient1.id, publicKey: recipient1.publicKey },
    ];

    const encryptedData = await multiRecipientService.encryptMultiple(
      recipients,
      message,
    );

    const header = multiRecipientService.buildHeader(encryptedData);
    const view = new DataView(header.buffer);
    // Offset 3 because of Version (1) + Suite (1) + Type (1)
    const combinedLength = view.getBigUint64(3, false);
    
    const storedRecipientIdSize = Number(combinedLength >> 56n);
    const dataLength = Number(combinedLength & 0x00FFFFFFFFFFFFFFn);

    expect(storedRecipientIdSize).toBe(ECIES.MULTIPLE.RECIPIENT_ID_SIZE);
    expect(dataLength).toBe(message.length);
  });

  it('should parse header correctly when MSB is set', async () => {
    const message = new TextEncoder().encode('Test message');
    const recipients: IMultiRecipient[] = [
      { id: recipient1.id, publicKey: recipient1.publicKey },
    ];

    const encryptedData = await multiRecipientService.encryptMultiple(
      recipients,
      message,
    );

    const header = multiRecipientService.buildHeader(encryptedData);
    const parsedHeader = multiRecipientService.parseHeader(header);

    expect(parsedHeader.dataLength).toBe(message.length);
    // We can't directly check if it used the MSB value vs config value here because they are the same,
    // but we can verify it parsed correctly.
  });

  it('should fallback to config recipient ID size if MSB is 0 (legacy support)', async () => {
    const message = new TextEncoder().encode('Legacy message');
    const recipients: IMultiRecipient[] = [
      { id: recipient1.id, publicKey: recipient1.publicKey },
    ];

    const encryptedData = await multiRecipientService.encryptMultiple(
      recipients,
      message,
    );

    // Manually construct a legacy header (MSB 0)
    const header = multiRecipientService.buildHeader(encryptedData);
    const view = new DataView(header.buffer);
    
    // Clear the MSB (offset 3)
    const combinedLength = view.getBigUint64(3, false);
    const legacyLength = combinedLength & 0x00FFFFFFFFFFFFFFn;
    view.setBigUint64(3, legacyLength, false);

    const parsedHeader = multiRecipientService.parseHeader(header);

    expect(parsedHeader.dataLength).toBe(message.length);
    // It should still work because it falls back to config which matches the ID size used
  });
});
