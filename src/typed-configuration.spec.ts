import { ObjectId } from 'bson';
import { registerRuntimeConfiguration } from './constants';
import type { GuidV4 } from './lib/guid';
import { GuidProvider } from './lib/id-providers/guidv4-provider';
import { ObjectIdProvider } from './lib/id-providers/objectid-provider';
import { UuidProvider } from './lib/id-providers/uuid-provider';
import {
  createObjectIdConfiguration,
  createGuidV4Configuration,
  createTypedConfiguration,
  getTypedConfiguration,
  getTypedIdProvider,
  getEnhancedIdProvider,
} from './typed-configuration';

describe('TypedConfiguration', () => {
  describe('ObjectId Configuration', () => {
    it('should provide strongly typed ObjectId operations', () => {
      const config = createObjectIdConfiguration();

      // Generate should return ObjectId
      const id = config.generateId();
      expect(id).toBeInstanceOf(ObjectId);

      // Validate should accept ObjectId
      const isValid = config.validateId(id);
      expect(isValid).toBe(true);

      // Serialize should accept ObjectId and return string
      const serialized = config.serializeId(id);
      expect(typeof serialized).toBe('string');
      expect(serialized).toHaveLength(24); // ObjectId hex string length

      // Deserialize should return ObjectId
      const deserialized = config.deserializeId(serialized);
      expect(deserialized).toBeInstanceOf(ObjectId);
      expect(deserialized.equals(id)).toBe(true);
    });

    it('should provide access to underlying constants', () => {
      const config = createObjectIdConfiguration();

      expect(config.constants).toBeDefined();
      expect(config.constants.idProvider).toBeDefined();
      expect(config.constants.idProvider.byteLength).toBe(12);
    });
  });

  describe('GuidV4 Configuration', () => {
    it('should provide strongly typed GuidV4 operations', () => {
      const config = createGuidV4Configuration({
        idProvider: new GuidProvider(),
      });

      // Generate should return GuidV4
      const id = config.generateId();
      expect(id).toBeDefined();
      expect(typeof id.asFullHexGuid).toBe('string'); // GuidV4 method

      // Validate should accept GuidV4
      const isValid = config.validateId(id);
      expect(isValid).toBe(true);

      // Serialize should accept GuidV4 and return string
      const serialized = config.serializeId(id);
      expect(typeof serialized).toBe('string');

      // Deserialize should return GuidV4
      const deserialized = config.deserializeId(serialized);
      expect(deserialized).toBeDefined();
      expect(typeof deserialized.asFullHexGuid).toBe('string');
    });
  });

  describe('Type-inferring Configuration', () => {
    it('should infer ObjectId type from ObjectIdProvider', () => {
      const config = createTypedConfiguration({
        idProvider: new ObjectIdProvider(),
      });

      const id = config.generateId();
      expect(id).toBeInstanceOf(ObjectId);
    });

    it('should infer GuidV4 type from GuidV4Provider', () => {
      const config = createTypedConfiguration({
        idProvider: new GuidProvider(),
      });

      const id = config.generateId();
      expect(id).toBeDefined();
      expect(typeof id.asFullHexGuid).toBe('string'); // GuidV4 method
    });

    it('should infer string type from UuidProvider', () => {
      const config = createTypedConfiguration({
        idProvider: new UuidProvider(),
      });

      const id = config.generateId();
      expect(typeof id).toBe('string');
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('Registry Integration', () => {
    it('should work with configuration registry', () => {
      const testKey = 'test-typed-config';

      // Register a configuration
      registerRuntimeConfiguration(testKey, {
        idProvider: new GuidProvider(),
      });

      // Get typed configuration from registry
      const config = getTypedConfiguration<GuidV4>(testKey);

      const id = config.generateId();
      expect(id).toBeDefined();
      expect(typeof id.asFullHexGuid).toBe('string');
    });
  });

  describe('Backward Compatibility', () => {
    it('should provide access to underlying constants for existing code', () => {
      const config = createObjectIdConfiguration();

      // Existing code can still access the raw constants
      const constants = config.constants;
      expect(constants.idProvider).toBeDefined();
      expect(constants.ECIES).toBeDefined();
      expect(constants.PBKDF2).toBeDefined();

      // Raw operations still work (but without strong typing)
      const rawBytes = constants.idProvider.generate();
      expect(rawBytes).toBeInstanceOf(Uint8Array);
      expect(rawBytes.length).toBe(12);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type boundaries between different providers', () => {
      const objectIdConfig = createObjectIdConfiguration();
      const guidConfig = createGuidV4Configuration({
        idProvider: new GuidProvider(),
      });

      const objectId = objectIdConfig.generateId();
      const guid = guidConfig.generateId();

      // These should be different types
      expect(objectId).toBeInstanceOf(ObjectId);
      expect(guid).toBeDefined();
      expect(typeof guid.asFullHexGuid).toBe('string'); // GuidV4 method

      // Serialization should work with correct types
      const objectIdString = objectIdConfig.serializeId(objectId);
      const guidString = guidConfig.serializeId(guid);

      expect(typeof objectIdString).toBe('string');
      expect(typeof guidString).toBe('string');
      expect(objectIdString).not.toBe(guidString);
    });
  });

  describe('Direct ID Provider Access', () => {
    it('should provide strongly typed ID provider directly', () => {
      const idProvider = getTypedIdProvider<ObjectId>();

      // Generate bytes and convert to native type
      const bytes = idProvider.generate();
      const objectId = idProvider.fromBytes(bytes); // Returns ObjectId, not unknown!

      expect(objectId).toBeInstanceOf(ObjectId);
      expect(idProvider.toBytes(objectId)).toEqual(bytes);
    });

    it('should provide enhanced ID provider with typed methods', () => {
      const enhancedProvider = getEnhancedIdProvider<ObjectId>();

      // Original methods work the same
      const rawBytes = enhancedProvider.generate();
      expect(rawBytes).toBeInstanceOf(Uint8Array);
      expect(rawBytes.length).toBe(12);

      // New typed methods provide direct native type access
      const objectId = enhancedProvider.generateTyped(); // ObjectId directly!
      expect(objectId).toBeInstanceOf(ObjectId);

      const isValid = enhancedProvider.validateTyped(objectId);
      expect(isValid).toBe(true);

      const serialized = enhancedProvider.serializeTyped(objectId);
      expect(typeof serialized).toBe('string');
      expect(serialized).toHaveLength(24);

      const deserialized = enhancedProvider.deserializeTyped(serialized);
      expect(deserialized).toBeInstanceOf(ObjectId);
      expect(deserialized.equals(objectId)).toBe(true);
    });
  });

  describe('Migration Patterns', () => {
    it('should provide drop-in replacement for Constants.idProvider pattern', () => {
      // BEFORE: const Constants = getRuntimeConfiguration();
      // BEFORE: const id = Constants.idProvider.generate(); // Uint8Array
      // BEFORE: const nativeId = Constants.idProvider.fromBytes(id) as ObjectId; // Manual cast

      // AFTER: Enhanced provider (most similar to original)
      const enhancedProvider = getEnhancedIdProvider<ObjectId>();
      const objectId1 = enhancedProvider.generateTyped(); // ObjectId directly!

      // AFTER: Simple typed provider
      const typedProvider = getTypedIdProvider<ObjectId>();
      const bytes = typedProvider.generate();
      const objectId2 = typedProvider.fromBytes(bytes); // ObjectId, not unknown!

      // Both approaches work and provide strong typing
      expect(objectId1).toBeInstanceOf(ObjectId);
      expect(objectId2).toBeInstanceOf(ObjectId);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid serialized IDs gracefully', () => {
      const config = createObjectIdConfiguration();

      expect(() => {
        config.deserializeId('invalid-id');
      }).toThrow();
    });

    it('should validate IDs correctly', () => {
      const config = createObjectIdConfiguration();
      const validId = config.generateId();

      expect(config.validateId(validId)).toBe(true);
    });
  });
});
