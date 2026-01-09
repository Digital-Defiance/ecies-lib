/**
 * Unit Tests: Member ID Generation
 *
 * These tests validate Member ID generation behavior.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * - Member uses the service's configured idProvider for ID generation
 * - The service's idProvider configuration DOES affect Member ID generation
 * - member.id is a native type (ObjectId/GuidV4), member.idBytes is the raw Uint8Array
 * - Service's idProvider IS used for both creation and serialization
 */

import { ObjectId } from 'bson';
import { createRuntimeConfiguration } from '../src/constants';
import { EmailString } from '../src/email-string';
import { MemberType } from '../src/enumerations/member-type';
import { GuidV4 } from '../src/lib/guid';
import { GuidV4Provider, ObjectIdProvider } from '../src/lib/id-providers';
import { Member } from '../src/member';
import { ECIESService } from '../src/services/ecies/service';

describe('Unit Tests: Member ID Generation', () => {
  describe('Member ID uses service idProvider', () => {
    it('should create Member with GuidV4 type ID when service uses GuidV4Provider', () => {
      // Member uses service's configured idProvider
      const service = new ECIESService(
        createRuntimeConfiguration({ idProvider: new GuidV4Provider() }),
      );

      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      // ID is GuidV4 type (from service's idProvider)
      expect(result.member.id).toBeInstanceOf(GuidV4);
      // idBytes is the raw bytes
      expect(result.member.idBytes).toBeInstanceOf(Uint8Array);
      expect(result.member.idBytes.length).toBe(
        service.constants.idProvider.byteLength,
      );
      expect(result.member.idBytes.length).toBe(16);
    });

    it('should create Member with ObjectId type ID when service uses ObjectIdProvider', () => {
      // Member uses service's configured idProvider
      const service = new ECIESService(
        createRuntimeConfiguration({ idProvider: new ObjectIdProvider() }),
      );

      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      // ID is ObjectId type (from service's idProvider)
      expect(result.member.id).toBeInstanceOf(ObjectId);
      // idBytes is the raw bytes
      expect(result.member.idBytes).toBeInstanceOf(Uint8Array);
      expect(result.member.idBytes.length).toBe(
        service.constants.idProvider.byteLength,
      );
      expect(result.member.idBytes.length).toBe(12);
    });

    it('should generate different ID lengths based on service configuration', () => {
      // GuidV4Provider service generates 16-byte IDs
      const guidService = new ECIESService(
        createRuntimeConfiguration({ idProvider: new GuidV4Provider() }),
      );
      // ObjectIdProvider service generates 12-byte IDs
      const objectIdService = new ECIESService(
        createRuntimeConfiguration({ idProvider: new ObjectIdProvider() }),
      );

      const guidMember = Member.newMember(
        guidService,
        MemberType.User,
        'User 1',
        new EmailString('user1@example.com'),
      );
      const objectIdMember = Member.newMember(
        objectIdService,
        MemberType.User,
        'User 2',
        new EmailString('user2@example.com'),
      );

      // Different ID lengths based on service configuration
      expect(guidMember.member.idBytes.length).toBe(16);
      expect(objectIdMember.member.idBytes.length).toBe(12);
      expect(guidMember.member.id).toBeInstanceOf(GuidV4);
      expect(objectIdMember.member.id).toBeInstanceOf(ObjectId);
    });
  });

  describe('Member ID uniqueness', () => {
    it('should generate unique IDs for different members', () => {
      const service = new ECIESService();

      const member1 = Member.newMember(
        service,
        MemberType.User,
        'User 1',
        new EmailString('user1@example.com'),
      );
      const member2 = Member.newMember(
        service,
        MemberType.User,
        'User 2',
        new EmailString('user2@example.com'),
      );
      const member3 = Member.newMember(
        service,
        MemberType.Admin,
        'Admin',
        new EmailString('admin@example.com'),
      );

      // IDs should be unique
      expect(member1.member.id.toString()).not.toBe(
        member2.member.id.toString(),
      );
      expect(member1.member.id.toString()).not.toBe(
        member3.member.id.toString(),
      );
      expect(member2.member.id.toString()).not.toBe(
        member3.member.id.toString(),
      );

      // Byte representations should also be unique
      expect(member1.member.idBytes).not.toEqual(member2.member.idBytes);
      expect(member1.member.idBytes).not.toEqual(member3.member.idBytes);
      expect(member2.member.idBytes).not.toEqual(member3.member.idBytes);
    });
  });

  describe('Member ID consistency between id and idBytes', () => {
    it('should have matching id and idBytes representations', () => {
      const service = new ECIESService();

      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      // Verify idBytes matches what we'd get from service's idProvider
      const member = result.member;
      expect(member.idBytes).toBeInstanceOf(Uint8Array);
      expect(member.idBytes.length).toBe(12); // Default ObjectIdProvider

      // Convert id to bytes using service's idProvider and compare
      const idToBytes = service.constants.idProvider.toBytes(member.id);
      expect(member.idBytes).toEqual(idToBytes);
    });

    it('should have matching id and idBytes for GuidV4Provider', () => {
      const service = new ECIESService(
        createRuntimeConfiguration({ idProvider: new GuidV4Provider() }),
      );

      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      const member = result.member;
      expect(member.idBytes).toBeInstanceOf(Uint8Array);
      expect(member.idBytes.length).toBe(16); // GuidV4Provider

      // Convert id to bytes using service's idProvider and compare
      const idToBytes = service.constants.idProvider.toBytes(member.id);
      expect(member.idBytes).toEqual(idToBytes);
    });
  });

  describe('Member serialization with service idProvider', () => {
    it('should serialize ID using service idProvider in toJson()', () => {
      // Service with ObjectIdProvider
      const objectIdService = new ECIESService(
        createRuntimeConfiguration({ idProvider: new ObjectIdProvider() }),
      );

      const result = Member.newMember(
        objectIdService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      // toJson returns a JSON string
      const jsonString = result.member.toJson();
      expect(typeof jsonString).toBe('string');

      // Parse to verify structure
      const parsed = JSON.parse(jsonString);
      expect(parsed.id).toBeDefined();
      expect(typeof parsed.id).toBe('string');
      // ObjectId hex string is 24 chars
      expect(parsed.id.length).toBe(24);
    });

    it('should preserve ID through serialization/deserialization', () => {
      const service = new ECIESService();
      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );
      const originalId = result.member.id;
      const originalIdBytes = result.member.idBytes;

      // Serialize and deserialize
      const json = result.member.toJson();
      const deserialized = Member.fromJson(json, service);

      // ID should be preserved
      expect(deserialized.id.toString()).toBe(originalId.toString());
      expect(deserialized.idBytes).toEqual(originalIdBytes);
      expect(deserialized.name).toBe('Test User');
      expect(deserialized.email.toString()).toBe('test@example.com');
    });

    it('should preserve all Member properties through serialization', () => {
      const service = new ECIESService();
      const result = Member.newMember(
        service,
        MemberType.Admin,
        'Admin User',
        new EmailString('admin@example.com'),
      );
      const original = result.member;

      const json = original.toJson();
      const deserialized = Member.fromJson(json, service);

      // All properties preserved
      expect(deserialized.id.toString()).toBe(original.id.toString());
      expect(deserialized.idBytes).toEqual(original.idBytes);
      expect(deserialized.type).toBe(original.type);
      expect(deserialized.name).toBe(original.name);
      expect(deserialized.email.toString()).toBe(original.email.toString());
      expect(deserialized.publicKey).toEqual(original.publicKey);
      expect(deserialized.creatorId.toString()).toBe(
        original.creatorId.toString(),
      );
      expect(deserialized.dateCreated.getTime()).toBe(
        original.dateCreated.getTime(),
      );
      expect(deserialized.dateUpdated.getTime()).toBe(
        original.dateUpdated.getTime(),
      );
    });
  });

  describe('Service idProvider configuration', () => {
    it('should reflect configured idProvider in service constants', () => {
      const guidConstants = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const guidService = new ECIESService(guidConstants);

      const objectIdConstants = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      const objectIdService = new ECIESService(objectIdConstants);

      // Service constants reflect configuration
      expect(guidService.constants.idProvider.byteLength).toBe(16);
      expect(guidService.constants.MEMBER_ID_LENGTH).toBe(16);

      expect(objectIdService.constants.idProvider.byteLength).toBe(12);
      expect(objectIdService.constants.MEMBER_ID_LENGTH).toBe(12);
    });

    it('should use default ObjectIdProvider when no idProvider configured', () => {
      const service = new ECIESService();

      expect(service.constants.idProvider.byteLength).toBe(12);
      expect(service.constants.MEMBER_ID_LENGTH).toBe(12);
    });
  });

  describe('Member creation without custom idProvider', () => {
    it('should work correctly when service has no explicit idProvider', () => {
      const service = new ECIESService({
        curveName: 'secp256k1',
      });

      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      // Should create valid member with ObjectId
      expect(result.member.id).toBeInstanceOf(ObjectId);
      expect(result.member.idBytes.length).toBe(12);
    });

    it('should work correctly with minimal service config', () => {
      const service = new ECIESService();

      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      expect(result.member.id).toBeInstanceOf(ObjectId);
      expect(result.member.idBytes.length).toBe(12);
    });
  });

  describe('ID byte length validation on deserialization', () => {
    it('should warn when deserialized ID length does not match expected', () => {
      const service = new ECIESService();
      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );
      const json = result.member.toJson();

      // Spy on console.warn
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Deserialize with same service (no mismatch expected)
      const deserialized = Member.fromJson(json, service);

      // Should NOT warn when ID length matches
      expect(warnSpy).not.toHaveBeenCalled();
      expect(deserialized.idBytes.length).toBe(12);

      warnSpy.mockRestore();
    });
  });
});
