/**
 * Result pattern for better error handling.
 * Provides a type-safe way to return either success with data or failure with error.
 */

import { CryptoError } from '../errors/crypto-error';

/**
 * Result type that represents either success with data or failure with error.
 * @template T The type of data returned on success
 */
export type CryptoResult<T> =
  | { success: true; data: T }
  | { success: false; error: CryptoError };

/**
 * Builder for creating CryptoResult instances.
 */
export class ResultBuilder {
  /**
   * Create a successful result.
   * @template T The type of data
   * @param data The success data
   * @returns A successful CryptoResult
   */
  static success<T>(data: T): CryptoResult<T> {
    return { success: true, data };
  }

  /**
   * Create a failure result.
   * @template T The type of data
   * @param error The error that occurred
   * @returns A failed CryptoResult
   */
  static failure<T>(error: CryptoError): CryptoResult<T> {
    return { success: false, error };
  }
}
