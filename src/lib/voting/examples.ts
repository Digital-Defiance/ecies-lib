/**
 * Voting System Usage Examples
 * Shows how to use with ecies-lib Member class
 */

import { Member } from '../../member';
import {
  PollFactory,
  VoteEncoder,
  PollTallier,
  VotingMethod as _VotingMethod,
} from './index';

/**
 * Example 1: Simple Plurality Vote
 */
async function examplePlurality() {
  // Create authority (poll creator)
  const authority = await createMemberWithVotingKeys();

  // Create poll
  const poll = PollFactory.createPlurality(
    ['Alice', 'Bob', 'Charlie'],
    authority,
  );

  // Create voters
  const voter1 = await createMemberWithVotingKeys();
  const voter2 = await createMemberWithVotingKeys();
  const voter3 = await createMemberWithVotingKeys();

  // Cast votes
  const encoder = new VoteEncoder(authority.votingPublicKey!);

  poll.vote(voter1, encoder.encodePlurality(0, 3)); // Alice
  poll.vote(voter2, encoder.encodePlurality(0, 3)); // Alice
  poll.vote(voter3, encoder.encodePlurality(1, 3)); // Bob

  // Close and tally
  poll.close();
  const tallier = new PollTallier(
    authority,
    authority.votingPrivateKey!,
    authority.votingPublicKey!,
  );
  const results = tallier.tally(poll);

  console.log('Winner:', results.choices[results.winner!]); // Alice
  console.log('Tallies:', results.tallies); // [2n, 1n, 0n]
}

/**
 * Example 2: Ranked Choice Voting (True IRV)
 */
async function exampleRankedChoice() {
  const authority = await createMemberWithVotingKeys();

  const poll = PollFactory.createRankedChoice(
    ['Alice', 'Bob', 'Charlie', 'Diana'],
    authority,
  );

  const encoder = new VoteEncoder(authority.votingPublicKey!);

  // Voter 1: Alice > Bob > Charlie
  const voter1 = await createMemberWithVotingKeys();
  poll.vote(voter1, encoder.encodeRankedChoice([0, 1, 2], 4));

  // Voter 2: Bob > Alice > Diana
  const voter2 = await createMemberWithVotingKeys();
  poll.vote(voter2, encoder.encodeRankedChoice([1, 0, 3], 4));

  // Voter 3: Charlie > Diana > Bob
  const voter3 = await createMemberWithVotingKeys();
  poll.vote(voter3, encoder.encodeRankedChoice([2, 3, 1], 4));

  // Voter 4: Alice > Charlie
  const voter4 = await createMemberWithVotingKeys();
  poll.vote(voter4, encoder.encodeRankedChoice([0, 2], 4));

  poll.close();
  const tallier = new PollTallier(
    authority,
    authority.votingPrivateKey!,
    authority.votingPublicKey!,
  );
  const results = tallier.tally(poll);

  console.log('Winner:', results.choices[results.winner!]);
  console.log('Rounds:', results.rounds);
  console.log('Eliminated:', results.eliminated);
}

/**
 * Example 3: Weighted Voting (Stakeholder)
 */
async function exampleWeighted() {
  const authority = await createMemberWithVotingKeys();

  const poll = PollFactory.createWeighted(
    ['Proposal A', 'Proposal B'],
    authority,
    1000n, // Max weight
  );

  const encoder = new VoteEncoder(authority.votingPublicKey!);

  // Large stakeholder
  const whale = await createMemberWithVotingKeys();
  poll.vote(whale, encoder.encodeWeighted(0, 500n, 2));

  // Medium stakeholder
  const dolphin = await createMemberWithVotingKeys();
  poll.vote(dolphin, encoder.encodeWeighted(1, 200n, 2));

  // Small stakeholder
  const shrimp = await createMemberWithVotingKeys();
  poll.vote(shrimp, encoder.encodeWeighted(1, 50n, 2));

  poll.close();
  const tallier = new PollTallier(
    authority,
    authority.votingPrivateKey!,
    authority.votingPublicKey!,
  );
  const results = tallier.tally(poll);

  console.log('Results:', results.tallies); // [500n, 250n]
}

