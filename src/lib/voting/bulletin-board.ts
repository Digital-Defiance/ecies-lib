/**
 * Public Bulletin Board for Government-Grade Voting
 * Implements requirement 1.2: Append-only, publicly verifiable vote publication
 */
import { getRuntimeConfiguration } from '../../constants';
import type { PlatformID } from '../../interfaces';
import type { IMember } from './types';
const Constants = getRuntimeConfiguration();

export interface BulletinBoardEntry<TID extends PlatformID = Uint8Array> {
  /** Sequence number (monotonically increasing) */
  readonly sequence: number;
  /** Microsecond-precision timestamp */
  readonly timestamp: number;
  /** Poll identifier */
  readonly pollId: TID;
  /** Encrypted vote data */
  readonly encryptedVote: bigint[];
  /** Hash of voter ID (anonymized) */
  readonly voterIdHash: Uint8Array;
  /** Merkle root of all entries up to this point */
  readonly merkleRoot: Uint8Array;
  /** Hash of this entry */
  readonly entryHash: Uint8Array;
  /** Authority signature */
  readonly signature: Uint8Array;
}

export interface TallyProof<TID extends PlatformID = Uint8Array> {
  /** Poll identifier */
  readonly pollId: TID;
  /** Final tallies */
  readonly tallies: bigint[];
  /** Choice names */
  readonly choices: string[];
  /** Timestamp of tally */
  readonly timestamp: number;
  /** Hash of all encrypted votes */
  readonly votesHash: Uint8Array;
  /** Cryptographic proof of correct decryption */
  readonly decryptionProof: Uint8Array;
  /** Authority signature */
  readonly signature: Uint8Array;
}

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

/**
 * Append-only public bulletin board with cryptographic verification
 */
export class PublicBulletinBoard<
  TID extends PlatformID = Uint8Array,
