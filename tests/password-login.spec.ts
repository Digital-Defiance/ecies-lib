import { Wallet } from '@ethereumjs/wallet';
import { EciesEncryptionTypeEnum } from '../src/enumerations/ecies-encryption-type';
import { Pbkdf2ProfileEnum } from '../src/enumerations/pbkdf2-profile';
import { SecureString } from '../src/secure-string';
import { ECIESService } from '../src/services/ecies/service';
import { PasswordLoginService } from '../src/services/password-login';
import { Pbkdf2Service } from '../src/services/pbkdf2';
import { hexToUint8Array, uint8ArrayToHex } from '../src/utils';

// Mock dependencies
jest.mock('../src/services/pbkdf2');
jest.mock('../src/services/ecies/service');
jest.mock('../src/services/aes-gcm', () => {
  const mockInstance = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    splitEncryptedData: jest.fn(),
    combineIvTagAndEncryptedData: jest.fn(),
    combineEncryptedDataAndTag: jest.fn(),
  };
  const MockConstructor = jest.fn(() => mockInstance);
  // Expose the instance on the constructor so tests can access it
  MockConstructor.encrypt = mockInstance.encrypt;
  MockConstructor.decrypt = mockInstance.decrypt;
  MockConstructor.splitEncryptedData = mockInstance.splitEncryptedData;
  MockConstructor.combineIvTagAndEncryptedData =
    mockInstance.combineIvTagAndEncryptedData;
  MockConstructor.combineEncryptedDataAndTag =
    mockInstance.combineEncryptedDataAndTag;
  return {
    AESGCMService: MockConstructor,
  };
});
jest.mock('../src/utils', () => ({
  hexToUint8Array: jest.fn(),
  uint8ArrayToHex: jest.fn(),
  isValidTimezone: jest.fn().mockReturnValue(true),
  validateEnumCollection: jest.fn(),
}));

