import { IdProviderErrorType } from '../enumerations/id-provider-error-type';
import { IdProviderError } from '../errors/id-provider';
import type { IIdProvider } from '../interfaces/id-provider';

/**
 * Base class for ID providers with common utility methods.
 */
export abstract class BaseIdProvider implements IIdProvider {
  abstract readonly byteLength: number;
  abstract readonly name: string;

  abstract generate(): Uint8Array;
  abstract validate(id: Uint8Array): boolean;
  abstract serialize(id: Uint8Array): string;
  abstract deserialize(str: string): Uint8Array;

  /**
   * Convert an ID of unknown type to a string representation.
   * Default implementation handles Uint8Array using serialize(), and falls back to String().
   */
  idToString(id: unknown): string {
    if (id instanceof Uint8Array) {
      return this.serialize(id);
    }
    return String(id);
  }

  /**
   * Convert a string representation of an ID back to an ID buffer.
   * Default implementation delegates to `deserialize`.
   */
  idFromString(str: string): Uint8Array {
    return this.deserialize(str);
  }

  /**
   * Convert any ID representation to canonical Uint8Array format.
   * Default implementation handles common types.
   */
  toBytes(id: unknown): Uint8Array {
    if (id instanceof Uint8Array) {
      return this.clone(id);
    }
    if (typeof id === 'string') {
      return this.deserialize(id);
    }
    // For other types, convert to string first then deserialize
    return this.deserialize(String(id));
  }

  /**
   * Convert Uint8Array to the provider's native representation.
   * Default implementation returns Uint8Array (no conversion).
   */
  fromBytes(bytes: Uint8Array): unknown {
    this.validateLength(bytes, 'BaseIdProvider.fromBytes');
    return this.clone(bytes);
  }

  /**
   * Constant-time comparison to prevent timing attacks.
   */
  equals(a: unknown, b: unknown): boolean {
    if (a instanceof Uint8Array && b instanceof Uint8Array) {
      if (a.length !== b.length) {
        return false;
      }
      let diff = 0;
      for (let i = 0; i < a.length; i++) {
        diff |= a[i] ^ b[i];
      }
      return diff === 0;
    }
    return false;
  }

  /**
   * Create a defensive copy of an ID.
   */
  clone(id: Uint8Array): Uint8Array {
    return new Uint8Array(id);
  }

  /**
   * Validate ID length matches expected byte length.
   */
  protected validateLength(id: Uint8Array, context: string): void {
    if (id.length !== this.byteLength) {
      throw new IdProviderError(
        IdProviderErrorType.InvalidLength,
        undefined,
        undefined,
        { context, expected: this.byteLength, actual: id.length },
      );
    }
  }
}
