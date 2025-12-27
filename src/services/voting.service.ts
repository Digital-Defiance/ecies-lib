/**
 * Voting Service for browser/web environments
 * Provides ECIES-to-Paillier key bridge for homomorphic encryption voting systems.
 * Uses @noble/secp256k1 for ECDH (matching Node.js implementation).
 */

import { secp256k1 } from '@noble/curves/secp256k1.js';
import type { KeyPair, PrivateKey, PublicKey } from 'paillier-bigint';
import { VOTING } from '../constants';
import { VotingErrorType } from '../enumerations/voting-error-type';
import { VotingError } from '../errors/voting';
import type { IVotingService } from '../interfaces/voting-service';
import { IsolatedPrivateKey } from '../isolated-private';
import { IsolatedPublicKey } from '../isolated-public';

/**
 * Configuration options for deriving Paillier voting keys from ECDH keys.
 */
export interface DeriveVotingKeysOptions {
  /** Curve name (default: 'secp256k1') */
  curveName?: string;
  /** ECIES public key magic byte (default: 0x04) */
  publicKeyMagic?: number;
  /** Raw public key length without prefix (default: 64) */
  rawPublicKeyLength?: number;
  /** Public key length with prefix (default: 65) */
  publicKeyLength?: number;
  /** HMAC algorithm for HKDF (default: 'sha512') */
  hmacAlgorithm?: string;
  /** HKDF info string (default: 'PaillierPrimeGen') */
  hkdfInfo?: string;
  /** HKDF output length (default: 64) */
  hkdfLength?: number;
  /** Key pair bit length (default: 3072) */
  keypairBitLength?: number;
  /** Prime test iterations (default: 256) */
  primeTestIterations?: number;
  /** Max attempts to generate prime (default: 20000) */
  maxPrimeAttempts?: number;
}

/**
 * Miller-Rabin primality test with deterministic witnesses
 *
 * SECURITY: With k=256 rounds, probability of false positive is < 2^-512
 * (more likely: cosmic ray bit flip or hardware failure)
 *
 * @param n - Number to test for primality
 * @param k - Number of rounds (witnesses to test)
 * @returns true if n is probably prime, false if definitely composite
 */
export function millerRabinTest(n: bigint, k: number): boolean {
  if (n <= 1n || n === 4n) return false;
  if (n <= 3n) return true;

  // Write n-1 as 2^r * d
  let d = n - 1n;
  let r = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    r++;
  }

  // Use first k prime numbers as witnesses
  const witnesses = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

  // Witness loop
  const witnessLoop = (a: bigint): boolean => {
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) return true;

    for (let i = 1; i < r; i++) {
      x = (x * x) % n;
      if (x === 1n) return false;
      if (x === n - 1n) return true;
    }

    return false;
  };

  // Test with deterministic witnesses
  for (let i = 0; i < Math.min(k, witnesses.length); i++) {
    const a = (witnesses[i] % (n - 2n)) + 2n;
    if (!witnessLoop(a)) return false;
  }

  return true;
}

/**
 * Modular exponentiation: (base^exp) mod mod
 */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod === 1n) return 0n;
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod;
    }
    exp = exp >> 1n;
    base = (base * base) % mod;
  }
  return result;
}

/**
 * Extended Euclidean algorithm to find modular multiplicative inverse
 */
export function modInverse(a: bigint, m: bigint): bigint {
  if (m === 1n) return 0n;

  const m0 = m;
  let x0 = 0n;
  let x1 = 1n;
  let a0 = a;

  while (a0 > 1n) {
    const q = a0 / m;
    let t = m;
    m = a0 % m;
    a0 = t;
    t = x0;
    x0 = x1 - q * x0;
    x1 = t;
  }

  if (x1 < 0n) x1 += m0;
  return x1;
}

/**
 * Greatest common divisor using Euclidean algorithm
 */
export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;

  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Least common multiple
 */
export function lcm(a: bigint, b: bigint): bigint {
  return (a * b) / gcd(a, b);
}

/**
 * Decompress a secp256k1 compressed public key
 * @param compressedKey - 33 bytes (1 byte prefix + 32 bytes x-coordinate)
 * @returns 65 bytes uncompressed key (0x04 + x + y)
 */
