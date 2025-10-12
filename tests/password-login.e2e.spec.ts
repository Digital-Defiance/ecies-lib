import { Wallet } from '@ethereumjs/wallet';
import { PasswordLoginService } from '../src/services/password-login';
import { ECIESService } from '../src/services/ecies';
import { SecureString } from '../src/secure-string';
import { Pbkdf2ProfileEnum } from '../src/enumerations';
import { Pbkdf2Service } from '../src/services/pbkdf2';
import { getCompatibleEciesEngine } from '../src/i18n-setup';

describe('PasswordLoginService E2E', () => {
  let passwordLoginService: PasswordLoginService;
  let eciesService: ECIESService;
  let pbkdf2Service: Pbkdf2Service;
  let testMnemonic: SecureString;
  let testPassword: SecureString;

  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage?.clear();

    eciesService = new ECIESService();
    pbkdf2Service = new Pbkdf2Service(getCompatibleEciesEngine());
    passwordLoginService = new PasswordLoginService(eciesService, pbkdf2Service, getCompatibleEciesEngine());

    // Use real test data
    testMnemonic = new SecureString(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    );
    testPassword = new SecureString('test-password-123');
  });

  afterEach(() => {
    testMnemonic?.dispose();
    testPassword?.dispose();
    global.localStorage?.clear();
  });

  describe('Full Password Login Flow', () => {
    it('should complete setup and recovery cycle successfully', async () => {
      // Setup password login
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword);

      // Verify localStorage contains required data
      expect(localStorage.getItem('passwordLoginSalt')).toBeTruthy();
      expect(localStorage.getItem('encryptedPrivateKey')).toBeTruthy();
      expect(localStorage.getItem('encryptedMnemonic')).toBeTruthy();

      // Recover wallet and mnemonic
      const result =
        await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          testPassword,
        );

      // Verify recovered data
      expect(result.wallet).toBeInstanceOf(Wallet);
      expect(result.mnemonic).toBeInstanceOf(SecureString);

      // Verify mnemonic matches original
      expect(result.mnemonic.value).toBe(testMnemonic.value);

      // Verify wallet can be derived from recovered mnemonic
      const { wallet: originalWallet } =
        eciesService.walletAndSeedFromMnemonic(testMnemonic);
      expect(result.wallet.getPrivateKey()).toEqual(
        originalWallet.getPrivateKey(),
      );
      expect(result.wallet.getPublicKey()).toEqual(
        originalWallet.getPublicKey(),
      );

      result.mnemonic.dispose();
    });

    it('should handle different password strengths', async () => {
      const passwords = [
        new SecureString('weak'),
        new SecureString('medium-strength-password'),
        new SecureString('very-strong-password-with-special-chars!@#$%^&*()'),
        new SecureString('unicode-password-世界-🔐'),
      ];

      // Test passwords in parallel for better performance
      const testPromises = passwords.map(async (password, index) => {
        try {
          // Use unique storage keys to avoid conflicts
          const originalSetItem = localStorage.setItem;
          const originalGetItem = localStorage.getItem;
          const originalRemoveItem = localStorage.removeItem;
          const originalClear = localStorage.clear;
          
          const prefix = `test_${index}_`;
          
          // Mock localStorage with prefixed keys for parallel execution
          const mockStorage: { [key: string]: string } = {};
          
          localStorage.setItem = (key: string, value: string) => {
            mockStorage[prefix + key] = value;
          };
          
          localStorage.getItem = (key: string) => {
            return mockStorage[prefix + key] || null;
          };
          
          localStorage.removeItem = (key: string) => {
            delete mockStorage[prefix + key];
          };
          
          localStorage.clear = () => {
            Object.keys(mockStorage).forEach(key => {
              if (key.startsWith(prefix)) {
                delete mockStorage[key];
              }
            });
          };

          await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, password, Pbkdf2ProfileEnum.TEST_FAST);
          const result =
            await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(password);

          expect(result.mnemonic.value).toBe(testMnemonic.value);
          result.mnemonic.dispose();
          
          // Restore original localStorage methods
          localStorage.setItem = originalSetItem;
          localStorage.getItem = originalGetItem;
          localStorage.removeItem = originalRemoveItem;
          localStorage.clear = originalClear;
        } finally {
          password.dispose();
        }
      });

      await Promise.all(testPromises);
    }, 60000);

    it('should handle different mnemonic lengths', async () => {
      const mnemonics = [
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', // 12 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon agent', // 18 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art', // 24 words
      ];

      for (const mnemonicPhrase of mnemonics) {
        const mnemonic = new SecureString(mnemonicPhrase);
        localStorage.clear();

        await passwordLoginService.setupPasswordLoginLocalStorageBundle(mnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
        const result =
          await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
            testPassword,
          );

        expect(result.mnemonic.value).toBe(mnemonicPhrase);

        result.mnemonic.dispose();
        mnemonic.dispose();
      }
    });

    it('should fail with wrong password', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);

      const wrongPassword = new SecureString('wrong-password');

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(wrongPassword),
      ).rejects.toThrow();

      wrongPassword.dispose();
    });

    it('should fail when localStorage is cleared', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);

      // Clear localStorage
      localStorage.clear();

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(testPassword),
      ).rejects.toThrow('Password login is not set up');
    });

    it('should fail when localStorage data is corrupted', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);

      // Corrupt the salt
      localStorage.setItem('passwordLoginSalt', 'invalid-hex-data');

      await expect(
        passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(testPassword),
      ).rejects.toThrow();
    });
  });

  describe('createPasswordLoginBundle', () => {
    it('should create bundle without localStorage', async () => {
      const bundle = await passwordLoginService.createPasswordLoginBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);

      expect(bundle.salt).toBeInstanceOf(Uint8Array);
      expect(bundle.encryptedPrivateKey).toBeInstanceOf(Uint8Array);
      expect(bundle.encryptedMnemonic).toBeInstanceOf(Uint8Array);
      expect(bundle.wallet).toBeInstanceOf(Wallet);

      // Verify localStorage is not used
      expect(localStorage.getItem('passwordLoginSalt')).toBeNull();
    });
  });

  describe('getWalletAndMnemonicFromEncryptedPasswordBundle', () => {
    it('should decrypt bundle without localStorage', async () => {
      const bundle = await passwordLoginService.createPasswordLoginBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
      
      const result = await passwordLoginService.getWalletAndMnemonicFromEncryptedPasswordBundle(
        bundle.salt,
        bundle.encryptedPrivateKey,
        bundle.encryptedMnemonic,
        testPassword,
        Pbkdf2ProfileEnum.TEST_FAST
      );

      expect(result.wallet).toBeInstanceOf(Wallet);
      expect(result.mnemonic.value).toBe(testMnemonic.value);

      result.mnemonic.dispose();
    });
  });

  describe('Encryption/Decryption Integrity', () => {
    it('should maintain data integrity across multiple operations', async () => {
      const iterations = 5;
      const results: Array<{ wallet: Wallet; mnemonic: SecureString }> = [];

      for (let i = 0; i < iterations; i++) {
        localStorage.clear();

        await passwordLoginService.setupPasswordLoginLocalStorageBundle(
          testMnemonic,
          testPassword,
          Pbkdf2ProfileEnum.TEST_FAST
        );
        const result =
          await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
            testPassword,
          );

        results.push(result);
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i].wallet.getPrivateKey()).toEqual(
          results[0].wallet.getPrivateKey(),
        );
        expect(results[i].mnemonic.value).toBe(results[0].mnemonic.value);
      }

      // Cleanup
      results.forEach((result) => result.mnemonic.dispose());
    });

    it('should generate unique salts for each setup', async () => {
      const salts: string[] = [];

      for (let i = 0; i < 3; i++) {
        localStorage.clear();

        await passwordLoginService.setupPasswordLoginLocalStorageBundle(
          testMnemonic,
          testPassword,
          Pbkdf2ProfileEnum.TEST_FAST
        );
        const salt = localStorage.getItem('passwordLoginSalt');

        expect(salt).toBeTruthy();
        expect(salts).not.toContain(salt);
        salts.push(salt!);
      }
    });

    it('should encrypt private keys differently each time', async () => {
      const encryptedKeys: string[] = [];

      for (let i = 0; i < 3; i++) {
        localStorage.clear();

        await passwordLoginService.setupPasswordLoginLocalStorageBundle(
          testMnemonic,
          testPassword,
          Pbkdf2ProfileEnum.TEST_FAST
        );
        const encryptedKey = localStorage.getItem('encryptedPrivateKey');

        expect(encryptedKey).toBeTruthy();
        expect(encryptedKeys).not.toContain(encryptedKey);
        encryptedKeys.push(encryptedKey!);
      }
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work with different crypto implementations', async () => {
      // Test that the service works with the actual Web Crypto API
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);

      const result =
        await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          testPassword,
        );

      expect(result.wallet).toBeInstanceOf(Wallet);
      expect(result.mnemonic.value).toBe(testMnemonic.value);

      result.mnemonic.dispose();
    });

    it('should handle large data sets', async () => {
      // Test with a valid 24-word mnemonic (largest standard size)
      const longMnemonic = new SecureString(
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
      );

      await passwordLoginService.setupPasswordLoginLocalStorageBundle(longMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
      const result =
        await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          testPassword,
        );

      expect(result.mnemonic.value).toBe(longMnemonic.value);

      result.mnemonic.dispose();
      longMnemonic.dispose();
    });
  });

  describe('Performance Tests', () => {
    it('should complete setup within reasonable time', async () => {
      const startTime = Date.now();

      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds (generous for CI environments)
      expect(duration).toBeLessThan(10000);
    });

    it('should complete recovery within reasonable time', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);

      const startTime = Date.now();

      const result =
        await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          testPassword,
        );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Recovery should be faster than setup
      expect(duration).toBeLessThan(10000);

      result.mnemonic.dispose();
    });
  });

  describe('Security Tests', () => {
    it('should use BROWSER_PASSWORD profile for PBKDF2', async () => {
      // This is tested indirectly by ensuring the operation completes
      // and produces consistent results
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.BROWSER_PASSWORD);

      const result1 =
        await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          testPassword,
        );
      const result2 =
        await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(
          testPassword,
        );

      expect(result1.wallet.getPrivateKey()).toEqual(
        result2.wallet.getPrivateKey(),
      );

      result1.mnemonic.dispose();
      result2.mnemonic.dispose();
    });

    it('should not store plaintext passwords or mnemonics', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);

      const salt = localStorage.getItem('passwordLoginSalt');
      const encryptedKey = localStorage.getItem('encryptedPrivateKey');
      const encryptedMnemonic = localStorage.getItem('encryptedMnemonic');

      // Verify no plaintext data is stored
      expect(salt).not.toContain(testPassword.value);
      expect(encryptedKey).not.toContain(testPassword.value);
      expect(encryptedMnemonic).not.toContain(testPassword.value);
      expect(encryptedMnemonic).not.toContain(testMnemonic.value);
    });
  });

  describe('Error Handling', () => {
    it('should handle concurrent setup attempts gracefully', async () => {
      const promises = Array(3)
        .fill(null)
        .map(() =>
          passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST),
        );

      // All should complete without throwing
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should handle concurrent recovery attempts gracefully', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);

      const promises = Array(3)
        .fill(null)
        .map(() =>
          passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(testPassword),
        );

      const results = await Promise.all(promises);

      // All should succeed and return identical results
      for (let i = 1; i < results.length; i++) {
        expect(results[i].wallet.getPrivateKey()).toEqual(
          results[0].wallet.getPrivateKey(),
        );
        expect(results[i].mnemonic.value).toBe(results[0].mnemonic.value);
      }

      results.forEach((result) => result.mnemonic.dispose());
    });
  });

  describe('isPasswordLoginSetup', () => {
    it('should return false before setup', () => {
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
    });

    it('should return true after successful setup', async () => {
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);

      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);

      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(true);
    });

    it('should return false after localStorage is cleared', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(true);

      localStorage.clear();
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
    });

    it('should return false when only salt is present', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(true);

      // Remove encrypted private key and mnemonic, leaving only salt
      localStorage.removeItem('encryptedPrivateKey');
      localStorage.removeItem('encryptedMnemonic');

      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
    });

    it('should return false when only encrypted private key is present', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(true);

      // Remove salt and encrypted mnemonic, leaving only encrypted private key
      localStorage.removeItem('passwordLoginSalt');
      localStorage.removeItem('encryptedMnemonic');

      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
    });

    it('should return false when only encrypted mnemonic is present', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(true);

      // Remove salt and encrypted private key, leaving only encrypted mnemonic
      localStorage.removeItem('passwordLoginSalt');
      localStorage.removeItem('encryptedPrivateKey');

      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
    });

    it('should return false when salt is corrupted to empty string', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(true);

      localStorage.setItem('passwordLoginSalt', '');
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
    });

    it('should return false when encrypted private key is corrupted to empty string', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(true);

      localStorage.setItem('encryptedPrivateKey', '');
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
    });

    it('should return false when encrypted mnemonic is corrupted to empty string', async () => {
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(true);

      localStorage.setItem('encryptedMnemonic', '');
      expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
    });

    it('should consistently return same result across multiple calls', async () => {
      // Test when not setup
      for (let i = 0; i < 5; i++) {
        expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
      }

      // Setup and test when setup
      await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
      for (let i = 0; i < 5; i++) {
        expect(PasswordLoginService.isPasswordLoginSetup()).toBe(true);
      }

      // Clear and test when not setup again
      localStorage.clear();
      for (let i = 0; i < 5; i++) {
        expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
      }
    });

    it('should work correctly after multiple setup cycles', async () => {
      const iterations = 3;

      for (let i = 0; i < iterations; i++) {
        expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);

        await passwordLoginService.setupPasswordLoginLocalStorageBundle(testMnemonic, testPassword, Pbkdf2ProfileEnum.TEST_FAST);
        expect(PasswordLoginService.isPasswordLoginSetup()).toBe(true);

        localStorage.clear();
        expect(PasswordLoginService.isPasswordLoginSetup()).toBe(false);
      }
    });
  });
});