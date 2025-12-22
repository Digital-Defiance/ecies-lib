import { Constants, createRuntimeConfiguration } from '../../src/constants';
import { BaseInvariant } from '../../src/interfaces/invariant';
import { GuidV4Provider, ObjectIdProvider } from '../../src/lib/id-providers';
import { InvariantValidator } from '../../src/lib/invariant-validator';

/**
 * Helper to create an unfrozen copy of a configuration for testing
 */
function createMutableConfig(config: IConstants): IConstants {
  return structuredClone(config) as IConstants;
}

describe('InvariantValidator', () => {
  afterEach(() => {
    InvariantValidator.clearCustomInvariants();
  });

  describe('Default Invariants', () => {
    it('should pass all invariants for default Constants', () => {
      expect(() => InvariantValidator.validateAll(Constants)).not.toThrow();
    });

    it('should validate RecipientIdConsistency', () => {
      const result = InvariantValidator.checkInvariant(
        Constants,
        'RecipientIdConsistency',
      );
      expect(result).toBe(true);
    });

    it('should validate Pbkdf2ProfilesValidity', () => {
      const result = InvariantValidator.checkInvariant(
        Constants,
        'Pbkdf2ProfilesValidity',
      );
      expect(result).toBe(true);
    });

    it('should validate EncryptionAlgorithmConsistency', () => {
      const result = InvariantValidator.checkInvariant(
        Constants,
        'EncryptionAlgorithmConsistency',
      );
      expect(result).toBe(true);
    });
  });

  describe('RecipientIdConsistency Invariant', () => {
    it('should catch mismatched MEMBER_ID_LENGTH', () => {
      const badConfig = createMutableConfig(
        createRuntimeConfiguration({ idProvider: new GuidV4Provider() }),
      );
      // Manually break the config to test validation
      (badConfig as any).MEMBER_ID_LENGTH = 999;

      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /RecipientIdConsistency/,
      );
      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /MEMBER_ID_LENGTH/,
      );
    });

    it('should catch mismatched ECIES.MULTIPLE.RECIPIENT_ID_SIZE', () => {
      const badConfig = createMutableConfig(
        createRuntimeConfiguration({ idProvider: new ObjectIdProvider() }),
      );
      (badConfig as any).ECIES.MULTIPLE.RECIPIENT_ID_SIZE = 999;

      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /RecipientIdConsistency/,
      );
      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /RECIPIENT_ID_SIZE/,
      );
    });

    it('should pass for ObjectID provider (12 bytes)', () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      expect(() => InvariantValidator.validateAll(config)).not.toThrow();
    });

    it('should pass for GUID provider (16 bytes)', () => {
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      expect(() => InvariantValidator.validateAll(config)).not.toThrow();
    });
  });

  describe('Pbkdf2ProfilesValidity Invariant', () => {
    it('should catch iterations too low', () => {
      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).PBKDF2_PROFILES.BROWSER_PASSWORD.iterations = 500; // Too low

      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /Pbkdf2ProfilesValidity/,
      );
      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /iterations/,
      );
    });

    it('should catch iterations too high', () => {
      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).PBKDF2_PROFILES.BROWSER_PASSWORD.iterations =
        20_000_000; // Too high

      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /Pbkdf2ProfilesValidity/,
      );
    });

    it('should catch saltBytes too small', () => {
      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).PBKDF2_PROFILES.BROWSER_PASSWORD.saltBytes = 8; // Too small

      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /Pbkdf2ProfilesValidity/,
      );
      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /saltBytes/,
      );
    });

    it('should catch hashBytes invalid', () => {
      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).PBKDF2_PROFILES.BROWSER_PASSWORD.hashBytes = 13; // Invalid

      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /Pbkdf2ProfilesValidity/,
      );
      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /hashBytes/,
      );
    });
  });

  describe('EncryptionAlgorithmConsistency Invariant', () => {
    it('should catch wrong symmetric key size', () => {
      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).ECIES.SYMMETRIC.KEY_SIZE = 16; // Wrong for AES-256

      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /EncryptionAlgorithmConsistency/,
      );
      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /KEY_SIZE/,
      );
    });

    it('should catch unsupported curve', () => {
      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).ECIES.CURVE_NAME = 'invalid-curve';

      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /EncryptionAlgorithmConsistency/,
      );
      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /CURVE_NAME/,
      );
    });

    it('should catch invalid key derivation path', () => {
      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).ECIES.PRIMARY_KEY_DERIVATION_PATH = 'invalid/path';

      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /EncryptionAlgorithmConsistency/,
      );
      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /PRIMARY_KEY_DERIVATION_PATH/,
      );
    });
  });

  describe('Custom Invariants', () => {
    class CustomInvariant extends BaseInvariant {
      constructor() {
        super('CustomTest', 'Test invariant');
      }

      check(config: IConstants): boolean {
        return config.PBKDF2.SALT_BYTES > 0;
      }

      errorMessage(config: IConstants): string {
        return `CustomTest failed: SALT_BYTES must be positive, got ${config.PBKDF2.SALT_BYTES}`;
      }
    }

    beforeEach(() => {
      InvariantValidator.clearCustomInvariants();
    });

    it('should allow registering custom invariants', () => {
      InvariantValidator.registerInvariant(new CustomInvariant());
      const invariants = InvariantValidator.getAllInvariants();

      expect(invariants.some((i) => i.name === 'CustomTest')).toBe(true);
    });

    it('should validate custom invariants', () => {
      InvariantValidator.registerInvariant(new CustomInvariant());

      const goodConfig = createRuntimeConfiguration();
      try {
        expect(() => InvariantValidator.validateAll(goodConfig)).not.toThrow();
      } catch (e) {
        console.error('First expect failed:', e);
        throw e;
      }

      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).PBKDF2.SALT_BYTES = -1;
      try {
        expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
          /CustomTest/,
        );
      } catch (e) {
        console.error('Second expect failed:', e);
        console.error(
          'badConfig.PBKDF2.SALT_BYTES:',
          (badConfig as any).PBKDF2.SALT_BYTES,
        );
        throw e;
      }
    });

    it('should clear custom invariants', () => {
      InvariantValidator.registerInvariant(new CustomInvariant());
      expect(InvariantValidator.getAllInvariants().length).toBeGreaterThan(3);

      InvariantValidator.clearCustomInvariants();
      expect(InvariantValidator.getAllInvariants().length).toBe(3); // Only default invariants
    });
  });

  describe('Failure Details', () => {
    it('should return null for passing invariant', () => {
      const details = InvariantValidator.getFailureDetails(
        Constants,
        'RecipientIdConsistency',
      );
      expect(details).toBeNull();
    });

    it('should return error message for failing invariant', () => {
      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).MEMBER_ID_LENGTH = 999;

      const details = InvariantValidator.getFailureDetails(
        badConfig,
        'RecipientIdConsistency',
      );
      expect(details).not.toBeNull();
      expect(details).toContain('RecipientIdConsistency');
      expect(details).toContain('MEMBER_ID_LENGTH');
    });

    it('should throw for unknown invariant', () => {
      expect(() => {
        InvariantValidator.checkInvariant(Constants, 'NonExistent');
      }).toThrow(/Unknown invariant/);
    });
  });

  describe('Multiple Failures', () => {
    it('should report all failing invariants', () => {
      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).MEMBER_ID_LENGTH = 999; // Breaks RecipientIdConsistency
      (badConfig as any).ECIES.SYMMETRIC.KEY_SIZE = 16; // Breaks EncryptionAlgorithmConsistency
      (badConfig as any).PBKDF2_PROFILES.BROWSER_PASSWORD.iterations = 500; // Breaks Pbkdf2ProfilesValidity

      try {
        InvariantValidator.validateAll(badConfig);
        fail('Should have thrown');
      } catch (error: unknown) {
        expect(error.message).toContain('3 invariants');
        expect(error.message).toContain('RecipientIdConsistency');
        expect(error.message).toContain('EncryptionAlgorithmConsistency');
        expect(error.message).toContain('Pbkdf2ProfilesValidity');
      }
    });
  });

  describe('Integration with createRuntimeConfiguration', () => {
    it('should automatically validate on configuration creation', () => {
      // This should NOT throw because auto-sync fixes it
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      expect(config.MEMBER_ID_LENGTH).toBe(16);
      expect(config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE).toBe(16);
    });

    it('would have caught the 12 vs 32 discrepancy', () => {
      // Simulate the old bug: manually create mismatched config
      const badConfig = createMutableConfig(createRuntimeConfiguration());
      (badConfig as any).ECIES.MULTIPLE.RECIPIENT_ID_SIZE = 32; // Wrong!

      // The invariant validator catches this
      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(
        /RecipientIdConsistency/,
      );
      expect(() => InvariantValidator.validateAll(badConfig)).toThrow(/32.*12/);
    });
  });
});
