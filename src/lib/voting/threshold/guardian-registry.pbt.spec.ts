/**
 * Property-Based Tests: Guardian Registry
 *
 * Feature: real-time-threshold-voting
 * These tests validate Guardian registry consistency.
 *
 * Property 5: Guardian Registry Consistency
 *
 * **Validates: Requirements 2.1, 2.6**
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { GuardianStatus } from './enumerations/guardian-status';
import {
  GuardianRegistry,
  RegistryFullError,
  InvalidShareIndexError,
  GuardianAlreadyRegisteredError,
} from './guardian-registry';
import type { Guardian } from './interfaces/guardian';

/**
 * Arbitrary for generating a valid totalShares value (n).
 * Constrained to [2, 15] to keep tests fast.
 */
const arbTotalShares = fc.integer({ min: 2, max: 15 });

/**
 * Build a list of n unique Guardians with share indices 1..n.
 */
function buildGuardians(n: number): Guardian<string>[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `guardian-${i + 1}`,
    name: `Guardian ${i + 1}`,
    shareIndex: i + 1,
    verificationKey: new Uint8Array([i + 1]),
    status: GuardianStatus.Registered,
  }));
}

describe('Feature: real-time-threshold-voting, Property 5: Guardian Registry Consistency', () => {
  it('For any n, registering n Guardians with unique indices 1..n results in count === n and all indices present', () => {
    fc.assert(
      fc.property(arbTotalShares, (n) => {
        const registry = new GuardianRegistry<string>(n);
        const guardians = buildGuardians(n);

        for (const g of guardians) {
          registry.register(g);
        }

        // Count must equal n
        expect(registry.count).toBe(n);

        // All indices 1..n must be present and map to the correct Guardian
        for (let i = 1; i <= n; i++) {
          const found = registry.getGuardianByIndex(i);
          expect(found).toBeDefined();
          expect(found?.shareIndex).toBe(i);
          expect(found?.id).toBe(`guardian-${i}`);
        }

        // getAllGuardians returns exactly n entries
        expect(registry.getAllGuardians()).toHaveLength(n);
      }),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any n, registering more than n Guardians is rejected', () => {
    fc.assert(
      fc.property(arbTotalShares, (n) => {
        const registry = new GuardianRegistry<string>(n);
        const guardians = buildGuardians(n);

        for (const g of guardians) {
          registry.register(g);
        }

        // The (n+1)th registration must fail
        expect(() =>
          registry.register({
            id: `guardian-extra`,
            name: 'Extra Guardian',
            shareIndex: n + 1, // out of range anyway
            verificationKey: new Uint8Array([255]),
            status: GuardianStatus.Registered,
          }),
        ).toThrow(RegistryFullError);
      }),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any n, duplicate share indices are rejected', () => {
    fc.assert(
      fc.property(
        arbTotalShares,
        fc.integer({ min: 1, max: 15 }),
        (n, targetIndex) => {
          // Clamp targetIndex to valid range
          const idx = ((targetIndex - 1) % n) + 1;
          const registry = new GuardianRegistry<string>(n);

          // Register first Guardian at idx
          registry.register({
            id: 'first',
            name: 'First',
            shareIndex: idx,
            verificationKey: new Uint8Array([1]),
            status: GuardianStatus.Registered,
          });

          // Attempting to register another Guardian at the same index must fail
          expect(() =>
            registry.register({
              id: 'second',
              name: 'Second',
              shareIndex: idx,
              verificationKey: new Uint8Array([2]),
              status: GuardianStatus.Registered,
            }),
          ).toThrow(InvalidShareIndexError);
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any n, duplicate Guardian IDs are rejected', () => {
    fc.assert(
      fc.property(arbTotalShares, (n) => {
        const registry = new GuardianRegistry<string>(n);

        registry.register({
          id: 'same-id',
          name: 'First',
          shareIndex: 1,
          verificationKey: new Uint8Array([1]),
          status: GuardianStatus.Registered,
        });

        expect(() =>
          registry.register({
            id: 'same-id',
            name: 'Second',
            shareIndex: 2,
            verificationKey: new Uint8Array([2]),
            status: GuardianStatus.Registered,
          }),
        ).toThrow(GuardianAlreadyRegisteredError);
      }),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any n and any permutation of indices 1..n, all Guardians are retrievable by index', () => {
    fc.assert(
      fc.property(
        arbTotalShares.chain((n) =>
          fc.tuple(
            fc.constant(n),
            fc.shuffledSubarray(
              Array.from({ length: n }, (_, i) => i + 1),
              { minLength: n, maxLength: n },
            ),
          ),
        ),
        ([n, permutedIndices]) => {
          const registry = new GuardianRegistry<string>(n);

          // Register in shuffled order
          for (let i = 0; i < n; i++) {
            registry.register({
              id: `g-${i}`,
              name: `Guardian ${i}`,
              shareIndex: permutedIndices[i],
              verificationKey: new Uint8Array([i]),
              status: GuardianStatus.Registered,
            });
          }

          expect(registry.count).toBe(n);

          // Every index 1..n should be present
          const indices = new Set<number>();
          for (const g of registry.getAllGuardians()) {
            indices.add(g.shareIndex);
          }
          expect(indices.size).toBe(n);
          for (let i = 1; i <= n; i++) {
            expect(indices.has(i)).toBe(true);
          }
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });
});
