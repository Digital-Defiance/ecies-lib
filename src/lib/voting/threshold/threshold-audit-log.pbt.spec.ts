/**
 * Property-Based Tests: Threshold Audit Log Integrity
 *
 * Feature: real-time-threshold-voting
 * These tests validate that the threshold audit log maintains hash chain
 * integrity across all threshold operation types.
 *
 * Property 6: Audit Log Integrity
 *
 * *For any* threshold operation (key generation, share distribution, ceremony,
 * tally publication), the audit log SHALL contain a corresponding entry with
 * correct metadata, and the hash chain SHALL remain valid.
 *
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import type { PublicKey } from 'paillier-bigint';
import { EmailString } from '../../../email-string';
import { MemberType } from '../../../enumerations/member-type';
import type { IMember } from '../../../interfaces';
import type { IIdProvider } from '../../../interfaces/id-provider';
import { SecureBuffer } from '../../../secure-buffer';
import { ThresholdAuditEventType } from './enumerations/threshold-audit-event-type';
import { ThresholdAuditLog } from './threshold-audit-log';

/**
 * Mock Member for testing — provides deterministic sign/verify.
 */
class MockMember implements IMember {
  public readonly type = MemberType.User;
  public readonly name = 'Audit Test Authority';
  public readonly email = new EmailString('audit@example.com');
  public readonly creatorId: Uint8Array;
  public readonly dateCreated = new Date();
  public readonly dateUpdated = new Date();
  public readonly privateKey: SecureBuffer | undefined = undefined;
  public readonly hasPrivateKey = false;
  public readonly hasVotingPrivateKey = false;
  public readonly publicKey = new Uint8Array([1, 2, 3]);
  public readonly votingPrivateKey = undefined;
  public readonly votingPublicKey: PublicKey | undefined = undefined;

  constructor(public readonly id: Uint8Array) {
    this.creatorId = id;
  }

  get idBytes(): Uint8Array {
    return this.id;
  }
  get wallet(): never {
    throw new Error('Not implemented');
  }
  get walletOptional(): undefined {
    return undefined;
  }
  get idProvider(): IIdProvider<Uint8Array> {
    return {
      byteLength: 12,
      generate: () => new Uint8Array(12),
      toBytes: (id: Uint8Array) => id,
      fromBytes: (bytes: Uint8Array) => bytes,
      serialize: (id: Uint8Array) =>
        Array.from(id)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      deserialize: (str: string) =>
        new Uint8Array(
          str.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
        ),
      validate: (id: Uint8Array) => id.length === 12,
    };
  }

  sign(data: Uint8Array): Uint8Array {
    const sig = new Uint8Array(64);
    for (let i = 0; i < Math.min(data.length, 64); i++) {
      sig[i] = data[i] ^ 0xaa;
    }
    return sig;
  }
  signData(data: Uint8Array): Uint8Array {
    return this.sign(data);
  }
  verify(signature: Uint8Array, data: Uint8Array): boolean {
    const expected = this.sign(data);
    if (signature.length !== expected.length) return false;
    for (let i = 0; i < signature.length; i++) {
      if (signature[i] !== expected[i]) return false;
    }
    return true;
  }
  verifySignature(
    data: Uint8Array,
    signature: Uint8Array,
    _publicKey: Uint8Array,
  ): boolean {
    return this.verify(signature, data);
  }
  unloadPrivateKey(): void {}
  unloadWallet(): void {}
  unloadWalletAndPrivateKey(): void {}
  loadWallet(): void {}
  loadPrivateKey(): void {}
  loadVotingKeys(): void {}
  async deriveVotingKeys(): Promise<void> {}
  unloadVotingPrivateKey(): void {}
  async *encryptDataStream(): AsyncGenerator<never, void, unknown> {
    /* noop */
  }
  async *decryptDataStream(): AsyncGenerator<never, void, unknown> {
    /* noop */
  }
  async encryptData(): Promise<Uint8Array> {
    return new Uint8Array(0);
  }
  async decryptData(): Promise<Uint8Array> {
    return new Uint8Array(0);
  }
  toJson(): string {
    return '{}';
  }
  dispose(): void {}
}

// --- Arbitraries ---

const arbPollId = fc.uint8Array({ minLength: 4, maxLength: 12 });
const arbGuardianId = fc.uint8Array({ minLength: 4, maxLength: 12 });
const arbGuardianIndex = fc.integer({ min: 1, max: 20 });
const arbCeremonyId = fc
  .array(fc.integer({ min: 0, max: 15 }), { minLength: 8, maxLength: 16 })
  .map((arr) => arr.map((n) => n.toString(16)).join(''));
const arbMetadataValue = fc.oneof(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.integer({ min: 0, max: 10000 }),
  fc.boolean(),
);
const arbMetadata = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]/.test(s)),
  arbMetadataValue,
  { minKeys: 1, maxKeys: 5 },
);

/**
 * Arbitrary for a threshold audit operation — one of the six recording methods.
 */
interface AuditOp {
  type: ThresholdAuditEventType;
  pollId: Uint8Array;
  ceremonyId?: string;
  guardianId?: Uint8Array;
  guardianIndex?: number;
  metadata: Record<string, string | number | boolean>;
}

