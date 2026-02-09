/**
 * A single key share held by a Guardian.
 *
 * Key shares are generated using Shamir's Secret Sharing and distributed
 * to Guardians. Any k shares can reconstruct decryption capability.
 */
export interface KeyShare {
  /** Share index (1 to n) */
  readonly index: number;
  /** The secret share value */
  readonly share: bigint;
  /** Verification key for this share (used for ZK proof verification) */
  readonly verificationKey: Uint8Array;
}