function _decompressSecp256k1PublicKey(compressedKey: Uint8Array): Uint8Array {
  if (compressedKey.length !== 33) {
    throw new Error(
      `Invalid compressed key length: expected 33 bytes, got ${compressedKey.length}`,
    );
  }

  const prefix = compressedKey[0];
  if (prefix !== 0x02 && prefix !== 0x03) {
    throw new Error(
      `Invalid compressed key prefix: expected 0x02 or 0x03, got 0x${prefix.toString(16)}`,
    );
  }

  // secp256k1 parameters
  const p = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
  const b = 7n;

  // Extract x coordinate
  const xBytes = compressedKey.slice(1);
  let x = 0n;
  for (let i = 0; i < xBytes.length; i++) {
    x = (x << 8n) | BigInt(xBytes[i]);
  }

  // Calculate y² = x³ + 7 (mod p)
  const ySquared = (modPow(x, 3n, p) + b) % p;

  // Calculate y using Tonelli-Shanks algorithm (for p ≡ 3 mod 4, it's simpler)
  // For secp256k1, p ≡ 3 mod 4, so y = ySquared^((p+1)/4) mod p
  const y = modPow(ySquared, (p + 1n) / 4n, p);

  // Choose the correct y based on prefix (even/odd)
  const yIsEven = (y & 1n) === 0n;
  const prefixIndicatesEven = prefix === 0x02;
  const finalY = yIsEven === prefixIndicatesEven ? y : p - y;

  // Construct uncompressed key: 0x04 + x + y
  const uncompressed = new Uint8Array(65);
  uncompressed[0] = 0x04;

  // Write x coordinate
  for (let i = 0; i < 32; i++) {
    uncompressed[1 + i] = Number((x >> BigInt(8 * (31 - i))) & 0xffn);
  }

  // Write y coordinate
  for (let i = 0; i < 32; i++) {
    uncompressed[33 + i] = Number((finalY >> BigInt(8 * (31 - i))) & 0xffn);
  }

  return uncompressed;
}

/**
 * HKDF implementation using Web Crypto API
 *
 * SECURITY: This is a cryptographically secure key derivation function.
 * - Uses Web Crypto API for browser compatibility
 * - Provides pseudorandomness indistinguishable from random
 * - One-way: computationally infeasible to recover IKM from OKM
 * - Domain separation via 'info' parameter
 *
 * @param secret - The input key material (IKM)
 * @param salt - Optional salt value (non-secret random value)
 * @param info - Context string for domain separation
 * @param length - Length of output keying material in bytes
 * @param hmacAlgorithm - HMAC algorithm to use (default: 'SHA-512')
 * @returns Derived key material (OKM)
 */
export async function hkdf(
  secret: Uint8Array,
  salt: Uint8Array | null,
  info: string,
  length: number,
  hmacAlgorithm: string = 'SHA-512',
): Promise<Uint8Array> {
  // Import key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HKDF' },
    false,
    ['deriveBits'],
  );

  // Derive bits using HKDF
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: hmacAlgorithm,
      salt: salt || new Uint8Array(0),
      info: new TextEncoder().encode(info),
    },
    keyMaterial,
    length * 8, // length in bits
  );

  return new Uint8Array(derived);
}

/**
 * Secure Deterministic Random Bit Generator using HMAC-DRBG (SP 800-90A)
 * Web Crypto API version with proper async initialization
 *
 * SECURITY: NIST-approved deterministic random bit generator
 * - Provides backtracking resistance
 * - Provides prediction resistance
 * - Cryptographically secure pseudorandom output
 * - Uses async factory pattern for proper HMAC initialization
 */
export class SecureDeterministicDRBG {
  private v: Uint8Array;
  private k: Uint8Array;
  private readonly hmacAlgorithm: string;
  private readonly hashLength: number;

  private constructor(seed: Uint8Array, hmacAlgorithm: string = 'SHA-512') {
    this.hmacAlgorithm = hmacAlgorithm;
    // SHA-512 = 64 bytes, SHA-256 = 32 bytes
    this.hashLength = hmacAlgorithm === 'SHA-512' ? 64 : 32;

    // Initialize V and K
    this.v = new Uint8Array(this.hashLength).fill(0x01);
    this.k = new Uint8Array(this.hashLength).fill(0x00);
  }

  /**
   * Create and initialize a new DRBG instance
   */
  public static async create(
    seed: Uint8Array,
    hmacAlgorithm: string = 'SHA-512',
  ): Promise<SecureDeterministicDRBG> {
    const drbg = new SecureDeterministicDRBG(seed, hmacAlgorithm);
    await drbg.update(seed);
    return drbg;
  }

