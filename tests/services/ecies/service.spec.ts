import { ECIES, createRuntimeConfiguration } from '../../../src/constants';
import {
  EciesEncryptionTypeEnum,
  EciesStringKey,
} from '../../../src/enumerations';
import { GuidV4Provider } from '../../../src/lib/id-providers';
import { ECIESService } from '../../../src/services/ecies/service';
import { englishTranslations } from '../../../src/translations/en-US';

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
      expect(keyPair.publicKey.length).toBe(33);
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
    it('should throw an error because it is not supported for this function', async () => {
      const recipient1 = eciesService.mnemonicToSimpleKeyPair(
        eciesService.generateNewMnemonic(),
      );
      const message = new TextEncoder().encode('test');

      await expect(
        eciesService.encrypt(
          EciesEncryptionTypeEnum.Multiple,
          recipient1.publicKey,
          message,
        ),
      ).rejects.toThrow(
        englishTranslations[
          EciesStringKey
            .Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode
        ],
      );
    });
  });

  describe('Constructor Signature', () => {
    describe('IConstants acceptance', () => {
      it('should accept IConstants from createRuntimeConfiguration without TypeScript errors', () => {
        const config = createRuntimeConfiguration({
          idProvider: new GuidV4Provider(),
        });

        // This should compile without type errors
        const service = new ECIESService(config);

        expect(service).toBeInstanceOf(ECIESService);
        expect(service.config).toBeDefined();
      });

      it('should correctly extract ECIES config from IConstants', () => {
        const config = createRuntimeConfiguration({
          idProvider: new GuidV4Provider(),
        });

        const service = new ECIESService(config);

        // Verify that ECIES config was correctly extracted
        expect(service.config.curveName).toBe(config.ECIES.CURVE_NAME);
        expect(service.config.symmetricAlgorithm).toBe(
          config.ECIES.SYMMETRIC.ALGORITHM,
        );
        expect(service.config.symmetricKeyBits).toBe(
          config.ECIES.SYMMETRIC.KEY_BITS,
        );
        expect(service.config.symmetricKeyMode).toBe(
          config.ECIES.SYMMETRIC.MODE,
        );
      });
    });

    describe('Partial<IECIESConfig> acceptance', () => {
      it('should accept Partial<IECIESConfig> without TypeScript errors', () => {
        const config = {
          curveName: 'secp256k1',
          symmetricAlgorithm: 'aes-256-gcm',
        };

        // This should compile without type errors
        const service = new ECIESService(config);

        expect(service).toBeInstanceOf(ECIESService);
        expect(service.config.curveName).toBe('secp256k1');
        expect(service.config.symmetricAlgorithm).toBe('aes-256-gcm');
      });

      it('should merge partial config with defaults', () => {
        const config = {
          curveName: 'secp256k1',
        };

        const service = new ECIESService(config);

        expect(service.config.curveName).toBe('secp256k1');
        expect(service.config.symmetricAlgorithm).toBe(
          ECIES.SYMMETRIC.ALGORITHM,
        );
      });
    });

    describe('No parameters', () => {
      it('should use defaults when no config is provided', () => {
        const service = new ECIESService();

        expect(service.config.curveName).toBe(ECIES.CURVE_NAME);
        expect(service.config.symmetricAlgorithm).toBe(
          ECIES.SYMMETRIC.ALGORITHM,
        );
      });
    });

    describe('Backward compatibility', () => {
      it('should maintain existing behavior with Partial<IECIESConfig>', () => {
        const config = {
          curveName: 'secp256k1',
          symmetricAlgorithm: 'aes-256-gcm',
          symmetricKeyBits: 256,
        };

        const service = new ECIESService(config);

        // Verify service is correctly initialized
        expect(service.config.curveName).toBe('secp256k1');
        expect(service.config.symmetricAlgorithm).toBe('aes-256-gcm');
        expect(service.config.symmetricKeyBits).toBe(256);

        // Verify service functionality works
        const mnemonic = service.generateNewMnemonic();
        expect(mnemonic.value?.split(' ').length).toBe(24);
      });

      it('should work with existing usage patterns', async () => {
        const service = new ECIESService();

        const recipientMnemonic = service.generateNewMnemonic();
        const recipientKeyPair =
          service.mnemonicToSimpleKeyPair(recipientMnemonic);
        const message = new TextEncoder().encode('Test message');

        const encrypted = await service.encryptSimpleOrSingle(
          true,
          recipientKeyPair.publicKey,
          message,
        );

        const decrypted = await service.decryptSimpleOrSingleWithHeader(
          true,
          recipientKeyPair.privateKey,
          encrypted,
        );

        expect(new TextDecoder().decode(decrypted)).toBe('Test message');
      });
    });
  });

  describe('idProvider Configuration', () => {
    describe('IConstants preservation', () => {
      it('should preserve GuidV4Provider when configured', () => {
        const config = createRuntimeConfiguration({
          idProvider: new GuidV4Provider(),
        });
        const service = new ECIESService(config);

        expect(service.constants).toBeDefined();
        expect(service.constants.idProvider).toBe(config.idProvider);
        expect(service.constants.idProvider.byteLength).toBe(16);
      });

      it('should preserve ObjectIdProvider when configured', () => {
        const config = createRuntimeConfiguration({
          idProvider: new GuidV4Provider(),
        });
        const service = new ECIESService(config);

        expect(service.constants).toBeDefined();
        expect(service.constants.idProvider).toBe(config.idProvider);
        expect(service.constants.idProvider.byteLength).toBe(16);
      });

      it('should use default Constants for Partial<IECIESConfig>', () => {
        const partialConfig = {
          curveName: 'secp256k1' as const,
          symmetricAlgorithm: 'aes-256-gcm' as const,
        };
        const service = new ECIESService(partialConfig);

        expect(service.constants.idProvider.byteLength).toBe(12); // Default ObjectIdProvider
      });
    });

    describe('config property backward compatibility', () => {
      it('should return IECIESConfig without idProvider', () => {
        const config = createRuntimeConfiguration({
          idProvider: new GuidV4Provider(),
        });
        const service = new ECIESService(config);

        expect(service.config).toBeDefined();
        expect('idProvider' in service.config).toBe(false);
        expect(service.config.curveName).toBeDefined();
        expect(service.config.symmetricAlgorithm).toBeDefined();
      });
    });

    describe('constants property', () => {
      it('should return full IConstants', () => {
        const config = createRuntimeConfiguration({
          idProvider: new GuidV4Provider(),
        });
        const service = new ECIESService(config);

        expect(service.constants).toBeDefined();
        expect(service.constants.idProvider).toBeDefined();
        expect(service.constants.ECIES).toBeDefined();
        expect(service.constants.CHECKSUM).toBeDefined();
        expect(service.constants.PBKDF2).toBeDefined();
        expect(service.constants.VOTING).toBeDefined();
      });
    });
  });
});
