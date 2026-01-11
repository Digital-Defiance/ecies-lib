/**
 * Full Module Load Integration Test
 * Tests that main index.ts can be imported without errors
 * Verifies all exports are defined
 * Verifies no runtime errors during initialization
 * Validates Requirements 1.3, 3.5, 4.5
 */

describe('Module Load Integration', () => {
  describe('12.1 Full module load test', () => {
    it('should import main index.ts without errors', () => {
      // This test verifies that importing the main module doesn't throw
      expect(() => {
        require('../../src/index');
      }).not.toThrow();
    });

    it('should have all core exports defined', () => {
      const eciesLib = require('../../src/index');

      // Core classes
      expect(eciesLib.Member).toBeDefined();
      expect(eciesLib.ECIESService).toBeDefined();
      expect(eciesLib.SecureBuffer).toBeDefined();
      expect(eciesLib.SecureString).toBeDefined();
      expect(eciesLib.EmailString).toBeDefined();

      // Constants
      expect(eciesLib.Constants).toBeDefined();
      expect(eciesLib.ConstantsRegistry).toBeDefined();

      // Services
      expect(eciesLib.EncryptionStream).toBeDefined();
      expect(eciesLib.ChunkProcessor).toBeDefined();
      expect(eciesLib.ProgressTracker).toBeDefined();
      expect(eciesLib.Pbkdf2Service).toBeDefined();
      expect(eciesLib.PasswordLoginService).toBeDefined();
      expect(eciesLib.ResumableEncryption).toBeDefined();

      // Enumerations
      expect(eciesLib.MemberType).toBeDefined();
      expect(eciesLib.EciesStringKey).toBeDefined();
      expect(eciesLib.EciesCipherSuiteEnum).toBeDefined();
      expect(eciesLib.EciesEncryptionTypeEnum).toBeDefined();
      expect(eciesLib.EciesVersionEnum).toBeDefined();
      expect(eciesLib.Pbkdf2ProfileEnum).toBeDefined();

      // Builders
      expect(eciesLib.MemberBuilder).toBeDefined();

      // ID Providers
      expect(eciesLib.ObjectIdProvider).toBeDefined();
      expect(eciesLib.BaseIdProvider).toBeDefined();

      // Errors
      expect(eciesLib.ECIESError).toBeDefined();

      // Utilities
      expect(eciesLib.hexToUint8Array).toBeDefined();
      expect(eciesLib.uint8ArrayToHex).toBeDefined();
      expect(eciesLib.getLengthEncodingTypeForLength).toBeDefined();
    });

    it('should have all interface types exported', () => {
      const eciesLib = require('../../src/index');

      // These are type exports, so we can't check them at runtime
      // But we can verify the module loads without errors
      expect(eciesLib).toBeDefined();
    });

    it('should initialize constants without errors', () => {
      const { Constants } = require('../../src/index');

      expect(Constants).toBeDefined();
      expect(Constants.MEMBER_ID_LENGTH).toBeDefined();
      expect(Constants.idProvider).toBeDefined();
      expect(Constants.ECIES).toBeDefined();
    });

    it('should create service instances without errors', () => {
      const {
        ECIESService,
        Pbkdf2Service,
        PasswordLoginService,
        AESGCMService,
      } = require('../../src/index');

      expect(() => new ECIESService()).not.toThrow();
      expect(() => new Pbkdf2Service()).not.toThrow();
      expect(
        () =>
          new PasswordLoginService(
            new AESGCMService(),
            new ECIESService(),
            new Pbkdf2Service(),
          ),
      ).not.toThrow();
    });

    it('should create secure storage instances without errors', () => {
      const { SecureBuffer, SecureString } = require('../../src/index');

      const buffer = new SecureBuffer(new Uint8Array([1, 2, 3]));
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(3);
      buffer.dispose();

      const str = new SecureString('test');
      expect(str).toBeDefined();
      expect(str.value).toBe('test');
      str.dispose();
    });

    it('should create Member using builder without errors', () => {
      const {
        MemberBuilder,
        MemberType,
        EmailString,
      } = require('../../src/index');

      const { member, mnemonic } = MemberBuilder.newMember(
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      expect(member).toBeDefined();
      expect(member.name).toBe('Test User');
      expect(mnemonic).toBeDefined();

      member.dispose();
      mnemonic.dispose();
    });

    it('should verify no circular dependency errors during initialization', () => {
      // Clear module cache to test fresh initialization
      jest.resetModules();

      // Track any errors during module loading
      const errors: Error[] = [];
      const originalConsoleError = console.error;
      console.error = (...args: unknown[]) => {
        if (args[0] instanceof Error) {
          errors.push(args[0]);
        }
      };

      try {
        // Import the main module
        require('../../src/index');

        // Should have no errors
        expect(errors).toHaveLength(0);
      } finally {
        // Restore console.error
        console.error = originalConsoleError;
      }
    });

    it('should verify all exports are accessible', () => {
      const eciesLib = require('../../src/index');

      // Get all exported names
      const exportNames = Object.keys(eciesLib);

      // Should have a reasonable number of exports
      expect(exportNames.length).toBeGreaterThan(50);

      // Verify no undefined exports
      const undefinedExports = exportNames.filter(
        (name) => eciesLib[name] === undefined,
      );
      expect(undefinedExports).toHaveLength(0);
    });

    it('should verify i18n system initializes correctly', () => {
      const {
        getEciesI18nEngine,
        EciesComponentId,
        getEciesTranslation,
        safeEciesTranslation,
      } = require('../../src/index');

      expect(getEciesI18nEngine).toBeDefined();
      expect(EciesComponentId).toBeDefined();
      expect(getEciesTranslation).toBeDefined();
      expect(safeEciesTranslation).toBeDefined();

      // Verify i18n engine can be retrieved
      const engine = getEciesI18nEngine();
      expect(engine).toBeDefined();
    });

    it('should verify enumerations are accessible', () => {
      const {
        MemberType,
        EciesCipherSuiteEnum,
        EciesVersionEnum,
        Pbkdf2ProfileEnum,
      } = require('../../src/index');

      expect(MemberType.User).toBeDefined();
      expect(MemberType.System).toBeDefined();
      expect(EciesCipherSuiteEnum.Secp256k1_Aes256Gcm_Sha256).toBeDefined();
      expect(EciesVersionEnum.V1).toBeDefined();
      expect(Pbkdf2ProfileEnum.BROWSER_PASSWORD).toBeDefined();
    });

    it('should verify utility functions work correctly', () => {
      const { hexToUint8Array, uint8ArrayToHex } = require('../../src/index');

      const hex = '0102030405';
      const bytes = hexToUint8Array(hex);
      expect(bytes).toEqual(new Uint8Array([1, 2, 3, 4, 5]));

      const hexBack = uint8ArrayToHex(bytes);
      expect(hexBack).toBe(hex);
    });

    it('should verify ID providers work correctly', () => {
      const { ObjectIdProvider } = require('../../src/index');

      const provider = new ObjectIdProvider();
      const id1 = provider.generate();
      const id2 = provider.generate();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toEqual(id2);
      expect(provider.validate(id1)).toBe(true);
      expect(provider.validate(id2)).toBe(true);
    });

    it('should verify constants registry works correctly', () => {
      const { ConstantsRegistry, Constants } = require('../../src/index');

      // Should be able to access default constants
      expect(Constants.MEMBER_ID_LENGTH).toBeDefined();

      // Should be able to access registry
      expect(ConstantsRegistry).toBeDefined();
    });
  });
});
