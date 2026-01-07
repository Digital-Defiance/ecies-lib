/**
 * Property-Based Tests: Member idProvider Integration
 *
 * Feature: fix-idprovider-member-generation
 * These tests validate that Member.newMember() generates IDs correctly using
 * the global Constants.idProvider (ObjectIdProvider by default).
 *
 * NOTE: Member always uses the global Constants.idProvider, not the service's
 * configured idProvider. This is intentional - the service's idProvider is used
 * for other purposes like multi-recipient encryption.
 */

import { ObjectId } from 'bson';
import * as fc from 'fast-check';
import { Constants } from '../src/constants';
import { EmailString } from '../src/email-string';
import { MemberType } from '../src/enumerations/member-type';
import { Member } from '../src/member';
import { ECIESService } from '../src/services/ecies/service';

describe('Property-Based Tests: Member idProvider Integration', () => {
  /**
   * Property 4: Member ID Length Matches Global idProvider
   * Feature: fix-idprovider-member-generation, Property 4: Member ID Length Matches Global idProvider
   * Validates: Requirements 2.1, 2.2, 2.3, 2.5, 5.2
   *
   * For any ECIESService, when Member.newMember() creates a Member, the Member.idBytes.length
   * should equal Constants.idProvider.byteLength (the global default).
   */
  describe('Property 4: Member ID Length Matches Global idProvider', () => {
    it('should generate Member IDs matching global idProvider length', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            // Create service (configuration doesn't affect Member ID generation)
            const service = new ECIESService();

            // Create member
            const result = Member.newMember(
              service,
              memberType,
              name,
              new EmailString(email),
            );

            // Verify Member ID length matches global idProvider
            expect(result.member.idBytes.length).toBe(
              Constants.idProvider.byteLength,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should generate 12-byte IDs with default ObjectIdProvider', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            const service = new ECIESService();

            const result = Member.newMember(
              service,
              memberType,
              name,
              new EmailString(email),
            );

            // Verify 12-byte ObjectID (default global provider)
            expect(result.member.idBytes.length).toBe(12);
            expect(Constants.idProvider.byteLength).toBe(12);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Member Uses Default idProvider Regardless of Service Config
   * Feature: fix-idprovider-member-generation, Property 5: Member Uses Default idProvider
   * Validates: Requirements 2.4, 6.1, 6.3
   *
   * For any ECIESService, when Member.newMember() creates a Member, it always uses
   * the global Constants.idProvider, producing 12-byte ObjectIDs.
   */
  describe('Property 5: Member Uses Default idProvider Regardless of Service Config', () => {
    it('should use default 12-byte ObjectID regardless of service configuration', () => {
      fc.assert(
        fc.property(
          fc.record(
            {
              curveName: fc.constantFrom('secp256k1'),
              symmetricAlgorithm: fc.constantFrom('aes-256-gcm'),
            },
            { requiredKeys: [] },
          ),
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (partialConfig, memberType, name, email) => {
            // Create service with any config
            const service = new ECIESService(partialConfig);

            const result = Member.newMember(
              service,
              memberType,
              name,
              new EmailString(email),
            );

            // Verify default 12-byte ObjectID (global provider)
            expect(result.member.idBytes.length).toBe(12);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should use default idProvider when service created with no config', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            const service = new ECIESService();

            const result = Member.newMember(
              service,
              memberType,
              name,
              new EmailString(email),
            );

            // Verify default 12-byte ObjectID
            expect(result.member.idBytes.length).toBe(12);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7: ObjectId Members Are ObjectID-Compatible
   * Feature: fix-idprovider-member-generation, Property 7: ObjectId Members Are ObjectID-Compatible
   * Validates: Requirements 4.2
   *
   * For any Member created, the Member.id should be an ObjectId and the Member.idBytes
   * should be convertible to a valid ObjectID string representation.
   */
  describe('Property 7: ObjectId Members Are ObjectID-Compatible', () => {
    it('should create ObjectID-compatible IDs', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            const service = new ECIESService();

            const result = Member.newMember(
              service,
              memberType,
              name,
              new EmailString(email),
            );

            // Verify member.id is an ObjectId
            expect(result.member.id).toBeInstanceOf(ObjectId);

            // Verify idBytes can be serialized (using idBytes, not id)
            expect(() => {
              const objectIdString = Constants.idProvider.serialize(
                result.member.idBytes,
              );
              expect(objectIdString).toBeDefined();
              expect(typeof objectIdString).toBe('string');
              expect(objectIdString.length).toBe(24); // ObjectID hex string is 24 chars
            }).not.toThrow();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 8: Member ID Conversion Never Throws
   * Feature: fix-idprovider-member-generation, Property 8: Member ID Conversion Never Throws
   * Validates: Requirements 4.3
   *
   * For any Member created, converting the Member.idBytes to its string representation
   * using the global provider's conversion method should not throw errors.
   */
  describe('Property 8: Member ID Conversion Never Throws', () => {
    it('should never throw when converting Member idBytes to strings', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            const service = new ECIESService();

            const result = Member.newMember(
              service,
              memberType,
              name,
              new EmailString(email),
            );

            // Verify idBytes conversion doesn't throw
            expect(() => {
              const idString = Constants.idProvider.serialize(
                result.member.idBytes,
              );
              expect(idString).toBeDefined();
              expect(typeof idString).toBe('string');
            }).not.toThrow();

            // Verify round-trip conversion works with idBytes
            expect(() => {
              const idString = Constants.idProvider.serialize(
                result.member.idBytes,
              );
              const deserializedBytes =
                Constants.idProvider.deserialize(idString);
              expect(deserializedBytes).toEqual(result.member.idBytes);
            }).not.toThrow();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 10: Member Serialization Round-Trip Preserves ID
   * Feature: fix-idprovider-member-generation, Property 10: Member Serialization Round-Trip Preserves ID
   * Validates: Requirements 7.2, 7.3, 7.4
   *
   * For any Member created, serializing to JSON and then deserializing should
   * produce a Member with an identical ID buffer.
   */
  describe('Property 10: Member Serialization Round-Trip Preserves ID', () => {
    it('should preserve Member ID through serialization round-trip', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            const service = new ECIESService();

            // Create member
            const result = Member.newMember(
              service,
              memberType,
              name,
              new EmailString(email),
            );
            const originalMember = result.member;
            const originalIdBytes = new Uint8Array(originalMember.idBytes);

            // Serialize to JSON
            const json = originalMember.toJson();
            expect(json).toBeDefined();
            expect(typeof json).toBe('string');

            // Deserialize from JSON
            const deserializedMember = Member.fromJson(json, service);

            // Verify ID bytes are preserved (compare by value)
            expect(Array.from(deserializedMember.idBytes)).toEqual(
              Array.from(originalIdBytes),
            );
            expect(deserializedMember.idBytes.length).toBe(12);

            // Verify other properties are preserved
            expect(deserializedMember.type).toBe(originalMember.type);
            expect(deserializedMember.name).toBe(originalMember.name);
            expect(deserializedMember.email.toString()).toBe(
              originalMember.email.toString(),
            );
            expect(deserializedMember.publicKey).toEqual(
              originalMember.publicKey,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should preserve 12-byte ObjectID IDs through serialization', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(MemberType.User, MemberType.Admin),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim() === s),
          fc.emailAddress(),
          (memberType, name, email) => {
            const service = new ECIESService();

            const result = Member.newMember(
              service,
              memberType,
              name,
              new EmailString(email),
            );
            const originalIdBytes = new Uint8Array(result.member.idBytes);

            // Serialize and deserialize
            const json = result.member.toJson();
            const deserialized = Member.fromJson(json, service);

            // Verify 12-byte ID preserved (compare by value)
            expect(Array.from(deserialized.idBytes)).toEqual(
              Array.from(originalIdBytes),
            );
            expect(deserialized.idBytes.length).toBe(12);

            // Verify ObjectID compatibility maintained (using idBytes)
            const objectIdString = Constants.idProvider.serialize(
              deserialized.idBytes,
            );
            expect(objectIdString).toBeDefined();
            expect(objectIdString.length).toBe(24);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