const arbAuditOp: fc.Arbitrary<AuditOp> = fc.oneof(
  fc.record({
    type: fc.constant(ThresholdAuditEventType.KeyGeneration),
    pollId: arbPollId,
    metadata: arbMetadata,
  }),
  fc.record({
    type: fc.constant(ThresholdAuditEventType.KeyShareDistribution),
    pollId: arbPollId,
    guardianId: arbGuardianId,
    guardianIndex: arbGuardianIndex,
    metadata: arbMetadata,
  }),
  fc.record({
    type: fc.constant(ThresholdAuditEventType.CeremonyStarted),
    pollId: arbPollId,
    ceremonyId: arbCeremonyId,
    metadata: arbMetadata,
  }),
  fc.record({
    type: fc.constant(ThresholdAuditEventType.PartialSubmitted),
    pollId: arbPollId,
    ceremonyId: arbCeremonyId,
    guardianId: arbGuardianId,
    guardianIndex: arbGuardianIndex,
    metadata: arbMetadata,
  }),
  fc.record({
    type: fc.constant(ThresholdAuditEventType.CeremonyCompleted),
    pollId: arbPollId,
    ceremonyId: arbCeremonyId,
    metadata: arbMetadata,
  }),
  fc.record({
    type: fc.constant(ThresholdAuditEventType.TallyPublished),
    pollId: arbPollId,
    metadata: arbMetadata,
  }),
);

/** Execute an audit operation on the log. */
function executeOp(log: ThresholdAuditLog<Uint8Array>, op: AuditOp): void {
  switch (op.type) {
    case ThresholdAuditEventType.KeyGeneration:
      log.recordKeyGeneration(op.pollId, op.metadata);
      break;
    case ThresholdAuditEventType.KeyShareDistribution:
      log.recordKeyShareDistribution(
        op.pollId,
        op.guardianId!,
        op.guardianIndex!,
        op.metadata,
      );
      break;
    case ThresholdAuditEventType.CeremonyStarted:
      log.recordCeremonyStarted(op.pollId, op.ceremonyId!, op.metadata);
      break;
    case ThresholdAuditEventType.PartialSubmitted:
      log.recordPartialSubmitted(
        op.pollId,
        op.ceremonyId!,
        op.guardianId!,
        op.guardianIndex!,
        op.metadata,
      );
      break;
    case ThresholdAuditEventType.CeremonyCompleted:
      log.recordCeremonyCompleted(op.pollId, op.ceremonyId!, op.metadata);
      break;
    case ThresholdAuditEventType.TallyPublished:
      log.recordTallyPublished(op.pollId, op.metadata);
      break;
  }
}

describe('Feature: real-time-threshold-voting, Property 6: Audit Log Integrity', () => {
  it('For any sequence of threshold operations, the hash chain remains valid', () => {
    fc.assert(
      fc.property(
        fc.array(arbAuditOp, { minLength: 1, maxLength: 20 }),
        (ops) => {
          const authority = new MockMember(new Uint8Array([1, 2, 3]));
          const log = new ThresholdAuditLog(authority);

          for (const op of ops) {
            executeOp(log, op);
          }

          expect(log.verifyChain()).toBe(true);
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any threshold operation, the log contains a corresponding entry with correct event type and metadata', () => {
    fc.assert(
      fc.property(arbAuditOp, (op) => {
        const authority = new MockMember(new Uint8Array([1, 2, 3]));
        const log = new ThresholdAuditLog(authority);

        executeOp(log, op);

        const entries = log.getEntries();
        expect(entries).toHaveLength(1);

        const entry = entries[0];
        expect(entry.eventType).toBe(op.type);
        expect(entry.metadata).toEqual(op.metadata);
        expect(entry.entryHash).toBeInstanceOf(Uint8Array);
        expect(entry.entryHash.length).toBe(32);
        expect(entry.signature).toBeInstanceOf(Uint8Array);
        expect(entry.signature.length).toBe(64);
        expect(entry.timestamp).toBeGreaterThan(0);
      }),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any entry, the signature is verifiable by the authority', () => {
    fc.assert(
      fc.property(
        fc.array(arbAuditOp, { minLength: 1, maxLength: 10 }),
        (ops) => {
          const authority = new MockMember(new Uint8Array([5, 6, 7]));
          const log = new ThresholdAuditLog(authority);

          for (const op of ops) {
            executeOp(log, op);
          }

          const entries = log.getEntries();
          for (const entry of entries) {
            expect(log.verifyEntry(entry)).toBe(true);
          }
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any sequence, each entry links to the previous via previousHash', () => {
    fc.assert(
      fc.property(
        fc.array(arbAuditOp, { minLength: 2, maxLength: 15 }),
        (ops) => {
          const authority = new MockMember(new Uint8Array([9, 10]));
          const log = new ThresholdAuditLog(authority);

          for (const op of ops) {
            executeOp(log, op);
          }

          const entries = log.getEntries();

          // First entry links to zero hash
          const zeroHash = new Uint8Array(32);
          expect(entries[0].previousHash).toEqual(zeroHash);

          // Each subsequent entry links to the previous entry's hash
          for (let i = 1; i < entries.length; i++) {
            expect(entries[i].previousHash).toEqual(entries[i - 1].entryHash);
          }
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });

  it('For any entry with tampered entryHash, chain verification fails', () => {
    fc.assert(
      fc.property(
        fc.array(arbAuditOp, { minLength: 1, maxLength: 10 }),
        fc.nat(),
        (ops, tamperSeed) => {
          const authority = new MockMember(new Uint8Array([1, 2, 3]));
          const log = new ThresholdAuditLog(authority);

          for (const op of ops) {
            executeOp(log, op);
          }

          // Tamper with one entry's hash
          const entries = log.getEntries();
          const tamperIdx = tamperSeed % entries.length;
          const tampered = entries[tamperIdx];
          (tampered as { entryHash: Uint8Array }).entryHash = new Uint8Array(
            tampered.entryHash.map((b, i) => (i === 0 ? b ^ 0xff : b)),
          );

          expect(log.verifyChain()).toBe(false);
        },
      ),
      { numRuns: 100, verbose: true },
    );
  });
});
