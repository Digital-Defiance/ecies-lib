/**
 * PBKDF2 configuration interface.
 * Defines parameters for a single PBKDF2 key derivation operation.
 */
export interface IPbkdf2Config {
  /** Size of the derived hash in bytes */
  hashBytes: number;
  /** Size of the salt in bytes */
  saltBytes: number;
  /** Number of PBKDF2 iterations */
  iterations: number;
  /** Hash algorithm to use (e.g., 'SHA-256', 'SHA-512') */
  algorithm: string;
}