/**
 * Example 4: Borda Count
 */
async function exampleBorda() {
  const authority = await createMemberWithVotingKeys();

  const poll = PollFactory.createBorda(
    ['Option A', 'Option B', 'Option C'],
    authority,
  );

  const encoder = new VoteEncoder(authority.votingPublicKey!);

  // Each voter ranks all options
  const voter1 = await createMemberWithVotingKeys();
  poll.vote(voter1, encoder.encodeBorda([0, 1, 2], 3)); // A=3, B=2, C=1

  const voter2 = await createMemberWithVotingKeys();
  poll.vote(voter2, encoder.encodeBorda([1, 0, 2], 3)); // B=3, A=2, C=1

  const voter3 = await createMemberWithVotingKeys();
  poll.vote(voter3, encoder.encodeBorda([0, 2, 1], 3)); // A=3, C=2, B=1

  poll.close();
  const tallier = new PollTallier(
    authority,
    authority.votingPrivateKey!,
    authority.votingPublicKey!,
  );
  const results = tallier.tally(poll);

  console.log('Points:', results.tallies); // [8n, 6n, 4n]
  console.log('Winner:', results.choices[results.winner!]); // Option A
}

/**
 * Example 5: Approval Voting
 */
async function exampleApproval() {
  const authority = await createMemberWithVotingKeys();

  const poll = PollFactory.createApproval(
    ['Red', 'Green', 'Blue', 'Yellow'],
    authority,
  );

  const encoder = new VoteEncoder(authority.votingPublicKey!);

  // Voter 1 approves Red and Blue
  const voter1 = await createMemberWithVotingKeys();
  poll.vote(voter1, encoder.encodeApproval([0, 2], 4));

  // Voter 2 approves Green and Blue
  const voter2 = await createMemberWithVotingKeys();
  poll.vote(voter2, encoder.encodeApproval([1, 2], 4));

  // Voter 3 approves only Blue
  const voter3 = await createMemberWithVotingKeys();
  poll.vote(voter3, encoder.encodeApproval([2], 4));

  poll.close();
  const tallier = new PollTallier(
    authority,
    authority.votingPrivateKey!,
    authority.votingPublicKey!,
  );
  const results = tallier.tally(poll);

  console.log('Approvals:', results.tallies); // [1n, 1n, 3n, 0n]
  console.log('Winner:', results.choices[results.winner!]); // Blue
}

/**
 * Example 6: Receipt Verification
 */
async function exampleReceipts() {
  const authority = await createMemberWithVotingKeys();
  const poll = PollFactory.createPlurality(['Yes', 'No'], authority);

  const voter = await createMemberWithVotingKeys();
  const encoder = new VoteEncoder(authority.votingPublicKey!);

  // Cast vote and get receipt
  const receipt = poll.vote(voter, encoder.encodePlurality(0, 2));

  // Verify receipt
  const isValid = poll.verifyReceipt(voter, receipt);
  console.log('Receipt valid:', isValid); // true

  // Try to verify with wrong voter
  const otherVoter = await createMemberWithVotingKeys();
  const isInvalid = poll.verifyReceipt(otherVoter, receipt);
  console.log('Wrong voter:', isInvalid); // false
}

/**
 * Helper: Create member with voting keys derived from ECDH
 */
async function createMemberWithVotingKeys(): Promise<Member> {
  // This would use ecies-lib's Member.newMember() and deriveVotingKeys()
  // Placeholder for example purposes
  throw new Error(
    'Use ecies-lib Member.newMember() and member.deriveVotingKeys()',
  );
}

// Export examples
export {
  examplePlurality,
  exampleRankedChoice,
  exampleWeighted,
  exampleBorda,
  exampleApproval,
  exampleReceipts,
};
