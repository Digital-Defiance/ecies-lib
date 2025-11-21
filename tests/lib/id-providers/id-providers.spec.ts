import {
  ObjectIdProvider,
  GuidV4Provider,
  UuidProvider,
  Legacy32ByteProvider,
  CustomIdProvider,
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

      // Should be unique
      expect(provider.equals(id1, id2)).toBe(false);
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

      expect(provider.equals(id, deserialized)).toBe(true);
    });

    it('should reject invalid ObjectIDs', () => {
      const allZeros = new Uint8Array(12);
      expect(provider.validate(allZeros)).toBe(false);

      const wrongLength = new Uint8Array(11);
      expect(provider.validate(wrongLength)).toBe(false);
    });

    it('should clone IDs', () => {
      const id = provider.generate();
      const cloned = provider.clone(id);

      expect(provider.equals(id, cloned)).toBe(true);
      expect(id).not.toBe(cloned); // Different objects
    });

    it('should perform constant-time equality comparison', () => {
      const id1 = provider.generate();
      const id2 = provider.clone(id1);
      const id3 = provider.generate();

      expect(provider.equals(id1, id2)).toBe(true);
      expect(provider.equals(id1, id3)).toBe(false);
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

      // Should be unique
      expect(provider.equals(id1, id2)).toBe(false);
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

      expect(provider.equals(id, deserialized)).toBe(true);
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

      // Should be unique
      expect(provider.equals(id1, id2)).toBe(false);
    });

    it('should serialize to UUID format with dashes', () => {
      const id = provider.generate();
      const serialized = provider.serialize(id);

      expect(serialized).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(serialized.length).toBe(36);
    });

    it('should deserialize from UUID string', () => {
      const id = provider.generate();
      const serialized = provider.serialize(id);
      const deserialized = provider.deserialize(serialized);

      expect(provider.equals(id, deserialized)).toBe(true);
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
  });

  describe('Legacy32ByteProvider', () => {
    let provider: Legacy32ByteProvider;

    beforeEach(() => {
      provider = new Legacy32ByteProvider();
    });

    it('should have correct byte length', () => {
      expect(provider.byteLength).toBe(32);
      expect(provider.name).toBe('Legacy32Byte');
    });

    it('should generate valid 32-byte IDs', () => {
      const id1 = provider.generate();
      const id2 = provider.generate();

      expect(id1).toBeInstanceOf(Uint8Array);
      expect(id1.length).toBe(32);
      expect(provider.validate(id1)).toBe(true);

      // Should be unique
      expect(provider.equals(id1, id2)).toBe(false);
    });

    it('should serialize to 64-character hex string', () => {
      const id = provider.generate();
      const serialized = provider.serialize(id);

      expect(serialized).toMatch(/^[0-9a-f]{64}$/);
      expect(serialized.length).toBe(64);
    });

    it('should deserialize from hex string', () => {
      const id = provider.generate();
      const serialized = provider.serialize(id);
      const deserialized = provider.deserialize(serialized);

      expect(provider.equals(id, deserialized)).toBe(true);
    });

    it('should validate any 32-byte buffer', () => {
      const id = new Uint8Array(32);
      expect(provider.validate(id)).toBe(true);

      const wrongLength = new Uint8Array(31);
      expect(provider.validate(wrongLength)).toBe(false);
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
  });

  describe('Cross-provider compatibility', () => {
    it('should not allow comparing IDs from different providers', () => {
      const objectIdProvider = new ObjectIdProvider();
      const guidProvider = new GuidV4Provider();

      const objectId = objectIdProvider.generate();
      const guid = guidProvider.generate();

      // Different lengths should not be equal
      expect(objectIdProvider.equals(objectId, guid)).toBe(false);
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
  });
});
