/**
 * Common interfaces for ECIES library across ecies-lib (browser) and node-ecies-lib (Node.js)
 *
 * This file defines the shared contracts that both implementations must adhere to,
 * ensuring consistent behavior and cross-platform compatibility.
 */

import type { EciesEncryptionType } from '../enumerations/ecies-encryption-type';
import type { PlatformBuffer } from './platform-buffer';
import type { IVotingService } from './voting-service';

/**
 * ECIES encryption options
 */
export interface IEciesEncryptionOptions {
  /**
   * Encryption type to use
   */
  encryptionType?: EciesEncryptionType;

  /**
   * Additional authenticated data for AES-GCM
   */
  aad?: PlatformBuffer;

  /**
   * Custom ephemeral key pair (for testing)
   */
  ephemeralKeyPair?: {
    privateKey: PlatformBuffer;
    publicKey: PlatformBuffer;
  };
}

/**
 * Common interface for ECIES encryption/decryption operations
 */
export interface IEciesService {
  /**
   * Encrypt data for a single recipient
   *
   * @param recipientPublicKey - Recipient's public key (compressed or uncompressed)
   * @param plaintext - Data to encrypt
   * @param options - Encryption options
   * @returns Encrypted data with ephemeral public key and MAC
   */
  encrypt(
    recipientPublicKey: PlatformBuffer,
    plaintext: PlatformBuffer,
    options?: IEciesEncryptionOptions,
  ): Promise<PlatformBuffer>;

  /**
   * Decrypt data encrypted for this recipient
   *
   * @param recipientPrivateKey - Recipient's private key
   * @param ciphertext - Encrypted data
   * @param options - Decryption options
   * @returns Decrypted plaintext
   */
  decrypt(
    recipientPrivateKey: PlatformBuffer,
    ciphertext: PlatformBuffer,
    options?: Partial<IEciesEncryptionOptions>,
  ): Promise<PlatformBuffer>;

  /**
   * Encrypt data for multiple recipients
   *
   * @param recipientPublicKeys - Array of recipient public keys
   * @param plaintext - Data to encrypt
   * @param options - Encryption options
   * @returns Encrypted data structure for all recipients
   */
  encryptMultiRecipient(
    recipientPublicKeys: PlatformBuffer[],
    plaintext: PlatformBuffer,
    options?: IEciesEncryptionOptions,
  ): Promise<PlatformBuffer>;

  /**
   * Decrypt multi-recipient encrypted data
   *
   * @param recipientPrivateKey - Recipient's private key
   * @param ciphertext - Multi-recipient encrypted data
   * @param recipientIndex - Index of this recipient in the recipient list
   * @param options - Decryption options
   * @returns Decrypted plaintext
   */
  decryptMultiRecipient(
    recipientPrivateKey: PlatformBuffer,
    ciphertext: PlatformBuffer,
    recipientIndex: number,
    options?: Partial<IEciesEncryptionOptions>,
  ): Promise<PlatformBuffer>;
}

/**
 * Common interface for cryptographic core operations
 */
export interface ICryptoCoreService {
  /**
   * Generate a random ECDH key pair
   *
   * @param curveName - Elliptic curve to use (default: 'secp256k1')
   * @returns Key pair with private and public keys
   */
  generateKeyPair(curveName?: string): Promise<{
    privateKey: PlatformBuffer;
    publicKey: PlatformBuffer;
  }>;

  /**
   * Derive public key from private key
   *
   * @param privateKey - ECDH private key
   * @param curveName - Elliptic curve to use (default: 'secp256k1')
   * @param compressed - Whether to return compressed public key
   * @returns Public key
   */
  derivePublicKey(
    privateKey: PlatformBuffer,
    curveName?: string,
    compressed?: boolean,
  ): Promise<PlatformBuffer>;

  /**
   * Perform ECDH key agreement
   *
   * @param privateKey - Our private key
   * @param publicKey - Their public key
   * @param curveName - Elliptic curve to use (default: 'secp256k1')
   * @returns Shared secret
   */
  deriveSharedSecret(
    privateKey: PlatformBuffer,
    publicKey: PlatformBuffer,
    curveName?: string,
  ): Promise<PlatformBuffer>;

  /**
   * Sign data with ECDSA
   *
   * @param privateKey - Signing key
   * @param data - Data to sign
   * @param curveName - Elliptic curve to use (default: 'secp256k1')
   * @returns Signature
   */
  sign(
    privateKey: PlatformBuffer,
    data: PlatformBuffer,
    curveName?: string,
  ): Promise<PlatformBuffer>;

