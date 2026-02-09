/**
 * Result of verifying a published tally.
 */
export interface VerificationResult {
  /** Whether verification passed */
  readonly valid: boolean;
  /** Specific checks performed */
  readonly checks: {
    readonly proofValid: boolean;
    readonly guardiansAuthorized: boolean;
    readonly tallyMatchesEncrypted: boolean;
    readonly timestampValid: boolean;
  };
  /** Error details if verification failed */
  readonly error?: string;
}
