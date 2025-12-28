/**
 * Secure Voting System
 *
 * Browser-compatible voting system built on ecies-lib with:
 * - True Ranked Choice Voting (IRV)
 * - Weighted voting
 * - Borda count
 * - Approval voting
 * - Plurality voting
 * - Proper role separation (Poll vs Tallier)
 * - Homomorphic encryption for privacy
 *
 * @example
 * ```typescript
 * import { PollFactory, VoteEncoder, PollTallier } from './voting';
 *
 * // Authority creates poll
 * const poll = PollFactory.createRankedChoice(
 *   ['Alice', 'Bob', 'Charlie'],
 *   authority
 * );
 *
 * // Voters cast votes
 * const encoder = new VoteEncoder(authority.votingPublicKey);
 * const vote = encoder.encodeRankedChoice([1, 0, 2], 3);
 * const receipt = poll.vote(voter, vote);
 *
 * // Close and tally
 * poll.close();
 * const tallier = new PollTallier(authority, privateKey, publicKey);
 * const results = tallier.tally(poll);
 * ```
 */

export { Poll } from './poll-core';
export { VotingPoll } from './poll';
export { PollTallier } from './tallier';
export { VoteEncoder } from './encoder';
export { PollFactory } from './factory';
export { VotingSecurityValidator, VOTING_SECURITY } from './security';
export {
  ImmutableAuditLog,
  AuditEventType,
  type AuditEntry,
  type AuditLog,
} from './audit';
export {
  PublicBulletinBoard,
  type BulletinBoard,
  type BulletinBoardEntry,
  type TallyProof,
} from './bulletin-board';
export {
  PollEventLogger,
  EventType,
  type EventLogger,
  type EventLogEntry,
  type PollConfiguration,
} from './event-logger';
export {
  VotingMethod,
  type VoteReceipt,
  type PollResults,
  type RoundResult,
  type EncryptedVote,
  // IMember is already exported from main index via ./interfaces
  type SupermajorityConfig,
} from './types';
