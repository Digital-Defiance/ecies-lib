import { ECIES } from '../../../src/constants';
import { EciesEncryptionTypeEnum } from '../../../src/enumerations';
import { ECIESService } from '../../../src/services/ecies/service';

describe('ECIESService', () => {
  let eciesService: ECIESService;

  beforeEach(() => {
    eciesService = new ECIESService();
  });

  it('should have the correct default configuration', () => {
    const config = eciesService.config;
    expect(config.curveName).toBe(ECIES.CURVE_NAME);
    expect(config.symmetricAlgorithm).toBe(ECIES.SYMMETRIC.ALGORITHM);
  });

  describe('Key Management', () => {
    it('should generate a valid key pair', async () => {
      const mnemonic = eciesService.generateNewMnemonic();
      expect(mnemonic.value?.split(' ').length).toBe(24); // 256 bits

      const keyPair = eciesService.mnemonicToSimpleKeyPair(mnemonic);
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey.length).toBe(32);
      expect(keyPair.publicKey.length).toBe(65);
    });

    it('should derive the same public key from a private key', () => {
      const mnemonic = eciesService.generateNewMnemonic();
      const keyPair = eciesService.mnemonicToSimpleKeyPair(mnemonic);
      const derivedPublicKey = eciesService.getPublicKey(keyPair.privateKey);
      expect(derivedPublicKey).toEqual(keyPair.publicKey);
    });
  });

  describe('Simple Encryption and Decryption', () => {
    it('should encrypt and decrypt a message for a single recipient', async () => {
      const recipientMnemonic = eciesService.generateNewMnemonic();
      const recipientKeyPair =
        eciesService.mnemonicToSimpleKeyPair(recipientMnemonic);

      const message = new TextEncoder().encode(
        'This is a secret message for simple encryption.',
      );

      // Encrypt using the simple method (true)
      const encryptedMessage = await eciesService.encryptSimpleOrSingle(
        true,
        recipientKeyPair.publicKey,
        message,
      );

      // Decrypt using the simple method
      const decryptedMessage =
        await eciesService.decryptSimpleOrSingleWithHeader(
          true,
          recipientKeyPair.privateKey,
          encryptedMessage,
        );

      expect(new TextDecoder().decode(decryptedMessage)).toBe(
        'This is a secret message for simple encryption.',
      );
    });
  });

  describe('Signatures', () => {
    it('should sign and verify a Uint8Array message', async () => {
      const signerMnemonic = eciesService.generateNewMnemonic();
      const signerKeyPair =
        eciesService.mnemonicToSimpleKeyPair(signerMnemonic);
      const message = new TextEncoder().encode('This is a Uint8Array message');

      const signature = eciesService.signMessage(
        signerKeyPair.privateKey,
        message,
      );
      const isValid = eciesService.verifyMessage(
        signerKeyPair.publicKey,
        message,
        signature,
      );

      expect(isValid).toBe(true);
    });

    it('should fail to verify a signature with the wrong public key', async () => {
      const signerMnemonic = eciesService.generateNewMnemonic();
      const signerKeyPair =
        eciesService.mnemonicToSimpleKeyPair(signerMnemonic);

      const otherMnemonic = eciesService.generateNewMnemonic();
      const otherKeyPair = eciesService.mnemonicToSimpleKeyPair(otherMnemonic);

      const message = new TextEncoder().encode('Another message to sign');

      const signature = eciesService.signMessage(
        signerKeyPair.privateKey,
        message,
      );
      const isValid = eciesService.verifyMessage(
        otherKeyPair.publicKey,
        message,
        signature,
      );

      expect(isValid).toBe(false);
    });
  });

  describe('Multi-recipient Encryption', () => {
    it('should throw an error because it is not implemented', async () => {
      const recipient1 = eciesService.mnemonicToSimpleKeyPair(
        eciesService.generateNewMnemonic(),
      );
      const recipient2 = eciesService.mnemonicToSimpleKeyPair(
        eciesService.generateNewMnemonic(),
      );
      const message = new TextEncoder().encode('test');

      await expect(
        eciesService.encrypt(
          EciesEncryptionTypeEnum.Multiple,
          [
            { publicKey: recipient1.publicKey },
            { publicKey: recipient2.publicKey },
          ],
          message,
        ),
      ).rejects.toThrow('Multi-recipient encryption not yet implemented');
    });
  });
});
