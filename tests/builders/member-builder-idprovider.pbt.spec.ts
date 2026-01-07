/**
 * Property-Based Tests: MemberBuilder ID Generation
 *
 * These tests validate that MemberBuilder creates Members with proper IDs.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * - Member always uses global Constants.idProvider (ObjectIdProvider) for ID generation
 * - The service's idProvider configuration does NOT affect Member ID generation
 * - member.id is a native type (ObjectId), member.idBytes is the raw Uint8Array
 */

import { ObjectId } from 'bson';
import * as fc from 'fast-check';
import { MemberBuilder } from '../../src/builders/member-builder';
import { Constants, createRuntimeConfiguration } from '../../src/constants';
import { EmailString } from '../../src/email-string';
import { MemberType } from '../../src/enumerations/member-type';
import { GuidV4Provider, ObjectIdProvider } from '../../src/lib/id-providers';
import { ECIESService } from '../../src/services/ecies/service';

describe('Property-Based Tests: MemberBuilder ID Generation', () => {
  /**
   * Test that MemberBuilder creates Members with proper ObjectId IDs.
   * Member always uses global Constants.idProvider (ObjectIdProvider).
   */
  describe('MemberBuilder creates ObjectId IDs', () => {
    it('should create Members with ObjectId regardless of service idProvider config', () => {
      fc.assert(
        fc.property(
          // Generate random idProvider configurations
          fc.constantFrom(
            createRuntimeConfiguration({ idProvider: new GuidV4Provider() }),
            createRuntimeConfiguration({ idProvider: new ObjectIdProvider() }),
          ),
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (constants, memberType, name, email) => {
            // Create service with configured idProvider
            const service = new ECIESService(constants);

            // Create member using MemberBuilder
            const result = MemberBuilder.create()
              .withEciesService(service)
              .withType(memberType)
              .withName(name)
              .withEmail(new EmailString(email))
              .build();

            // Member ID is always ObjectId (from global Constants.idProvider)
            expect(result.member.id).toBeInstanceOf(ObjectId);

            // idBytes always 12 bytes (ObjectIdProvider)
            expect(result.member.idBytes.length).toBe(
              Constants.idProvider.byteLength,
            );
            expect(result.member.idBytes.length).toBe(12);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should create 12-byte idBytes with any service configuration', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            // Even with GuidV4Provider, Member uses global ObjectIdProvider
            const constants = createRuntimeConfiguration({
              idProvider: new GuidV4Provider(),
            });
            const service = new ECIESService(constants);

            const result = MemberBuilder.create()
              .withEciesService(service)
              .withType(memberType)
              .withName(name)
              .withEmail(new EmailString(email))
              .build();

            // Verify 12-byte ObjectID from global provider
            expect(result.member.idBytes.length).toBe(12);
            expect(result.member.id).toBeInstanceOf(ObjectId);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should have consistent idBytes with ObjectIdProvider service', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            const constants = createRuntimeConfiguration({
              idProvider: new ObjectIdProvider(),
            });
            const service = new ECIESService(constants);

            const result = MemberBuilder.create()
              .withEciesService(service)
              .withType(memberType)
              .withName(name)
              .withEmail(new EmailString(email))
              .build();

            // Verify 12-byte ObjectID
            expect(result.member.idBytes.length).toBe(12);
            expect(result.member.id).toBeInstanceOf(ObjectId);

            // Verify idBytes matches id
            const idToBytes = Constants.idProvider.toBytes(result.member.id);
            expect(result.member.idBytes).toEqual(idToBytes);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should use default 12-byte ObjectID when no custom idProvider configured', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            // Create service without custom idProvider
            const service = new ECIESService();

            const result = MemberBuilder.create()
              .withEciesService(service)
              .withType(memberType)
              .withName(name)
              .withEmail(new EmailString(email))
              .build();

            // Verify default 12-byte ObjectID
            expect(result.member.idBytes.length).toBe(12);
            expect(result.member.id).toBeInstanceOf(ObjectId);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should create multiple Members with unique IDs', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            createRuntimeConfiguration({ idProvider: new GuidV4Provider() }),
            createRuntimeConfiguration({ idProvider: new ObjectIdProvider() }),
          ),
          fc.array(
            fc.record({
              type: fc.constantFrom(MemberType.User, MemberType.Admin),
              name: fc
                .string({ minLength: 1, maxLength: 50 })
                .filter((s) => s.trim() === s),
              email: fc.emailAddress(),
            }),
            { minLength: 2, maxLength: 5 },
          ),
          (constants, memberConfigs) => {
            const service = new ECIESService(constants);

            // Create multiple members
            const members = memberConfigs.map((config) =>
              MemberBuilder.create()
                .withEciesService(service)
                .withType(config.type)
                .withName(config.name)
                .withEmail(new EmailString(config.email))
                .build(),
            );

            // All should have 12-byte IDs (global ObjectIdProvider)
            members.forEach((result) => {
              expect(result.member.idBytes.length).toBe(12);
              expect(result.member.id).toBeInstanceOf(ObjectId);
            });

            // Verify IDs are unique
            const idStrings = members.map((m) => m.member.id.toString());
            const uniqueIds = new Set(idStrings);
            expect(uniqueIds.size).toBe(idStrings.length);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Service idProvider configuration verification', () => {
    it('should correctly configure service constants', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { provider: new GuidV4Provider(), expectedLength: 16 },
            { provider: new ObjectIdProvider(), expectedLength: 12 },
          ),
          ({ provider, expectedLength }) => {
            const constants = createRuntimeConfiguration({
              idProvider: provider,
            });
            const service = new ECIESService(constants);

            // Service constants reflect configuration
            expect(service.constants.idProvider.byteLength).toBe(
              expectedLength,
            );
            expect(service.constants.MEMBER_ID_LENGTH).toBe(expectedLength);
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
