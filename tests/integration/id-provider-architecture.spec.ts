/**
 * Integration tests for the complete ID provider architecture
 * Tests the full flow from service configuration to voting system usage
 */

import { ObjectId } from 'bson';
import { createRuntimeConfiguration } from '../../src/constants';
import { EmailString } from '../../src/email-string';
import { MemberType } from '../../src/enumerations/member-type';
import {
  ObjectIdProvider,
  GuidV4Provider,
  CustomIdProvider,
} from '../../src/lib/id-providers';
import { VotingMethod } from '../../src/lib/voting/enumerations/voting-method';
import { PollFactory } from '../../src/lib/voting/factory';
import { Member } from '../../src/member';
import { ECIESService } from '../../src/services/ecies/service';

describe('ID Provider Architecture Integration', () => {
  describe('Complete Flow: Service → Member → Voting', () => {
    it('should work end-to-end with ObjectId provider', async () => {
      // 1. Create service with ObjectId provider (default)
      const service = new ECIESService<ObjectId>();

      // 2. Verify service configuration
      expect(service.idProvider.byteLength).toBe(12);
      expect(service.idProvider.name).toBe('ObjectID');

      // 3. Create member using service
      const { member: authority } = Member.newMember(
        service,
        MemberType.System,
        'Authority',
        new EmailString('auth@test.com'),
      );

      // 4. Verify member uses service's idProvider
      expect(authority.idProvider).toBe(service.idProvider);
      expect(authority.idBytes.length).toBe(12);
      expect(authority.id).toBeInstanceOf(ObjectId);

      // 5. Derive keys for voting
      await authority.deriveVotingKeys();

      // 6. Create poll using authority
      const poll = PollFactory.create(
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
      );

      // 7. Verify poll was created successfully
      // Note: Poll ID is generated as raw bytes, then converted to native type
      expect(poll.id.length).toBe(12); // Raw bytes length
      expect(poll.choices).toEqual(['Option A', 'Option B']);
      expect(poll.method).toBe(VotingMethod.Plurality);

      // 8. Verify the architectural integration works
      const { member: voter } = Member.newMember(
        service,
        MemberType.User,
        'Voter1',
        new EmailString('voter1@test.com'),
      );
      await voter.deriveVotingKeys();

      // 9. Verify all components use the same idProvider
      expect(voter.idProvider).toBe(service.idProvider);
      expect(voter.idProvider).toBe(authority.idProvider);
      expect(voter.id).toBeInstanceOf(ObjectId);
      expect(voter.idBytes.length).toBe(12);
    });

    it('should work end-to-end with GUID provider', async () => {
      // 1. Create service with GUID provider
      const guidConfig = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const service = new ECIESService<Uint8Array>(guidConfig);

      // 2. Verify service configuration
      expect(service.idProvider.byteLength).toBe(16);
      expect(service.idProvider.name).toBe('GUIDv4');

      // 3. Create member using service
      const { member: authority } = Member.newMember(
        service,
        MemberType.System,
        'Authority',
        new EmailString('auth@test.com'),
      );

      // 4. Verify member uses service's idProvider
      expect(authority.idProvider).toBe(service.idProvider);
      expect(authority.idBytes.length).toBe(16);
      // GuidV4Provider returns GuidV4 instances, not Uint8Array
      expect(authority.id.constructor.name).toBe('GuidV4');

      // 5. Derive keys and create poll
      await authority.deriveVotingKeys();
      const poll = PollFactory.create(
        ['Yes', 'No'],
        VotingMethod.Plurality,
        authority,
      );

      // 6. Verify poll uses GUID IDs
      expect(poll.id.length).toBe(16); // Raw bytes length

      // 7. Test serialization/deserialization
      const memberJson = authority.toJson();
      const restoredMember = Member.fromJson<Uint8Array>(memberJson, service);

      expect(restoredMember.id.constructor.name).toBe('GuidV4');
      expect(restoredMember.idBytes.length).toBe(16);
      expect(restoredMember.idProvider).toBe(service.idProvider);
    });

    it('should work with custom provider', async () => {
      // 1. Create service with custom 20-byte provider
      const customProvider = new CustomIdProvider(20, 'Custom20');
      const customConfig = createRuntimeConfiguration({
        idProvider: customProvider,
      });
      const service = new ECIESService<Uint8Array>(customConfig);

      // 2. Verify configuration
      expect(service.idProvider.byteLength).toBe(20);
      expect(service.idProvider.name).toBe('Custom20');

      // 3. Create and test member
      const { member } = Member.newMember(
        service,
        MemberType.User,
        'CustomUser',
        new EmailString('custom@test.com'),
      );

      expect(member.idBytes.length).toBe(20);
      expect(member.id).toBeInstanceOf(Uint8Array);
      expect(member.id.length).toBe(20);
    });
  });

  describe('Cross-Service Compatibility', () => {
    it('should detect configuration mismatches', () => {
      // Create two services with different providers
      const objectIdService = new ECIESService<ObjectId>();

      const guidConfig = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const guidService = new ECIESService<Uint8Array>(guidConfig);

      // Verify they have different configurations
      expect(objectIdService.idProvider.byteLength).toBe(12);
      expect(guidService.idProvider.byteLength).toBe(16);
      expect(objectIdService.idProvider.name).toBe('ObjectID');
      expect(guidService.idProvider.name).toBe('GUIDv4');

      // They should be different instances
      expect(objectIdService.idProvider).not.toBe(guidService.idProvider);
    });

    it('should maintain consistency within same service', () => {
      const service = new ECIESService<ObjectId>();

      // Create multiple members with same service
      const { member: member1 } = Member.newMember(
        service,
        MemberType.User,
        'User1',
        new EmailString('user1@test.com'),
      );

      const { member: member2 } = Member.newMember(
        service,
        MemberType.User,
        'User2',
        new EmailString('user2@test.com'),
      );

      // All should use same idProvider instance
      expect(member1.idProvider).toBe(service.idProvider);
      expect(member2.idProvider).toBe(service.idProvider);
      expect(member1.idProvider).toBe(member2.idProvider);

      // All should have same ID format
      expect(member1.idBytes.length).toBe(member2.idBytes.length);
      expect(member1.id).toBeInstanceOf(ObjectId);
      expect(member2.id).toBeInstanceOf(ObjectId);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should catch configuration errors early', () => {
      // Create a custom config with mismatched lengths
      const guidProvider = new GuidV4Provider(); // 16 bytes
      const baseConfig = createRuntimeConfiguration();

      // Create a new config object with mismatched MEMBER_ID_LENGTH
      const badConfig = {
        ...baseConfig,
        idProvider: guidProvider,
        MEMBER_ID_LENGTH: 12, // Mismatch: provider is 16 bytes, config says 12
      };

      expect(() => new ECIESService(badConfig)).toThrow(
        /ID provider byte length \(16\) does not match MEMBER_ID_LENGTH \(12\)/,
      );
    });

    it('should provide helpful error messages', () => {
      const badProvider = {
        byteLength: 12,
        generate: () => new Uint8Array(12),
        // Missing required methods
      };

      const badConfig = createRuntimeConfiguration({
        idProvider: badProvider as any,
      });

      expect(() => new ECIESService(badConfig)).toThrow(
        /ID provider is missing required method: serialize/,
      );
    });

    it('should validate idProvider methods work correctly', () => {
      class FaultyProvider extends ObjectIdProvider {
        toBytes(): Uint8Array {
          return new Uint8Array(8); // Wrong length
        }
      }

      const faultyConfig = createRuntimeConfiguration({
        idProvider: new FaultyProvider(),
      });

      expect(() => new ECIESService(faultyConfig)).toThrow(
        /toBytes\(\) returned incorrect length: expected 12, got 8/,
      );
    });
  });

  describe('Performance and Memory', () => {
    it('should reuse idProvider instances efficiently', () => {
      const service = new ECIESService<ObjectId>();

      // Create multiple members
      const members = Array.from(
        { length: 10 },
        (_, i) =>
          Member.newMember(
            service,
            MemberType.User,
            `User${i}`,
            new EmailString(`user${i}@test.com`),
          ).member,
      );

      // All should reference the same idProvider instance
      const firstProvider = members[0].idProvider;
      members.forEach((member) => {
        expect(member.idProvider).toBe(firstProvider);
      });

      // Service should also reference the same instance
      expect(service.idProvider).toBe(firstProvider);
    });

    it('should handle large numbers of ID operations efficiently', () => {
      const service = new ECIESService<ObjectId>();
      const provider = service.idProvider;

      const startTime = Date.now();

      // Generate, serialize, and validate many IDs
      for (let i = 0; i < 1000; i++) {
        const id = provider.generate();
        const _nativeId = provider.fromBytes(id);
        const serialized = provider.serialize(id);
        const deserialized = provider.deserialize(serialized);
        const backToNative = provider.fromBytes(deserialized);
        const backToBytes = provider.toBytes(backToNative);

        expect(backToBytes.length).toBe(12);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete reasonably quickly (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds for 1000 operations
    });
  });

  describe('Documentation Examples Validation', () => {
    it('should validate all documentation examples work', async () => {
      // Example 1: Default ObjectID provider
      const defaultService = new ECIESService<ObjectId>();
      const objectIdMember = Member.newMember(
        defaultService,
        MemberType.User,
        'TestUser',
        new EmailString('test@example.com'),
      ).member;

      expect(objectIdMember.idBytes.length).toBe(12);
      expect(defaultService.idProvider.byteLength).toBe(12);

      // Example 2: GUID provider
      const guidConfig = createRuntimeConfiguration({
        idProvider: new GuidV4Provider(),
      });
      const guidService = new ECIESService<Uint8Array>(guidConfig);
      const guidMember = Member.newMember(
        guidService,
        MemberType.User,
        'GuidUser',
        new EmailString('guid@example.com'),
      ).member;

      expect(guidMember.idBytes.length).toBe(16);
      expect(guidService.idProvider.byteLength).toBe(16);

      // Example 3: Voting system integration
      await guidMember.deriveVotingKeys();
      const poll = PollFactory.create(
        ['Yes', 'No'],
        VotingMethod.Plurality,
        guidMember,
      );

      // Verify poll was created with correct ID format
      expect(poll.id.length).toBe(16); // Raw bytes length
      expect(poll.choices).toEqual(['Yes', 'No']);
      expect(poll.method).toBe(VotingMethod.Plurality);
    });
  });
});
