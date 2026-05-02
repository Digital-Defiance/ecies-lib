/**
 * Property-Based Test: WCAP Unrecognized Algorithm Suite Rejection (Property 3)
 *
 * Feature: ecies-spec-and-wcap-integration, Property 3: WCAP Unrecognized Algorithm Suite Rejection
 * **Validates: Requirements 14.5**
 *
 * For any string value for the `alg` parameter in a WCAP `Content-Signature` header
 * that is not a registered Algorithm Suite identifier (`ecdsa-p256-sha256` or
 * `dd-ecies-secp256k1-sha256`), a conforming verifier SHALL reject the signature
 * and report the unsupported algorithm.
 *
 * Since WCAP is a protocol specification (not a code library), there is no existing
 * WCAP verifier implementation to test against. This test implements a simple
 * `validateAlgorithmSuite` function that conforms to the WCAP spec's requirements
 * for algorithm suite validation, then uses fast-check to verify that all
 * unrecognized algorithm identifiers are properly rejected.
 */

import * as fc from 'fast-check';

// --- Registered WCAP Algorithm Suite identifiers ---
const REGISTERED_ALGORITHM_SUITES = new Set([
  'ecdsa-p256-sha256',
  'dd-ecies-secp256k1-sha256',
]);

/**
 * Validates an algorithm suite identifier per WCAP spec requirements.
 *
 * A conforming verifier MUST reject unrecognized `alg` values and SHOULD
 * report the unsupported algorithm (Requirement 14.5).
 *
 * @param alg - The algorithm suite identifier string from the Content-Signature header
 * @returns The validated algorithm suite identifier
 * @throws Error with a descriptive message if the algorithm suite is not recognized
 */
function validateAlgorithmSuite(alg: string): string {
  if (REGISTERED_ALGORITHM_SUITES.has(alg)) {
    return alg;
  }
  throw new Error(
    `Unsupported algorithm suite: "${alg}". ` +
      `Supported suites are: ${[...REGISTERED_ALGORITHM_SUITES].join(', ')}`,
  );
}

// --- fast-check arbitraries ---

/**
 * Generate random ASCII strings that are NOT equal to any registered
 * algorithm suite identifier.
 *
 * Uses fc.string() which generates arbitrary unicode strings, then filters
 * out the two registered identifiers.
 */
const unrecognizedAlgArb = fc
  .string({ minLength: 0, maxLength: 100 })
  .filter((s) => !REGISTERED_ALGORITHM_SUITES.has(s));

/**
 * Generate random strings composed of lowercase letters, digits, and hyphens
 * (typical algorithm identifier characters) that are NOT registered suites.
 */
const algLikeStringArb = fc
  .stringMatching(/^[a-z0-9-]{1,60}$/)
  .filter((s) => !REGISTERED_ALGORITHM_SUITES.has(s));

// ============================================================
// Property Tests
// ============================================================

describe('Property 3: WCAP Unrecognized Algorithm Suite Rejection', () => {
  describe('validateAlgorithmSuite accepts registered suites', () => {
    it('accepts ecdsa-p256-sha256', () => {
      expect(validateAlgorithmSuite('ecdsa-p256-sha256')).toBe(
        'ecdsa-p256-sha256',
      );
    });

    it('accepts dd-ecies-secp256k1-sha256', () => {
      expect(validateAlgorithmSuite('dd-ecies-secp256k1-sha256')).toBe(
        'dd-ecies-secp256k1-sha256',
      );
    });
  });

  describe('Unrecognized algorithm suite rejection', () => {
    it('rejects any random ASCII string ∉ registered suites with a descriptive error', () => {
      fc.assert(
        fc.property(unrecognizedAlgArb, (unrecognizedAlg) => {
          // The validator MUST reject unrecognized alg values
          expect(() => {
            validateAlgorithmSuite(unrecognizedAlg);
          }).toThrow();

          // The error SHOULD report the unsupported algorithm
          try {
            validateAlgorithmSuite(unrecognizedAlg);
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error);

            // Error message must be descriptive (non-empty)
            expect(message.length).toBeGreaterThan(0);

            // Error message should mention "unsupported" or "algorithm"
            const lowerMessage = message.toLowerCase();
            expect(
              lowerMessage.includes('unsupported') ||
                lowerMessage.includes('algorithm'),
            ).toBe(true);

            // Error message should include the unrecognized alg value
            expect(message).toContain(unrecognizedAlg);
          }
        }),
        { numRuns: 100 },
      );
    });

    it('rejects algorithm-identifier-like strings ∉ registered suites', () => {
      fc.assert(
        fc.property(algLikeStringArb, (algLikeString) => {
          // Even strings that look like valid algorithm identifiers
          // (lowercase, digits, hyphens) must be rejected if not registered
          expect(() => {
            validateAlgorithmSuite(algLikeString);
          }).toThrow();

          try {
            validateAlgorithmSuite(algLikeString);
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error);

            // Error should be descriptive and mention the unsupported algorithm
            expect(message.length).toBeGreaterThan(0);
            expect(message).toContain(algLikeString);
          }
        }),
        { numRuns: 100 },
      );
    });

    it('rejects the empty string', () => {
      expect(() => {
        validateAlgorithmSuite('');
      }).toThrow(/Unsupported algorithm suite/);
    });

    it('rejects near-miss variations of registered suites', () => {
      // These are strings that are close to but not exactly the registered identifiers
      const nearMisses = [
        'ecdsa-p256-sha256 ', // trailing space
        ' ecdsa-p256-sha256', // leading space
        'ECDSA-P256-SHA256', // uppercase
        'ecdsa-p256-sha512', // wrong hash
        'dd-ecies-secp256k1-sha512', // wrong hash
        'dd-ecies-secp256r1-sha256', // wrong curve
        'ecdsa-p384-sha256', // wrong curve
        'ecdsa-p256-sha256;', // trailing semicolon
      ];

      for (const nearMiss of nearMisses) {
        expect(() => {
          validateAlgorithmSuite(nearMiss);
        }).toThrow(/Unsupported algorithm suite/);
      }
    });
  });
});
