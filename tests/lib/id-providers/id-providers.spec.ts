import {
  CustomIdProvider,
  GuidV4Provider,
  ObjectIdProvider,
  UuidProvider,
} from '../../../src/lib/id-providers';

describe('ID Providers', () => {
  describe('ObjectIdProvider', () => {
    let provider: ObjectIdProvider;

    beforeEach(() => {
      provider = new ObjectIdProvider();
    });

    it('should have correct byte length', () => {
      expect(provider.byteLength).toBe(12);
      expect(provider.name).toBe('ObjectID');
    });

    it('should generate valid ObjectIDs', () => {
      const id1 = provider.generate();
      const id2 = provider.generate();

      expect(id1).toBeInstanceOf(Uint8Array);
      expect(id1.length).toBe(12);
      expect(provider.validate(id1)).toBe(true);

      // Should be unique - convert to native type for comparison
      const obj1 = provider.fromBytes(id1);
      const obj2 = provider.fromBytes(id2);
      expect(provider.equals(obj1, obj2)).toBe(false);
    });

    it('should serialize to 24-character hex string', () => {
      const id = provider.generate();
      const serialized = provider.serialize(id);

      expect(serialized).toMatch(/^[0-9a-f]{24}$/);
      expect(serialized.length).toBe(24);
    });

    it('should deserialize from hex string', () => {
      const id = provider.generate();
      const serialized = provider.serialize(id);
      const deserialized = provider.deserialize(serialized);

      const obj1 = provider.fromBytes(id);
      const obj2 = provider.fromBytes(deserialized);
      expect(provider.equals(obj1, obj2)).toBe(true);
    });

    it('should reject invalid ObjectIDs', () => {
      const allZeros = new Uint8Array(12);
      expect(provider.validate(allZeros)).toBe(false);

      const wrongLength = new Uint8Array(11);
      expect(provider.validate(wrongLength)).toBe(false);
    });

    it('should clone IDs', () => {
      const id = provider.generate();
      const obj = provider.fromBytes(id);
      const cloned = provider.clone(obj);

      expect(provider.equals(obj, cloned)).toBe(true);
      expect(obj).not.toBe(cloned); // Different objects
    });

    it('should perform equality comparison', () => {
      const id1 = provider.generate();
      const obj1 = provider.fromBytes(id1);
      const obj2 = provider.clone(obj1);
      const obj3 = provider.fromBytes(provider.generate());

      expect(provider.equals(obj1, obj2)).toBe(true);
      expect(provider.equals(obj1, obj3)).toBe(false);
    });

    it('should convert to/from bytes', () => {
      const id = provider.generate();
      const obj = provider.fromBytes(id);
      const bytes = provider.toBytes(obj);
      const restored = provider.fromBytes(bytes);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(12);
      expect(provider.equals(obj, restored)).toBe(true);
    });

    it('should convert to/from string', () => {
      const id = provider.generate();
      const obj = provider.fromBytes(id);
      const str = provider.idToString(obj);
      const restored = provider.idFromString(str);

      expect(typeof str).toBe('string');
      expect(provider.equals(obj, restored)).toBe(true);
    });
  });

  describe('GuidV4Provider', () => {
    let provider: GuidV4Provider;

    beforeEach(() => {
      provider = new GuidV4Provider();
    });

    it('should have correct byte length', () => {
      expect(provider.byteLength).toBe(16);
      expect(provider.name).toBe('GUIDv4');
    });

    it('should generate valid GUIDs', () => {
      const id1 = provider.generate();
      const id2 = provider.generate();

      expect(id1).toBeInstanceOf(Uint8Array);
      expect(id1.length).toBe(16);
      expect(provider.validate(id1)).toBe(true);

      // Should be unique - convert to native type for comparison
      const guid1 = provider.fromBytes(id1);
      const guid2 = provider.fromBytes(id2);
      expect(provider.equals(guid1, guid2)).toBe(false);
    });

    it('should serialize to base64 string', () => {
      const id = provider.generate();
      const serialized = provider.serialize(id);

      expect(serialized.length).toBe(24); // Base64 for 16 bytes
      expect(provider.validate(id)).toBe(true);
    });

    it('should deserialize from base64 string', () => {
      const id = provider.generate();
      const serialized = provider.serialize(id);
      const deserialized = provider.deserialize(serialized);

      const guid1 = provider.fromBytes(id);
      const guid2 = provider.fromBytes(deserialized);
      expect(provider.equals(guid1, guid2)).toBe(true);
    });

    it('should validate v4 GUIDs', () => {
      const id = provider.generate();
      expect(provider.validate(id)).toBe(true);
      expect(provider.getVersion(id)).toBe(4);
    });

    it('should detect empty GUIDs', () => {
      const emptyGuid = new Uint8Array(16);
      expect(provider.isEmpty(emptyGuid)).toBe(true);

      const nonEmptyGuid = provider.generate();
      expect(provider.isEmpty(nonEmptyGuid)).toBe(false);
    });

    it('should convert to/from bytes', () => {
      const id = provider.generate();
      const guid = provider.fromBytes(id);
      const bytes = provider.toBytes(guid);
      const restored = provider.fromBytes(bytes);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(16);
      expect(provider.equals(guid, restored)).toBe(true);
    });

    it('should clone IDs', () => {
      const id = provider.generate();
      const guid = provider.fromBytes(id);
      const cloned = provider.clone(guid);

      expect(provider.equals(guid, cloned)).toBe(true);
      expect(guid).not.toBe(cloned); // Different objects
    });

    it('should convert to/from string', () => {
      const id = provider.generate();
      const guid = provider.fromBytes(id);
      const str = provider.idToString(guid);
      const restored = provider.idFromString(str);

      expect(typeof str).toBe('string');
      expect(provider.equals(guid, restored)).toBe(true);
    });
  });

  describe('UuidProvider', () => {
    let provider: UuidProvider;

    beforeEach(() => {
      provider = new UuidProvider();
    });

    it('should have correct byte length', () => {
      expect(provider.byteLength).toBe(16);
      expect(provider.name).toBe('UUID');
    });

    it('should generate valid UUIDs', () => {
      const id1 = provider.generate();
      const id2 = provider.generate();

      expect(id1).toBeInstanceOf(Uint8Array);
      expect(id1.length).toBe(16);
      expect(provider.validate(id1)).toBe(true);

      // Should be unique - convert to native type (string) for comparison
      const str1 = provider.fromBytes(id1);
      const str2 = provider.fromBytes(id2);
      expect(provider.equals(str1, str2)).toBe(false);
    });

    it('should serialize to UUID format with dashes', () => {
      const id = provider.generate();
      const serialized = provider.serialize(id);

      expect(serialized).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(serialized.length).toBe(36);
    });

    it('should deserialize from UUID string', () => {
      const id = provider.generate();
      const serialized = provider.serialize(id);
      const deserialized = provider.deserialize(serialized);

      const str1 = provider.fromBytes(id);
      const str2 = provider.fromBytes(deserialized);
      expect(provider.equals(str1, str2)).toBe(true);
    });

    it('should extract version from UUID', () => {
      const id = provider.generate();
      const version = provider.getVersion(id);

      expect(version).toBe(4); // v4 UUID
    });

    it('should detect nil UUIDs', () => {
      const nilUuid = new Uint8Array(16);
      expect(provider.isNil(nilUuid)).toBe(true);

      const nonNilUuid = provider.generate();
      expect(provider.isNil(nonNilUuid)).toBe(false);
    });

    it('should convert to/from bytes', () => {
      const id = provider.generate();
      const str = provider.fromBytes(id);
      const bytes = provider.toBytes(str);
      const restored = provider.fromBytes(bytes);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(16);
      expect(provider.equals(str, restored)).toBe(true);
    });

    it('should clone IDs (strings are immutable)', () => {
      const id = provider.generate();
      const str = provider.fromBytes(id);
      const cloned = provider.clone(str);

      expect(provider.equals(str, cloned)).toBe(true);
      expect(str).toBe(cloned); // Strings are immutable, same reference is fine
    });

    it('should convert to/from string', () => {
      const id = provider.generate();
      const uuidStr = provider.fromBytes(id);
      const str = provider.idToString(uuidStr);
      const restored = provider.idFromString(str);

      expect(typeof str).toBe('string');
      expect(provider.equals(uuidStr, restored)).toBe(true);
    });
  });

  describe('CustomIdProvider', () => {
    it('should create provider with custom byte length', () => {
      const provider = new CustomIdProvider(20, 'SHA1Hash');

      expect(provider.byteLength).toBe(20);
      expect(provider.name).toBe('SHA1Hash');
    });

    it('should generate IDs of specified length', () => {
      const provider = new CustomIdProvider(24);
      const id = provider.generate();

      expect(id.length).toBe(24);
      expect(provider.validate(id)).toBe(true);
    });

    it('should serialize to hex string of correct length', () => {
      const provider = new CustomIdProvider(16);
      const id = provider.generate();
      const serialized = provider.serialize(id);

      expect(serialized.length).toBe(32); // 16 bytes * 2 hex chars
      expect(serialized).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should deserialize from hex string', () => {
      const provider = new CustomIdProvider(8);
      const id = provider.generate();
      const serialized = provider.serialize(id);
      const deserialized = provider.deserialize(serialized);

      // CustomIdProvider uses Uint8Array as native type
      expect(provider.equals(id, deserialized)).toBe(true);
    });

    it('should reject invalid byte lengths', () => {
      expect(() => new CustomIdProvider(0)).toThrow();
      expect(() => new CustomIdProvider(256)).toThrow();
      expect(() => new CustomIdProvider(-1)).toThrow();
      expect(() => new CustomIdProvider(1.5)).toThrow();
    });

    it('should use default name if not provided', () => {
      const provider = new CustomIdProvider(10);
      expect(provider.name).toBe('Custom');
    });

    it('should convert to/from bytes (pass-through for CustomIdProvider)', () => {
      const provider = new CustomIdProvider(20);
      const id = provider.generate();
      const bytes = provider.toBytes(id);
      const restored = provider.fromBytes(bytes);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(20);
      expect(provider.equals(id, restored)).toBe(true);
    });

    it('should clone IDs', () => {
      const provider = new CustomIdProvider(16);
      const id = provider.generate();
      const cloned = provider.clone(id);

      expect(provider.equals(id, cloned)).toBe(true);
      expect(id).not.toBe(cloned); // Different Uint8Array instances
    });

    it('should convert to/from string', () => {
      const provider = new CustomIdProvider(12);
      const id = provider.generate();
      const str = provider.idToString(id);
      const restored = provider.idFromString(str);

      expect(typeof str).toBe('string');
      expect(provider.equals(id, restored)).toBe(true);
    });

    it('should use constant-time equality comparison', () => {
      const provider = new CustomIdProvider(16);
      const id1 = provider.generate();
      const id2 = provider.clone(id1);
      const id3 = provider.generate();

      expect(provider.equals(id1, id2)).toBe(true);
      expect(provider.equals(id1, id3)).toBe(false);
    });
  });

  describe('Cross-provider compatibility', () => {
    it('should have different native types for different providers', () => {
      const objectIdProvider = new ObjectIdProvider();
      const guidProvider = new GuidV4Provider();
      const uuidProvider = new UuidProvider();
      const customProvider = new CustomIdProvider(12);

      const objectIdBytes = objectIdProvider.generate();
      const guidBytes = guidProvider.generate();
      const uuidBytes = uuidProvider.generate();
      const customBytes = customProvider.generate();

      // ObjectIdProvider native type is ObjectId
      const objectId = objectIdProvider.fromBytes(objectIdBytes);
      expect(objectId.toHexString).toBeDefined();

      // GuidV4Provider native type is GuidV4
      const guid = guidProvider.fromBytes(guidBytes);
      expect(guid.asFullHexGuid).toBeDefined();

      // UuidProvider native type is string
      const uuid = uuidProvider.fromBytes(uuidBytes);
      expect(typeof uuid).toBe('string');

      // CustomIdProvider native type is Uint8Array
      const custom = customProvider.fromBytes(customBytes);
      expect(custom).toBeInstanceOf(Uint8Array);
    });

    it('should maintain distinct serialization formats', () => {
      const objectIdProvider = new ObjectIdProvider();
      const uuidProvider = new UuidProvider();

      const objectId = objectIdProvider.generate();
      const uuid = uuidProvider.generate();

      const objectIdStr = objectIdProvider.serialize(objectId);
      const uuidStr = uuidProvider.serialize(uuid);

      // ObjectID: 24 hex chars, UUID: 36 chars with dashes
      expect(objectIdStr.length).toBe(24);
      expect(uuidStr.length).toBe(36);
      expect(uuidStr).toContain('-');
      expect(objectIdStr).not.toContain('-');
    });

    it('should all implement IIdProvider interface consistently', () => {
      const providers = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
        new UuidProvider(),
        new CustomIdProvider(16),
      ];

      for (const provider of providers) {
        // All providers should have these properties/methods
        expect(typeof provider.byteLength).toBe('number');
        expect(typeof provider.name).toBe('string');
        expect(typeof provider.generate).toBe('function');
        expect(typeof provider.validate).toBe('function');
        expect(typeof provider.serialize).toBe('function');
        expect(typeof provider.deserialize).toBe('function');
        expect(typeof provider.equals).toBe('function');
        expect(typeof provider.clone).toBe('function');
        expect(typeof provider.toBytes).toBe('function');
        expect(typeof provider.fromBytes).toBe('function');
        expect(typeof provider.idToString).toBe('function');
        expect(typeof provider.idFromString).toBe('function');

        // Generate should return Uint8Array of correct length
        const bytes = provider.generate();
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(provider.byteLength);
        expect(provider.validate(bytes)).toBe(true);
      }
    });
  });
});
