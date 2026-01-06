/**
 * Voting System Usage Examples
 * Shows how to use with ecies-lib Member class
 */

import { getRuntimeConfiguration } from '../../constants';
import { EmailString } from '../../email-string';
import { MemberType } from '../../enumerations';
import { IMember, IMemberWithMnemonic, PlatformID } from '../../interfaces';
import { Member } from '../../member';
import { ECIESService } from '../../services';
import { GuidV4 } from '../guid';
import {
  PollFactory,
  VoteEncoder,
  PollTallier,
  VotingMethod as _VotingMethod,
} from './index';

/**
 * Example 1: Simple Plurality Vote
 */
async function examplePlurality<TID extends PlatformID>() {
  // Create authority (poll creator)
  const authority = createMemberWithVotingKeys<TID>();

  // Create poll
  const poll = PollFactory.createPlurality<TID>(
    ['Alice', 'Bob', 'Charlie'],
    authority.member,
  );

  // Create voters
  const voter1 = createMemberWithVotingKeys<TID>();
  const voter2 = createMemberWithVotingKeys<TID>();
  const voter3 = createMemberWithVotingKeys<TID>();

  // Cast votes
  const encoder = new VoteEncoder<TID>(authority.member.votingPublicKey!);

  poll.vote(voter1.member, encoder.encodePlurality(0, 3)); // Alice
  poll.vote(voter2.member, encoder.encodePlurality(0, 3)); // Alice
  poll.vote(voter3.member, encoder.encodePlurality(1, 3)); // Bob

  // Close and tally
  poll.close();
  const tallier = new PollTallier(
    authority.member,
    authority.member.votingPrivateKey!,
    authority.member.votingPublicKey!,
  );
  const results = tallier.tally(poll);

  console.log('Winner:', results.choices[results.winner!]); // Alice
  console.log('Tallies:', results.tallies); // [2n, 1n, 0n]
}

/**
 * Example 2: Ranked Choice Voting (True IRV)
 */
async function exampleRankedChoice<TID extends PlatformID>() {
  const authority = createMemberWithVotingKeys<TID>();

  const poll = PollFactory.createRankedChoice<TID>(
    ['Alice', 'Bob', 'Charlie', 'Diana'],
    authority.member,
  );

  const encoder = new VoteEncoder<TID>(authority.member.votingPublicKey!);

  // Voter 1: Alice > Bob > Charlie
  const voter1 = await createMemberWithVotingKeys<TID>();
  poll.vote(voter1.member, encoder.encodeRankedChoice([0, 1, 2], 4));

  // Voter 2: Bob > Alice > Diana
  const voter2 = await createMemberWithVotingKeys<TID>();
  poll.vote(voter2.member, encoder.encodeRankedChoice([1, 0, 3], 4));

  // Voter 3: Charlie > Diana > Bob
  const voter3 = await createMemberWithVotingKeys<TID>();
  poll.vote(voter3.member, encoder.encodeRankedChoice([2, 3, 1], 4));

  // Voter 4: Alice > Charlie
  const voter4 = await createMemberWithVotingKeys<TID>();
  poll.vote(voter4.member, encoder.encodeRankedChoice([0, 2], 4));

  poll.close();
  const tallier = new PollTallier(
    authority.member,
    authority.member.votingPrivateKey!,
    authority.member.votingPublicKey!,
  );
  const results = tallier.tally(poll);

  console.log('Winner:', results.choices[results.winner!]);
  console.log('Rounds:', results.rounds);
  console.log('Eliminated:', results.eliminated);
}

/**
 * Example 3: Weighted Voting (Stakeholder)
 */
async function exampleWeighted<TID extends PlatformID = Uint8Array>() {
  const authority = await createMemberWithVotingKeys<TID>();

  const poll = PollFactory.createWeighted<TID>(
    ['Proposal A', 'Proposal B'],
    authority.member,
    1000n, // Max weight
  );

  const encoder = new VoteEncoder<TID>(authority.member.votingPublicKey!);

  // Large stakeholder
  const whale = await createMemberWithVotingKeys<TID>();
  poll.vote(whale.member, encoder.encodeWeighted(0, 500n, 2));

  // Medium stakeholder
  const dolphin = await createMemberWithVotingKeys<TID>();
  poll.vote(dolphin.member, encoder.encodeWeighted(1, 200n, 2));

  // Small stakeholder
  const shrimp = await createMemberWithVotingKeys<TID>();
  poll.vote(shrimp.member, encoder.encodeWeighted(1, 50n, 2));

  poll.close();
  const tallier = new PollTallier<TID>(
    authority.member,
    authority.member.votingPrivateKey!,
    authority.member.votingPublicKey!,
  );
  const results = tallier.tally(poll);

  console.log('Results:', results.tallies); // [500n, 250n]
}