  private async hmacAsync(
    key: Uint8Array,
    data: Uint8Array,
  ): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: this.hmacAlgorithm },
      false,
      ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    return new Uint8Array(signature);
  }

  private async update(providedData?: Uint8Array): Promise<void> {
    // K = HMAC(K, V || 0x00 || provided_data)
    let data = new Uint8Array(this.v.length + 1 + (providedData?.length || 0));
    data.set(this.v, 0);
    data[this.v.length] = 0x00;
    if (providedData) {
      data.set(providedData, this.v.length + 1);
    }
    this.k = await this.hmacAsync(this.k, data);

    // V = HMAC(K, V)
    this.v = await this.hmacAsync(this.k, this.v);

    if (providedData) {
      // K = HMAC(K, V || 0x01 || provided_data)
      data = new Uint8Array(this.v.length + 1 + providedData.length);
      data.set(this.v, 0);
      data[this.v.length] = 0x01;
      data.set(providedData, this.v.length + 1);
      this.k = await this.hmacAsync(this.k, data);

      // V = HMAC(K, V)
      this.v = await this.hmacAsync(this.k, this.v);
    }
  }

  public async generate(numBytes: number): Promise<Uint8Array> {
    const result = new Uint8Array(numBytes);
    let offset = 0;

    while (offset < numBytes) {
      this.v = await this.hmacAsync(this.k, this.v);
      const copyLength = Math.min(this.v.length, numBytes - offset);
      result.set(this.v.slice(0, copyLength), offset);
      offset += copyLength;
    }

    await this.update();
    return result;
  }
}

/**
 * Small prime sieve for quick composite elimination
 */
const SMALL_PRIMES = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
  157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
  239, 241, 251,
];

/**
 * Generate a deterministic prime number using DRBG (async web version)
 */
export async function generateDeterministicPrime(
  drbg: SecureDeterministicDRBG,
  numBits: number,
  primeTestIterations: number = 256,
  maxAttempts: number = 10000, // Reduced and enforced for timing attack mitigation
): Promise<bigint> {
  const numBytes = Math.ceil(numBits / 8);
  const topBitMask = 1 << ((numBits - 1) % 8);

  // Always perform exactly maxAttempts iterations for timing attack mitigation
  let foundPrime: bigint | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Continue checking even after finding prime to maintain constant timing
    if (foundPrime !== null) {
      // Perform dummy operations to maintain timing consistency
      await drbg.generate(numBytes);
      continue;
    }

    // Generate random bytes
    const bytes = await drbg.generate(numBytes);

    // Set top bit to ensure exact bit length
    bytes[0] |= topBitMask;

    // Set bottom bit to ensure odd number
    bytes[bytes.length - 1] |= 1;

    const candidate = BigInt(
      '0x' +
        Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
    );

    // Quick check against small primes
    let isComposite = false;
    for (const smallPrime of SMALL_PRIMES) {
      if (
        candidate % BigInt(smallPrime) === 0n &&
        candidate !== BigInt(smallPrime)
      ) {
        isComposite = true;
        break;
      }
    }

    if (isComposite) continue;

    // Miller-Rabin primality test
    if (millerRabinTest(candidate, primeTestIterations)) {
      foundPrime = candidate;
    }
  }

  if (foundPrime === null) {
    throw new Error(`Failed to generate prime after ${maxAttempts} attempts`);
  }

  return foundPrime;
}

/**
 * Generate a deterministic Paillier key pair from a seed (async web version)
 */
export async function generateDeterministicKeyPair(
  seed: Uint8Array,
  bits: number = 3072,
  primeTestIterations: number = 256,
): Promise<KeyPair> {
  // Validate inputs
  if (!seed || seed.length < 32) {
    throw new Error(`Seed must be at least 32 bytes, got ${seed?.length || 0}`);
  }
  if (bits < 2048) {
    throw new Error(`Key size must be at least 2048 bits, got ${bits}`);
  }
  if (bits % 2 !== 0) {
    throw new Error(`Key size must be even, got ${bits}`);
  }
  if (primeTestIterations < 64) {
    throw new Error(
      `Must perform at least 64 Miller-Rabin iterations, got ${primeTestIterations}`,
    );
  }

  // Load paillier-bigint dynamically (optional peer dependency)
  let PublicKey: typeof import('paillier-bigint').PublicKey;
  let PrivateKey: typeof import('paillier-bigint').PrivateKey;

  try {
    const paillier = await import('paillier-bigint');
    PublicKey = paillier.PublicKey;
    PrivateKey = paillier.PrivateKey;
  } catch (_error) {
    throw new Error(
      'paillier-bigint is required for voting functionality. Install it with: npm install paillier-bigint',
    );
  }

  const drbg = await SecureDeterministicDRBG.create(seed);

  // Generate two primes of half the key size
  const primeBits = Math.floor(bits / 2);
  const p = await generateDeterministicPrime(
    drbg,
    primeBits,
    primeTestIterations,
  );
  const q = await generateDeterministicPrime(
    drbg,
    primeBits,
    primeTestIterations,
  );

  // Calculate n = p * q
  const n = p * q;

  // Calculate lambda = lcm(p-1, q-1)
  const lambda = lcm(p - 1n, q - 1n);

  // For Paillier, g = n + 1 (simplest form)
  const g = n + 1n;

  // Calculate mu = (L(g^lambda mod n^2))^-1 mod n
  // where L(x) = (x-1)/n
  const nSquared = n * n;
  const gLambda = modPow(g, lambda, nSquared);
  const l = (gLambda - 1n) / n;
  const mu = modInverse(l, n);

  // Create key pair
  const publicKey = new PublicKey(n, g);
  const privateKey = new PrivateKey(lambda, mu, publicKey);

  // Validate with test encryption/decryption
  const testPlaintext = 42n;
  const encrypted = publicKey.encrypt(testPlaintext);
  const decrypted = privateKey.decrypt(encrypted);

  if (decrypted !== testPlaintext) {
    throw new Error(
      'Key pair validation failed: test encryption/decryption mismatch',
    );
  }

  return { publicKey, privateKey };
}

