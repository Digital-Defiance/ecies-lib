/**
 * Constants for voting operations using Paillier homomorphic encryption.
 * These values are critical for cryptographic operations and should be consistent
 * across all implementations (ecies-lib, node-ecies-lib, BrightChain).
 */
export interface IVotingConsts {
  /**
   * Info string used in HKDF for prime generation.
   * This provides domain separation in the key derivation process.
   */
  readonly PRIME_GEN_INFO: 'PaillierPrimeGen';

  /**
   * Number of iterations for Miller-Rabin primality test.
   * With 256 rounds, probability of false positive is < 2^-512.
   */
  readonly PRIME_TEST_ITERATIONS: 256;

  /**
   * Bit length for Paillier key pair generation.
   * 3072 bits provides ~128-bit security level (NIST recommended).
   */
  readonly KEYPAIR_BIT_LENGTH: 3072;

  /**
   * Offset of the public key in the key pair buffer.
   * Used for buffer serialization calculations.
   */
  readonly PUB_KEY_OFFSET: 768;

  /**
   * HKDF output length in bytes.
   * SHA-512 produces 64 bytes.
   */
  readonly HKDF_LENGTH: 64;

  /**
   * HMAC algorithm for HKDF key derivation.
   */
  readonly HMAC_ALGORITHM: 'sha512';

  /**
   * Hash algorithm for key ID generation and HMAC tagging.
   */
  readonly HASH_ALGORITHM: 'sha256';

  /**
   * Radix for bit string representation (binary).
   */
  readonly BITS_RADIX: 2;

  /**
   * Radix for key serialization (hexadecimal).
   */
  readonly KEY_RADIX: 16;

  /**
   * Format for key serialization.
   */
  readonly KEY_FORMAT: 'hex';

  /**
   * Format for digest output.
   */
  readonly DIGEST_FORMAT: 'hex';

  /**
   * Current version of the voting key format.
   * Increment when serialization format changes.
   */
  readonly KEY_VERSION: 1;

  /**
   * Magic identifier for voting keys.
   * Used to identify key type in serialized format.
   */
  readonly KEY_MAGIC: 'BCVK'; // BrightChain Voting Key

  /**
   * Maximum attempts to generate a prime number using DRBG.
   * Prevents infinite loops in prime generation.
   */
  readonly DRBG_PRIME_ATTEMPTS: 20000;

  /**
   * Length of key ID in bytes.
   * SHA-256 produces 32 bytes.
   */
  readonly KEY_ID_LENGTH: 32;

  /**
   * Length of instance ID in bytes.
   * SHA-256 produces 32 bytes.
   */
  readonly INSTANCE_ID_LENGTH: 32;
}
