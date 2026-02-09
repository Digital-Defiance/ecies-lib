import type { PlatformID } from '../../../../interfaces/platform-id';
import type { CombinedZKProof } from './combined-zk-proof';

/**
 * A published interval tally with cryptographic proof.
 *
 * Published to the public tally feed for real-time election results.
 */
export interface IntervalTally<TID extends PlatformID = Uint8Array> {
  /** Associated poll ID */
  readonly pollId: TID;
  /** Interval number (0 = initial, -1 = final) */
  readonly intervalNumber: number;
  /** Decrypted tallies per choice */
  readonly tallies: readonly bigint[];
  /** Choice names */
  readonly choices: readonly string[];
  /** Total votes in this interval */
  readonly voteCount: number;
  /** Cumulative vote count */
  readonly cumulativeVoteCount: number;
  /** Combined ZK proof */
  readonly proof: CombinedZKProof;
  /** Participating Guardian indices */
  readonly participatingGuardians: readonly number[];
  /** Timestamp of decryption */
  readonly timestamp: number;
  /** Whether this is the final tally */
  readonly isFinal: boolean;
}