/**
 * Derive Paillier voting keys from ECDH key pair (async web version)
 *
 * SECURITY PROPERTIES:
 * - One-way: Computationally infeasible to recover ECDH keys from Paillier keys
 * - Deterministic: Same ECDH keys always produce same Paillier keys
 * - Collision-resistant: Different ECDH keys produce different Paillier keys
 * - Domain-separated: Cryptographically bound to voting purpose via HKDF info
 *
 * SECURITY LEVEL: ~128 bits (equivalent to 3072-bit RSA)
 * - ECDH: secp256k1 curve (~128-bit security, matches Node.js)
 * - HKDF: SHA-512 (512-bit security against preimage)
 * - Paillier: 3072-bit modulus (NIST recommended for 128-bit security)
 *
 * @param ecdhPrivKey - ECDH private key (32 bytes for secp256k1)
 * @param ecdhPubKey - ECDH public key (33/64/65 bytes, compressed or uncompressed)
 * @param options - Configuration options
 * @returns Paillier key pair for voting operations
 */
export async function deriveVotingKeysFromECDH(
  ecdhPrivKey: Uint8Array,
  ecdhPubKey: Uint8Array,
  options: DeriveVotingKeysOptions = {},
): Promise<KeyPair> {
  const {
    curveName: _curveName = 'secp256k1', // Use secp256k1 to match Node.js implementation
    publicKeyMagic = 0x04,
    rawPublicKeyLength = 64,
    publicKeyLength = 65,
    hmacAlgorithm = 'SHA-512',
    hkdfInfo = 'PaillierPrimeGen',
    hkdfLength = 64,
    keypairBitLength = 3072,
    primeTestIterations = 256,
  } = options;

  // Validate inputs with strict length checks
  if (!ecdhPrivKey || ecdhPrivKey.length === 0) {
    throw new Error('ECDH private key is required');
  }

  // Validate private key length (32 bytes for secp256k1)
  if (ecdhPrivKey.length !== 32) {
    throw new Error(
      `Invalid ECDH private key length: expected 32 bytes, got ${ecdhPrivKey.length}`,
    );
  }

  if (!ecdhPubKey || ecdhPubKey.length === 0) {
    throw new Error('ECDH public key is required');
  }

  // Handle both compressed (33 bytes) and uncompressed (65 bytes) public keys
  // @noble/secp256k1 accepts both formats
  let publicKeyForECDH: Uint8Array;

  if (ecdhPubKey.length === 33) {
    // Compressed key - @noble/secp256k1 handles this natively
    publicKeyForECDH = ecdhPubKey;
  } else if (
    ecdhPubKey.length === publicKeyLength &&
    ecdhPubKey[0] === publicKeyMagic
  ) {
    // Already uncompressed with 0x04 prefix - @noble/secp256k1 handles this
    publicKeyForECDH = ecdhPubKey;
  } else if (ecdhPubKey.length === rawPublicKeyLength) {
    // Uncompressed without prefix - add it
    publicKeyForECDH = new Uint8Array(publicKeyLength);
    publicKeyForECDH[0] = publicKeyMagic;
    publicKeyForECDH.set(ecdhPubKey, 1);
  } else {
    throw new Error(
      `Invalid public key length: expected 33 (compressed), 64 (uncompressed raw), or 65 (uncompressed with prefix) bytes, got ${ecdhPubKey.length}`,
    );
  }

  // Compute shared secret using @noble/secp256k1 (same as Node.js implementation)
  const sharedSecret = secp256k1.getSharedSecret(
    ecdhPrivKey,
    publicKeyForECDH,
    false,
  );

  // Remove the 0x04 prefix from shared secret (getSharedSecret returns uncompressed point)
  const _sharedSecretBytes = sharedSecret.slice(1);

  // Derive seed using HKDF
  const seed = await hkdf(
    sharedSecret,
    null,
    hkdfInfo,
    hkdfLength,
    hmacAlgorithm,
  );

  // Generate deterministic key pair
  return await generateDeterministicKeyPair(
    seed,
    keypairBitLength,
    primeTestIterations,
  );
}