  /**
   * Verify ECDSA signature
   *
   * @param publicKey - Verification key
   * @param data - Original data
   * @param signature - Signature to verify
   * @param curveName - Elliptic curve to use (default: 'secp256k1')
   * @returns True if signature is valid
   */
  verify(
    publicKey: PlatformBuffer,
    data: PlatformBuffer,
    signature: PlatformBuffer,
    curveName?: string,
  ): Promise<boolean>;
}

/**
 * Common interface for PBKDF2 key derivation
 */
export interface IPbkdf2Service {
  /**
   * Derive a key from a password using PBKDF2
   *
   * @param password - Password to derive from
   * @param salt - Salt value
   * @param iterations - Number of iterations
   * @param keyLength - Desired key length in bytes
   * @param hashAlgorithm - Hash algorithm (default: 'sha256')
   * @returns Derived key
   */
  derive(
    password: string | PlatformBuffer,
    salt: PlatformBuffer,
    iterations: number,
    keyLength: number,
    hashAlgorithm?: string,
  ): Promise<PlatformBuffer>;

  /**
   * Generate a random salt
   *
   * @param length - Salt length in bytes (default: 32)
   * @returns Random salt
   */
  generateSalt(length?: number): PlatformBuffer;
}

/**
 * Common interface for AES-GCM encryption
 */
export interface IAesGcmService {
  /**
   * Encrypt data with AES-GCM
   *
   * @param key - Encryption key (16, 24, or 32 bytes)
   * @param plaintext - Data to encrypt
   * @param aad - Additional authenticated data (optional)
   * @returns IV (12 bytes) + ciphertext + auth tag (16 bytes)
   */
  encrypt(
    key: PlatformBuffer,
    plaintext: PlatformBuffer,
    aad?: PlatformBuffer,
  ): Promise<PlatformBuffer>;

  /**
   * Decrypt AES-GCM encrypted data
   *
   * @param key - Decryption key
   * @param ciphertext - IV + encrypted data + auth tag
   * @param aad - Additional authenticated data (optional)
   * @returns Decrypted plaintext
   */
  decrypt(
    key: PlatformBuffer,
    ciphertext: PlatformBuffer,
    aad?: PlatformBuffer,
  ): Promise<PlatformBuffer>;
}

/**
 * Common interface for checksum/hashing operations
 */
export interface IChecksumService {
  /**
   * Compute SHA-256 hash
   *
   * @param data - Data to hash
   * @returns SHA-256 hash (32 bytes)
   */
  sha256(data: PlatformBuffer): Promise<PlatformBuffer>;

  /**
   * Compute SHA-512 hash
   *
   * @param data - Data to hash
   * @returns SHA-512 hash (64 bytes)
   */
  sha512(data: PlatformBuffer): Promise<PlatformBuffer>;

  /**
   * Compute HMAC with SHA-256
   *
   * @param key - HMAC key
   * @param data - Data to authenticate
   * @returns HMAC tag (32 bytes)
   */
  hmacSha256(
    key: PlatformBuffer,
    data: PlatformBuffer,
  ): Promise<PlatformBuffer>;

  /**
   * Compute HMAC with SHA-512
   *
   * @param key - HMAC key
   * @param data - Data to authenticate
   * @returns HMAC tag (64 bytes)
   */
  hmacSha512(
    key: PlatformBuffer,
    data: PlatformBuffer,
  ): Promise<PlatformBuffer>;
}

// IVotingService is defined in voting-service.ts and re-exported from there

/**
 * Platform-specific random number generation
 */
export interface IRandomService {
  /**
   * Generate cryptographically secure random bytes
   *
   * @param length - Number of bytes to generate
   * @returns Random bytes
   */
  randomBytes(length: number): PlatformBuffer;

  /**
   * Generate a random integer in range [0, max)
   *
   * @param max - Upper bound (exclusive)
   * @returns Random integer
   */
  randomInt(max: number): number;
}

/**
 * Root interface combining all service interfaces
 * Both ecies-lib and node-ecies-lib should provide implementations
 * that conform to these contracts
 */
export interface IEciesLibrary {
  /**
   * Core ECIES encryption/decryption operations
   */
  ecies: IEciesService;

  /**
   * Low-level cryptographic primitives
   */
  cryptoCore: ICryptoCoreService;

  /**
   * PBKDF2 key derivation
   */
  pbkdf2: IPbkdf2Service;

  /**
   * AES-GCM symmetric encryption
   */
  aesGcm: IAesGcmService;

  /**
   * Checksum and hashing operations
   */
  checksum: IChecksumService;

  /**
   * Voting system (Paillier homomorphic encryption)
   */
  voting: IVotingService;

  /**
   * Cryptographically secure random number generation
   */
  random: IRandomService;
}
