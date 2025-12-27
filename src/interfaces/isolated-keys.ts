/**
 * Shared interfaces for IsolatedPublicKey and IsolatedPrivateKey
 * These interfaces define the common API that both ecies-lib (Uint8Array)
 * and node-ecies-lib (Buffer) must implement.
 */

import type { PrivateKey, PublicKey } from 'paillier-bigint';

/**
 * Async/Sync mode flag for conditional return types
 */
export type AsyncMode = 'async' | 'sync';

/**
 * Conditional return type based on async mode
 */
export type MaybePromise<T, TMode extends AsyncMode> = TMode extends 'async'
  ? Promise<T>
  : T;

/**
 * Common interface for IsolatedPublicKey implementations
 * @template TBuffer - The buffer type (Uint8Array for browser, Buffer for Node.js)
 * @template TMode - 'async' for browser (ecies-lib), 'sync' for Node.js (node-ecies-lib)
 */
export interface IIsolatedPublicKey<
  TBuffer extends Uint8Array | Buffer = Uint8Array,
  TMode extends AsyncMode = 'async',
> extends PublicKey {
  /**
   * Deterministic identifier derived from the public key (SHA-256 of 'n')
   */
  readonly keyId: TBuffer;

  /**
   * Returns a copy of the keyId
   */
  getKeyId(): TBuffer;

  /**
   * Returns a copy of the current instance ID
   */
  getInstanceId(): TBuffer;

  /**
   * Updates the current instance ID to a new random value
   * This invalidates all previously encrypted ciphertexts
   */
  updateInstanceId(): MaybePromise<void, TMode>;

  /**
   * Verifies that the keyId matches the SHA-256 hash of the public key 'n'
   */
  verifyKeyId(): void;

  /**
   * Encrypts a message and tags it with instance HMAC
   */
  encryptIsolated(m: bigint): MaybePromise<bigint, TMode>;

  /**
   * Multiplies a ciphertext by a constant, preserving instance HMAC
   */
  multiplyIsolated(
    ciphertext: bigint,
    constant: bigint,
  ): MaybePromise<bigint, TMode>;

  /**
   * Adds two ciphertexts, preserving instance HMAC
   */
  additionIsolated(a: bigint, b: bigint): MaybePromise<bigint, TMode>;

  /**
   * Extracts and validates the instance ID from a tagged ciphertext
   * Returns the instance ID if valid, or zero-filled array if invalid
   */
  extractInstanceId(ciphertext: bigint): MaybePromise<TBuffer, TMode>;
}

/**
 * Common interface for IsolatedPrivateKey implementations
 * @template TBuffer - The buffer type (Uint8Array for browser, Buffer for Node.js)
 * @template TMode - 'async' for browser (ecies-lib), 'sync' for Node.js (node-ecies-lib)
 */
export interface IIsolatedPrivateKey<
  TBuffer extends Uint8Array | Buffer = Uint8Array,
  TMode extends AsyncMode = 'async',
> extends PrivateKey {
  /**
   * Decrypts a tagged ciphertext after validating instance ID and HMAC
   */
  decryptIsolated(taggedCiphertext: bigint): MaybePromise<bigint, TMode>;

  /**
   * Gets a copy of the original keyId
   */
  getOriginalKeyId(): TBuffer;

  /**
   * Gets a copy of the original instanceId
   */
  getOriginalInstanceId(): TBuffer;

  /**
   * Gets the original public key reference
   */
  getOriginalPublicKey(): IIsolatedPublicKey<TBuffer, TMode>;
}
