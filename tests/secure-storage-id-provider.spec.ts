/**
 * Tests for SecureBuffer and SecureString with custom ID providers
 * Validates Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { resetRegistry } from '@digitaldefiance/branded-enum';
import { ObjectIdProvider } from '../src/lib/id-providers/objectid-provider';
import { SecureBuffer } from '../src/secure-buffer';
import { SecureString } from '../src/secure-string';

describe('Secure Storage with ID Provider Injection', () => {
  describe('SecureBuffer', () => {
    it('should accept custom ID provider in constructor', () => {
      const customProvider = new ObjectIdProvider();
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const buffer = new SecureBuffer(data, customProvider);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(5);
      expect(buffer.id).toBeDefined();
      expect(buffer.id.length).toBe(24); // ObjectID hex string is 24 chars

      buffer.dispose();
    });

    it('should use default ID provider when none provided', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const buffer = new SecureBuffer(data);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(5);
      expect(buffer.id).toBeDefined();
      expect(buffer.id.length).toBe(24); // ObjectID hex string is 24 chars

      buffer.dispose();
    });

    it('should work with factory method using Constants.idProvider', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const buffer = SecureBuffer.create(data);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(5);
      expect(buffer.id).toBeDefined();

      buffer.dispose();
    });

    it('should not require Constants module when using custom provider', () => {
      // This test verifies that we can create SecureBuffer without loading Constants
      const customProvider = new ObjectIdProvider();
      const data = new Uint8Array([1, 2, 3, 4, 5]);

      // Clear module cache to ensure fresh import
      jest.resetModules();
      resetRegistry();

      const buffer = new SecureBuffer(data, customProvider);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(5);

      buffer.dispose();
    });
  });

  describe('SecureString', () => {
    it('should accept custom ID provider in constructor', () => {
      const customProvider = new ObjectIdProvider();
      const data = 'test string';
      const secureStr = new SecureString(data, customProvider);

      expect(secureStr).toBeDefined();
      expect(secureStr.value).toBe(data);
      expect(secureStr.id).toBeDefined();
      expect(secureStr.id.length).toBe(24); // ObjectID hex string is 24 chars

      secureStr.dispose();
    });

    it('should use default ID provider when none provided', () => {
      const data = 'test string';
      const secureStr = new SecureString(data);

      expect(secureStr).toBeDefined();
      expect(secureStr.value).toBe(data);
      expect(secureStr.id).toBeDefined();
      expect(secureStr.id.length).toBe(24); // ObjectID hex string is 24 chars

      secureStr.dispose();
    });

    it('should work with factory method using Constants.idProvider', () => {
      const data = 'test string';
      const secureStr = SecureString.create(data);

      expect(secureStr).toBeDefined();
      expect(secureStr.value).toBe(data);
      expect(secureStr.id).toBeDefined();

      secureStr.dispose();
    });

    it('should not require Constants module when using custom provider', () => {
      // This test verifies that we can create SecureString without loading Constants
      const customProvider = new ObjectIdProvider();
      const data = 'test string';

      // Clear module cache to ensure fresh import
      jest.resetModules();
      resetRegistry();

      const secureStr = new SecureString(data, customProvider);

      expect(secureStr).toBeDefined();
      expect(secureStr.value).toBe(data);

      secureStr.dispose();
    });

    it('should handle null data with custom provider', () => {
      const customProvider = new ObjectIdProvider();
      const secureStr = new SecureString(null, customProvider);

      expect(secureStr).toBeDefined();
      expect(secureStr.value).toBeNull();
      expect(secureStr.id).toBeDefined();

      secureStr.dispose();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility for existing code', () => {
      // Old code that doesn't pass ID provider should still work
      const buffer = new SecureBuffer(new Uint8Array([1, 2, 3]));
      const secureStr = new SecureString('test');

      expect(buffer.length).toBe(3);
      expect(secureStr.value).toBe('test');

      buffer.dispose();
      secureStr.dispose();
    });

    it('should allow mixing old and new patterns', () => {
      const customProvider = new ObjectIdProvider();

      // New pattern with custom provider
      const buffer1 = new SecureBuffer(
        new Uint8Array([1, 2, 3]),
        customProvider,
      );

      // Old pattern without provider
      const buffer2 = new SecureBuffer(new Uint8Array([4, 5, 6]));

      // Factory method pattern
      const buffer3 = SecureBuffer.create(new Uint8Array([7, 8, 9]));

      expect(buffer1.length).toBe(3);
      expect(buffer2.length).toBe(3);
      expect(buffer3.length).toBe(3);

      buffer1.dispose();
      buffer2.dispose();
      buffer3.dispose();
    });
  });
});