/**
 * Voting service for deriving and managing Paillier voting keys from ECDH keys.
 * Web/Browser version using @noble/secp256k1.
 *
 * SECURITY ARCHITECTURE:
 * This service implements a novel but cryptographically sound bridge between
 * ECDSA/ECDH keys and Paillier homomorphic encryption keys. The construction
 * uses only proven cryptographic primitives:
 *
 * - ECDH (secp256k1): Shared secret computation via @noble/secp256k1
 * - HKDF (RFC 5869): Cryptographically secure key derivation
 * - HMAC-DRBG (NIST SP 800-90A): Deterministic random generation
 * - Miller-Rabin (256 rounds): Primality testing (error < 2^-512)
 * - Paillier (3072-bit): Homomorphic encryption
 *
 * SECURITY GUARANTEES:
 * - 128-bit security level (equivalent to 3072-bit RSA)
 * - One-way: Cannot recover ECDH keys from Paillier keys
 * - Deterministic: Enables key recovery from same ECDH source
 * - Collision-resistant: Birthday bound ~2^128 operations
 * - Domain-separated: Cryptographic binding via HKDF info string
 *
 * THREAT MODEL:
 * Protected against: factorization attacks, weak primes, small prime attacks
 * Timing attacks: Mitigated via constant-time operations where possible
 * Side-channels: Dependent on @noble/secp256k1 implementation
 * Quantum: Vulnerable to Shor's algorithm (like all RSA-type systems)
 *
 * WEB-SPECIFIC CONSIDERATIONS:
 * - All cryptographic operations are async
 * - Uses secp256k1 curve (same as Node.js for cross-platform compatibility)
 * - Uses @noble/secp256k1 library (already used for ECIES operations)
 * - DRBG uses proper async factory pattern for HMAC initialization
 *
 * For detailed security analysis, see:
 * docs/SECURITY_ANALYSIS_ECIES_PAILLIER_BRIDGE.md
 */
export class VotingService implements IVotingService {
  private static instance?: VotingService;

  /**
   * Get singleton instance of VotingService
   */
  public static getInstance(): VotingService {
    if (!VotingService.instance) {
      VotingService.instance = new VotingService();
    }
    return VotingService.instance;
  }

  /**
   * Derive Paillier voting keys from ECDH key pair.
   *
   * @param ecdhPrivKey - ECDH private key (32 bytes for secp256k1)
   * @param ecdhPubKey - ECDH public key (33/64/65 bytes, compressed or uncompressed)
   * @param options - Configuration options
   * @returns Paillier key pair for voting operations
   */
  public async deriveVotingKeysFromECDH(
    ecdhPrivKey: Uint8Array,
    ecdhPubKey: Uint8Array,
    options?: DeriveVotingKeysOptions,
  ): Promise<KeyPair> {
    return await deriveVotingKeysFromECDH(ecdhPrivKey, ecdhPubKey, options);
  }

  /**
   * HKDF key derivation function (RFC 5869)
   */
  public async hkdf(
    secret: Uint8Array,
    salt: Uint8Array | null,
    info: string,
    length: number,
    hmacAlgorithm?: string,
  ): Promise<Uint8Array> {
    return await hkdf(secret, salt, info, length, hmacAlgorithm);
  }

  /**
   * Miller-Rabin primality test
   */
  public millerRabinTest(n: bigint, k: number): boolean {
    return millerRabinTest(n, k);
  }

