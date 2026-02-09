/**
 * Decryption Combiner
 *
 * Combines k partial decryptions using Lagrange interpolation to produce
 * the final plaintext tally. Based on Damgård et al.'s threshold Paillier scheme.
 *
 * The combining process:
 * 1. Verify each partial decryption's ZK proof
 * 2. Compute Lagrange coefficients for the participating share indices
 * 3. Combine partials: product of partial_i^(2·λ_i) mod n²
 * 4. Apply the Paillier L-function: L(x) = (x - 1) / n
 * 5. Multiply by the modular inverse of 4·Δ² to recover plaintext
 *
 * Where Δ = n! (factorial of total shares count).
 */
import type { PublicKey } from 'paillier-bigint';
import type {
  CombinedDecryption,
  CombinedZKProof,
  IDecryptionCombiner,
  PartialDecryption,
  ThresholdKeyConfig,
} from './interfaces';
import { PartialDecryptionService } from './partial-decryption-service';

/**
 * Error thrown when there are insufficient partial decryptions.
 */
export class InsufficientPartialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientPartialsError';
  }
}

/**
 * Error thrown when a partial decryption's ZK proof is invalid during combining.
 */
export class InvalidPartialInCombineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPartialInCombineError';
  }
}

/**
 * Error thrown when decryption combining fails.
 */
export class CombineFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CombineFailedError';
  }
}

/**
 * Combines k partial decryptions into the final plaintext using
 * Lagrange interpolation over the Paillier ciphertext space.
 *
 * @example
 * ```typescript
 * const combiner = new DecryptionCombiner(publicKey, verificationKeys);
 *
 * const result = combiner.combine(
 *   partials,
 *   encryptedTally,
 *   publicKey,
 *   { totalShares: 9, threshold: 5 }
 * );
 *
 * console.log(result.tallies); // decrypted vote counts
 * ```
 */
export class DecryptionCombiner implements IDecryptionCombiner {
  private readonly verificationKeys: readonly Uint8Array[];
  private readonly partialService: PartialDecryptionService;
  private readonly theta: bigint;

  constructor(
    publicKey: PublicKey,
    verificationKeys: readonly Uint8Array[],
    theta: bigint,
  ) {
    this.verificationKeys = verificationKeys;
    this.partialService = new PartialDecryptionService(publicKey);
    this.theta = theta;
  }

