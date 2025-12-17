/**
 * Result pattern for better error handling
 */

import { CryptoError } from '../errors/crypto-error';

export type CryptoResult<T> =
  | { success: true; data: T }
  | { success: false; error: CryptoError };

export class ResultBuilder {
  static success<T>(data: T): CryptoResult<T> {
    return { success: true, data };
  }

  static failure<T>(error: CryptoError): CryptoResult<T> {
    return { success: false, error };
  }
}
