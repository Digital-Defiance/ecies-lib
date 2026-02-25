import { GuidErrorType } from '../../src/enumerations/guid-error-type';
import { GuidError } from '../../src/errors/guid';
import { GuidUint8Array } from '../../src/lib/guid';
import {
  fromProviderId,
  fromProviderIdBytes,
} from '../../src/lib/guid-provider-utils';
import {
  GuidV4Provider,
  ObjectIdProvider,
  UuidProvider,
  CustomIdProvider,
  Uint8ArrayIdProvider,
} from '../../src/lib/id-providers';

describe('GuidUint8Array.fromProviderId / fromProviderIdBytes', () => {
  describe('GuidV4Provider (16-byte, direct reinterpretation)', () => {
    const provider = new GuidV4Provider();

    it('should convert a generated GuidV4 id to a GuidUint8Array', () => {
      const rawBytes = provider.generate();
      const nativeId = provider.fromBytes(rawBytes);
      const guid = fromProviderId(nativeId, provider);

      expect(guid).toBeInstanceOf(GuidUint8Array);
      expect(guid.length).toBe(16);
    });

    it('should produce a valid UUID from GuidV4 bytes', () => {
      const rawBytes = provider.generate();
      const guid = fromProviderIdBytes(rawBytes, provider);

      expect(guid.isValidV4()).toBe(true);
    });

    it('should be deterministic (same input → same output)', () => {
      const rawBytes = provider.generate();
      const guid1 = fromProviderIdBytes(rawBytes, provider);
      const guid2 = fromProviderIdBytes(rawBytes, provider);

      expect(guid1.asFullHexGuid).toBe(guid2.asFullHexGuid);
    });

    it('should preserve the original bytes for 16-byte providers', () => {
      const rawBytes = provider.generate();
      const guid = fromProviderIdBytes(rawBytes, provider);

      // The raw bytes should match since GuidV4 is already 16 bytes
      const guidBytes = guid.asRawGuidPlatformBuffer;
      expect(Buffer.from(guidBytes).toString('hex')).toBe(
        Buffer.from(rawBytes).toString('hex'),
      );
    });
  });

  describe('UuidProvider (16-byte, direct reinterpretation)', () => {
    const provider = new UuidProvider();

    it('should convert a UUID string id to a GuidUint8Array via fromProviderId', () => {
      const rawBytes = provider.generate();
      const nativeId = provider.fromBytes(rawBytes); // returns a UUID string
      const guid = fromProviderId(nativeId, provider);

      expect(guid).toBeInstanceOf(GuidUint8Array);
      expect(guid.length).toBe(16);
    });

    it('should produce a valid UUID from UUID bytes', () => {
      const rawBytes = provider.generate();
      const guid = fromProviderIdBytes(rawBytes, provider);

      expect(guid.getVersion()).toBeDefined();
    });

    it('should preserve the original bytes for UUID provider', () => {
      const rawBytes = provider.generate();
      const guid = fromProviderIdBytes(rawBytes, provider);

      const guidBytes = guid.asRawGuidPlatformBuffer;
      expect(Buffer.from(guidBytes).toString('hex')).toBe(
        Buffer.from(rawBytes).toString('hex'),
      );
    });
  });

  describe('ObjectIdProvider (12-byte, v5 derivation)', () => {
    const provider = new ObjectIdProvider();

    it('should convert an ObjectId to a GuidUint8Array via fromProviderId', () => {
      const rawBytes = provider.generate();
      const nativeId = provider.fromBytes(rawBytes); // returns ObjectId
      const guid = fromProviderId(nativeId, provider);

      expect(guid).toBeInstanceOf(GuidUint8Array);
      expect(guid.length).toBe(16);
    });

    it('should produce a valid v5 UUID from ObjectId bytes', () => {
      const rawBytes = provider.generate();
      const guid = fromProviderIdBytes(rawBytes, provider);

      expect(guid.isValidV5()).toBe(true);
    });

    it('should be deterministic (same ObjectId → same GUID)', () => {
      const rawBytes = provider.generate();
      const guid1 = fromProviderIdBytes(rawBytes, provider);
      const guid2 = fromProviderIdBytes(rawBytes, provider);

      expect(guid1.asFullHexGuid).toBe(guid2.asFullHexGuid);
    });

    it('should produce different GUIDs for different ObjectIds', () => {
      const bytes1 = provider.generate();
      const bytes2 = provider.generate();
      const guid1 = fromProviderIdBytes(bytes1, provider);
      const guid2 = fromProviderIdBytes(bytes2, provider);

      expect(guid1.asFullHexGuid).not.toBe(guid2.asFullHexGuid);
    });

    it('should produce a different GUID than a CustomIdProvider with the same bytes', () => {
      // ObjectId is 12 bytes, so create a Custom provider with 12 bytes
      const customProvider = new CustomIdProvider(12, 'Test12');
      const rawBytes = provider.generate();

      const guidFromObjectId = fromProviderIdBytes(rawBytes, provider);
      const guidFromCustom = fromProviderIdBytes(rawBytes, customProvider);

      // Different namespaces should produce different v5 GUIDs
      expect(guidFromObjectId.asFullHexGuid).not.toBe(
        guidFromCustom.asFullHexGuid,
      );
    });
  });

  describe('CustomIdProvider (variable-byte, v5 derivation)', () => {
    it('should convert a 20-byte custom id to a GuidUint8Array', () => {
      const provider = new CustomIdProvider(20, 'SHA1Hash');
      const rawBytes = provider.generate();
      const guid = fromProviderIdBytes(rawBytes, provider);

      expect(guid).toBeInstanceOf(GuidUint8Array);
      expect(guid.length).toBe(16);
      expect(guid.isValidV5()).toBe(true);
    });

    it('should convert a 32-byte custom id to a GuidUint8Array', () => {
      const provider = new CustomIdProvider(32, 'SHA256Hash');
      const rawBytes = provider.generate();
      const guid = fromProviderIdBytes(rawBytes, provider);

      expect(guid).toBeInstanceOf(GuidUint8Array);
      expect(guid.isValidV5()).toBe(true);
    });

    it('should work with fromProviderId using native Uint8Array type', () => {
      const provider = new CustomIdProvider(20, 'Test');
      const rawBytes = provider.generate();
      const nativeId = provider.fromBytes(rawBytes);
      const guid = fromProviderId(nativeId, provider);

      expect(guid).toBeInstanceOf(GuidUint8Array);
      expect(guid.isValidV5()).toBe(true);
    });

    it('should be deterministic for custom ids', () => {
      const provider = new CustomIdProvider(8, 'Short');
      const rawBytes = provider.generate();
      const guid1 = fromProviderIdBytes(rawBytes, provider);
      const guid2 = fromProviderIdBytes(rawBytes, provider);

      expect(guid1.asFullHexGuid).toBe(guid2.asFullHexGuid);
    });
  });

  describe('Uint8ArrayIdProvider (variable-byte, v5 derivation)', () => {
    it('should convert a 24-byte Uint8Array id to a GuidUint8Array', () => {
      const provider = new Uint8ArrayIdProvider(24, 'Test24');
      const rawBytes = provider.generate();
      const guid = fromProviderIdBytes(rawBytes, provider);

      expect(guid).toBeInstanceOf(GuidUint8Array);
      expect(guid.length).toBe(16);
      expect(guid.isValidV5()).toBe(true);
    });

    it('should be deterministic for Uint8Array ids', () => {
      const provider = new Uint8ArrayIdProvider(10, 'Test10');
      const rawBytes = provider.generate();
      const guid1 = fromProviderIdBytes(rawBytes, provider);
      const guid2 = fromProviderIdBytes(rawBytes, provider);

      expect(guid1.asFullHexGuid).toBe(guid2.asFullHexGuid);
    });

    it('should produce different GUIDs than CustomIdProvider with same byte length and data', () => {
      const uint8Provider = new Uint8ArrayIdProvider(12, 'Test12');
      const customProvider = new CustomIdProvider(12, 'Test12');
      const rawBytes = uint8Provider.generate();

      const guidFromUint8 = fromProviderIdBytes(rawBytes, uint8Provider);
      const guidFromCustom = fromProviderIdBytes(rawBytes, customProvider);

      // Different provider types use different namespaces
      expect(guidFromUint8.asFullHexGuid).not.toBe(
        guidFromCustom.asFullHexGuid,
      );
    });
  });

  describe('Error handling', () => {
    it('should throw GuidError when byte length does not match provider', () => {
      const provider = new ObjectIdProvider(); // expects 12 bytes
      const wrongBytes = new Uint8Array(16); // 16 bytes

      expect(() => fromProviderIdBytes(wrongBytes, provider)).toThrow(
        GuidError,
      );
    });

    it('should throw GuidError with correct type for length mismatch', () => {
      const provider = new CustomIdProvider(20, 'Test');
      const wrongBytes = new Uint8Array(10);

      try {
        fromProviderIdBytes(wrongBytes, provider);
        fail('Expected GuidError to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(GuidError);
        expect((e as GuidError).type).toBe(GuidErrorType.InvalidGuid);
      }
    });
  });

  describe('Cross-provider isolation', () => {
    it('should produce unique GUIDs per provider type for the same serialized value', () => {
      // Create providers that all use 12 bytes
      const objectIdProvider = new ObjectIdProvider();
      const customProvider = new CustomIdProvider(12, 'Custom12');
      const uint8Provider = new Uint8ArrayIdProvider(12, 'Uint8_12');

      const rawBytes = objectIdProvider.generate();

      const guidFromObjectId = fromProviderIdBytes(rawBytes, objectIdProvider);
      const guidFromCustom = fromProviderIdBytes(rawBytes, customProvider);
      const guidFromUint8 = fromProviderIdBytes(rawBytes, uint8Provider);

      // All three should be different due to different namespaces
      const guids = new Set([
        guidFromObjectId.asFullHexGuid,
        guidFromCustom.asFullHexGuid,
        guidFromUint8.asFullHexGuid,
      ]);
      expect(guids.size).toBe(3);
    });
  });

  describe('Round-trip consistency', () => {
    it('fromProviderId and fromProviderIdBytes should produce the same result for GuidV4', () => {
      const provider = new GuidV4Provider();
      const rawBytes = provider.generate();
      const nativeId = provider.fromBytes(rawBytes);

      const guidFromNative = fromProviderId(nativeId, provider);
      const guidFromBytes = fromProviderIdBytes(rawBytes, provider);

      expect(guidFromNative.asFullHexGuid).toBe(guidFromBytes.asFullHexGuid);
    });

    it('fromProviderId and fromProviderIdBytes should produce the same result for ObjectId', () => {
      const provider = new ObjectIdProvider();
      const rawBytes = provider.generate();
      const nativeId = provider.fromBytes(rawBytes);

      const guidFromNative = fromProviderId(nativeId, provider);
      const guidFromBytes = fromProviderIdBytes(rawBytes, provider);

      expect(guidFromNative.asFullHexGuid).toBe(guidFromBytes.asFullHexGuid);
    });

    it('fromProviderId and fromProviderIdBytes should produce the same result for UUID', () => {
      const provider = new UuidProvider();
      const rawBytes = provider.generate();
      const nativeId = provider.fromBytes(rawBytes);

      const guidFromNative = fromProviderId(nativeId, provider);
      const guidFromBytes = fromProviderIdBytes(rawBytes, provider);

      expect(guidFromNative.asFullHexGuid).toBe(guidFromBytes.asFullHexGuid);
    });
  });
});
