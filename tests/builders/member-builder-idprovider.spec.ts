/**
 * Unit Tests: MemberBuilder ID Generation
 *
 * These tests validate MemberBuilder creates Members with proper IDs.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * - Member uses the service's configured idProvider for ID generation
 * - The service's idProvider configuration DOES affect Member ID generation
 * - member.id matches the service's idProvider type, member.idBytes is the raw Uint8Array
 * - Service's idProvider IS used for both ID generation and serialization
 */

import { ObjectId } from 'bson';
import { MemberBuilder } from '../../src/builders/member-builder';
import { Constants, createRuntimeConfiguration } from '../../src/constants';
import { EmailString } from '../../src/email-string';
import { MemberType } from '../../src/enumerations/member-type';
import { GuidV4 } from '../../src/lib/guid';
import { GuidV4Provider, ObjectIdProvider } from '../../src/lib/id-providers';
import { ECIESService } from '../../src/services/ecies/service';

describe('Unit Tests: MemberBuilder ID Generation', () => {
  describe('MemberBuilder creates IDs based on service configuration', () => {
    it('should create Member with GuidV4 ID when service uses GuidV4Provider', () => {
      // Member uses service's configured idProvider (GuidV4Provider)
      const constants = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const service = new ECIESService(constants);

      const result = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('Test User')
        .withEmail(new EmailString('test@example.com'))
        .build();

      // ID matches service's configured idProvider (GuidV4)
      expect(result.member.id).toBeInstanceOf(GuidV4);
      expect(result.member.idBytes.length).toBe(16);
      expect(service.constants.idProvider.byteLength).toBe(16); // Service config is 16
    });

    it('should create consistent 12-byte idBytes with ObjectIdProvider service', () => {
      const constants = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      const service = new ECIESService(constants);

      const result = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('Test User')
        .withEmail(new EmailString('test@example.com'))
        .build();

      expect(result.member.id).toBeInstanceOf(ObjectId);
      expect(result.member.idBytes.length).toBe(12);
      expect(service.constants.idProvider.byteLength).toBe(12);
    });

    it('should create Member with GuidV4 using fluent API', () => {
      const constants = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const service = new ECIESService(constants);

      const result = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.Admin)
        .withName('Admin User')
        .withEmail('admin@example.com')
        .generateMnemonic()
        .build();

      expect(result.member.id).toBeInstanceOf(GuidV4);
      expect(result.member.idBytes.length).toBe(16);
      expect(result.mnemonic).toBeDefined();
    });
  });

  describe('MemberBuilder without custom idProvider', () => {
    it('should create Member with 12-byte ID when no custom idProvider is configured', () => {
      const service = new ECIESService();

      const result = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('Test User')
        .withEmail(new EmailString('test@example.com'))
        .build();

      expect(result.member.id).toBeInstanceOf(ObjectId);
      expect(result.member.idBytes.length).toBe(12);
    });

    it('should create Member with 12-byte ID using default service', () => {
      const service = new ECIESService({
        curveName: 'secp256k1',
      });

      const result = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('Test User')
        .withEmail(new EmailString('test@example.com'))
        .build();

      expect(result.member.id).toBeInstanceOf(ObjectId);
      expect(result.member.idBytes.length).toBe(12);
    });
  });

  describe('MemberBuilder with multiple Members', () => {
    it('should create multiple Members with unique IDs', () => {
      const constants = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const service = new ECIESService(constants);

      const member1 = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('User 1')
        .withEmail(new EmailString('user1@example.com'))
        .build();

      const member2 = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('User 2')
        .withEmail(new EmailString('user2@example.com'))
        .build();

      const member3 = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.Admin)
        .withName('Admin')
        .withEmail(new EmailString('admin@example.com'))
        .build();

      // All should have 16-byte IDs (service uses GuidV4Provider)
      expect(member1.member.idBytes.length).toBe(16);
      expect(member2.member.idBytes.length).toBe(16);
      expect(member3.member.idBytes.length).toBe(16);

      // All should be GuidV4 type
      expect(member1.member.id).toBeInstanceOf(GuidV4);
      expect(member2.member.id).toBeInstanceOf(GuidV4);
      expect(member3.member.id).toBeInstanceOf(GuidV4);

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
    });
  });

  describe('MemberBuilder with different service configs', () => {
    it('should create IDs matching each service idProvider', () => {
      const guidService = new ECIESService(
        createRuntimeConfiguration({ idProvider: new GuidV4Provider() }),
      );
      const objectIdService = new ECIESService(
        createRuntimeConfiguration({ idProvider: new ObjectIdProvider() }),
      );

      const guidMember = MemberBuilder.create()
        .withEciesService(guidService)
        .withType(MemberType.User)
        .withName('GUID User')
        .withEmail(new EmailString('guid@example.com'))
        .build();

      const objectIdMember = MemberBuilder.create()
        .withEciesService(objectIdService)
        .withType(MemberType.User)
        .withName('ObjectID User')
        .withEmail(new EmailString('objectid@example.com'))
        .build();

      // Each should match their service's idProvider
      expect(guidMember.member.idBytes.length).toBe(16);
      expect(objectIdMember.member.idBytes.length).toBe(12);
      expect(guidMember.member.id).toBeInstanceOf(GuidV4);
      expect(objectIdMember.member.id).toBeInstanceOf(ObjectId);
    });
  });

  describe('MemberBuilder with createdBy', () => {
    it('should set creatorIdBytes when withCreatedBy is used', () => {
      const service = new ECIESService();

      // Create a creator
      const creator = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.Admin)
        .withName('Creator')
        .withEmail(new EmailString('creator@example.com'))
        .build();

      // Create member with createdBy (pass idBytes, not id)
      const result = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('Created User')
        .withEmail(new EmailString('created@example.com'))
        .withCreatedBy(creator.member.idBytes)
        .build();

      expect(result.member.id).toBeInstanceOf(ObjectId);
      expect(result.member.idBytes.length).toBe(12);
      // creatorIdBytes should be set
      expect(result.member.creatorIdBytes).toBeInstanceOf(Uint8Array);
      expect(result.member.creatorIdBytes.length).toBe(12);
    });
  });

  describe('MemberBuilder static factory methods', () => {
    it('should create ObjectId in static newMember method', () => {
      const result = MemberBuilder.newMember(
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      expect(result.member.id).toBeInstanceOf(ObjectId);
      expect(result.member.idBytes.length).toBe(12);
    });

    it('should create ObjectId in static fromMnemonic method', () => {
      const service = new ECIESService();
      const original = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('Original')
        .withEmail(new EmailString('original@example.com'))
        .generateMnemonic()
        .build();

      const result = MemberBuilder.fromMnemonic(
        original.mnemonic,
        'Test User',
        new EmailString('test@example.com'),
      );

      expect(result.id).toBeInstanceOf(ObjectId);
      expect(result.idBytes.length).toBe(12);
    });

    it('should preserve ObjectId through fromJson', () => {
      const service = new ECIESService();
      const original = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('Original')
        .withEmail(new EmailString('original@example.com'))
        .build();
      const json = original.member.toJson();

      const result = MemberBuilder.fromJson(json);

      expect(result.id).toBeInstanceOf(ObjectId);
      expect(result.idBytes.length).toBe(12);
      expect(result.id.toString()).toBe(original.member.id.toString());
    });
  });

  describe('ID consistency between id and idBytes', () => {
    it('should have matching id and idBytes', () => {
      const service = new ECIESService();

      const result = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('Test User')
        .withEmail(new EmailString('test@example.com'))
        .build();

      const idToBytes = Constants.idProvider.toBytes(result.member.id);
      expect(result.member.idBytes).toEqual(idToBytes);
    });
  });
});
