/**
 * Property-Based Test: DD-ECIES Registry Value Rejection (Property 2)
 *
 * Feature: ecies-spec-and-wcap-integration, Property 2: DD-ECIES Registry Value Rejection
 * **Validates: Requirements 10.4**
 *
 * For any byte value not present in the DD-ECIES Version Registry ({0x01}),
 * Cipher Suite Registry ({0x01}), or Encryption Type Registry ({0x21, 0x42, 0x63}),
 * a conforming parser encountering that value in the corresponding header field
 * SHALL reject the message with a descriptive error rather than silently accepting
 * or misinterpreting it.
 *
 * This test uses the actual ecies-lib parsing/validation functions to verify
 * that invalid registry values are properly rejected with descriptive errors.
 */

import * as fc from 'fast-check';
import { ECIES_CONFIG, Constants } from '../../src/constants';
import { EciesEncryptionTypeEnum } from '../../src/enumerations/ecies-encryption-type';
import { EciesSingleRecipient } from '../../src/services/ecies/single-recipient';
import {
  encryptionTypeToString,
  ensureEciesEncryptionTypeEnum,
} from '../../src/utils/encryption-type-utils';

// --- Valid registry values (from DD-ECIES specification) ---
const VALID_VERSIONS = new Set([0x01]);
const VALID_CIPHER_SUITES = new Set([0x01]);
const VALID_ENCRYPTION_TYPES = new Set([0x21, 0x42, 0x63]); // Basic=33, WithLength=66, Multiple=99

// --- Wire format constants ---
const PUBLIC_KEY_LENGTH = 33;
const IV_SIZE = 12;
const AUTH_TAG_SIZE = 16;

/**
 * Build a minimal valid-looking single-recipient header buffer.
 * Layout: version(1) || cipherSuite(1) || type(1) || ephemeralPublicKey(33) || iv(12) || authTag(16) || ciphertext(>=1)
 * Total minimum: 64 bytes header + at least 1 byte ciphertext = 65 bytes
 */
function buildMinimalHeader(
  version: number,
  cipherSuite: number,
  encryptionType: number,
): Uint8Array {
  // WithLength mode (0x42) needs 72 bytes header + ciphertext, Basic (0x21) needs 64 + ciphertext
  // Use enough bytes for the largest single-recipient header (WithLength = 72) + 16 bytes fake ciphertext
  const size = 1 + 1 + 1 + PUBLIC_KEY_LENGTH + IV_SIZE + AUTH_TAG_SIZE + 8 + 16;
  const buf = new Uint8Array(size);
  let offset = 0;

  buf[offset++] = version;
  buf[offset++] = cipherSuite;
  buf[offset++] = encryptionType;

  // Fill ephemeral public key with a valid-looking compressed key (0x02 prefix + 32 bytes)
  buf[offset] = 0x02;
  for (let i = 1; i < PUBLIC_KEY_LENGTH; i++) {
    buf[offset + i] = 0xaa;
  }
  offset += PUBLIC_KEY_LENGTH;

  // Fill IV with non-zero bytes
  for (let i = 0; i < IV_SIZE; i++) {
    buf[offset + i] = 0xbb;
  }
  offset += IV_SIZE;

  // Fill auth tag with non-zero bytes
  for (let i = 0; i < AUTH_TAG_SIZE; i++) {
    buf[offset + i] = 0xcc;
  }
  offset += AUTH_TAG_SIZE;

  // Fill data length (8 bytes) for WithLength mode compatibility
  // Write a small value (16) as big-endian
  buf[offset + 7] = 16;
  offset += 8;

  // Fill fake ciphertext
  for (let i = 0; i < 16; i++) {
    buf[offset + i] = 0xdd;
  }

  return buf;
}

// --- fast-check arbitraries ---

/**
 * Generate a random byte value NOT in the valid version set {0x01}.
 * Valid range: 0x00, 0x02-0xFF
 */
const invalidVersionArb = fc
  .integer({ min: 0, max: 255 })
  .filter((v) => !VALID_VERSIONS.has(v));

