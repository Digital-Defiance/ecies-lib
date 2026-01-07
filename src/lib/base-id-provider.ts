import { IdProviderErrorType } from '../enumerations/id-provider-error-type';
import { IdProviderError } from '../errors/id-provider';
import type { IIdProvider } from '../interfaces/id-provider';

/**
 * Base class for ID providers with common utility methods.
 *
 * Subclasses must implement all abstract methods for their specific ID type.
 * For providers where T = Uint8Array, see ByteIdProvider for a concrete base.
 */
export abstract class BaseIdProvider<T> implements IIdProvider<T> {
  abstract readonly byteLength: number;
  abstract readonly name: string;

  abstract generate(): Uint8Array;
  abstract validate(id: Uint8Array): boolean;
  abstract serialize(id: Uint8Array): string;
  abstract deserialize(str: string): Uint8Array;

  /**
   * Create a defensive copy of an ID.
   */
  abstract clone(id: T): T;

  /**
   * Convert Uint8Array to the provider's native representation.
   */
  abstract fromBytes(bytes: Uint8Array): T;

  /**
   * Convert the provider's native representation to Uint8Array.
   */
  abstract toBytes(id: T): Uint8Array;

  /**
   * Compare two IDs for equality.
   * Subclasses should implement constant-time comparison where possible.
   */
  abstract equals(a: T, b: T): boolean;

  /**
   * Convert an ID to a string representation.
   * Default implementation delegates to serialize().
   */
  idToString(id: T): string {
    return this.serialize(this.toBytes(id));
  }

  /**
   * Convert a string representation of an ID back to the native type.
   * Default implementation delegates to deserialize().
   */
  idFromString(str: string): T {
    return this.fromBytes(this.deserialize(str));
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

  /**
   * Constant-time comparison for Uint8Array buffers.
   * Utility method for subclasses to use in their equals() implementation.
   */
  protected constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
  }
}