/**
 * Example 4: Borda Count
 */
async function exampleBorda<TID extends PlatformID = Uint8Array>() {
  const authority = await createMemberWithVotingKeys<TID>();

  const poll = PollFactory.createBorda<TID>(
    ['Option A', 'Option B', 'Option C'],
    authority.member,
  );

  const encoder = new VoteEncoder<TID>(authority.member.votingPublicKey!);

  // Each voter ranks all options
  const voter1 = await createMemberWithVotingKeys<TID>();
  poll.vote(voter1.member, encoder.encodeBorda([0, 1, 2], 3)); // A=3, B=2, C=1

  const voter2 = await createMemberWithVotingKeys<TID>();
  poll.vote(voter2.member, encoder.encodeBorda([1, 0, 2], 3)); // B=3, A=2, C=1

  const voter3 = await createMemberWithVotingKeys<TID>();
  poll.vote(voter3.member, encoder.encodeBorda([0, 2, 1], 3)); // A=3, C=2, B=1

  poll.close();
  const tallier = new PollTallier<TID>(
    authority.member,
    authority.member.votingPrivateKey!,
    authority.member.votingPublicKey!,
  );
  const results = tallier.tally(poll);

  console.log('Points:', results.tallies); // [8n, 6n, 4n]
  console.log('Winner:', results.choices[results.winner!]); // Option A
}

/**
 * Example 5: Approval Voting
 */
async function exampleApproval<TID extends PlatformID = Uint8Array>() {
  const authority = await createMemberWithVotingKeys<TID>();

  const poll = PollFactory.createApproval<TID>(
    ['Red', 'Green', 'Blue', 'Yellow'],
    authority.member,
  );

  const encoder = new VoteEncoder<TID>(authority.member.votingPublicKey!);

  // Voter 1 approves Red and Blue
  const voter1 = await createMemberWithVotingKeys<TID>();
  poll.vote(voter1.member, encoder.encodeApproval([0, 2], 4));

  // Voter 2 approves Green and Blue
  const voter2 = await createMemberWithVotingKeys<TID>();
  poll.vote(voter2.member, encoder.encodeApproval([1, 2], 4));

  // Voter 3 approves only Blue
  const voter3 = await createMemberWithVotingKeys<TID>();
  poll.vote(voter3.member, encoder.encodeApproval([2], 4));

  poll.close();
  const tallier = new PollTallier<TID>(
    authority.member,
    authority.member.votingPrivateKey!,
    authority.member.votingPublicKey!,
  );
  const results = tallier.tally(poll);

  console.log('Approvals:', results.tallies); // [1n, 1n, 3n, 0n]
  console.log('Winner:', results.choices[results.winner!]); // Blue
}

/**
 * Example 6: Receipt Verification
 */
async function exampleReceipts<TID extends PlatformID>() {
  const authority = await createMemberWithVotingKeys<TID>();
  const poll = PollFactory.createPlurality<TID>(['Yes', 'No'], authority.member);

  const voter = await createMemberWithVotingKeys<TID>();
  const encoder = new VoteEncoder<TID>(authority.member.votingPublicKey!);

  // Cast vote and get receipt
  const receipt = poll.vote(voter.member, encoder.encodePlurality(0, 2));

  // Verify receipt
  const isValid = poll.verifyReceipt(voter.member, receipt);
  console.log('Receipt valid:', isValid); // true

  // Try to verify with wrong voter
  const otherVoter = await createMemberWithVotingKeys<TID>();
  const isInvalid = poll.verifyReceipt(otherVoter.member, receipt);
  console.log('Wrong voter:', isInvalid); // false
}

/**
 * Helper: Create member with voting keys derived from ECDH
 */
function createMemberWithVotingKeys<TID extends PlatformID>(name: string = 'Voter', email: string = 'voter@example.com', memberType: MemberType = MemberType.Anonymous): { member: Member<TID> } {
  // This would use ecies-lib's Member.newMember() and deriveVotingKeys()
  // Placeholder for example purposes
  const eciesService = new ECIESService(getRuntimeConfiguration());
  const memberWithMnemonic = Member.newMember(eciesService, memberType, name, new EmailString(email));
  return { member: memberWithMnemonic.member as Member<TID> };
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
