/**
 * Voting System Integrity Tests
 * Government-grade requirement: Verifiable, auditable, tamper-proof voting
 */

import { EmailString } from '../../src/email-string';
import { MemberType } from '../../src/enumerations/member-type';
import { VotingMethod } from '../../src/lib/voting/enumerations';
import type { EncryptedVote } from '../../src/lib/voting/interfaces';
import { Poll } from '../../src/lib/voting/poll-core';
import { Member } from '../../src/member';
import { ECIESService } from '../../src/services/ecies/service';

jest.setTimeout(300000);

describe('Voting System Integrity', () => {
  let ecies: ECIESService;
  let authority: Member<Uint8Array>;
  let voters: Member<Uint8Array>[];

  beforeAll(async () => {
    ecies = new ECIESService();

    // Create authority with voting keys
    const { member: auth, mnemonic: authMnemonic } = Member.newMember(
      ecies,
      MemberType.Admin,
      'Authority',
      new EmailString('authority@example.com'),
    );

    const { privateKey: _privateKey, publicKey: _publicKey } =
      ecies.mnemonicToSimpleKeyPair(authMnemonic);
    await auth.deriveVotingKeys();
    authority = auth;

    // Create voters
    voters = [];
    for (let i = 0; i < 5; i++) {
      const { member } = Member.newMember(
        ecies,
        MemberType.User,
        `Voter${i}`,
        new EmailString(`voter${i}@example.com`),
      );
      voters.push(member);
    }
  });

  describe('Vote Uniqueness and Integrity', () => {
    it('should prevent double voting', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const vote: EncryptedVote<Uint8Array> = {
        choiceIndex: 0,
        encrypted: [42n],
      };

      poll.vote(voters[0], vote);

      expect(() => {
        poll.vote(voters[0], vote);
      }).toThrow('Already voted');
    });

    it('should generate unique receipts for each vote', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const receipts = voters.slice(0, 3).map((voter, i) => {
        const vote: EncryptedVote<Uint8Array> = {
          choiceIndex: i % 2,
          encrypted: [BigInt(i)],
        };
        return poll.vote(voter, vote);
      });

      // All receipts should be unique
      const signatures = receipts.map((r) =>
        Buffer.from(r.signature).toString('hex'),
      );
      const uniqueSignatures = new Set(signatures);
      expect(uniqueSignatures.size).toBe(3);

      // All nonces should be unique
      const nonces = receipts.map((r) => Buffer.from(r.nonce).toString('hex'));
      const uniqueNonces = new Set(nonces);
      expect(uniqueNonces.size).toBe(3);
    });

    it('should verify valid receipts', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const vote: EncryptedVote<Uint8Array> = {
        choiceIndex: 0,
        encrypted: [42n],
      };

      const receipt = poll.vote(voters[0], vote);
      expect(poll.verifyReceipt(voters[0], receipt)).toBe(true);
    });

    it('should reject forged receipts', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const vote: EncryptedVote<Uint8Array> = {
        choiceIndex: 0,
        encrypted: [42n],
      };

      const receipt = poll.vote(voters[0], vote);

      // Tamper with signature
      receipt.signature[0] ^= 0xff;

      expect(poll.verifyReceipt(voters[0], receipt)).toBe(false);
    });

    it('should reject receipts from wrong voter', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const vote: EncryptedVote<Uint8Array> = {
        choiceIndex: 0,
        encrypted: [42n],
      };

      const receipt = poll.vote(voters[0], vote);

      // Try to verify with different voter
      expect(poll.verifyReceipt(voters[1], receipt)).toBe(false);
    });
  });

  describe('Vote Validation', () => {
    it('should reject votes with invalid choice index', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const invalidVote: EncryptedVote<Uint8Array> = {
        choiceIndex: 5, // Out of range
        encrypted: [42n],
      };

      expect(() => {
        poll.vote(voters[0], invalidVote);
      }).toThrow('Invalid choice');
    });

    it('should reject votes with negative choice index', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const invalidVote: EncryptedVote<Uint8Array> = {
        choiceIndex: -1,
        encrypted: [42n],
      };

      expect(() => {
        poll.vote(voters[0], invalidVote);
      }).toThrow('Invalid choice');
    });

    it('should reject votes without encrypted data', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const invalidVote: EncryptedVote<Uint8Array> = {
        choiceIndex: 0,
        encrypted: [],
      };

      expect(() => {
        poll.vote(voters[0], invalidVote);
      }).toThrow('Encrypted data required');
    });

    it('should validate approval voting choices', () => {
      const poll = new Poll(
        authority.id,
        ['A', 'B', 'C', 'D'],
        VotingMethod.Approval,
        authority,
        authority.votingPublicKey!,
      );

      const validVote: EncryptedVote<Uint8Array> = {
        choices: [0, 2, 3],
        encrypted: [42n],
      };

      expect(() => {
        poll.vote(voters[0], validVote);
      }).not.toThrow();
    });

    it('should reject approval votes with invalid choices', () => {
      const poll = new Poll(
        authority.id,
        ['A', 'B', 'C', 'D'],
        VotingMethod.Approval,
        authority,
        authority.votingPublicKey!,
      );

      const invalidVote: EncryptedVote<Uint8Array> = {
        choices: [0, 5], // 5 is out of range
        encrypted: [42n],
      };

      expect(() => {
        poll.vote(voters[0], invalidVote);
      }).toThrow('Invalid choice');
    });

    it('should validate weighted votes', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Weighted,
        authority,
        authority.votingPublicKey!,
        100n, // Max weight
      );

      const validVote: EncryptedVote<Uint8Array> = {
        choiceIndex: 0,
        weight: 50n,
        encrypted: [42n],
      };

      expect(() => {
        poll.vote(voters[0], validVote);
      }).not.toThrow();
    });

    it('should reject weighted votes exceeding maximum', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Weighted,
        authority,
        authority.votingPublicKey!,
        100n,
      );

      const invalidVote: EncryptedVote<Uint8Array> = {
        choiceIndex: 0,
        weight: 150n, // Exceeds max
        encrypted: [42n],
      };

      expect(() => {
        poll.vote(voters[0], invalidVote);
      }).toThrow('Weight exceeds maximum');
    });

    it('should reject weighted votes with zero or negative weight', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Weighted,
        authority,
        authority.votingPublicKey!,
      );

      const zeroVote: EncryptedVote<Uint8Array> = {
        choiceIndex: 0,
        weight: 0n,
        encrypted: [42n],
      };

      expect(() => {
        poll.vote(voters[0], zeroVote);
      }).toThrow('Weight must be positive');
    });

    it('should validate ranked choice votes', () => {
      const poll = new Poll(
        authority.id,
        ['A', 'B', 'C'],
        VotingMethod.RankedChoice,
        authority,
        authority.votingPublicKey!,
      );

      const validVote: EncryptedVote<Uint8Array> = {
        rankings: [2, 0, 1], // C, A, B
        encrypted: [42n],
      };

      expect(() => {
        poll.vote(voters[0], validVote);
      }).not.toThrow();
    });

    it('should reject ranked votes with duplicates', () => {
      const poll = new Poll(
        authority.id,
        ['A', 'B', 'C'],
        VotingMethod.RankedChoice,
        authority,
        authority.votingPublicKey!,
      );

      const invalidVote: EncryptedVote<Uint8Array> = {
        rankings: [0, 1, 0], // Duplicate 0
        encrypted: [42n],
      };

      expect(() => {
        poll.vote(voters[0], invalidVote);
      }).toThrow('Duplicate ranking');
    });
  });

  describe('Poll Lifecycle', () => {
    it('should prevent voting after poll closes', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      poll.close();

      const vote: EncryptedVote<Uint8Array> = {
        choiceIndex: 0,
        encrypted: [42n],
      };

      expect(() => {
        poll.vote(voters[0], vote);
      }).toThrow('Poll is closed');
    });

    it('should prevent double closing', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      poll.close();

      expect(() => {
        poll.close();
      }).toThrow('Already closed');
    });

    it('should track voter count accurately', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      expect(poll.voterCount).toBe(0);

      voters.slice(0, 3).forEach((voter, i) => {
        const vote: EncryptedVote<Uint8Array> = {
          choiceIndex: i % 2,
          encrypted: [BigInt(i)],
        };
        poll.vote(voter, vote);
      });

      expect(poll.voterCount).toBe(3);
    });

    it('should record creation and closure timestamps', () => {
      const beforeCreate = Date.now();

      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const afterCreate = Date.now();

      expect(poll.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(poll.createdAt).toBeLessThanOrEqual(afterCreate);
      expect(poll.closedAt).toBeUndefined();

      const beforeClose = Date.now();
      poll.close();
      const afterClose = Date.now();

      expect(poll.closedAt).toBeGreaterThanOrEqual(beforeClose);
      expect(poll.closedAt).toBeLessThanOrEqual(afterClose);
    });
  });

  describe('Encrypted Vote Storage', () => {
    it('should store encrypted votes immutably', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const vote: EncryptedVote<Uint8Array> = {
        choiceIndex: 0,
        encrypted: [42n],
      };

      poll.vote(voters[0], vote);

      const encryptedVotes = poll.getEncryptedVotes();

      // Should not be able to modify
      expect(() => {
        (encryptedVotes as any).set('key', [1n]);
      }).toThrow();
    });

    it('should return readonly encrypted votes', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      voters.slice(0, 2).forEach((voter, i) => {
        const vote: EncryptedVote<Uint8Array> = {
          choiceIndex: i,
          encrypted: [BigInt(i + 1)],
        };
        poll.vote(voter, vote);
      });

      const encryptedVotes = poll.getEncryptedVotes();

      expect(encryptedVotes.size).toBe(2);

      // Verify immutability
      for (const [_, encrypted] of encryptedVotes) {
        expect(Object.isFrozen(encrypted)).toBe(true);
      }
    });
  });

  describe('Audit Log Integrity', () => {
    it('should record poll creation in audit log', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const auditLog = poll.auditLog;
      const entries = auditLog.getEntries();

      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].eventType).toBe('poll_created');
    });

    it('should record each vote in audit log', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      voters.slice(0, 3).forEach((voter, i) => {
        const vote: EncryptedVote<Uint8Array> = {
          choiceIndex: i % 2,
          encrypted: [BigInt(i)],
        };
        poll.vote(voter, vote);
      });

      const auditLog = poll.auditLog;
      const entries = auditLog.getEntries();

      const voteEntries = entries.filter((e) => e.eventType === 'vote_cast');
      expect(voteEntries.length).toBe(3);
    });

    it('should record poll closure in audit log', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      poll.close();

      const auditLog = poll.auditLog;
      const entries = auditLog.getEntries();

      const closeEntry = entries.find((e) => e.eventType === 'poll_closed');
      expect(closeEntry).toBeDefined();
    });

    it('should maintain immutable audit log', () => {
      const poll = new Poll(
        authority.id,
        ['Option A', 'Option B'],
        VotingMethod.Plurality,
        authority,
        authority.votingPublicKey!,
      );

      const auditLog = poll.auditLog;
      const entries = auditLog.getEntries();

      // Should not be able to modify frozen array
      expect(() => {
        (entries as any).push({ eventType: 'FAKE' });
      }).toThrow();
    });
  });

  describe('Poll Configuration Validation', () => {
    it('should require at least 2 choices', () => {
      expect(() => {
        new Poll(
          authority.id,
          ['Only One'],
          VotingMethod.Plurality,
          authority,
          authority.votingPublicKey!,
        );
      }).toThrow('at least 2 choices');
    });

    it('should require authority with voting keys', () => {
      const { member: noKeyAuth } = Member.newMember(
        ecies,
        MemberType.Admin,
        'NoKeys',
        new EmailString('nokeys@example.com'),
      );

      expect(() => {
        new Poll(
          noKeyAuth.id,
          ['A', 'B'],
          VotingMethod.Plurality,
          noKeyAuth,
          authority.votingPublicKey!,
        );
      }).toThrow('must have voting keys');
    });

    it('should validate insecure voting methods', () => {
      expect(() => {
        new Poll(
          authority.id,
          ['A', 'B'],
          VotingMethod.Quadratic,
          authority,
          authority.votingPublicKey!,
        );
      }).toThrow('not cryptographically secure');
    });

    it('should allow insecure methods with explicit flag', () => {
      expect(() => {
        new Poll(
          authority.id,
          ['A', 'B'],
          VotingMethod.Quadratic,
          authority,
          authority.votingPublicKey!,
          undefined,
          true, // allowInsecure
        );
      }).not.toThrow();
    });
  });
});
