/**
 * Event types for voting system operations.
 */
export enum EventType {
  PollCreated = 'poll_created',
  VoteCast = 'vote_cast',
  PollClosed = 'poll_closed',
  VoteVerified = 'vote_verified',
  TallyComputed = 'tally_computed',
  AuditRequested = 'audit_requested',
}
