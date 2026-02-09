/**
 * Threshold Key Generator
 *
 * Generates threshold Paillier keys using Shamir's Secret Sharing.
 * Based on Damgård et al.'s "Generalization of Paillier's Public-Key System
 * with Applications to Electronic Voting."
 *
 * The threshold scheme allows k-of-n Guardians to cooperate for decryption,
 * while fewer than k Guardians cannot decrypt any information.
 */
import type { PublicKey } from 'paillier-bigint';
import type {
  IThresholdKeyGenerator,
  KeyShare,
  ThresholdKeyConfig,
  ThresholdKeyPair,
} from './interfaces';

/**
 * Error thrown when threshold configuration is invalid.
 */
export class InvalidThresholdConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidThresholdConfigError';
  }
}

/**
 * Error thrown when key generation fails.
 */
export class KeyGenerationFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeyGenerationFailedError';
  }
}

/**
 * Default key bit length for Paillier keys.
 */
const DEFAULT_KEY_BIT_LENGTH = 2048;

/**
 * Generates threshold Paillier keys with n shares and threshold k.
 *
 * Uses Shamir's Secret Sharing to split the private key into n shares,
 * where any k shares can reconstruct decryption capability.
 *
 * @example
 * ```typescript
 * const generator = new ThresholdKeyGenerator();
 * const keyPair = await generator.generate({
 *   totalShares: 9,
 *   threshold: 5,
 *   keyBitLength: 2048
 * });
 *
 * // Distribute keyPair.keyShares to Guardians
 * // Use keyPair.publicKey for encryption
 * ```
 */
export class ThresholdKeyGenerator implements IThresholdKeyGenerator {
  /**
   * Validate a threshold configuration.
   *
   * @param config - The threshold configuration to validate
   * @throws InvalidThresholdConfigError if configuration is invalid
   */
  validateConfig(config: ThresholdKeyConfig): void {
    const { totalShares: n, threshold: k } = config;

    if (!Number.isInteger(n) || n < 2) {
      throw new InvalidThresholdConfigError(
        `Total shares (n) must be an integer >= 2, got ${n}`,
      );
    }

    if (!Number.isInteger(k) || k < 2) {
      throw new InvalidThresholdConfigError(
        `Threshold (k) must be an integer >= 2, got ${k}`,
      );
    }

    if (k > n) {
      throw new InvalidThresholdConfigError(
        `Threshold (k=${k}) cannot exceed total shares (n=${n})`,
      );
    }

    if (config.keyBitLength !== undefined) {
      if (!Number.isInteger(config.keyBitLength) || config.keyBitLength < 512) {
        throw new InvalidThresholdConfigError(
          `Key bit length must be an integer >= 512, got ${config.keyBitLength}`,
        );
      }
    }
  }

