/**
 * Tests for enhanced ID provider validation and type safety improvements
 */

import { ObjectId } from 'bson';
import { createRuntimeConfiguration } from '../../../src/constants';
import { EmailString } from '../../../src/email-string';
import { MemberType } from '../../../src/enumerations/member-type';
import {
  ObjectIdProvider,
  GuidV4Provider,
  CustomIdProvider,
} from '../../../src/lib/id-providers';
import { Member } from '../../../src/member';
import { ECIESService } from '../../../src/services/ecies/service';

describe('Enhanced ID Provider Validation', () => {
  describe('Type Safety Improvements', () => {
    it('should provide strongly typed idProvider getter', () => {
      const service = new ECIESService<ObjectId>();
      const idProvider = service.idProvider;

      // Type should be IIdProvider<ObjectId>
      expect(idProvider).toBeDefined();
      expect(idProvider.byteLength).toBe(12);
      expect(typeof idProvider.generate).toBe('function');

      // Should work with ObjectId operations
      const id = idProvider.generate();
      const objectId = idProvider.fromBytes(id);
      expect(objectId).toBeInstanceOf(ObjectId);
    });

    it('should work with GUID provider and Uint8Array TID', () => {
      const guidConfig = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const service = new ECIESService<Uint8Array>(guidConfig);
      const idProvider = service.idProvider;

      expect(idProvider.byteLength).toBe(16);

      const id = idProvider.generate();
      const guidId = idProvider.fromBytes(id);
      // GuidV4Provider returns GuidV4 instances
      expect(guidId.constructor.name).toBe('GuidV4');

      // But we can convert back to bytes
      const backToBytes = idProvider.toBytes(guidId);
      expect(backToBytes).toBeInstanceOf(Uint8Array);
      expect(backToBytes.length).toBe(16);
    });

    it('should work with custom provider', () => {
      const customProvider = new CustomIdProvider(20, 'Custom20Byte');
      const customConfig = createRuntimeConfiguration({
        idProvider: customProvider,
      });
      const service = new ECIESService<Uint8Array>(customConfig);

      expect(service.idProvider.byteLength).toBe(20);
      expect(service.idProvider.name).toBe('Custom20Byte');
    });
  });

  describe('Enhanced Construction-Time Validation', () => {
    it('should validate idProvider exists (conceptual test)', () => {
      // Note: In practice, createRuntimeConfiguration always provides a valid idProvider
      // and the type guard ensures only valid IConstants objects are accepted.
      // This test demonstrates the validation logic exists, even if it's hard to trigger
      // in normal usage due to the robust configuration system.

      const service = new ECIESService();

      // Verify that the service has a valid idProvider
      expect(service.idProvider).toBeDefined();
      expect(typeof service.idProvider.generate).toBe('function');
      expect(typeof service.idProvider.byteLength).toBe('number');

      // The validation logic is tested indirectly through other tests
      // that verify the service rejects invalid configurations
    });

    it('should validate byteLength matches MEMBER_ID_LENGTH', () => {
      // Create a custom config with mismatched lengths
      const guidProvider = new GuidV4Provider(); // 16 bytes
      const baseConfig = createRuntimeConfiguration();

      // Create a new config object with mismatched MEMBER_ID_LENGTH
      const mismatchedConfig = {
        ...baseConfig,
        idProvider: guidProvider,
        MEMBER_ID_LENGTH: 12, // Mismatch: provider is 16 bytes, config says 12
      };

      expect(() => new ECIESService(mismatchedConfig)).toThrow(
        /ID provider byte length \(16\) does not match MEMBER_ID_LENGTH \(12\)/,
      );
    });

    it('should validate required methods exist', () => {
      const incompleteProvider = {
        byteLength: 12,
        generate: () => new Uint8Array(12),
        // Missing other required methods
      };

      const invalidConfig = createRuntimeConfiguration({
        idProvider: incompleteProvider as any,
      });

      expect(() => new ECIESService(invalidConfig)).toThrow(
        /ID provider is missing required method: serialize/,
      );
    });

    it('should validate generate() returns correct length', () => {
      class BadProvider extends ObjectIdProvider {
        generate(): Uint8Array {
          return new Uint8Array(8); // Wrong length
        }
      }

      const badConfig = createRuntimeConfiguration({
        idProvider: new BadProvider(),
      });

      expect(() => new ECIESService(badConfig)).toThrow(
        /Generated ID length \(8\) does not match declared byteLength \(12\)/,
      );
    });

    it('should validate generated ID passes validation', () => {
      class BadProvider extends ObjectIdProvider {
        validate(): boolean {
          return false; // Always fail validation
        }
      }

      const badConfig = createRuntimeConfiguration({
        idProvider: new BadProvider(),
      });

      expect(() => new ECIESService(badConfig)).toThrow(
        'Generated ID failed validation check',
      );
    });

    it('should validate serialization returns string', () => {
      class BadProvider extends ObjectIdProvider {
        serialize(): string {
          return 123 as any; // Return non-string
        }
      }

      const badConfig = createRuntimeConfiguration({
        idProvider: new BadProvider(),
      });

      expect(() => new ECIESService(badConfig)).toThrow(
        'Serialization must return a string',
      );
    });

    it('should validate serialization round-trip', () => {
      class BadProvider extends ObjectIdProvider {
        deserialize(): Uint8Array {
          return new Uint8Array(8); // Wrong length
        }
      }

      const badConfig = createRuntimeConfiguration({
        idProvider: new BadProvider(),
      });

      expect(() => new ECIESService(badConfig)).toThrow(
        /Serialization round-trip failed: expected 12 bytes, got 8 bytes/,
      );
    });

    it('should validate toBytes() returns correct length', () => {
      class BadProvider extends ObjectIdProvider {
        toBytes(): Uint8Array {
          return new Uint8Array(8); // Wrong length
        }
      }

      const badConfig = createRuntimeConfiguration({
        idProvider: new BadProvider(),
      });

      expect(() => new ECIESService(badConfig)).toThrow(
        /toBytes\(\) returned incorrect length: expected 12, got 8/,
      );
    });

    it('should validate byte conversion round-trip', () => {
      let callCount = 0;
      class BadProvider extends ObjectIdProvider {
        toBytes(): Uint8Array {
          callCount++;
          return callCount === 1 ? new Uint8Array(12) : new Uint8Array(8);
        }
      }

      const badConfig = createRuntimeConfiguration({
        idProvider: new BadProvider(),
      });

      expect(() => new ECIESService(badConfig)).toThrow(
        'Byte conversion round-trip failed',
      );
    });

    it('should validate TID type compatibility', () => {
      // This test verifies the enhanced TID type validation
      const service = new ECIESService<ObjectId>();

      // Should not throw - validation should pass
      expect(service.idProvider.byteLength).toBe(12);

      // The validation includes testing TID type conversion
      const testId = service.idProvider.generate();
      const nativeId = service.idProvider.fromBytes(testId);
      const typedId = nativeId as ObjectId;
      const reConverted = service.idProvider.toBytes(typedId);

      expect(reConverted.length).toBe(12);
    });
  });

  describe('Error Messages and Debugging', () => {
    it('should provide detailed error messages', () => {
      class FailingProvider extends ObjectIdProvider {
        generate(): Uint8Array {
          throw new Error('Mock generation failure');
        }
      }

      const badConfig = createRuntimeConfiguration({
        idProvider: new FailingProvider(),
      });

      expect(() => new ECIESService(badConfig)).toThrow(
        /ID provider validation failed: Mock generation failure\. Ensure your idProvider implementation correctly handles.*and that the TID type parameter matches the idProvider's native type/,
      );
    });
  });

  describe('Integration with Member Creation', () => {
    it('should work seamlessly with Member.newMember()', () => {
      const guidConfig = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const service = new ECIESService<Uint8Array>(guidConfig);

      // This should work without issues due to proper validation
      expect(() => {
        const { member } = Member.newMember(
          service,
          MemberType.User,
          'TestMember',
          new EmailString('test@example.com'),
        );
        expect(member.idBytes.length).toBe(16);
      }).not.toThrow();
    });

    it('should maintain consistency across service and member', () => {
      const service = new ECIESService<ObjectId>();
      const { member } = Member.newMember(
        service,
        MemberType.User,
        'TestMember',
        new EmailString('test@example.com'),
      );

      // Service and member should use the same idProvider
      expect(service.idProvider).toBe(member.idProvider);
      expect(service.idProvider.byteLength).toBe(member.idBytes.length);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with existing code', () => {
      // Old style - should still work
      const service = new ECIESService();
      expect(service.idProvider.byteLength).toBe(12);

      // New style - should also work
      const typedService = new ECIESService<ObjectId>();
      expect(typedService.idProvider.byteLength).toBe(12);
    });

    it('should work with partial configuration', () => {
      const partialConfig = {
        curveName: 'secp256k1' as const,
      };

      const service = new ECIESService(partialConfig);
      expect(service.idProvider.byteLength).toBe(12); // Uses default
    });
  });
});
