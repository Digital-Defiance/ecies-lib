/**
 * Voting methods supported by the poll system.
 *
 * Methods are classified by security level:
 * - Fully Homomorphic: Single-round, privacy-preserving (no intermediate decryption)
 * - Multi-Round: Requires decryption between rounds (less secure)
 * - Insecure: Cannot be made secure with Paillier encryption
 */
export enum VotingMethod {
  // ✅ Fully homomorphic (single-round, privacy-preserving)
  /** First-past-the-post voting - most votes wins */
  Plurality = 'plurality',
  /** Approval voting - vote for multiple candidates */
  Approval = 'approval',
  /** Weighted voting - stakeholder voting with configurable weights */
  Weighted = 'weighted',
  /** Borda count - ranked voting with point allocation */
  Borda = 'borda',
  /** Score voting - rate candidates 0-10 */
  Score = 'score',
  /** Yes/No referendum */
  YesNo = 'yes-no',
  /** Yes/No/Abstain referendum with abstention option */
  YesNoAbstain = 'yes-no-abstain',
  /** Supermajority - requires 2/3 or 3/4 threshold */
  Supermajority = 'supermajority',

  // ⚠️ Multi-round (requires decryption between rounds)
  /** Ranked choice voting (IRV) - instant runoff with elimination */
  RankedChoice = 'ranked-choice',
  /** Two-round voting - top 2 runoff election */
  TwoRound = 'two-round',
  /** STAR voting - Score Then Automatic Runoff */
  STAR = 'star',
  /** Single Transferable Vote - proportional representation */
  STV = 'stv',

  // ❌ Insecure (requires non-additive operations or reveals individual votes)
  /** Quadratic voting - requires sqrt operation (not homomorphic) */
  Quadratic = 'quadratic',
  /** Consensus voting - requires 95%+ agreement (no privacy) */
  Consensus = 'consensus',
  /** Consent-based voting - sociocracy style (no privacy) */
  ConsentBased = 'consent-based',
}
