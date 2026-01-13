/**
 * Bulletin board interface for public vote publication and verification.
 */
import type { PlatformID } from '../../../interfaces';
import { BulletinBoardEntry } from './bulletin-board-entry';
import { TallyProof } from './tally-proof';

export interface BulletinBoard<TID extends PlatformID = Uint8Array> {
  /** Publish encrypted vote to bulletin board */
  publishVote(
    pollId: TID,
    encryptedVote: bigint[],
    voterIdHash: Uint8Array,
  ): BulletinBoardEntry<TID>;

  /** Publish tally with cryptographic proof */
  publishTally(
    pollId: TID,
    tallies: bigint[],
    choices: string[],
    encryptedVotes: bigint[][],
  ): TallyProof<TID>;
  /** Get all entries for a poll */
  getEntries(pollId: TID): readonly BulletinBoardEntry<TID>[];

  /** Get all entries (entire bulletin board) */
  getAllEntries(): readonly BulletinBoardEntry<TID>[];

  /** Get tally proof for a poll */
  getTallyProof(pollId: TID): TallyProof<TID> | undefined;

  /** Verify entry signature and hash */
  verifyEntry(entry: BulletinBoardEntry<TID>): boolean;

  /** Verify tally proof */
  verifyTallyProof(proof: TallyProof<TID>): boolean;

  /** Verify Merkle tree integrity */
  verifyMerkleTree(): boolean;

  /** Export complete bulletin board for archival */
  export(): Uint8Array;
}
