/**
 * Integration Tests: Documented Usage Pattern
 *
 * Feature: fix-ecies-constructor-signature
 * Task: 4.1 Write integration test for documented usage pattern
 *
 * These tests verify that the exact code examples from the README compile
 * without errors and work correctly.
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import {
  ECIESService,
  createRuntimeConfiguration,
  GuidV4Provider,
  ObjectIdProvider,
} from '../../src';

describe('Integration: Documented Usage Pattern (Browser)', () => {
  describe('README Example: Basic Usage', () => {
    it('should work with the documented createRuntimeConfiguration pattern', () => {
      // This is the exact pattern from the README
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      // This should compile without type assertions
      const ecies = new ECIESService(config);

      expect(ecies).toBeInstanceOf(ECIESService);
      expect(ecies.config).toBeDefined();
    });

    it('should work with ObjectIdProvider as documented', () => {
      // From README: Configure (Optional - defaults to ObjectIdProvider)
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });

      const ecies = new ECIESService(config);

      expect(ecies).toBeInstanceOf(ECIESService);
      expect(ecies.config).toBeDefined();
    });
  });

  describe('README Example: Quick Start', () => {
    it('should compile and execute the Quick Start example', async () => {
      // Configure to use 16-byte GUIDs
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      const ecies = new ECIESService(config);

      // Generate keys
      const mnemonic = ecies.generateNewMnemonic();
      const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);

      // Encrypt
      const message = new TextEncoder().encode('Hello, World!');
      const encrypted = await ecies.encryptBasic(keyPair.publicKey, message);

      // Decrypt
      const decrypted = await ecies.decryptBasicWithHeader(
        keyPair.privateKey,
        encrypted,
      );

      expect(new TextDecoder().decode(decrypted)).toBe('Hello, World!');
    });
  });

  describe('README Example: Configuration', () => {
    it('should work with the configuration example', () => {
      // From README configuration section
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });

      const ecies = new ECIESService(config);

      expect(ecies).toBeInstanceOf(ECIESService);
      expect(ecies.config.curveName).toBe(config.ECIES.CURVE_NAME);
    });
  });

  describe('No Type Assertions Required', () => {
    it('should not require "as any" or type assertions', () => {
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      // Before the fix, this would require: new ECIESService(config as any)
      // After the fix, this should work without type assertions
      const ecies = new ECIESService(config);

      expect(ecies).toBeInstanceOf(ECIESService);
    });

    it('should accept IConstants directly from createRuntimeConfiguration', () => {
      // The return type of createRuntimeConfiguration is IConstants
      // This should be accepted by ECIESService constructor
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      // TypeScript should accept this without errors
      const ecies = new ECIESService(config);

      expect(ecies).toBeInstanceOf(ECIESService);
      expect(ecies.config).toBeDefined();
    });
  });

  describe('Functional Verification', () => {
    it('should create a fully functional service from documented pattern', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      const ecies = new ECIESService(config);

      // Verify all core functionality works
      const mnemonic = ecies.generateNewMnemonic();
      expect(mnemonic.value?.split(' ').length).toBe(24);

      const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);

      const message = new TextEncoder().encode('Test message');
      const encrypted = await ecies.encryptBasic(keyPair.publicKey, message);

      const decrypted = await ecies.decryptBasicWithHeader(
        keyPair.privateKey,
        encrypted,
      );

      expect(new TextDecoder().decode(decrypted)).toBe('Test message');
    });

    it('should correctly use ECIES config from IConstants', () => {
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });

      const ecies = new ECIESService(config);

      // Verify ECIES config was correctly extracted
      expect(ecies.config.curveName).toBe(config.ECIES.CURVE_NAME);
      expect(ecies.config.symmetricAlgorithm).toBe(
        config.ECIES.SYMMETRIC_ALGORITHM_CONFIGURATION,
      );
      expect(ecies.config.symmetricKeyBits).toBe(
        config.ECIES.SYMMETRIC.KEY_BITS,
      );
      expect(ecies.config.symmetricKeyMode).toBe(config.ECIES.SYMMETRIC.MODE);
      expect(ecies.config.primaryKeyDerivationPath).toBe(
        config.ECIES.PRIMARY_KEY_DERIVATION_PATH,
      );
      expect(ecies.config.mnemonicStrength).toBe(
        config.ECIES.MNEMONIC_STRENGTH,
      );
    });
  });
});
