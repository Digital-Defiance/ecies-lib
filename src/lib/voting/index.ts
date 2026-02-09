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
 * - U.S. scale hierarchical aggregation
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
export { PollTallier } from './tallier';
export { VoteEncoder } from './encoder';
export { PollFactory } from './factory';
export { VotingSecurityValidator, VOTING_SECURITY } from './security';
export { ImmutableAuditLog } from './audit';
export { PublicBulletinBoard } from './bulletin-board';
export { PollEventLogger } from './event-logger';
export {
  PrecinctAggregator,
  CountyAggregator,
  StateAggregator,
  NationalAggregator,
} from './hierarchical-aggregator';
export { BatchVoteProcessor } from './persistent-state';

// Re-export enumerations
export * from './enumerations';

// Re-export interfaces
export type * from './interfaces';

// Re-export threshold voting module
export * from './threshold';