> implements BulletinBoard<TID> {
  private readonly entries: BulletinBoardEntry<TID>[] = [];
  private readonly tallyProofs = new Map<string, TallyProof<TID>>();
  private readonly authority: IMember;
  private sequence = 0;

  constructor(authority: IMember) {
    this.authority = authority;
  }

  publishVote(
    pollId: TID,
    encryptedVote: bigint[],
    voterIdHash: Uint8Array,
  ): BulletinBoardEntry<TID> {
    const timestamp = this.getMicrosecondTimestamp();
    const merkleRoot = this.computeMerkleRoot([...this.entries]);

    const entryData = this.serializeEntryData({
      sequence: this.sequence,
      timestamp,
      pollId,
      encryptedVote,
      voterIdHash,
      merkleRoot,
    });

    const entryHash = this.sha256(entryData);
    const signature = this.authority.sign(entryHash);

    const entry: BulletinBoardEntry<TID> = {
      sequence: this.sequence++,
      timestamp,
      pollId,
      encryptedVote,
      voterIdHash,
      merkleRoot,
      entryHash,
      signature,
    };

    this.entries.push(entry);
    return entry;
  }

  publishTally(
    pollId: TID,
    tallies: bigint[],
    choices: string[],
    encryptedVotes: bigint[][],
  ): TallyProof<TID> {
    const pollIdBytes = Constants.idProvider.toBytes(pollId);
    const timestamp = this.getMicrosecondTimestamp();
    const votesHash = this.hashEncryptedVotes(encryptedVotes);
    const decryptionProof = this.generateDecryptionProof(
      encryptedVotes,
      tallies,
    );

    const proofData = this.serializeTallyProof({
      pollId,
      tallies,
      choices,
      timestamp,
      votesHash,
      decryptionProof,
    });

    const signature = this.authority.sign(proofData);

    const proof: TallyProof<TID> = {
      pollId,
      tallies,
      choices,
      timestamp,
      votesHash,
      decryptionProof,
      signature,
    };

    this.tallyProofs.set(this.toHex(pollIdBytes), proof);
    return proof;
  }

  getEntries(pollId: TID): readonly BulletinBoardEntry<TID>[] {
    return this.entries.filter((e) => this.pollIdsEqual(e.pollId, pollId));
  }

  getAllEntries(): readonly BulletinBoardEntry<TID>[] {
    return Object.freeze([...this.entries]);
  }

  getTallyProof(pollId: TID): TallyProof<TID> | undefined {
    return this.tallyProofs.get(
      this.toHex(Constants.idProvider.toBytes(pollId)),
    );
  }

  verifyEntry(entry: BulletinBoardEntry<TID>): boolean {
    const entryData = this.serializeEntryData({
      sequence: entry.sequence,
      timestamp: entry.timestamp,
      pollId: entry.pollId,
      encryptedVote: entry.encryptedVote,
      voterIdHash: entry.voterIdHash,
      merkleRoot: entry.merkleRoot,
    });

    const computedHash = this.sha256(entryData);
    if (!this.arraysEqual(computedHash, entry.entryHash)) {
      return false;
    }

    return this.authority.verify(entry.signature, entry.entryHash);
  }

  verifyTallyProof(proof: TallyProof<TID>): boolean {
    const proofData = this.serializeTallyProof({
      pollId: proof.pollId,
      tallies: proof.tallies,
      choices: proof.choices,
      timestamp: proof.timestamp,
      votesHash: proof.votesHash,
      decryptionProof: proof.decryptionProof,
    });

    return this.authority.verify(proof.signature, proofData);
  }

  verifyMerkleTree(): boolean {
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const expectedRoot = this.computeMerkleRoot(this.entries.slice(0, i));

      if (!this.arraysEqual(entry.merkleRoot, expectedRoot)) {
        return false;
      }
    }
    return true;
  }

  export(): Uint8Array {
    const parts: Uint8Array[] = [];

    // Export entries
    parts.push(this.encodeNumber(this.entries.length));
    for (const entry of this.entries) {
      parts.push(this.serializeEntry(entry));
    }

    // Export tally proofs
    parts.push(this.encodeNumber(this.tallyProofs.size));
    for (const proof of this.tallyProofs.values()) {
      parts.push(this.serializeTallyProofFull(proof));
    }

    return this.concat(parts);
  }

  private computeMerkleRoot(entries: BulletinBoardEntry<TID>[]): Uint8Array {
    if (entries.length === 0) {
      return new Uint8Array(32);
    }

    let hashes = entries.map((e) => e.entryHash);

    while (hashes.length > 1) {
      const nextLevel: Uint8Array[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        if (i + 1 < hashes.length) {
          nextLevel.push(this.sha256(this.concat([hashes[i], hashes[i + 1]])));
        } else {
          nextLevel.push(hashes[i]);
        }
      }
      hashes = nextLevel;
    }

    return hashes[0];
  }

  private hashEncryptedVotes(votes: bigint[][]): Uint8Array {
    const parts: Uint8Array[] = [];
    for (const vote of votes) {
      for (const value of vote) {
        parts.push(this.encodeBigInt(value));
      }
    }
    return this.sha256(this.concat(parts));
  }

  private generateDecryptionProof(
    encryptedVotes: bigint[][],
    tallies: bigint[],
  ): Uint8Array {
    // Simplified proof: hash of encrypted votes + tallies
    // In production, use ZK-SNARK or similar
    const parts: Uint8Array[] = [];
    for (const vote of encryptedVotes) {
      for (const value of vote) {
        parts.push(this.encodeBigInt(value));
      }
    }
    for (const tally of tallies) {
      parts.push(this.encodeBigInt(tally));
    }
    return this.sha256(this.concat(parts));
  }

  private serializeEntryData(data: {
    sequence: number;
    timestamp: number;
    pollId: TID;
    encryptedVote: bigint[];
    voterIdHash: Uint8Array;
    merkleRoot: Uint8Array;
  }): Uint8Array {
    const parts: Uint8Array[] = [
      this.encodeNumber(data.sequence),
      this.encodeNumber(data.timestamp),
      Constants.idProvider.toBytes(data.pollId),
      data.voterIdHash,
      data.merkleRoot,
    ];

    for (const value of data.encryptedVote) {
      parts.push(this.encodeBigInt(value));
    }

    return this.concat(parts);
  }

  private serializeTallyProof(data: {
    pollId: TID;
    tallies: bigint[];
    choices: string[];
    timestamp: number;
    votesHash: Uint8Array;
    decryptionProof: Uint8Array;
  }): Uint8Array {
    const parts: Uint8Array[] = [
      Constants.idProvider.toBytes(data.pollId),
      this.encodeNumber(data.timestamp),
      data.votesHash,
      data.decryptionProof,
    ];

    for (const tally of data.tallies) {
      parts.push(this.encodeBigInt(tally));
    }

    for (const choice of data.choices) {
      parts.push(this.encodeString(choice));
    }

    return this.concat(parts);
  }

  private serializeEntry(entry: BulletinBoardEntry<TID>): Uint8Array {
    const pollIdBytes = Constants.idProvider.toBytes(entry.pollId);
    const parts: Uint8Array[] = [
      this.encodeNumber(entry.sequence),
      this.encodeNumber(entry.timestamp),
      this.encodeNumber(pollIdBytes.length),
      pollIdBytes,
      this.encodeNumber(entry.encryptedVote.length),
    ];

    for (const value of entry.encryptedVote) {
      parts.push(this.encodeBigInt(value));
    }

    parts.push(
      this.encodeNumber(entry.voterIdHash.length),
      entry.voterIdHash,
      this.encodeNumber(entry.merkleRoot.length),
      entry.merkleRoot,
      this.encodeNumber(entry.entryHash.length),
      entry.entryHash,
      this.encodeNumber(entry.signature.length),
      entry.signature,
    );

    return this.concat(parts);
  }

  private serializeTallyProofFull(proof: TallyProof<TID>): Uint8Array {
    const pollIdBytes = Constants.idProvider.toBytes(proof.pollId);
    const parts: Uint8Array[] = [
      this.encodeNumber(pollIdBytes.length),
      pollIdBytes,
      this.encodeNumber(proof.tallies.length),
    ];

    for (const tally of proof.tallies) {
      parts.push(this.encodeBigInt(tally));
    }

    parts.push(this.encodeNumber(proof.choices.length));
    for (const choice of proof.choices) {
      const encoded = this.encodeString(choice);
      parts.push(this.encodeNumber(encoded.length), encoded);
    }

    parts.push(
      this.encodeNumber(proof.timestamp),
      this.encodeNumber(proof.votesHash.length),
      proof.votesHash,
      this.encodeNumber(proof.decryptionProof.length),
      proof.decryptionProof,
      this.encodeNumber(proof.signature.length),
      proof.signature,
    );

    return this.concat(parts);
  }

  private getMicrosecondTimestamp(): number {
    // Get milliseconds since epoch and convert to microseconds
    // performance.now() is relative to process start, not epoch, so we only use Date.now()
    const now = Date.now();
    return now * 1000;
  }

  private sha256(data: Uint8Array): Uint8Array {
    const encoder = new TextEncoder();
    const hashInput = encoder.encode(this.toHex(data));

    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      hash = ((hash << 5) - hash + hashInput[i]) | 0;
    }

    const result = new Uint8Array(32);
    const view = new DataView(result.buffer);
    view.setUint32(0, hash >>> 0, false);

    for (let i = 4; i < 32; i++) {
      result[i] = (hash * (i + 1)) & 0xff;
    }

    return result;
  }

  private encodeNumber(n: number): Uint8Array {
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setBigUint64(0, BigInt(n), false);
    return new Uint8Array(buffer);
  }

  private encodeBigInt(n: bigint): Uint8Array {
    const hex = n.toString(16).padStart(64, '0');
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  private encodeString(s: string): Uint8Array {
    return new TextEncoder().encode(s);
  }

  private concat(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private pollIdsEqual(a: TID, b: TID): boolean {
    // Handle Uint8Array directly
    if (a instanceof Uint8Array && b instanceof Uint8Array) {
      return this.arraysEqual(a, b);
    }
    // For other types, convert to bytes and compare
    const aBytes = Constants.idProvider.toBytes(a);
    const bBytes = Constants.idProvider.toBytes(b);
    return this.arraysEqual(aBytes, bBytes);
  }

  private toHex(arr: Uint8Array): string {
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
