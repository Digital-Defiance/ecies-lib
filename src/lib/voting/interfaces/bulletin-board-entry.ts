import type { PlatformID } from '../../../interfaces';

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
