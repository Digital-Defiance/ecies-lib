/**
 * PBKDF2 derivation result interface.
 * Contains the derived key and parameters used.
 */
export interface IPbkdf2Result {
  /** The salt used for derivation */
  salt: Uint8Array;
  /** The derived hash/key */
  hash: Uint8Array;
  /** Number of iterations used */
  iterations: number;
}
