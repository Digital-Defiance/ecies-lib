import type { PlatformID } from '../../../interfaces';

/**
 * Cryptographically signed receipt proving a vote was cast.
 * Can be used to verify participation without revealing vote content.
 */
export interface VoteReceipt<TID extends PlatformID = Uint8Array> {
  /** Unique identifier of the voter */
  voterId: TID;
  /** Unique identifier of the poll */
  pollId: TID;
  /** Unix timestamp when vote was cast */
  timestamp: number;
  /** Cryptographic signature from poll authority */
  signature: Uint8Array;
  /** Random nonce for uniqueness */
  nonce: Uint8Array;
}