// Mock crypto.subtle for AES operations
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('PasswordLoginService', () => {
  let passwordLoginService: PasswordLoginService;
  let mockEciesService: jest.Mocked<ECIESService>;
  let mockPbkdf2Service: jest.Mocked<Pbkdf2Service>;
  let mockMnemonic: SecureString;
  let mockPassword: SecureString;
  let mockWallet: Wallet;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AESGCMService methods
    const { AESGCMService } = require('../src/services/aes-gcm');
    AESGCMService.encrypt.mockResolvedValue({
      encrypted: new Uint8Array(16).fill(4),
      iv: new Uint8Array(16).fill(1),
      tag: new Uint8Array(16).fill(2),
    });
    AESGCMService.decrypt.mockResolvedValue(new Uint8Array(32).fill(1));
    AESGCMService.splitEncryptedData.mockReturnValue({
      iv: new Uint8Array(16).fill(1),
      encryptedDataWithTag: new Uint8Array(32).fill(4),
    });
    AESGCMService.combineIvTagAndEncryptedData.mockImplementation(
      (iv, encrypted, tag) => {
        const result = new Uint8Array(
          iv.length + encrypted.length + tag.length,
        );
        result.set(iv, 0);
        result.set(encrypted, iv.length);
        result.set(tag, iv.length + encrypted.length);
        return result;
      },
    );
    AESGCMService.combineEncryptedDataAndTag.mockImplementation(
      (encrypted, tag) => {
        const result = new Uint8Array(encrypted.length + tag.length);
        result.set(encrypted, 0);
        result.set(tag, encrypted.length);
        return result;
      },
    );

    // Setup mocks
    mockEciesService = {
      walletAndSeedFromMnemonic: jest.fn(),
      encrypt: jest.fn(),
      decryptBasicWithHeader: jest.fn(),
      decryptWithLengthAndHeader: jest.fn(),
    } as any;

    mockMnemonic = {
      valueAsUint8Array: new Uint8Array([
        109, 110, 101, 109, 111, 110, 105, 99,
      ]), // "mnemonic"
    } as SecureString;

    mockPassword = {
      valueAsUint8Array: new Uint8Array([
        112, 97, 115, 115, 119, 111, 114, 100,
      ]), // "password"
    } as SecureString;

    // Mock wallet
    const mockPrivateKey = new Uint8Array(32).fill(1);
    const mockPublicKey = new Uint8Array(65).fill(2);
    mockWallet = {
      getPrivateKey: jest.fn().mockReturnValue(mockPrivateKey),
      getPublicKey: jest.fn().mockReturnValue(mockPublicKey),
    } as any;

    // Mock Pbkdf2Service
    mockPbkdf2Service = {
      deriveKeyFromPasswordWithProfileAsync: jest.fn().mockResolvedValue({
        salt: new Uint8Array(64).fill(3),
        hash: new Uint8Array(32).fill(4),
        iterations: 2000000,
      }),
      deriveKeyFromPasswordAsync: jest.fn(),
      getConfig: jest.fn(),
      getProfileConfig: jest.fn(),
    } as any;

    const mockAesGcmService = new AESGCMService();
    passwordLoginService = new PasswordLoginService(
      mockAesGcmService,
      mockEciesService,
      mockPbkdf2Service,
    );

    mockEciesService.walletAndSeedFromMnemonic.mockReturnValue({
      wallet: mockWallet,
      seed: new Uint8Array(32),
    });

    mockEciesService.encrypt.mockResolvedValue(new Uint8Array([5, 6, 7, 8]));

    (uint8ArrayToHex as jest.Mock).mockImplementation((arr: Uint8Array) =>
      Array.from(arr)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    );

    (hexToUint8Array as jest.Mock).mockImplementation((hex: string) => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    });

    // Mock crypto operations
    mockCrypto.getRandomValues.mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    });

    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
    // Mock encrypt to return IV (16 bytes) + encrypted data + auth tag (16 bytes)
    const mockEncryptedWithTag = new Uint8Array(48); // 16 (data) + 16 (tag)
    mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedWithTag.buffer);
    // Mock decrypt to return decrypted private key
    const mockDecryptedKey = new Uint8Array(32).fill(1);
    mockCrypto.subtle.decrypt.mockResolvedValue(mockDecryptedKey.buffer);
  });

  describe('createPasswordLoginBundle', () => {
    it('should create password login bundle successfully', async () => {
      const result = await passwordLoginService.createPasswordLoginBundle(
        mockMnemonic,
        mockPassword,
        Pbkdf2ProfileEnum.TEST_FAST,
      );

      expect(result.salt).toBeInstanceOf(Uint8Array);
      expect(result.encryptedPrivateKey).toBeInstanceOf(Uint8Array);
      expect(result.encryptedMnemonic).toBeInstanceOf(Uint8Array);
      expect(result.wallet).toBe(mockWallet);
    });
  });

  describe('setupPasswordLoginLocalStorageBundle', () => {
    it('should setup password login successfully', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(
        mockMnemonic,
        mockPassword,
      );

      // Verify PBKDF2 was called with correct parameters
      expect(
        mockPbkdf2Service.deriveKeyFromPasswordWithProfileAsync,
      ).toHaveBeenCalledWith(
        mockPassword.valueAsUint8Array,
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
      );

      // Verify wallet was derived from mnemonic
      expect(mockEciesService.walletAndSeedFromMnemonic).toHaveBeenCalledWith(
        mockMnemonic,
      );

      // Verify AES encryption was called
      const { AESGCMService } = require('../src/services/aes-gcm');
      expect(AESGCMService.encrypt).toHaveBeenCalled();
      expect(AESGCMService.combineIvTagAndEncryptedData).toHaveBeenCalled();

      // Verify mnemonic encryption
      expect(mockEciesService.encrypt).toHaveBeenCalledWith(
        EciesEncryptionTypeEnum.Basic,
        mockWallet.getPublicKey(),
        mockMnemonic.valueAsUint8Array,
      );

      // Verify localStorage calls
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(4);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'passwordLoginSalt',
        expect.any(String),
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'encryptedPrivateKey',
        expect.any(String),
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'encryptedMnemonic',
        expect.any(String),
      );
    });

    it('should handle PBKDF2 derivation failure', async () => {
      mockPbkdf2Service.deriveKeyFromPasswordWithProfileAsync.mockRejectedValue(
        new Error('PBKDF2 failed'),
      );

      await expect(
        passwordLoginService.setupPasswordLoginLocalStorageBundle(
          mockMnemonic,
          mockPassword,
        ),
      ).rejects.toThrow('PBKDF2 failed');
    });

    it('should handle wallet derivation failure', async () => {
      mockEciesService.walletAndSeedFromMnemonic.mockImplementation(() => {
        throw new Error('Wallet derivation failed');
      });

      await expect(
        passwordLoginService.setupPasswordLoginLocalStorageBundle(
          mockMnemonic,
          mockPassword,
        ),
      ).rejects.toThrow('Wallet derivation failed');
    });

    it('should handle AES encryption failure', async () => {
      const { AESGCMService } = require('../src/services/aes-gcm');
      AESGCMService.encrypt.mockRejectedValue(
        new Error('AES encryption failed'),
      );

      await expect(
        passwordLoginService.setupPasswordLoginLocalStorageBundle(
          mockMnemonic,
          mockPassword,
        ),
      ).rejects.toThrow('AES encryption failed');
    });

    it('should handle ECIES encryption failure', async () => {
      mockEciesService.encrypt.mockRejectedValue(
        new Error('ECIES encryption failed'),
      );

      await expect(
        passwordLoginService.setupPasswordLoginLocalStorageBundle(
          mockMnemonic,
          mockPassword,
        ),
      ).rejects.toThrow('ECIES encryption failed');
    });
  });

  describe('getWalletAndMnemonicFromEncryptedPasswordBundle', () => {
    it('should decrypt bundle successfully', async () => {
      const mockSalt = new Uint8Array(64).fill(3);
      // Encrypted key must be: IV (16) + encrypted data + auth tag (16)
      const mockEncryptedKey = new Uint8Array(48);
      // Set IV (first 16 bytes) to non-zero values
      for (let i = 0; i < 16; i++) mockEncryptedKey[i] = i + 1;
      // Set encrypted data and tag
      for (let i = 16; i < 48; i++) mockEncryptedKey[i] = 4;
      const mockEncryptedMnemonic = new Uint8Array([5, 6, 7, 8]);

      (Wallet as any).fromPrivateKey = jest.fn().mockReturnValue(mockWallet);
      mockEciesService.decryptBasicWithHeader.mockResolvedValue(
        new Uint8Array([109, 110, 101, 109, 111, 110, 105, 99]),
      );

      const result =
        await passwordLoginService.getWalletAndMnemonicFromEncryptedPasswordBundle(
          mockSalt,
          mockEncryptedKey,
          mockEncryptedMnemonic,
          mockPassword,
        );

      expect(result.wallet).toBe(mockWallet);
      expect(result.mnemonic).toBeInstanceOf(SecureString);
    });
  });

  describe('getWalletAndMnemonicFromLocalStorageBundle', () => {
    const mockSaltHex =
      '0303030303030303030303030303030303030303030303030303030303030303';
    // Encrypted key: IV (16 bytes with values 01-10) + encrypted data + auth tag
    const mockEncryptedPrivateKeyHex =
      '0102030405060708090a0b0c0d0e0f10' + // IV (16 bytes)
      '04040404040404040404040404040404' + // encrypted data (16 bytes)
      '04040404040404040404040404040404'; // auth tag (16 bytes)
    const mockEncryptedMnemonicHex = '05060708';
    const mockDecryptedMnemonic = new Uint8Array([
      109, 110, 101, 109, 111, 110, 105, 99,
    ]);

    beforeEach(() => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'passwordLoginSalt':
            return mockSaltHex;
          case 'encryptedPrivateKey':
            return mockEncryptedPrivateKeyHex;
          case 'encryptedMnemonic':
            return mockEncryptedMnemonicHex;
          default:
            return null;
        }
      });

      mockEciesService.decryptBasicWithHeader.mockResolvedValue(
        mockDecryptedMnemonic,
      );

      // Mock Wallet.fromPrivateKey
      (Wallet as any).fromPrivateKey = jest.fn().mockReturnValue(mockWallet);
    });

    it('should recover wallet and mnemonic successfully', async () => {
      const result =
        await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          mockPassword,
        );

      // Verify localStorage reads
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'passwordLoginSalt',
      );
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'encryptedPrivateKey',
      );
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'encryptedMnemonic',
      );

      // Verify PBKDF2 derivation with stored salt
      expect(
        mockPbkdf2Service.deriveKeyFromPasswordWithProfileAsync,
      ).toHaveBeenCalledWith(
        mockPassword.valueAsUint8Array,
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
        expect.any(Uint8Array),
      );

      // Verify AES decryption
      const { AESGCMService } = require('../src/services/aes-gcm');
      expect(AESGCMService.splitEncryptedData).toHaveBeenCalled();
      expect(AESGCMService.decrypt).toHaveBeenCalled();

      // Verify wallet creation
      expect(Wallet.fromPrivateKey).toHaveBeenCalledWith(
        expect.any(Uint8Array),
      );

      // Verify ECIES decryption
      expect(mockEciesService.decryptBasicWithHeader).toHaveBeenCalledWith(
        mockWallet.getPrivateKey(),
        expect.any(Uint8Array),
      );

      // Verify result
      expect(result.wallet).toBe(mockWallet);
      expect(result.mnemonic).toBeInstanceOf(SecureString);
    });

    it('should throw error when salt is missing', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'passwordLoginSalt') return null;
        return 'mock-value';
      });

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          mockPassword,
        ),
      ).rejects.toThrow('Password login is not set up');
    });

    it('should throw error when encrypted private key is missing', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'encryptedPrivateKey') return null;
        return 'mock-value';
      });

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          mockPassword,
        ),
      ).rejects.toThrow('Password login is not set up');
    });

    it('should throw error when encrypted mnemonic is missing', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'encryptedMnemonic') return null;
        return 'mock-value';
      });

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          mockPassword,
        ),
      ).rejects.toThrow('Password login is not set up');
    });

    it('should handle PBKDF2 derivation failure during recovery', async () => {
      mockPbkdf2Service.deriveKeyFromPasswordWithProfileAsync.mockRejectedValue(
        new Error('PBKDF2 failed'),
      );

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          mockPassword,
        ),
      ).rejects.toThrow('PBKDF2 failed');
    });

    it('should handle AES decryption failure', async () => {
      const { AESGCMService } = require('../src/services/aes-gcm');
      AESGCMService.decrypt.mockRejectedValue(
        new Error('Invalid initialization vector (IV)'),
      );

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          mockPassword,
        ),
      ).rejects.toThrow('Invalid initialization vector (IV)');
    });

    it('should handle wallet creation failure', async () => {
      (Wallet as any).fromPrivateKey.mockImplementation(() => {
        throw new Error('Invalid private key');
      });

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          mockPassword,
        ),
      ).rejects.toThrow('Invalid private key');
    });

    it('should handle ECIES decryption failure', async () => {
      mockEciesService.decryptBasicWithHeader.mockRejectedValue(
        new Error('Invalid initialization vector (IV)'),
      );

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          mockPassword,
        ),
      ).rejects.toThrow('Invalid initialization vector (IV)');
    });
  });

  describe('integration scenarios', () => {
    it('should complete full setup and recovery cycle', async () => {
      // Setup
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(
        mockMnemonic,
        mockPassword,
      );

      // Verify setup calls
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(4);

      // Mock localStorage for recovery
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'passwordLoginSalt':
            return '0303030303030303030303030303030303030303030303030303030303030303';
          case 'encryptedPrivateKey':
            return '0404040404040404040404040404040404040404040404040404040404040404';
          case 'encryptedMnemonic':
            return '05060708';
          default:
            return null;
        }
      });

      // Mock Wallet.fromPrivateKey for recovery
      (Wallet as any).fromPrivateKey = jest.fn().mockReturnValue(mockWallet);
      mockEciesService.decryptBasicWithHeader.mockResolvedValue(
        new Uint8Array([109, 110, 101, 109, 111, 110, 105, 99]),
      );

      // Recovery
      const result =
        await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          mockPassword,
        );

      expect(result.wallet).toBe(mockWallet);
      expect(result.mnemonic).toBeInstanceOf(SecureString);
    });

    it('should handle different password profiles correctly', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(
        mockMnemonic,
        mockPassword,
      );

      expect(
        mockPbkdf2Service.deriveKeyFromPasswordWithProfileAsync,
      ).toHaveBeenCalledWith(
        mockPassword.valueAsUint8Array,
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
      );
    });
  });

  describe('error edge cases', () => {
    it('should handle empty password', async () => {
      const emptyPassword = {
        valueAsUint8Array: new Uint8Array(0),
      } as SecureString;

      // Should not throw during setup, but may fail during crypto operations
      await expect(
        passwordLoginService.setupPasswordLoginLocalStorageBundle(
          mockMnemonic,
          emptyPassword,
        ),
      ).resolves.not.toThrow();
    });

    it('should handle empty mnemonic', async () => {
      const emptyMnemonic = {
        valueAsUint8Array: new Uint8Array(0),
      } as SecureString;

      await expect(
        passwordLoginService.setupPasswordLoginLocalStorageBundle(
          emptyMnemonic,
          mockPassword,
        ),
      ).resolves.not.toThrow();
    });

    it('should handle corrupted localStorage data', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'passwordLoginSalt':
            return 'invalid-hex';
          case 'encryptedPrivateKey':
            return 'also-invalid-hex';
          case 'encryptedMnemonic':
            return 'still-invalid-hex';
          default:
            return null;
        }
      });

      (hexToUint8Array as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid hex string');
      });

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          mockPassword,
        ),
      ).rejects.toThrow('Invalid hex string');
    });
  });

  describe('isPasswordLoginSetup', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockClear();
    });

    it('should return true when all required localStorage items exist with values', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'passwordLoginSalt':
            return 'some-salt-hex';
          case 'encryptedPrivateKey':
            return 'some-encrypted-key-hex';
          case 'encryptedMnemonic':
            return 'some-encrypted-mnemonic-hex';
          default:
            return null;
        }
      });

      const result = PasswordLoginService.isPasswordLoginSetup();

      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'passwordLoginSalt',
      );
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'encryptedPrivateKey',
      );
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'encryptedMnemonic',
      );
    });

    it('should return false when salt is missing', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'passwordLoginSalt':
            return null;
          case 'encryptedPrivateKey':
            return 'some-encrypted-key-hex';
          case 'encryptedMnemonic':
            return 'some-encrypted-mnemonic-hex';
          default:
            return null;
        }
      });

      const result = PasswordLoginService.isPasswordLoginSetup();

      expect(result).toBe(false);
    });

    it('should return false when encryptedPrivateKey is missing', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'passwordLoginSalt':
            return 'some-salt-hex';
          case 'encryptedPrivateKey':
            return null;
          case 'encryptedMnemonic':
            return 'some-encrypted-mnemonic-hex';
          default:
            return null;
        }
      });

      const result = PasswordLoginService.isPasswordLoginSetup();

      expect(result).toBe(false);
    });

    it('should return false when encryptedMnemonic is missing', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'passwordLoginSalt':
            return 'some-salt-hex';
          case 'encryptedPrivateKey':
            return 'some-encrypted-key-hex';
          case 'encryptedMnemonic':
            return null;
          default:
            return null;
        }
      });

      const result = PasswordLoginService.isPasswordLoginSetup();

      expect(result).toBe(false);
    });

    it('should return false when salt is empty string', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'passwordLoginSalt':
            return '';
          case 'encryptedPrivateKey':
            return 'some-encrypted-key-hex';
          case 'encryptedMnemonic':
            return 'some-encrypted-mnemonic-hex';
          default:
            return null;
        }
      });

      const result = PasswordLoginService.isPasswordLoginSetup();

      expect(result).toBe(false);
    });

    it('should return false when encryptedPrivateKey is empty string', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'passwordLoginSalt':
            return 'some-salt-hex';
          case 'encryptedPrivateKey':
            return '';
          case 'encryptedMnemonic':
            return 'some-encrypted-mnemonic-hex';
          default:
            return null;
        }
      });

      const result = PasswordLoginService.isPasswordLoginSetup();

      expect(result).toBe(false);
    });

    it('should return false when encryptedMnemonic is empty string', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'passwordLoginSalt':
            return 'some-salt-hex';
          case 'encryptedPrivateKey':
            return 'some-encrypted-key-hex';
          case 'encryptedMnemonic':
            return '';
          default:
            return null;
        }
      });

      const result = PasswordLoginService.isPasswordLoginSetup();

      expect(result).toBe(false);
    });

    it('should return false when all items are missing', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = PasswordLoginService.isPasswordLoginSetup();

      expect(result).toBe(false);
    });

    it('should return false when all items are empty strings', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const result = PasswordLoginService.isPasswordLoginSetup();

      expect(result).toBe(false);
    });
  });
});
