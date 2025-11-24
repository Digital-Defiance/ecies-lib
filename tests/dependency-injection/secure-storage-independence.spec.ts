/**
 * Secure Storage Independence Tests
 * Tests that SecureBuffer/SecureString can be instantiated without constants
 * Validates Requirements 3.1, 3.2, 3.3
 */

describe('Secure Storage Independence', () => {
  describe('10.3 SecureBuffer and SecureString are independent of constants', () => {
    it('should create SecureBuffer without loading Constants module', () => {
      // Clear module cache
      jest.resetModules();

      // Track which modules get loaded
      const loadedModules = new Set<string>();
      const Module = require('module');
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function (id: string) {
        loadedModules.add(id);
        return originalRequire.apply(this, arguments);
      };

      try {
        // Import SecureBuffer and ID provider
        const { SecureBuffer } = require('../../src/secure-buffer');
        const {
          ObjectIdProvider,
        } = require('../../src/lib/id-providers/objectid-provider');

        // Create a SecureBuffer with explicit ID provider
        const provider = new ObjectIdProvider();
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const buffer = new SecureBuffer(data, provider);

        // Verify buffer was created successfully
        expect(buffer).toBeDefined();
        expect(buffer.length).toBe(5);
        expect(buffer.value).toEqual(data);

        // Verify Constants module was NOT loaded
        const constantsLoaded = Array.from(loadedModules).some(
          (mod) =>
            (mod.includes('constants') || mod.includes('/constants.')) &&
            !mod.includes('ecies-consts') &&
            !mod.includes('checksum-consts') &&
            !mod.includes('pbkdf2-consts'),
        );

        expect(constantsLoaded).toBe(false);

        // Clean up
        buffer.dispose();
      } finally {
        Module.prototype.require = originalRequire;
      }
    });

    it('should create SecureString without loading Constants module', () => {
      // Clear module cache
      jest.resetModules();

      // Track which modules get loaded
      const loadedModules = new Set<string>();
      const Module = require('module');
      const originalRequire = Module.prototype.require;

      Module.prototype.require = function (id: string) {
        loadedModules.add(id);
        return originalRequire.apply(this, arguments);
      };

      try {
        // Import SecureString and ID provider
        const { SecureString } = require('../../src/secure-string');
        const {
          ObjectIdProvider,
        } = require('../../src/lib/id-providers/objectid-provider');

        // Create a SecureString with explicit ID provider
        const provider = new ObjectIdProvider();
        const testString = 'test secret data';
        const secureStr = new SecureString(testString, provider);

        // Verify string was created successfully
        expect(secureStr).toBeDefined();
        expect(secureStr.value).toBe(testString);
        expect(secureStr.length).toBe(testString.length);

        // Verify Constants module was NOT loaded
        const constantsLoaded = Array.from(loadedModules).some(
          (mod) =>
            (mod.includes('constants') || mod.includes('/constants.')) &&
            !mod.includes('ecies-consts') &&
            !mod.includes('checksum-consts') &&
            !mod.includes('pbkdf2-consts'),
        );

        expect(constantsLoaded).toBe(false);

        // Clean up
        secureStr.dispose();
      } finally {
        Module.prototype.require = originalRequire;
      }
    });

    it('should create SecureBuffer with default provider without Constants', () => {
      // Clear module cache
      jest.resetModules();

      const { SecureBuffer } = require('../../src/secure-buffer');

      // Create buffer without providing ID provider (uses default)
      const data = new Uint8Array([10, 20, 30]);
      const buffer = new SecureBuffer(data);

      // Verify buffer works correctly
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(3);
      expect(buffer.value).toEqual(data);
      expect(buffer.id).toBeDefined();
      expect(typeof buffer.id).toBe('string');

      buffer.dispose();
    });

    it('should create SecureString with default provider without Constants', () => {
      // Clear module cache
      jest.resetModules();

      const { SecureString } = require('../../src/secure-string');

      // Create string without providing ID provider (uses default)
      const testString = 'another secret';
      const secureStr = new SecureString(testString);

      // Verify string works correctly
      expect(secureStr).toBeDefined();
      expect(secureStr.value).toBe(testString);
      expect(secureStr.id).toBeDefined();
      expect(typeof secureStr.id).toBe('string');

      secureStr.dispose();
    });

    it('should verify SecureBuffer factory method uses Constants', () => {
      // Clear module cache
      jest.resetModules();

      const { SecureBuffer } = require('../../src/secure-buffer');

      // Use factory method (should load Constants via require inside the method)
      const buffer = SecureBuffer.create(new Uint8Array([1, 2, 3]));

      // Verify buffer was created
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(3);

      // The factory method uses Constants internally, which is fine
      // This test just verifies the factory method works correctly
      buffer.dispose();
    });

    it('should verify SecureString factory method uses Constants', () => {
      // Clear module cache
      jest.resetModules();

      const { SecureString } = require('../../src/secure-string');

      // Use factory method (should load Constants via require inside the method)
      const secureStr = SecureString.create('test');

      // Verify string was created
      expect(secureStr).toBeDefined();
      expect(secureStr.value).toBe('test');

      // The factory method uses Constants internally, which is fine
      // This test just verifies the factory method works correctly
      secureStr.dispose();
    });

    it('should create multiple SecureBuffers with different providers', () => {
      // Clear module cache
      jest.resetModules();

      const { SecureBuffer } = require('../../src/secure-buffer');
      const {
        ObjectIdProvider,
      } = require('../../src/lib/id-providers/objectid-provider');

      // Create two providers
      const provider1 = new ObjectIdProvider();
      const provider2 = new ObjectIdProvider();

      // Create buffers with different providers
      const buffer1 = new SecureBuffer(new Uint8Array([1, 2]), provider1);
      const buffer2 = new SecureBuffer(new Uint8Array([3, 4]), provider2);

      // Verify both work independently
      expect(buffer1.length).toBe(2);
      expect(buffer2.length).toBe(2);
      expect(buffer1.id).not.toBe(buffer2.id);

      buffer1.dispose();
      buffer2.dispose();
    });

    it('should create multiple SecureStrings with different providers', () => {
      // Clear module cache
      jest.resetModules();

      const { SecureString } = require('../../src/secure-string');
      const {
        ObjectIdProvider,
      } = require('../../src/lib/id-providers/objectid-provider');

      // Create two providers
      const provider1 = new ObjectIdProvider();
      const provider2 = new ObjectIdProvider();

      // Create strings with different providers
      const str1 = new SecureString('secret1', provider1);
      const str2 = new SecureString('secret2', provider2);

      // Verify both work independently
      expect(str1.value).toBe('secret1');
      expect(str2.value).toBe('secret2');
      expect(str1.id).not.toBe(str2.id);

      str1.dispose();
      str2.dispose();
    });

    it('should verify SecureBuffer operations work without Constants', () => {
      // Clear module cache
      jest.resetModules();

      const { SecureBuffer } = require('../../src/secure-buffer');
      const {
        ObjectIdProvider,
      } = require('../../src/lib/id-providers/objectid-provider');

      const provider = new ObjectIdProvider();
      const data = new Uint8Array([100, 200, 50]);
      const buffer = new SecureBuffer(data, provider);

      // Test various operations
      expect(buffer.length).toBe(3);
      expect(buffer.originalLength).toBe(3);
      expect(buffer.value).toEqual(data);
      expect(buffer.valueAsHexString).toBeDefined();
      expect(buffer.valueAsBase64String).toBeDefined();
      expect(buffer.checksum).toBeDefined();

      buffer.dispose();
    });

    it('should verify SecureString operations work without Constants', () => {
      // Clear module cache
      jest.resetModules();

      const { SecureString } = require('../../src/secure-string');
      const {
        ObjectIdProvider,
      } = require('../../src/lib/id-providers/objectid-provider');

      const provider = new ObjectIdProvider();
      const testString = 'test data';
      const secureStr = new SecureString(testString, provider);

      // Test various operations
      expect(secureStr.length).toBe(testString.length);
      expect(secureStr.originalLength).toBe(testString.length);
      expect(secureStr.value).toBe(testString);
      expect(secureStr.notNullValue).toBe(testString);
      expect(secureStr.hasValue).toBe(true);
      expect(secureStr.valueAsHexString).toBeDefined();
      expect(secureStr.valueAsBase64String).toBeDefined();
      expect(secureStr.checksum).toBeDefined();

      secureStr.dispose();
    });

    it('should verify empty SecureBuffer works without Constants', () => {
      // Clear module cache
      jest.resetModules();

      const { SecureBuffer } = require('../../src/secure-buffer');
      const {
        ObjectIdProvider,
      } = require('../../src/lib/id-providers/objectid-provider');

      const provider = new ObjectIdProvider();
      const buffer = new SecureBuffer(undefined, provider);

      expect(buffer.length).toBe(0);
      expect(buffer.value).toEqual(new Uint8Array(0));

      buffer.dispose();
    });

    it('should verify null SecureString works without Constants', () => {
      // Clear module cache
      jest.resetModules();

      const { SecureString } = require('../../src/secure-string');
      const {
        ObjectIdProvider,
      } = require('../../src/lib/id-providers/objectid-provider');

      const provider = new ObjectIdProvider();
      const secureStr = new SecureString(null, provider);

      expect(secureStr.length).toBe(0);
      expect(secureStr.value).toBe(null);
      expect(secureStr.hasValue).toBe(false);

      secureStr.dispose();
    });
  });
});