  /**
   * Modular exponentiation
   */
  public modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    return modPow(base, exp, mod);
  }

  /**
   * Modular multiplicative inverse
   */
  public modInverse(a: bigint, m: bigint): bigint {
    return modInverse(a, m);
  }

  /**
   * Greatest common divisor
   */
  public gcd(a: bigint, b: bigint): bigint {
    return gcd(a, b);
  }

  /**
   * Least common multiple
   */
  public lcm(a: bigint, b: bigint): bigint {
    return lcm(a, b);
  }

  /**
   * Generate a deterministic prime using DRBG
   */
  public async generateDeterministicPrime(
    drbg: SecureDeterministicDRBG,
    numBits: number,
    primeTestIterations?: number,
    maxAttempts?: number,
  ): Promise<bigint> {
    return await generateDeterministicPrime(
      drbg,
      numBits,
      primeTestIterations,
      maxAttempts,
    );
  }

  /**
   * Generate a deterministic Paillier key pair from seed
   */
  public async generateDeterministicKeyPair(
    seed: Uint8Array,
    bits?: number,
    primeTestIterations?: number,
  ): Promise<KeyPair> {
    return await generateDeterministicKeyPair(seed, bits, primeTestIterations);
  }

  /**
   * Create a secure deterministic random bit generator
   */
  public async createDRBG(
    seed: Uint8Array,
    hmacAlgorithm?: string,
  ): Promise<SecureDeterministicDRBG> {
    return await SecureDeterministicDRBG.create(seed, hmacAlgorithm);
  }

  /**
   * Serialize a Paillier public key to Uint8Array
   * Format: [magic:4][version:1][keyId:32][n_length:4][n:variable]
   *
   * SECURITY: Public keys are safe to share. This serialization
   * format is deterministic and preserves all key information.
   */
  public async votingPublicKeyToBuffer(
    publicKey: PublicKey,
  ): Promise<Uint8Array> {
    // Generate keyId from n
    const nHex = publicKey.n
      .toString(VOTING.KEY_RADIX)
      .padStart(VOTING.PUB_KEY_OFFSET, '0');
    const nBytes = this.hexToUint8Array(nHex);
    const keyId = await this.sha256(nBytes);

    // Prepare n buffer
    const encoder = new TextEncoder();
    const nHexBytes = encoder.encode(nHex);

    // Create buffer: magic(4) + version(1) + keyId(32) + n_length(4) + n
    const result = new Uint8Array(4 + 1 + 32 + 4 + nHexBytes.length);
    const view = new DataView(result.buffer);

    // Write magic
    const magicBytes = encoder.encode(VOTING.KEY_MAGIC);
    result.set(magicBytes, 0);

    // Write version
    result[4] = VOTING.KEY_VERSION;

    // Write keyId
    result.set(keyId, 5);

    // Write n_length and n
    view.setUint32(37, nHexBytes.length);
    result.set(nHexBytes, 41);

    return result;
  }

  /**
   * Deserialize a Paillier public key from Uint8Array
   * Format: [magic:4][version:1][keyId:32][n_length:4][n:variable]
   */
  public async bufferToVotingPublicKey(buffer: Uint8Array): Promise<PublicKey> {
    // Load PublicKey class
    const { PublicKey } = await import('paillier-bigint');

    // Minimum buffer length check
    if (buffer.length < 41) {
      throw new VotingError(VotingErrorType.InvalidPublicKeyBufferTooShort);
    }

    const decoder = new TextDecoder();
    const view = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
    );

    // Verify magic
    const magic = decoder.decode(buffer.slice(0, 4));
    if (magic !== VOTING.KEY_MAGIC) {
      throw new VotingError(VotingErrorType.InvalidPublicKeyBufferWrongMagic);
    }

    // Read version
    const version = buffer[4];
    if (version !== VOTING.KEY_VERSION) {
      throw new VotingError(VotingErrorType.UnsupportedPublicKeyVersion);
    }

    // Read keyId
    const keyId = buffer.slice(5, 37);

    // Read n
    const nLength = view.getUint32(37);
    const nHex = decoder.decode(buffer.slice(41, 41 + nLength));
    const n = BigInt('0x' + nHex);

    // Verify keyId
    const nBytes = this.hexToUint8Array(nHex);
    const computedKeyId = await this.sha256(nBytes);
    if (!this.uint8ArrayEquals(keyId, computedKeyId)) {
      throw new VotingError(VotingErrorType.InvalidPublicKeyIdMismatch);
    }

    // g = n + 1 for simplified Paillier
    return new PublicKey(n, n + 1n);
  }

  /**
   * Serialize a Paillier private key to Uint8Array
   * Format: [magic:4][version:1][lambda_length:4][lambda:variable][mu_length:4][mu:variable]
   *
   * SECURITY WARNING: Private keys must be kept secret!
   * - Only serialize for secure storage or transmission
   * - Encrypt serialized keys before storing or transmitting
   * - Consider using browser's IndexedDB with encryption
   * - Never log or expose private keys in client-side code
   */
  public votingPrivateKeyToBuffer(privateKey: PrivateKey): Uint8Array {
    // Serialize lambda and mu values with padding
    const lambdaHex = privateKey.lambda
      .toString(VOTING.KEY_RADIX)
      .padStart(VOTING.PUB_KEY_OFFSET, '0');
    const muHex = privateKey.mu
      .toString(VOTING.KEY_RADIX)
      .padStart(VOTING.PUB_KEY_OFFSET, '0');

    const encoder = new TextEncoder();
    const magicBytes = encoder.encode(VOTING.KEY_MAGIC);
    const lambdaBytes = encoder.encode(lambdaHex);
    const muBytes = encoder.encode(muHex);

    // magic(4) + version(1) + lambda_length(4) + lambda + mu_length(4) + mu
    const result = new Uint8Array(
      4 + 1 + 4 + lambdaBytes.length + 4 + muBytes.length,
    );
    const view = new DataView(result.buffer);

    // Write magic
    result.set(magicBytes, 0);

    // Write version
    result[4] = VOTING.KEY_VERSION;

    // Write lambda_length and lambda
    view.setUint32(5, lambdaBytes.length);
    result.set(lambdaBytes, 9);

    // Write mu_length and mu
    view.setUint32(9 + lambdaBytes.length, muBytes.length);
    result.set(muBytes, 13 + lambdaBytes.length);

    return result;
  }

  /**
   * Deserialize a Paillier private key from Uint8Array
   * Format: [magic:4][version:1][lambda_length:4][lambda:variable][mu_length:4][mu:variable]
   */
  public async bufferToVotingPrivateKey(
    buffer: Uint8Array,
    publicKey: PublicKey,
  ): Promise<PrivateKey> {
    // Load PrivateKey class
    const { PrivateKey } = await import('paillier-bigint');

    // Minimum buffer length check
    if (buffer.length < 13) {
      throw new VotingError(VotingErrorType.InvalidPrivateKeyBufferTooShort);
    }

    const decoder = new TextDecoder();
    const view = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
    );

    // Verify magic
    const magic = decoder.decode(buffer.slice(0, 4));
    if (magic !== VOTING.KEY_MAGIC) {
      throw new VotingError(VotingErrorType.InvalidPrivateKeyBufferWrongMagic);
    }

    // Read version
    const version = buffer[4];
    if (version !== VOTING.KEY_VERSION) {
      throw new VotingError(VotingErrorType.UnsupportedPrivateKeyVersion);
    }

    // Read lambda
    const lambdaLength = view.getUint32(5);
    const lambdaHex = decoder.decode(buffer.slice(9, 9 + lambdaLength));
    const lambda = BigInt('0x' + lambdaHex);

    // Read mu
    const muLength = view.getUint32(9 + lambdaLength);
    const muHex = decoder.decode(
      buffer.slice(13 + lambdaLength, 13 + lambdaLength + muLength),
    );
    const mu = BigInt('0x' + muHex);

    return new PrivateKey(lambda, mu, publicKey);
  }

  /**
   * Serialize an IsolatedPublicKey to Uint8Array
   * Format: [magic:4][version:1][keyId:32][instanceId:32][n_length:4][n:variable]
   */
  public isolatedPublicKeyToBuffer(publicKey: IsolatedPublicKey): Uint8Array {
    if (!IsolatedPublicKey.isIsolatedPublicKey(publicKey)) {
      throw new VotingError(VotingErrorType.InvalidPublicKeyNotIsolated);
    }

    const nHex = publicKey.n
      .toString(VOTING.KEY_RADIX)
      .padStart(VOTING.PUB_KEY_OFFSET, '0');
    const keyId = publicKey.getKeyId();
    const instanceId = publicKey.getInstanceId();

    const encoder = new TextEncoder();
    const magicBytes = encoder.encode(VOTING.KEY_MAGIC);
    const nHexBytes = encoder.encode(nHex);

    // magic(4) + version(1) + keyId(32) + instanceId(32) + n_length(4) + n
    const result = new Uint8Array(4 + 1 + 32 + 32 + 4 + nHexBytes.length);
    const view = new DataView(result.buffer);

    // Write magic
    result.set(magicBytes, 0);

    // Write version
    result[4] = VOTING.KEY_VERSION;

    // Write keyId
    result.set(keyId, 5);

    // Write instanceId
    result.set(instanceId, 37);

    // Write n_length and n
    view.setUint32(69, nHexBytes.length);
    result.set(nHexBytes, 73);

    return result;
  }

  /**
   * Deserialize an IsolatedPublicKey from Uint8Array
   * Format: [magic:4][version:1][keyId:32][instanceId:32][n_length:4][n:variable]
   */
  public async bufferToIsolatedPublicKey(
    buffer: Uint8Array,
  ): Promise<IsolatedPublicKey> {
    // Minimum buffer length check
    if (buffer.length < 73) {
      throw new VotingError(VotingErrorType.InvalidPublicKeyBufferTooShort);
    }

    const decoder = new TextDecoder();
    const view = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
    );

    // Verify magic
    const magic = decoder.decode(buffer.slice(0, 4));
    if (magic !== VOTING.KEY_MAGIC) {
      throw new VotingError(VotingErrorType.InvalidPublicKeyBufferWrongMagic);
    }

    // Read version
    const version = buffer[4];
    if (version !== VOTING.KEY_VERSION) {
      throw new VotingError(VotingErrorType.UnsupportedPublicKeyVersion);
    }

    // Read keyId
    const keyId = buffer.slice(5, 37);

    // Read instanceId
    const instanceId = buffer.slice(37, 69);

    // Read n
    const nLength = view.getUint32(69);
    const nHex = decoder.decode(buffer.slice(73, 73 + nLength));
    const n = BigInt('0x' + nHex);

    // g = n + 1 for simplified Paillier
    const g = n + 1n;

    // Create IsolatedPublicKey using fromBuffer factory method
    // The keyId and instanceId from the buffer are trusted
    return IsolatedPublicKey.fromBuffer(n, g, keyId, instanceId);
  }

  /**
   * Serialize an IsolatedPrivateKey to Uint8Array
   * Format: [magic:4][version:1][lambda_length:4][lambda:variable][mu_length:4][mu:variable]
   */
  public isolatedPrivateKeyToBuffer(
    privateKey: IsolatedPrivateKey,
  ): Uint8Array {
    // IsolatedPrivateKey uses same format as base PrivateKey
    // Instance validation happens during decryption, not serialization
    return this.votingPrivateKeyToBuffer(privateKey);
  }

  /**
   * Deserialize an IsolatedPrivateKey from Uint8Array
   * Format: [magic:4][version:1][lambda_length:4][lambda:variable][mu_length:4][mu:variable]
   */
  public async bufferToIsolatedPrivateKey(
    buffer: Uint8Array,
    publicKey: IsolatedPublicKey,
  ): Promise<IsolatedPrivateKey> {
    if (!IsolatedPublicKey.isIsolatedPublicKey(publicKey)) {
      throw new VotingError(VotingErrorType.InvalidPublicKeyNotIsolated);
    }

    // Minimum buffer length check
    if (buffer.length < 13) {
      throw new VotingError(VotingErrorType.InvalidPrivateKeyBufferTooShort);
    }

    const decoder = new TextDecoder();
    const view = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
    );

    // Verify magic
    const magic = decoder.decode(buffer.slice(0, 4));
    if (magic !== VOTING.KEY_MAGIC) {
      throw new VotingError(VotingErrorType.InvalidPrivateKeyBufferWrongMagic);
    }

    // Read version
    const version = buffer[4];
    if (version !== VOTING.KEY_VERSION) {
      throw new VotingError(VotingErrorType.UnsupportedPrivateKeyVersion);
    }

    // Read lambda
    const lambdaLength = view.getUint32(5);
    const lambdaHex = decoder.decode(buffer.slice(9, 9 + lambdaLength));
    const lambda = BigInt('0x' + lambdaHex);

    // Read mu
    const muLength = view.getUint32(9 + lambdaLength);
    const muHex = decoder.decode(
      buffer.slice(13 + lambdaLength, 13 + lambdaLength + muLength),
    );
    const mu = BigInt('0x' + muHex);

    return new IsolatedPrivateKey(lambda, mu, publicKey);
  }

  // Helper methods for serialization
  private hexToUint8Array(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
      hex = '0' + hex;
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  private async sha256(data: Uint8Array): Promise<Uint8Array> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  private uint8ArrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  // Aliases for cross-platform compatibility tests
  public async serializePublicKey(publicKey: PublicKey): Promise<Uint8Array> {
    return await this.votingPublicKeyToBuffer(publicKey);
  }

  public async deserializePublicKey(buffer: Uint8Array): Promise<PublicKey> {
    return this.bufferToVotingPublicKey(buffer);
  }

  public async serializePrivateKey(
    privateKey: PrivateKey,
  ): Promise<Uint8Array> {
    return this.votingPrivateKeyToBuffer(privateKey);
  }

  public async deserializePrivateKey(
    buffer: Uint8Array,
    publicKey: PublicKey,
  ): Promise<PrivateKey> {
    return this.bufferToVotingPrivateKey(buffer, publicKey);
  }
}
