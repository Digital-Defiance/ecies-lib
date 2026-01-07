/**
 * Configuration for supermajority voting.
 * Defines the required threshold as a fraction (e.g., 2/3, 3/4).
 */
export interface SupermajorityConfig {
  /** Numerator of the fraction (e.g., 2 for 2/3) */
  numerator: number;
  /** Denominator of the fraction (e.g., 3 for 2/3) */
  denominator: number;
}
