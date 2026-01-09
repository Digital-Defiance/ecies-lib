/**
 * Integration Tests: Member ID Generation End-to-End
 *
 * These tests verify end-to-end workflows with Member ID generation.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * - Member uses the service's configured idProvider for ID generation
 * - The service's idProvider configuration DOES affect Member ID generation
 * - member.id matches the service's idProvider type, member.idBytes is the raw Uint8Array
 * - Service's idProvider IS used for both ID generation and serialization
 */

import { ObjectId } from 'bson';
import { MemberBuilder } from '../../src/builders/member-builder';
import { createRuntimeConfiguration } from '../../src/constants';
import { EmailString } from '../../src/email-string';
import { MemberType } from '../../src/enumerations/member-type';
import { GuidV4 } from '../../src/lib/guid';
import { GuidV4Provider, ObjectIdProvider } from '../../src/lib/id-providers';
import { Member } from '../../src/member';
import { ECIESService } from '../../src/services/ecies/service';

describe('Integration: Member ID Generation Workflows', () => {
  describe('Member Creation with Different Service Configurations', () => {
    it('should create Member with service idProvider configuration', () => {
      // Member uses the service's configured idProvider for ID generation
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const service = new ECIESService(config);

      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      // Member ID matches service's idProvider (GuidV4)
      expect(result.member.id).toBeInstanceOf(GuidV4);
      expect(result.member.idBytes.length).toBe(16);
      // Service config determines ID generation
      expect(service.constants.idProvider.byteLength).toBe(16);
    });

    it('should work correctly with ObjectIdProvider service config', () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      const service = new ECIESService(config);

      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      expect(result.member.id).toBeInstanceOf(ObjectId);
      expect(result.member.idBytes.length).toBe(12);
      expect(service.constants.idProvider.byteLength).toBe(12);
    });

    it('should work with default service config', () => {
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

  describe('Member Lifecycle: Creation → Serialization → Deserialization', () => {
    it('should preserve ID through serialization/deserialization', () => {
      const service = new ECIESService();

      // Create Member
      const result = Member.newMember(
        service,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );
      const originalId = result.member.id;
      const originalIdBytes = result.member.idBytes;

      // Serialize
      const json = result.member.toJson();
      expect(typeof json).toBe('string');

      // Deserialize
      const deserialized = Member.fromJson(json, service);

      // Verify ID preserved
      expect(deserialized.id.toString()).toBe(originalId.toString());
      expect(deserialized.idBytes).toEqual(originalIdBytes);
      expect(deserialized.name).toBe('Test User');
      expect(deserialized.email.toString()).toBe('test@example.com');
      expect(deserialized.type).toBe(MemberType.User);
    });

    it('should preserve all properties through multiple serialization cycles', () => {
      const service = new ECIESService();

      // Create Member
      const result = Member.newMember(
        service,
        MemberType.Admin,
        'Admin User',
        new EmailString('admin@example.com'),
      );
      const original = result.member;

      // Multiple round-trips
      let member = original;
      for (let i = 0; i < 5; i++) {
        const json = member.toJson();
        member = Member.fromJson(json, service);
      }

      // Verify all properties preserved
      expect(member.id.toString()).toBe(original.id.toString());
      expect(member.idBytes).toEqual(original.idBytes);
      expect(member.type).toBe(MemberType.Admin);
      expect(member.name).toBe('Admin User');
      expect(member.email.toString()).toBe('admin@example.com');
      expect(member.publicKey).toEqual(original.publicKey);
      expect(member.creatorId.toString()).toBe(original.creatorId.toString());
    });
  });

  describe('MemberBuilder Workflows', () => {
    it('should create Member with GuidV4 using fluent API', () => {
      const config = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const service = new ECIESService(config);

      const result = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('Builder User')
        .withEmail(new EmailString('builder@example.com'))
        .generateMnemonic()
        .build();

      expect(result.member.id).toBeInstanceOf(GuidV4);
      expect(result.member.idBytes.length).toBe(16);
      expect(result.mnemonic).toBeDefined();
    });

    it('should support MemberBuilder with createdBy relationship', () => {
      const service = new ECIESService();

      // Create admin
      const admin = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.Admin)
        .withName('Admin')
        .withEmail(new EmailString('admin@example.com'))
        .build();

      // Create user with createdBy (pass idBytes)
      const user = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('User')
        .withEmail(new EmailString('user@example.com'))
        .withCreatedBy(admin.member.idBytes)
        .build();

      // Verify both have ObjectId
      expect(admin.member.id).toBeInstanceOf(ObjectId);
      expect(user.member.id).toBeInstanceOf(ObjectId);

      // Verify creatorIdBytes is set
      expect(user.member.creatorIdBytes).toBeInstanceOf(Uint8Array);
      expect(user.member.creatorIdBytes.length).toBe(12);
    });

    it('should preserve MemberBuilder-created Members through serialization', () => {
      const service = new ECIESService();

      const result = MemberBuilder.create()
        .withEciesService(service)
        .withType(MemberType.User)
        .withName('Builder User')
        .withEmail(new EmailString('builder@example.com'))
        .generateMnemonic()
        .build();

      // Serialize
      const json = result.member.toJson();

      // Deserialize
      const deserialized = Member.fromJson(json, service);

      // Verify all properties
      expect(deserialized.id.toString()).toBe(result.member.id.toString());
      expect(deserialized.idBytes).toEqual(result.member.idBytes);
      expect(deserialized.name).toBe('Builder User');
      expect(deserialized.email.toString()).toBe('builder@example.com');
      expect(deserialized.type).toBe(MemberType.User);
    });
  });

  describe('Multiple Members with Consistent IDs', () => {
    it('should create multiple Members with consistent 12-byte IDs', () => {
      const service = new ECIESService();

      const members: Member[] = [];
      for (let i = 0; i < 10; i++) {
        const result = Member.newMember(
          service,
          MemberType.User,
          `User ${i}`,
          new EmailString(`user${i}@example.com`),
        );
        members.push(result.member);
      }

      // All should have 12-byte IDs
      for (const member of members) {
        expect(member.id).toBeInstanceOf(ObjectId);
        expect(member.idBytes.length).toBe(12);
      }

      // All IDs should be unique
      const idStrings = members.map((m) => m.id.toString());
      const uniqueIds = new Set(idStrings);
      expect(uniqueIds.size).toBe(members.length);
    });

    it('should maintain isolation between service instances', () => {
      const services = [
        new ECIESService(
          createRuntimeConfiguration({ idProvider: new GuidV4Provider() }),
        ),
        new ECIESService(
          createRuntimeConfiguration({ idProvider: new ObjectIdProvider() }),
        ),
        new ECIESService(
          createRuntimeConfiguration({ idProvider: new GuidV4Provider() }),
        ),
        new ECIESService(), // Default
      ];

      const members = services.map((service, i) =>
        Member.newMember(
          service,
          MemberType.User,
          `User ${i}`,
          new EmailString(`user${i}@example.com`),
        ),
      );

      // Members should have IDs matching their service's idProvider
      expect(members[0].member.id).toBeInstanceOf(GuidV4); // GuidV4Provider
      expect(members[0].member.idBytes.length).toBe(16);

      expect(members[1].member.id).toBeInstanceOf(ObjectId); // ObjectIdProvider
      expect(members[1].member.idBytes.length).toBe(12);

      expect(members[2].member.id).toBeInstanceOf(GuidV4); // GuidV4Provider
      expect(members[2].member.idBytes.length).toBe(16);

      expect(members[3].member.id).toBeInstanceOf(ObjectId); // Default (ObjectId)
      expect(members[3].member.idBytes.length).toBe(12);
    });
  });

  describe('Encryption Workflow with Member IDs', () => {
    it('should support encryption workflow with Members', async () => {
      const service = new ECIESService();

      // Create sender and recipient
      const sender = Member.newMember(
        service,
        MemberType.User,
        'Sender',
        new EmailString('sender@example.com'),
      );
      const recipient = Member.newMember(
        service,
        MemberType.User,
        'Recipient',
        new EmailString('recipient@example.com'),
      );

      // Both should have ObjectId
      expect(sender.member.id).toBeInstanceOf(ObjectId);
      expect(recipient.member.id).toBeInstanceOf(ObjectId);

      // Encrypt message for recipient
      const message = new TextEncoder().encode('Secret message');
      const encrypted = await service.encryptSimpleOrSingle(
        true,
        recipient.member.publicKey,
        message,
      );

      // Decrypt using recipient's private key
      const recipientKeyPair = service.mnemonicToSimpleKeyPair(
        recipient.mnemonic,
      );
      const decrypted = await service.decryptSimpleOrSingleWithHeader(
        true,
        recipientKeyPair.privateKey,
        encrypted,
      );

      expect(new TextDecoder().decode(decrypted)).toBe('Secret message');
    });
  });

  describe('Service Configuration Effects', () => {
    it('should use service idProvider for serialization format', () => {
      // ObjectId service
      const objectIdConfig = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      const objectIdService = new ECIESService(objectIdConfig);

      const result = Member.newMember(
        objectIdService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      // toJson uses service idProvider for serialization
      const json = result.member.toJson();
      const parsed = JSON.parse(json);

      // ObjectId hex string is 24 chars
      expect(parsed.id).toBeDefined();
      expect(typeof parsed.id).toBe('string');
      expect(parsed.id.length).toBe(24);
      expect(parsed.id).toMatch(/^[0-9a-f]{24}$/i);
    });

    it('should correctly reflect service idProvider configuration', () => {
      const guidConfig = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const objectIdConfig = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });

      const guidService = new ECIESService(guidConfig);
      const objectIdService = new ECIESService(objectIdConfig);

      // Service constants reflect configuration
      expect(guidService.constants.idProvider.byteLength).toBe(16);
      expect(guidService.constants.MEMBER_ID_LENGTH).toBe(16);

      expect(objectIdService.constants.idProvider.byteLength).toBe(12);
      expect(objectIdService.constants.MEMBER_ID_LENGTH).toBe(12);

      // Member generation uses service's configured idProvider
      const guidMember = Member.newMember(
        guidService,
        MemberType.User,
        'User',
        new EmailString('user@example.com'),
      );
      const objectIdMember = Member.newMember(
        objectIdService,
        MemberType.User,
        'User',
        new EmailString('user@example.com'),
      );

      // Members use their service's idProvider configuration
      expect(guidMember.member.idBytes.length).toBe(16); // GuidV4
      expect(guidMember.member.id).toBeInstanceOf(GuidV4);

      expect(objectIdMember.member.idBytes.length).toBe(12); // ObjectId
      expect(objectIdMember.member.idBytes.length).toBe(12);
    });
  });
});
