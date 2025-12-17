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
   * Constant-time comparison to prevent timing attacks.
   */
  equals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
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
