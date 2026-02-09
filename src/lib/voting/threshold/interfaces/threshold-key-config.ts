/**
 * Configuration for threshold key generation.
 */
export interface ThresholdKeyConfig {
  /** Total number of key shares (n) */
  readonly totalShares: number;
  /** Minimum shares required for decryption (k) */
  readonly threshold: number;
  /** Paillier key bit length (default: 2048) */
  readonly keyBitLength?: number;
}
