/**
 * PBKDF2 (Password-Based Key Derivation Function 2) constants interface.
 * Defines default parameters for password-based key derivation.
 */
export interface IPBkdf2Consts {
  /** Hash algorithm to use (e.g., 'SHA-256', 'SHA-512') */
  ALGORITHM: string;

  /** Number of bytes in a salt */
  SALT_BYTES: number;

  /** Expected number of PBKDF2 iterations per second when hashing a password */
  ITERATIONS_PER_SECOND: number;
}