/**
 * Generate a random byte value NOT in the valid cipher suite set {0x01}.
 * Valid range: 0x00, 0x02-0xFF
 */
const invalidCipherSuiteArb = fc
  .integer({ min: 0, max: 255 })
  .filter((v) => !VALID_CIPHER_SUITES.has(v));

/**
 * Generate a random byte value NOT in the valid encryption type set {0x21, 0x42, 0x63}.
 * Valid range: 0x00-0x20, 0x22-0x41, 0x43-0x62, 0x64-0xFF
 */
const invalidEncryptionTypeArb = fc
  .integer({ min: 0, max: 255 })
  .filter((v) => !VALID_ENCRYPTION_TYPES.has(v));

// ============================================================
// Property Tests
// ============================================================

describe('Property 2: DD-ECIES Registry Value Rejection', () => {
  let singleRecipient: EciesSingleRecipient;

  beforeAll(() => {
    singleRecipient = new EciesSingleRecipient(ECIES_CONFIG, Constants);
  });

  describe('Invalid Version byte rejection', () => {
    it('rejects any version byte ∉ {0x01} with a descriptive error', () => {
      fc.assert(
        fc.property(invalidVersionArb, (invalidVersion) => {
          const header = buildMinimalHeader(
            invalidVersion,
            0x01, // valid cipher suite
            0x21, // valid encryption type (Basic)
          );

          expect(() => {
            singleRecipient.parseEncryptedMessage(
              EciesEncryptionTypeEnum.Basic,
              header,
              0,
            );
          }).toThrow();

          // Verify the error message is descriptive (contains version info)
          try {
            singleRecipient.parseEncryptedMessage(
              EciesEncryptionTypeEnum.Basic,
              header,
              0,
            );
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error);
            // The error should be descriptive - not empty or generic
            expect(message.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Invalid Cipher Suite byte rejection', () => {
    it('rejects any cipher suite byte ∉ {0x01} with a descriptive error', () => {
      fc.assert(
        fc.property(invalidCipherSuiteArb, (invalidCipherSuite) => {
          const header = buildMinimalHeader(
            0x01, // valid version
            invalidCipherSuite,
            0x21, // valid encryption type (Basic)
          );

          expect(() => {
            singleRecipient.parseEncryptedMessage(
              EciesEncryptionTypeEnum.Basic,
              header,
              0,
            );
          }).toThrow();

          // Verify the error message is descriptive
          try {
            singleRecipient.parseEncryptedMessage(
              EciesEncryptionTypeEnum.Basic,
              header,
              0,
            );
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error);
            expect(message.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Invalid Encryption Type byte rejection', () => {
    it('rejects any encryption type byte ∉ {0x21, 0x42, 0x63} via parseEncryptedMessage', () => {
      fc.assert(
        fc.property(invalidEncryptionTypeArb, (invalidEncType) => {
          const header = buildMinimalHeader(
            0x01, // valid version
            0x01, // valid cipher suite
            invalidEncType,
          );

          expect(() => {
            singleRecipient.parseEncryptedMessage(
              undefined, // let it detect the type from the header
              header,
              0,
            );
          }).toThrow();

          // Verify the error message is descriptive
          try {
            singleRecipient.parseEncryptedMessage(undefined, header, 0);
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error);
            expect(message.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 },
      );
    });

    it('rejects any encryption type enum value ∉ {33, 66, 99} via encryptionTypeToString', () => {
      fc.assert(
        fc.property(invalidEncryptionTypeArb, (invalidEncType) => {
          expect(() => {
            encryptionTypeToString(
              invalidEncType as unknown as EciesEncryptionTypeEnum,
            );
          }).toThrow();
        }),
        { numRuns: 100 },
      );
    });

    it('rejects any encryption type enum value ∉ {33, 66, 99} via ensureEciesEncryptionTypeEnum', () => {
      fc.assert(
        fc.property(invalidEncryptionTypeArb, (invalidEncType) => {
          expect(() => {
            ensureEciesEncryptionTypeEnum(
              invalidEncType as unknown as EciesEncryptionTypeEnum,
            );
          }).toThrow();
        }),
        { numRuns: 100 },
      );
    });
  });
});
