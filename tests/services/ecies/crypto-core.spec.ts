import { ECIES } from '../../../src/defaults';
import { IECIESConfig } from '../../../src/interfaces';
import { SecureString } from '../../../src/secure-string';
import { EciesCryptoCore } from '../../../src/services/ecies/crypto-core';

// Mock config for tests
const mockConfig: IECIESConfig = {
  curveName: ECIES.CURVE_NAME,
  primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
  mnemonicStrength: 128, // 12 words for testing
  symmetricAlgorithm: ECIES.SYMMETRIC_ALGORITHM_CONFIGURATION,
  symmetricKeyBits: 256,
  symmetricKeyMode: 'gcm',
};

describe('EciesCryptoCore', () => {
  let cryptoCore: EciesCryptoCore;

  beforeAll(() => {
    cryptoCore = new EciesCryptoCore(mockConfig);
  });

  describe('normalizePublicKey', () => {
    it('should throw if public key is null or undefined', () => {
      expect(() => cryptoCore.normalizePublicKey(null as any)).toThrow(
        'Received null or undefined public key',
      );
    });

    it('should return the same key if it is already in the correct format', () => {
      const publicKey = new Uint8Array(ECIES.PUBLIC_KEY_LENGTH);
      publicKey[0] = ECIES.PUBLIC_KEY_MAGIC;
      const normalized = cryptoCore.normalizePublicKey(publicKey);
      expect(normalized).toEqual(publicKey);
    });

    it('should add the prefix to a raw public key', () => {
      const rawPublicKey = new Uint8Array(ECIES.RAW_PUBLIC_KEY_LENGTH).fill(1);
      const normalized = cryptoCore.normalizePublicKey(rawPublicKey);
      expect(normalized.length).toBe(ECIES.PUBLIC_KEY_LENGTH);
      expect(normalized[0]).toBe(ECIES.PUBLIC_KEY_MAGIC);
      expect(normalized.slice(1)).toEqual(rawPublicKey);
    });

    it('should throw on invalid public key length', () => {
      const invalidKey = new Uint8Array(32);
      expect(() => cryptoCore.normalizePublicKey(invalidKey)).toThrow(
        'Invalid public key format or length: 32',
      );
    });
  });

  describe('Mnemonic and Key Generation', () => {
    it('should generate a new valid mnemonic', () => {
      const mnemonic = cryptoCore.generateNewMnemonic();
      expect(mnemonic).toBeInstanceOf(SecureString);
      // 12 words for 128 strength
      expect(mnemonic.value!.split(' ').length).toBe(12);
    });

    it('should generate wallet and seed from a mnemonic', () => {
      const mnemonic = cryptoCore.generateNewMnemonic();
      const { wallet, seed } = cryptoCore.walletAndSeedFromMnemonic(mnemonic);
      expect(wallet).toBeDefined();
      expect(seed).toBeInstanceOf(Uint8Array);
      expect(seed.length).toBe(64); // Default seed length for bip39
    });

    it('should throw when using an invalid mnemonic', () => {
      const invalidMnemonic = new SecureString('this is not a valid mnemonic');
      expect(() =>
        cryptoCore.walletAndSeedFromMnemonic(invalidMnemonic),
      ).toThrow('Invalid mnemonic');
    });

    it('should generate a key pair from a seed', () => {
      const mnemonic = cryptoCore.generateNewMnemonic();
      const { seed } = cryptoCore.walletAndSeedFromMnemonic(mnemonic);
      const keyPair = cryptoCore.seedToSimpleKeyPair(seed);
      expect(keyPair.privateKey.length).toBe(32);
      expect(keyPair.publicKey.length).toBe(65);
    });

    it('should generate a new key pair', async () => {
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      expect(keyPair.privateKey.length).toBe(32);
      expect(keyPair.publicKey.length).toBe(65);
    });

    it('should derive the same public key from a private key', () => {
      const privateKey = cryptoCore.generatePrivateKey();
      const publicKey = cryptoCore.getPublicKey(privateKey);
      const keyPair = { privateKey, publicKey };
      expect(keyPair.publicKey).toEqual(publicKey);
    });
  });

  describe('Shared Key', () => {
    it('should compute a shared secret key', async () => {
      const keyPair1 = await cryptoCore.generateEphemeralKeyPair();
      const keyPair2 = await cryptoCore.generateEphemeralKeyPair();

      const sharedKey1 = cryptoCore.computeSharedSecret(
        keyPair1.privateKey,
        keyPair2.publicKey,
      );
      const sharedKey2 = cryptoCore.computeSharedSecret(
        keyPair2.privateKey,
        keyPair1.publicKey,
      );

      expect(sharedKey1).toEqual(sharedKey2);
      expect(sharedKey1.length).toBe(32);
    });
  });
});