  /**
   * Generate a new threshold key pair.
   *
   * @param config - The threshold configuration
   * @returns A promise that resolves to the threshold key pair
   * @throws InvalidThresholdConfigError if configuration is invalid
   * @throws KeyGenerationFailedError if key generation fails
   */
  async generate(config: ThresholdKeyConfig): Promise<ThresholdKeyPair> {
    this.validateConfig(config);

    const { totalShares: n, threshold: k } = config;
    const keyBitLength = config.keyBitLength ?? DEFAULT_KEY_BIT_LENGTH;

    try {
      // Dynamically import paillier-bigint to support both browser and Node.js
      const paillier = await import('paillier-bigint');

      // Generate the base Paillier key pair
      const baseKeyPair = await paillier.generateRandomKeys(keyBitLength);
      const publicKey: PublicKey = baseKeyPair.publicKey;

      // Get the private key components
      // In Paillier, the private key contains lambda and mu
      // For threshold, we need to split lambda using Shamir's Secret Sharing
      const lambda = baseKeyPair.privateKey.lambda;
      const n2 = publicKey.n * publicKey.n;

      // The Shamir modulus must be a multiple of the group order of Z*_{n²}.
      // The order of Z*_{n²} divides n·λ, so we split modulo n·λ.
      // This ensures that Lagrange reconstruction in the exponent is correct:
      // Σ λ_i'·s_i ≡ Δ·λ (mod n·λ) implies c^(Σ ...) ≡ c^(Δ·λ) (mod n²).
      const shamirModulus = publicKey.n * lambda;

      // Generate key shares using Shamir's Secret Sharing
      const { shares, coefficients } = this.shamirSplit(
        lambda,
        k,
        n,
        shamirModulus,
      );

      // Generate verification keys for each share
      // The verification key allows ZK proof verification without revealing the share
      const verificationKeys = await this.generateVerificationKeys(
        shares,
        publicKey,
        coefficients[0],
      );

      // Create KeyShare objects
      const keyShares: KeyShare[] = shares.map((share, i) => ({
        index: i + 1, // 1-indexed
        share: share,
        verificationKey: verificationKeys[i],
      }));

      // Compute the threshold decryption constant theta.
      // θ = L(g^(4·Δ·λ) mod n²) mod n, where Δ = n! (totalShares factorial).
      // The combiner uses θ⁻¹ to convert combined partial decryptions
      // into the final plaintext. This value is public and safe to share.
      const delta = this.factorial(BigInt(n));
      const g = publicKey.g;
      const thetaBase = this.modPow(g, 4n * delta * lambda, n2);
      const theta = this.mod((thetaBase - 1n) / publicKey.n, publicKey.n);

      return {
        publicKey,
        verificationKeys,
        keyShares,
        config: {
          totalShares: n,
          threshold: k,
          keyBitLength,
        },
        theta,
      };
    } catch (error) {
      if (
        error instanceof InvalidThresholdConfigError ||
        error instanceof KeyGenerationFailedError
      ) {
        throw error;
      }
      throw new KeyGenerationFailedError(
        `Failed to generate threshold keys: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Split a secret using Shamir's Secret Sharing.
   *
   * Creates a random polynomial of degree k-1 where the constant term is the secret.
   * Evaluates the polynomial at points 1, 2, ..., n to generate n shares.
   *
   * @param secret - The secret to split
   * @param k - The threshold (minimum shares needed to reconstruct)
   * @param n - The total number of shares
   * @param modulus - The modulus for arithmetic operations
   * @returns The shares and polynomial coefficients
   */
  private shamirSplit(
    secret: bigint,
    k: number,
    n: number,
    modulus: bigint,
  ): { shares: bigint[]; coefficients: bigint[] } {
    // Generate random coefficients for polynomial of degree k-1
    // f(x) = secret + a1*x + a2*x^2 + ... + a(k-1)*x^(k-1)
    const coefficients: bigint[] = [secret];

    for (let i = 1; i < k; i++) {
      coefficients.push(this.randomBigInt(modulus));
    }

    // Evaluate polynomial at points 1, 2, ..., n
    const shares: bigint[] = [];
    for (let i = 1; i <= n; i++) {
      const x = BigInt(i);
      let y = 0n;
      let xPower = 1n;

      for (const coeff of coefficients) {
        y = this.mod(y + this.mod(coeff * xPower, modulus), modulus);
        xPower = this.mod(xPower * x, modulus);
      }

      shares.push(y);
    }

    return { shares, coefficients };
  }

  /**
   * Generate verification keys for each share.
   *
   * The verification key is used to verify ZK proofs of correct partial decryption.
   * It's computed as g^share mod n^2 where g is the Paillier generator.
   *
   * @param shares - The key shares
   * @param publicKey - The Paillier public key
   * @param _secret - The original secret (for verification)
   * @returns Array of verification keys as Uint8Array
   */
  private async generateVerificationKeys(
    shares: bigint[],
    publicKey: PublicKey,
    _secret: bigint,
  ): Promise<Uint8Array[]> {
    const n2 = publicKey.n * publicKey.n;
    const g = publicKey.g;

    const verificationKeys: Uint8Array[] = [];

    for (const share of shares) {
      // Verification key: v_i = g^(share_i) mod n^2
      const vk = this.modPow(g, share, n2);
      verificationKeys.push(this.bigintToUint8Array(vk));
    }

    return verificationKeys;
  }

  /**
   * Generate a cryptographically secure random bigint less than max.
   *
   * @param max - The upper bound (exclusive)
   * @returns A random bigint in [0, max)
   */
  private randomBigInt(max: bigint): bigint {
    const byteLength = Math.ceil(max.toString(2).length / 8) + 8;
    const randomBytes = new Uint8Array(byteLength);
    crypto.getRandomValues(randomBytes);

    let result = 0n;
    for (const byte of randomBytes) {
      result = (result << 8n) | BigInt(byte);
    }

    return this.mod(result, max);
  }

  /**
   * Compute a mod m, handling negative numbers correctly.
   *
   * @param a - The dividend
   * @param m - The modulus
   * @returns a mod m (always non-negative)
   */
  private mod(a: bigint, m: bigint): bigint {
    const result = a % m;
    return result >= 0n ? result : result + m;
  }

  /**
   * Compute base^exp mod m using square-and-multiply.
   *
   * @param base - The base
   * @param exp - The exponent
   * @param m - The modulus
   * @returns base^exp mod m
   */
  private modPow(base: bigint, exp: bigint, m: bigint): bigint {
    if (m === 1n) return 0n;

    let result = 1n;
    base = this.mod(base, m);

    while (exp > 0n) {
      if (exp % 2n === 1n) {
        result = this.mod(result * base, m);
      }
      exp = exp >> 1n;
      base = this.mod(base * base, m);
    }

    return result;
  }

  /**
   * Convert a bigint to Uint8Array.
   *
   * @param value - The bigint to convert
   * @returns The Uint8Array representation
   */
  private bigintToUint8Array(value: bigint): Uint8Array {
    if (value === 0n) {
      return new Uint8Array([0]);
    }

    const hex = value.toString(16);
    const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;
    const bytes = new Uint8Array(paddedHex.length / 2);

    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(paddedHex.slice(i * 2, i * 2 + 2), 16);
    }

    return bytes;
  }

  /**
   * Compute n! (factorial).
   *
   * @param n - The number to compute factorial of
   * @returns n!
   */
  private factorial(n: bigint): bigint {
    let result = 1n;
    for (let i = 2n; i <= n; i++) {
      result *= i;
    }
    return result;
  }
}