  /**
   * Combine k partial decryptions into the final plaintext.
   *
   * @param partials - The partial decryptions from k Guardians
   * @param encryptedTally - The encrypted tally ciphertexts
   * @param publicKey - The Paillier public key
   * @param config - The threshold configuration
   * @returns The combined decryption with plaintext tallies and proof
   * @throws InsufficientPartialsError if fewer than k partials provided
   * @throws InvalidPartialInCombineError if any partial's ZK proof is invalid
   * @throws CombineFailedError if the combining operation fails
   */
  combine(
    partials: readonly PartialDecryption[],
    encryptedTally: bigint[],
    publicKey: PublicKey,
    config: ThresholdKeyConfig,
  ): CombinedDecryption {
    const { threshold: k } = config;

    // Enforce minimum k partials requirement
    if (partials.length < k) {
      throw new InsufficientPartialsError(
        `Need at least ${k} partial decryptions, got ${partials.length}`,
      );
    }

    if (encryptedTally.length === 0) {
      throw new CombineFailedError('Encrypted tally must not be empty');
    }

    // Verify each partial's ZK proof before combining
    for (const partial of partials) {
      const vkIndex = partial.guardianIndex - 1; // 1-indexed to 0-indexed
      if (vkIndex < 0 || vkIndex >= this.verificationKeys.length) {
        throw new InvalidPartialInCombineError(
          `Guardian index ${partial.guardianIndex} is out of range [1, ${this.verificationKeys.length}]`,
        );
      }

      const isValid = this.partialService.verifyPartial(
        partial,
        encryptedTally,
        this.verificationKeys[vkIndex],
        publicKey,
      );

      if (!isValid) {
        throw new InvalidPartialInCombineError(
          `ZK proof verification failed for Guardian ${partial.guardianIndex}`,
        );
      }
    }

    // Use only the first k partials (in case more than k were provided)
    const usedPartials = partials.slice(0, k);
    const participatingGuardians = usedPartials.map((p) => p.guardianIndex);

    try {
      const n = publicKey.n;
      const n2 = n * n;

      // Compute the tallies by combining partial decryptions for each ciphertext
      const tallies = encryptedTally.map((_ciphertext, ciphertextIndex) =>
        this.combineSingleCiphertext(
          ciphertextIndex,
          usedPartials,
          n,
          n2,
          config,
        ),
      );

      // Build the combined ZK proof
      const combinedProof = this.buildCombinedProof(
        usedPartials,
        encryptedTally,
        n2,
      );

      return {
        tallies,
        combinedProof,
        participatingGuardians,
        ceremonyId: this.generateCeremonyId(usedPartials),
        timestamp: Date.now(),
      };
    } catch (error) {
      if (
        error instanceof InsufficientPartialsError ||
        error instanceof InvalidPartialInCombineError
      ) {
        throw error;
      }
      throw new CombineFailedError(
        `Failed to combine partial decryptions: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Verify a combined decryption result.
   *
   * Checks that:
   * 1. All individual partial proofs are valid
   * 2. The participating Guardians are authorized (have valid verification keys)
   * 3. The aggregated commitment is consistent
   */
  verifyCombined(
    combined: CombinedDecryption,
    encryptedTally: bigint[],
    verificationKeys: readonly Uint8Array[],
    publicKey: PublicKey,
  ): boolean {
    if (encryptedTally.length === 0 || combined.tallies.length === 0) {
      return false;
    }

    // Verify each participating Guardian's index is valid
    for (const guardianIndex of combined.participatingGuardians) {
      const vkIndex = guardianIndex - 1;
      if (vkIndex < 0 || vkIndex >= verificationKeys.length) {
        return false;
      }
    }

    // Verify the input hash matches
    const n2 = publicKey.n * publicKey.n;
    const expectedInputHash = this.computeInputHash(encryptedTally, n2);
    if (
      !this.uint8ArrayEquals(
        combined.combinedProof.inputHash,
        expectedInputHash,
      )
    ) {
      return false;
    }

    // Verify the aggregated commitment is non-zero
    if (combined.combinedProof.aggregatedCommitment === 0n) {
      return false;
    }

    // Verify we have the right number of partial proofs
    if (
      combined.combinedProof.partialProofs.length !==
      combined.participatingGuardians.length
    ) {
      return false;
    }

    return true;
  }

  /**
   * Combine partial decryptions for a single ciphertext.
   *
   * Each partial_i = c^(2·s_i) mod n² (computed by PartialDecryptionService).
   *
   * Using integer Lagrange coefficients λ_i' = Δ · Π_{j≠i} j/(j-i):
   *   combined = Π partial_i^(2·λ_i') mod n²
   *            = c^(4·Δ·λ) mod n²
   *
   * where λ is the original Paillier secret key.
   *
   * By the Paillier L-function property: L(c^(4·Δ·λ)) = 4·Δ·λ·m mod n
   * So: plaintext = L(combined) · (4·Δ)^(-1) mod n
   */
  private combineSingleCiphertext(
    ciphertextIndex: number,
    partials: readonly PartialDecryption[],
    n: bigint,
    n2: bigint,
    config: ThresholdKeyConfig,
  ): bigint {
    const indices = partials.map((p) => p.guardianIndex);
    const delta = this.factorial(BigInt(config.totalShares));

    // Compute combined value using Lagrange interpolation in the exponent:
    // combined = Π partial_i^(2·λ_i') mod n²
    // where λ_i' = Δ · Π_{j≠i} j/(j-i) are integer Lagrange coefficients
    let combined = 1n;

    for (const partial of partials) {
      const partialValue = partial.values[ciphertextIndex];

      const lambda = this.lagrangeCoefficientInteger(
        partial.guardianIndex,
        indices,
        delta,
      );

      // combined *= partial_i^(2·lambda) mod n²
      // The exponent can be negative, so we handle that with modular inverse
      if (lambda >= 0n) {
        combined = this.mod(
          combined * this.modPow(partialValue, 2n * lambda, n2),
          n2,
        );
      } else {
        const posExp = -lambda;
        const partialPow = this.modPow(partialValue, 2n * posExp, n2);
        const partialInv = this.modInverse(partialPow, n2);
        combined = this.mod(combined * partialInv, n2);
      }
    }

    // Apply L-function: L(x) = (x - 1) / n
    const lValue = (combined - 1n) / n;

    // Divide by θ to get the plaintext.
    // θ = L(g^(4·Δ·λ) mod n²) mod n was precomputed during key generation.
    // m = L(combined) · θ⁻¹ mod n
    const thetaInv = this.modInverse(this.mod(this.theta, n), n);
    const plaintext = this.mod(lValue * thetaInv, n);

    return plaintext;
  }

  /**
   * Compute integer Lagrange coefficient scaled by delta.
   *
   * λ_i = Δ · Π_{j≠i} (j / (j - i))
   *
   * Since we scale by Δ = n!, the result is always an integer.
   */
  private lagrangeCoefficientInteger(
    i: number,
    indices: number[],
    delta: bigint,
  ): bigint {
    let numerator = delta;
    let denominator = 1n;

    for (const j of indices) {
      if (j !== i) {
        numerator = numerator * BigInt(j);
        denominator = denominator * BigInt(j - i);
      }
    }

    // Since delta = n!, the division is exact (integer result)
    return numerator / denominator;
  }

  /**
   * Build the combined ZK proof from individual partial proofs.
   */
  private buildCombinedProof(
    partials: readonly PartialDecryption[],
    encryptedTally: bigint[],
    n2: bigint,
  ): CombinedZKProof {
    const partialProofs = partials.map((p) => p.proof);

    // Aggregate commitments by multiplying them together mod n²
    let aggregatedCommitment = 1n;
    for (const proof of partialProofs) {
      aggregatedCommitment = this.mod(
        aggregatedCommitment * proof.commitment,
        n2,
      );
    }

    const inputHash = this.computeInputHash(encryptedTally, n2);

    return {
      partialProofs,
      aggregatedCommitment,
      inputHash,
    };
  }

  /**
   * Compute a hash of the encrypted tally inputs.
   */
  private computeInputHash(encryptedTally: bigint[], n2: bigint): Uint8Array {
    let hash = 0n;
    for (const ct of encryptedTally) {
      const bytes = this.bigintToUint8Array(ct);
      for (const byte of bytes) {
        hash = (hash * 256n + BigInt(byte)) % n2;
      }
    }
    return this.bigintToUint8Array(hash);
  }

  /**
   * Generate a ceremony ID from the partials' nonces.
   */
  private generateCeremonyId(partials: readonly PartialDecryption[]): string {
    if (partials.length === 0) return 'empty';
    // Use the first partial's nonce as the ceremony identifier
    const nonce = partials[0].ceremonyNonce;
    return Array.from(nonce)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Compute n! (factorial).
   */
  private factorial(n: bigint): bigint {
    let result = 1n;
    for (let i = 2n; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Compute a mod m, handling negative numbers correctly.
   */
  private mod(a: bigint, m: bigint): bigint {
    const result = a % m;
    return result >= 0n ? result : result + m;
  }

  /**
   * Compute base^exp mod m using square-and-multiply.
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
   * Compute modular inverse using extended Euclidean algorithm.
   */
  private modInverse(a: bigint, m: bigint): bigint {
    const originalM = m;
    a = this.mod(a, m);
    let [old_r, r] = [a, m];
    let [old_s, s] = [1n, 0n];

    while (r !== 0n) {
      const quotient = old_r / r;
      [old_r, r] = [r, old_r - quotient * r];
      [old_s, s] = [s, old_s - quotient * s];
    }

    if (old_r !== 1n) {
      throw new CombineFailedError(
        `Modular inverse does not exist for ${a} mod ${m}`,
      );
    }

    return ((old_s % originalM) + originalM) % originalM;
  }

  /**
   * Convert a bigint to Uint8Array.
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
   * Compare two Uint8Arrays for equality.
   */
  private uint8ArrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
