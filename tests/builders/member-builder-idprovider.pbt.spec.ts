/**
 * Property-Based Tests: MemberBuilder ID Generation
 *
 * These tests validate that MemberBuilder creates Members with proper IDs.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * - Member uses the service's configured idProvider for ID generation
 * - The service's idProvider configuration DOES affect Member ID generation
 * - member.id is a native type (ObjectId/GuidV4), member.idBytes is the raw Uint8Array
 */

import { ObjectId } from 'bson';
import * as fc from 'fast-check';
import { MemberBuilder } from '../../src/builders/member-builder';
import { createRuntimeConfiguration } from '../../src/constants';
import { EmailString } from '../../src/email-string';
import { MemberType } from '../../src/enumerations/member-type';
import { GuidV4 } from '../../src/lib/guid';
import { GuidV4Provider, ObjectIdProvider } from '../../src/lib/id-providers';
import { ECIESService } from '../../src/services/ecies/service';

describe('Property-Based Tests: MemberBuilder ID Generation', () => {
  /**
   * Test that MemberBuilder creates Members with IDs matching the service's idProvider.
   * Member uses the service's configured idProvider for ID generation.
   */
  describe('MemberBuilder respects service idProvider config', () => {
    it('should create Members with IDs matching service idProvider config', () => {
      fc.assert(
        fc.property(
          // Generate random idProvider configurations
          fc.constantFrom(
            {
              config: createRuntimeConfiguration({
                idProvider: new GuidV4Provider(),
              }),
              expectedType: GuidV4,
              expectedLength: 16,
            },
            {
              config: createRuntimeConfiguration({
                idProvider: new ObjectIdProvider(),
              }),
              expectedType: ObjectId,
              expectedLength: 12,
            },
          ),
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (
            { config, expectedType, expectedLength },
            memberType,
            name,
            email,
          ) => {
            // Create service with configured idProvider
            const service = new ECIESService(config);

            // Create member using MemberBuilder
            const result = MemberBuilder.create()
              .withEciesService(service)
              .withType(memberType)
              .withName(name)
              .withEmail(new EmailString(email))
              .build();

            // Member ID matches service's idProvider configuration
            expect(result.member.id).toBeInstanceOf(expectedType);

            // idBytes length matches service's idProvider
            expect(result.member.idBytes.length).toBe(expectedLength);
            expect(result.member.idBytes.length).toBe(
              service.constants.idProvider.byteLength,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should create GuidV4 IDs with GuidV4Provider service configuration', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            // Service with GuidV4Provider
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

            // Verify 16-byte GuidV4 from service provider
            expect(result.member.idBytes.length).toBe(16);
            expect(result.member.id).toBeInstanceOf(GuidV4);
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

            // Verify idBytes matches id using service's idProvider
            const idToBytes = service.constants.idProvider.toBytes(
              result.member.id,
            );
            expect(result.member.idBytes).toEqual(idToBytes);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should use default ObjectID when no custom idProvider configured', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            // Create service without custom idProvider (uses default ObjectIdProvider)
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
            {
              config: createRuntimeConfiguration({
                idProvider: new GuidV4Provider(),
              }),
              expectedType: GuidV4,
              expectedLength: 16,
            },
            {
              config: createRuntimeConfiguration({
                idProvider: new ObjectIdProvider(),
              }),
              expectedType: ObjectId,
              expectedLength: 12,
            },
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
          ({ config, expectedType, expectedLength }, memberConfigs) => {
            const service = new ECIESService(config);

            // Create multiple members
            const members = memberConfigs.map((memberConfig) =>
              MemberBuilder.create()
                .withEciesService(service)
                .withType(memberConfig.type)
                .withName(memberConfig.name)
                .withEmail(new EmailString(memberConfig.email))
                .build(),
            );

            // All should have IDs matching service configuration
            members.forEach((result) => {
              expect(result.member.idBytes.length).toBe(expectedLength);
              expect(result.member.id).toBeInstanceOf(expectedType);
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
