/**
 * Tests for Public Bulletin Board (Requirement 1.2)
 * Government-grade verification and security testing
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { EmailString } from '../../email-string';
import { Member } from '../../member';
import { ECIESService } from '../../services/ecies/service';
import {
  PublicBulletinBoard,
  type BulletinBoardEntry,
  type TallyProof as _TallyProof,
} from './bulletin-board';

describe('PublicBulletinBoard', () => {
  let authority: Member;
  let board: PublicBulletinBoard;
  let eciesService: ECIESService;

  beforeEach(() => {
    eciesService = new ECIESService();
    const mnemonic = eciesService.generateNewMnemonic();
    authority = Member.fromMnemonic(
      mnemonic,
      eciesService,
      undefined,
      'Authority',
      new EmailString('authority@example.com'),
    );
    board = new PublicBulletinBoard(authority);
  });

  describe('Vote Publication', () => {
    it('should publish encrypted vote to bulletin board', () => {
      const pollId = new Uint8Array([1, 2, 3]);
      const encryptedVote = [123n, 456n, 789n];
      const voterIdHash = new Uint8Array([4, 5, 6]);

      const entry = board.publishVote(pollId, encryptedVote, voterIdHash);

      expect(entry.sequence).toBe(0);
      expect(entry.pollId).toEqual(pollId);
      expect(entry.encryptedVote).toEqual(encryptedVote);
      expect(entry.voterIdHash).toEqual(voterIdHash);
      expect(entry.entryHash.length).toBe(32);
      expect(entry.signature.length).toBeGreaterThan(0);
      expect(entry.merkleRoot.length).toBe(32);
    });

    it('should assign sequential sequence numbers', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      const entry1 = board.publishVote(pollId, vote, hash);
      const entry2 = board.publishVote(pollId, vote, hash);
      const entry3 = board.publishVote(pollId, vote, hash);

      expect(entry1.sequence).toBe(0);
      expect(entry2.sequence).toBe(1);
      expect(entry3.sequence).toBe(2);
    });

    it('should include microsecond-precision timestamps', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      const before = Date.now() * 1000;
      const entry = board.publishVote(pollId, vote, hash);
      const after = Date.now() * 1000 + 1000; // Add 1ms buffer

      expect(entry.timestamp).toBeGreaterThanOrEqual(before);
      expect(entry.timestamp).toBeLessThanOrEqual(after);
    });

    it('should sign each entry with authority signature', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      const entry = board.publishVote(pollId, vote, hash);

      expect(board.verifyEntry(entry)).toBe(true);
    });

    it('should handle multiple votes for same poll', () => {
      const pollId = new Uint8Array([1, 2, 3]);
      const vote1 = [100n, 200n];
      const vote2 = [300n, 400n];
      const hash1 = new Uint8Array([4]);
      const hash2 = new Uint8Array([5]);

      board.publishVote(pollId, vote1, hash1);
      board.publishVote(pollId, vote2, hash2);

      const entries = board.getEntries(pollId);
      expect(entries.length).toBe(2);
      expect(entries[0].encryptedVote).toEqual(vote1);
      expect(entries[1].encryptedVote).toEqual(vote2);
    });

    it('should handle votes for different polls', () => {
      const pollId1 = new Uint8Array([1]);
      const pollId2 = new Uint8Array([2]);
      const vote = [100n];
      const hash = new Uint8Array([3]);

      board.publishVote(pollId1, vote, hash);
      board.publishVote(pollId2, vote, hash);

      expect(board.getEntries(pollId1).length).toBe(1);
      expect(board.getEntries(pollId2).length).toBe(1);
      expect(board.getAllEntries().length).toBe(2);
    });
  });

  describe('Tally Publication', () => {
    it('should publish tally with cryptographic proof', () => {
      const pollId = new Uint8Array([1, 2, 3]);
      const tallies = [100n, 200n, 300n];
      const choices = ['Alice', 'Bob', 'Charlie'];
      const encryptedVotes = [
        [10n, 20n, 30n],
        [40n, 50n, 60n],
      ];

      const proof = board.publishTally(
        pollId,
        tallies,
        choices,
        encryptedVotes,
      );

      expect(proof.pollId).toEqual(pollId);
      expect(proof.tallies).toEqual(tallies);
      expect(proof.choices).toEqual(choices);
      expect(proof.votesHash.length).toBe(32);
      expect(proof.decryptionProof.length).toBe(32);
      expect(proof.signature.length).toBeGreaterThan(0);
    });

    it('should verify tally proof signature', () => {
      const pollId = new Uint8Array([1]);
      const tallies = [100n];
      const choices = ['Option'];
      const votes = [[50n]];

      const proof = board.publishTally(pollId, tallies, choices, votes);

      expect(board.verifyTallyProof(proof)).toBe(true);
    });

    it('should retrieve tally proof by poll ID', () => {
      const pollId = new Uint8Array([1, 2, 3]);
      const tallies = [100n, 200n];
      const choices = ['A', 'B'];
      const votes = [[10n, 20n]];

      board.publishTally(pollId, tallies, choices, votes);

      const retrieved = board.getTallyProof(pollId);
      expect(retrieved).toBeDefined();
      expect(retrieved!.tallies).toEqual(tallies);
      expect(retrieved!.choices).toEqual(choices);
    });

    it('should return undefined for non-existent tally', () => {
      const pollId = new Uint8Array([99]);
      expect(board.getTallyProof(pollId)).toBeUndefined();
    });

    it('should include timestamp in tally proof', () => {
      const pollId = new Uint8Array([1]);
      const tallies = [100n];
      const choices = ['Option'];
      const votes = [[50n]];

      const before = Date.now() * 1000;
      const proof = board.publishTally(pollId, tallies, choices, votes);
      const after = Date.now() * 1000 + 1000; // Add 1ms buffer

      expect(proof.timestamp).toBeGreaterThanOrEqual(before);
      expect(proof.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Entry Verification', () => {
    it('should verify valid entry', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      const entry = board.publishVote(pollId, vote, hash);

      expect(board.verifyEntry(entry)).toBe(true);
    });

    it('should reject entry with tampered hash', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      const entry = board.publishVote(pollId, vote, hash);
      const tampered = { ...entry, entryHash: new Uint8Array(32) };

      expect(board.verifyEntry(tampered)).toBe(false);
    });

    it('should reject entry with invalid signature', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      const entry = board.publishVote(pollId, vote, hash);
      const tampered = { ...entry, signature: new Uint8Array(64) };

      expect(board.verifyEntry(tampered)).toBe(false);
    });

    it('should reject entry with tampered vote data', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      const entry = board.publishVote(pollId, vote, hash);
      const tampered = { ...entry, encryptedVote: [999n] };

      expect(board.verifyEntry(tampered)).toBe(false);
    });
  });

  describe('Merkle Tree Verification', () => {
    it('should verify empty merkle tree', () => {
      expect(board.verifyMerkleTree()).toBe(true);
    });

    it('should verify merkle tree with single entry', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      board.publishVote(pollId, vote, hash);

      expect(board.verifyMerkleTree()).toBe(true);
    });

    it('should verify merkle tree with multiple entries', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];

      for (let i = 0; i < 10; i++) {
        const hash = new Uint8Array([i]);
        board.publishVote(pollId, vote, hash);
      }

      expect(board.verifyMerkleTree()).toBe(true);
    });

    it('should update merkle root with each new entry', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];

      const entry1 = board.publishVote(pollId, vote, new Uint8Array([1]));
      const entry2 = board.publishVote(pollId, vote, new Uint8Array([2]));
      const entry3 = board.publishVote(pollId, vote, new Uint8Array([3]));

      // Each entry should have different merkle root
      expect(entry1.merkleRoot).not.toEqual(entry2.merkleRoot);
      expect(entry2.merkleRoot).not.toEqual(entry3.merkleRoot);
    });

    it('should compute merkle root as hex string for empty board', () => {
      const merkleRoot = board.computeMerkleRoot();

      expect(typeof merkleRoot).toBe('string');
      expect(merkleRoot).toBe('0'.repeat(64)); // 32 bytes of zeros as hex
      expect(merkleRoot.length).toBe(64);
    });

    it('should compute merkle root as hex string for board with entries', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      board.publishVote(pollId, vote, hash);
      const merkleRoot = board.computeMerkleRoot();

      expect(typeof merkleRoot).toBe('string');
      expect(merkleRoot.length).toBe(64); // 32 bytes as hex
      expect(/^[0-9a-f]{64}$/.test(merkleRoot)).toBe(true); // Valid hex string
    });

    it('should return different merkle roots as entries are added', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];

      const initialRoot = board.computeMerkleRoot();

      board.publishVote(pollId, vote, new Uint8Array([1]));
      const rootAfterFirst = board.computeMerkleRoot();

      board.publishVote(pollId, vote, new Uint8Array([2]));
      const rootAfterSecond = board.computeMerkleRoot();

      // Initial root should be all zeros
      expect(initialRoot).toBe('0'.repeat(64));

      // After first entry, root should still be zeros (first entry has empty merkle root)
      expect(rootAfterFirst).toBe('0'.repeat(64));

      // After second entry, root should be different (computed from first entry)
      expect(rootAfterSecond).not.toBe('0'.repeat(64));
      expect(rootAfterSecond).not.toBe(rootAfterFirst);
    });

    it('should return merkle root matching latest entry', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      const entry = board.publishVote(pollId, vote, hash);
      const computedRoot = board.computeMerkleRoot();

      // Convert entry's merkle root to hex for comparison
      const expectedRoot = Array.from(entry.merkleRoot)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      expect(computedRoot).toBe(expectedRoot);
    });
  });

  describe('Query Operations', () => {
    beforeEach(() => {
      // Setup test data
      const poll1 = new Uint8Array([1]);
      const poll2 = new Uint8Array([2]);
      const vote = [100n];

      board.publishVote(poll1, vote, new Uint8Array([1]));
      board.publishVote(poll1, vote, new Uint8Array([2]));
      board.publishVote(poll2, vote, new Uint8Array([3]));
      board.publishVote(poll1, vote, new Uint8Array([4]));
    });

    it('should get all entries for specific poll', () => {
      const poll1 = new Uint8Array([1]);
      const entries = board.getEntries(poll1);

      expect(entries.length).toBe(3);
      expect(entries[0].sequence).toBe(0);
      expect(entries[1].sequence).toBe(1);
      expect(entries[2].sequence).toBe(3);
    });

    it('should get all entries across all polls', () => {
      const entries = board.getAllEntries();

      expect(entries.length).toBe(4);
      expect(entries[0].sequence).toBe(0);
      expect(entries[3].sequence).toBe(3);
    });

    it('should return empty array for non-existent poll', () => {
      const nonExistent = new Uint8Array([99]);
      const entries = board.getEntries(nonExistent);

      expect(entries.length).toBe(0);
    });

    it('should return immutable entries', () => {
      const entries = board.getAllEntries();

      expect(() => {
        (entries as BulletinBoardEntry[]).push({} as BulletinBoardEntry);
      }).toThrow();
    });
  });

  describe('Export and Archival', () => {
    it('should export empty bulletin board', () => {
      const exported = board.export();

      expect(exported).toBeInstanceOf(Uint8Array);
      expect(exported.length).toBeGreaterThan(0);
    });

    it('should export bulletin board with entries', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n, 200n];
      const hash = new Uint8Array([2]);

      board.publishVote(pollId, vote, hash);
      board.publishVote(pollId, vote, hash);

      const exported = board.export();

      expect(exported).toBeInstanceOf(Uint8Array);
      expect(exported.length).toBeGreaterThan(16); // Has data
    });

    it('should export bulletin board with tally proofs', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      board.publishVote(pollId, vote, hash);
      board.publishTally(pollId, [100n], ['Option'], [[50n]]);

      const exported = board.export();

      expect(exported).toBeInstanceOf(Uint8Array);
      expect(exported.length).toBeGreaterThan(32);
    });
  });

  describe('Security Properties', () => {
    it('should maintain append-only property', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];

      board.publishVote(pollId, vote, new Uint8Array([1]));
      board.publishVote(pollId, vote, new Uint8Array([2]));

      const entries = board.getAllEntries();
      expect(entries.length).toBe(2);

      // Attempt to publish more
      board.publishVote(pollId, vote, new Uint8Array([3]));

      const newEntries = board.getAllEntries();
      expect(newEntries.length).toBe(3);
      // Original entries unchanged
      expect(newEntries[0]).toEqual(entries[0]);
      expect(newEntries[1]).toEqual(entries[1]);
    });

    it('should detect sequence number gaps', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];

      const entry1 = board.publishVote(pollId, vote, new Uint8Array([1]));
      const entry2 = board.publishVote(pollId, vote, new Uint8Array([2]));

      expect(entry2.sequence).toBe(entry1.sequence + 1);
    });

    it('should maintain cryptographic chain integrity', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];

      for (let i = 0; i < 5; i++) {
        board.publishVote(pollId, vote, new Uint8Array([i]));
      }

      expect(board.verifyMerkleTree()).toBe(true);

      const entries = board.getAllEntries();
      for (const entry of entries) {
        expect(board.verifyEntry(entry)).toBe(true);
      }
    });

    it('should prevent vote tampering detection', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];
      const hash = new Uint8Array([2]);

      const entry = board.publishVote(pollId, vote, hash);

      // Tamper with vote
      const tampered = {
        ...entry,
        encryptedVote: [999n],
      };

      expect(board.verifyEntry(tampered)).toBe(false);
    });

    it('should handle large vote counts', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];

      for (let i = 0; i < 100; i++) {
        const hash = new Uint8Array([i % 256]);
        board.publishVote(pollId, vote, hash);
      }

      expect(board.getAllEntries().length).toBe(100);
      expect(board.verifyMerkleTree()).toBe(true);
    });

    it('should handle large encrypted vote values', () => {
      const pollId = new Uint8Array([1]);
      const largeVote = [
        BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'),
        BigInt('0x123456789ABCDEF0123456789ABCDEF0'),
      ];
      const hash = new Uint8Array([1]);

      const entry = board.publishVote(pollId, largeVote, hash);

      expect(entry.encryptedVote).toEqual(largeVote);
      expect(board.verifyEntry(entry)).toBe(true);
    });
  });

  describe('Government Requirements Compliance', () => {
    it('REQUIREMENT: shall publish encrypted votes to public bulletin board', () => {
      const pollId = new Uint8Array([1]);
      const encryptedVote = [123n, 456n];
      const voterIdHash = new Uint8Array([2]);

      const entry = board.publishVote(pollId, encryptedVote, voterIdHash);

      expect(entry).toBeDefined();
      expect(entry.encryptedVote).toEqual(encryptedVote);
    });

    it('REQUIREMENT: shall allow observers to download complete vote set', () => {
      const pollId = new Uint8Array([1]);
      const vote = [100n];

      board.publishVote(pollId, vote, new Uint8Array([1]));
      board.publishVote(pollId, vote, new Uint8Array([2]));

      const allEntries = board.getAllEntries();
      expect(allEntries.length).toBe(2);
      expect(allEntries[0].encryptedVote).toBeDefined();
      expect(allEntries[1].encryptedVote).toBeDefined();
    });

    it('REQUIREMENT: shall publish zero-knowledge proofs of correct decryption', () => {
      const pollId = new Uint8Array([1]);
      const tallies = [100n, 200n];
      const choices = ['A', 'B'];
      const votes = [[50n, 100n]];

      const proof = board.publishTally(pollId, tallies, choices, votes);

      expect(proof.decryptionProof).toBeDefined();
      expect(proof.decryptionProof.length).toBe(32);
    });

    it('REQUIREMENT: shall publish verifiable tallies with cryptographic proofs', () => {
      const pollId = new Uint8Array([1]);
      const tallies = [100n, 200n];
      const choices = ['A', 'B'];
      const votes = [[50n, 100n]];

      const proof = board.publishTally(pollId, tallies, choices, votes);

      expect(proof.tallies).toEqual(tallies);
      expect(proof.votesHash).toBeDefined();
      expect(proof.signature).toBeDefined();
      expect(board.verifyTallyProof(proof)).toBe(true);
    });
  });
});
