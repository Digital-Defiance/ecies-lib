import { ObjectId } from 'bson';
import { registerRuntimeConfiguration } from './constants';
import { GuidV4Provider } from './lib/id-providers/guidv4-provider';
import { ObjectIdProvider } from './lib/id-providers/objectid-provider';
import { Uint8ArrayIdProvider } from './lib/id-providers/uint8array-provider';
import { UuidProvider } from './lib/id-providers/uuid-provider';
import {
  createObjectIdConfiguration,
  createGuidV4Configuration,
  createTypedConfiguration,
  getTypedConfiguration,
  getTypedIdProvider,
  getEnhancedIdProvider,
  ensureEnhancedIdProvider,
} from './typed-configuration';
import { GuidV4Uint8Array } from './types/guid-versions';

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
        idProvider: new GuidV4Provider(),
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
        idProvider: new GuidV4Provider(),
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
        idProvider: new GuidV4Provider(),
      });

      // Get typed configuration from registry
      const config = getTypedConfiguration<GuidV4Uint8Array>(testKey);

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
        idProvider: new GuidV4Provider(),
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

  describe('ensureEnhancedIdProvider', () => {
    it('should return provider when name matches', () => {
      const provider = ensureEnhancedIdProvider<ObjectId>('ObjectID');

      expect(provider).toBeDefined();
      expect(provider.name).toBe('ObjectID');

      const id = provider.generateTyped();
      expect(id).toBeInstanceOf(ObjectId);
    });

    it('should throw error when name does not match', () => {
      expect(() => {
        ensureEnhancedIdProvider<ObjectId>('GuidV4');
      }).toThrow('Provider name mismatch. Expected GuidV4, got ObjectID');
    });

    it('should work with custom configuration keys', () => {
      const testKey = 'test-guid-config';
      registerRuntimeConfiguration(testKey, {
        idProvider: new GuidV4Provider(),
      });

      const provider = ensureEnhancedIdProvider<GuidV4Uint8Array>(
        'GUIDv4',
        testKey,
      );
      expect(provider.name).toBe('GUIDv4');

      const id = provider.generateTyped();
      expect(typeof id.asFullHexGuid).toBe('string');
    });

    it('should throw error for mismatched name with custom key', () => {
      const testKey = 'test-uuid-config';
      registerRuntimeConfiguration(testKey, {
        idProvider: new UuidProvider(),
      });

      expect(() => {
        ensureEnhancedIdProvider<string>('ObjectID', testKey);
      }).toThrow('Provider name mismatch. Expected ObjectID, got UUID');
    });
  });

  describe('Enhanced Providers - All Types', () => {
    it('should work with ObjectIdProvider', () => {
      const key = 'test-objectid';
      registerRuntimeConfiguration(key, { idProvider: new ObjectIdProvider() });
      const provider = getEnhancedIdProvider<ObjectId>(key);

      const id = provider.generateTyped();
      expect(id).toBeInstanceOf(ObjectId);
      expect(provider.validateTyped(id)).toBe(true);

      const serialized = provider.serializeTyped(id);
      expect(serialized).toHaveLength(24);
      expect(provider.deserializeTyped(serialized).equals(id)).toBe(true);
    });

    it('should work with GuidV4Provider', () => {
      const key = 'test-guidv4';
      registerRuntimeConfiguration(key, { idProvider: new GuidV4Provider() });
      const provider = getEnhancedIdProvider<GuidV4Uint8Array>(key);

      const id = provider.generateTyped();
      expect(typeof id.asFullHexGuid).toBe('string');
      expect(provider.validateTyped(id)).toBe(true);

      const serialized = provider.serializeTyped(id);
      expect(provider.deserializeTyped(serialized).equals(id)).toBe(true);
    });

    it('should work with UuidProvider', () => {
      const key = 'test-uuid';
      registerRuntimeConfiguration(key, { idProvider: new UuidProvider() });
      const provider = getEnhancedIdProvider<string>(key);

      const id = provider.generateTyped();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(provider.validateTyped(id)).toBe(true);

      const serialized = provider.serializeTyped(id);
      expect(provider.deserializeTyped(serialized)).toBe(id);
    });

    it('should work with Uint8ArrayProvider', () => {
      const key = 'test-uint8array';
      registerRuntimeConfiguration(key, {
        idProvider: new Uint8ArrayIdProvider(16),
      });
      const provider = getEnhancedIdProvider<Uint8Array>(key);

      const id = provider.generateTyped();
      expect(id).toBeInstanceOf(Uint8Array);
      expect(id.length).toBe(16);
      expect(provider.validateTyped(id)).toBe(true);

      const serialized = provider.serializeTyped(id);
      const deserialized = provider.deserializeTyped(serialized);
      expect(deserialized).toEqual(id);
    });
  });
});
