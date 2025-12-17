import { PluginI18nEngine } from '@digitaldefiance/i18n-lib';
import { ECIES, PBKDF2, PBKDF2_PROFILES } from '../src/constants';
import { Pbkdf2ProfileEnum } from '../src/enumerations/pbkdf2-profile';
import { getEciesI18nEngine } from '../src/i18n-setup';
import { IPbkdf2Config } from '../src/interfaces/pbkdf2-config';
import { IPbkdf2Result } from '../src/interfaces/pbkdf2-result';
import { Pbkdf2Service } from '../src/services/pbkdf2';

// Mock crypto.subtle for testing
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    deriveBits: jest.fn(),
    exportKey: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

describe('Pbkdf2Service', () => {
  let pbkdf2Service: Pbkdf2Service<string>;
  let _i18nEngine: PluginI18nEngine<string>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize I18n engine with ECIES component
    PluginI18nEngine.resetAll();
    _i18nEngine = getEciesI18nEngine();

    pbkdf2Service = new Pbkdf2Service();

    // Default mock implementations
    mockCrypto.getRandomValues.mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    });

    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
    mockCrypto.subtle.deriveKey.mockResolvedValue({} as CryptoKey);
    mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
  });

  afterEach(() => {
    PluginI18nEngine.resetAll();
  });

  describe('getProfileConfig', () => {
    it('should return correct config for BROWSER_PASSWORD profile', () => {
      const config = pbkdf2Service.getProfileConfig(
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
      );

      expect(config).toEqual({
        hashBytes: 32,
        saltBytes: 64,
        iterations: 2000000,
        algorithm: 'SHA-512',
      });
    });
  });

  describe('getConfig', () => {
    it('should return default config when no parameters provided', () => {
      const config = pbkdf2Service.getConfig();

      expect(config).toEqual({
        hashBytes: ECIES.SYMMETRIC.KEY_SIZE,
        saltBytes: PBKDF2.SALT_BYTES,
        iterations: PBKDF2.ITERATIONS_PER_SECOND,
        algorithm: PBKDF2.ALGORITHM,
      });
    });

    it('should use provided parameters', () => {
      const config = pbkdf2Service.getConfig(500000, 16, 64, 'SHA-512');

      expect(config).toEqual({
        hashBytes: 64,
        saltBytes: 16,
        iterations: 500000,
        algorithm: 'SHA-512',
      });
    });

    it('should use defaults for undefined parameters', () => {
      const config = pbkdf2Service.getConfig(undefined, 16);

      expect(config).toEqual({
        hashBytes: ECIES.SYMMETRIC.KEY_SIZE,
        saltBytes: 16,
        iterations: PBKDF2.ITERATIONS_PER_SECOND,
        algorithm: PBKDF2.ALGORITHM,
      });
    });
  });

  describe('deriveKeyFromPasswordAsync', () => {
    const mockPassword = new Uint8Array([
      112, 97, 115, 115, 119, 111, 114, 100,
    ]); // "password"
    const mockSalt = new Uint8Array(32).fill(1);
    const mockDerivedKeyArray = new ArrayBuffer(32);
    const mockDerivedKey = new Uint8Array(mockDerivedKeyArray);

    beforeEach(() => {
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockDerivedKeyArray);
    });

    it('should derive key successfully with default parameters', async () => {
      const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
        mockPassword,
      );

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        mockPassword,
        'PBKDF2',
        false,
        ['deriveBits'],
      );

      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          iterations: 1304000,
          hash: 'SHA-256',
        }),
        {},
        256,
      );

      expect(result).toEqual({
        salt: expect.any(Uint8Array),
        hash: mockDerivedKey,
        iterations: PBKDF2.ITERATIONS_PER_SECOND,
      });
    });

    it('should use provided salt', async () => {
      const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
        mockPassword,
        mockSalt,
      );

      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          salt: mockSalt,
        }),
        {},
        256,
      );

      expect(result.salt).toEqual(mockSalt);
    });

    it('should use custom parameters', async () => {
      const iterations = 500000;
      const saltBytes = 16;
      const keySize = 64;
      const algorithm = 'SHA-512';
      const mockCustomKeyArray = new ArrayBuffer(64);
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockCustomKeyArray);

      await pbkdf2Service.deriveKeyFromPasswordAsync(
        mockPassword,
        undefined,
        iterations,
        saltBytes,
        keySize,
        algorithm,
      );

      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          iterations,
          hash: algorithm,
        }),
        {},
        512,
      );
    });

    it('should throw error for invalid salt length', async () => {
      const invalidSalt = new Uint8Array(16); // Wrong length for default config

      await expect(
        pbkdf2Service.deriveKeyFromPasswordAsync(mockPassword, invalidSalt),
      ).rejects.toThrow('Salt length does not match expected length');
    });

    it('should throw error for invalid hash length', async () => {
      const wrongSizeArray = new ArrayBuffer(16); // Wrong size
      mockCrypto.subtle.deriveBits.mockResolvedValue(wrongSizeArray);

      await expect(
        pbkdf2Service.deriveKeyFromPasswordAsync(mockPassword),
      ).rejects.toThrow('Hash length does not match expected length');
    });

    it('should generate random salt when not provided', async () => {
      const mockRandomSalt = new Uint8Array(32).fill(2);
      mockCrypto.getRandomValues.mockReturnValue(mockRandomSalt);

      const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
        mockPassword,
      );

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(
        expect.any(Uint8Array),
      );
      expect(result.salt).toEqual(mockRandomSalt);
    });
  });

  describe('deriveKeyFromPasswordWithProfileAsync', () => {
    const mockPassword = new Uint8Array([
      112, 97, 115, 115, 119, 111, 114, 100,
    ]); // "password"
    const mockSalt = new Uint8Array(64).fill(1); // Browser password profile uses 64-byte salt
    const mockDerivedKeyArray = new ArrayBuffer(32);

    beforeEach(() => {
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockDerivedKeyArray);
    });

    it('should derive key with BROWSER_PASSWORD profile', async () => {
      const result = await pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
        mockPassword,
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
      );

      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          iterations: 2000000,
          hash: 'SHA-512',
        }),
        {},
        256,
      );

      expect(result).toEqual({
        salt: expect.any(Uint8Array),
        hash: new Uint8Array(mockDerivedKeyArray),
        iterations: 2000000,
      });
    });

    it('should use provided salt with profile', async () => {
      const result = await pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
        mockPassword,
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
        mockSalt,
      );

      expect(result.salt).toEqual(mockSalt);
    });

    it('should throw error for invalid salt length with profile', async () => {
      const invalidSalt = new Uint8Array(16); // Wrong length for browser password profile

      await expect(
        pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
          mockPassword,
          Pbkdf2ProfileEnum.BROWSER_PASSWORD,
          invalidSalt,
        ),
      ).rejects.toThrow('Salt length does not match expected length');
    });
  });

  describe('error handling', () => {
    const mockPassword = new Uint8Array([
      112, 97, 115, 115, 119, 111, 114, 100,
    ]);

    it('should handle crypto.subtle.importKey failure', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Import failed'));

      await expect(
        pbkdf2Service.deriveKeyFromPasswordAsync(mockPassword),
      ).rejects.toThrow('Import failed');
    });

    it('should handle crypto.subtle.deriveBits failure', async () => {
      mockCrypto.subtle.deriveBits.mockRejectedValue(
        new Error('Derive failed'),
      );

      await expect(
        pbkdf2Service.deriveKeyFromPasswordAsync(mockPassword),
      ).rejects.toThrow('Derive failed');
    });
  });

  describe('integration with constants', () => {
    it('should use correct default values from constants', () => {
      const config = pbkdf2Service.getConfig();

      expect(config.hashBytes).toBe(ECIES.SYMMETRIC.KEY_SIZE);
      expect(config.saltBytes).toBe(PBKDF2.SALT_BYTES);
      expect(config.iterations).toBe(PBKDF2.ITERATIONS_PER_SECOND);
      expect(config.algorithm).toBe(PBKDF2.ALGORITHM);
    });

    it('should use correct profile values from constants', () => {
      const browserConfig = pbkdf2Service.getProfileConfig(
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
      );

      expect(browserConfig).toEqual(PBKDF2_PROFILES.BROWSER_PASSWORD);
    });
  });

  describe('type safety', () => {
    it('should return correct interface types', () => {
      const config: IPbkdf2Config = pbkdf2Service.getConfig();
      expect(typeof config.hashBytes).toBe('number');
      expect(typeof config.saltBytes).toBe('number');
      expect(typeof config.iterations).toBe('number');
      expect(typeof config.algorithm).toBe('string');
    });

    it('should return correct result interface', async () => {
      const mockPassword = new Uint8Array([
        112, 97, 115, 115, 119, 111, 114, 100,
      ]);
      const result: IPbkdf2Result =
        await pbkdf2Service.deriveKeyFromPasswordAsync(mockPassword);

      expect(result.salt).toBeInstanceOf(Uint8Array);
      expect(result.hash).toBeInstanceOf(Uint8Array);
      expect(typeof result.iterations).toBe('number');
    });
  });
});
