/**
 * Interface for ID providers that supply recipient identifiers.
 * This allows the library to support various ID formats (ObjectID, GUID, UUID, custom).
 */
export interface IIdProvider {
  /**
   * The fixed byte length of IDs produced by this provider.
   * This determines the size of recipient ID fields in encrypted messages.
   */
  readonly byteLength: number;

  /**
   * A human-readable name for this ID provider type.
   * Examples: 'ObjectID', 'GUIDv4', 'UUIDv4', 'Custom'
   */
  readonly name: string;

  /**
   * Generate a new random ID.
   * @returns A newly generated ID as a Uint8Array of length `byteLength`
   */
  generate(): Uint8Array;

  /**
   * Validate that a given buffer is a properly formatted ID for this provider.
   * This should check length, format constraints, and any version bits if applicable.
   * @param id The ID buffer to validate
   * @returns True if the ID is valid for this provider, false otherwise
   */
  validate(id: Uint8Array): boolean;

  /**
   * Serialize an ID buffer to a human-readable string representation.
   * Examples: hex string, base64, ObjectID hex, UUID format with dashes
   * @param id The ID buffer to serialize
   * @returns A string representation of the ID
   * @throws Error if the ID is invalid
   */
  serialize(id: Uint8Array): string;

  /**
   * Deserialize a string representation back to an ID buffer.
   * This is the inverse of `serialize`.
   * @param str The string representation of the ID
   * @returns The ID as a Uint8Array of length `byteLength`
   * @throws Error if the string is not a valid representation
   */
  deserialize(str: string): Uint8Array;

  /**
   * Compare two IDs for equality.
   * Default implementation uses constant-time comparison.
   * @param a First ID
   * @param b Second ID
   * @returns True if IDs are equal, false otherwise
   */
  equals(a: Uint8Array, b: Uint8Array): boolean;

  /**
   * Clone an ID buffer.
   * Default implementation creates a defensive copy.
   * @param id The ID to clone
   * @returns A new Uint8Array with the same contents
   */
  clone(id: Uint8Array): Uint8Array;

  /**
   * Convert an ID of unknown type to a string representation.
   * This is useful when dealing with generic IDs that might be Uint8Array, string, or other types.
   * @param id The ID to convert
   * @returns A string representation of the ID
   */
  idToString(id: unknown): string;

  /**
   * Convert a string representation of an ID back to an ID buffer.
   * This is an alias for `deserialize` to provide symmetry with `idToString`.
   * @param str The string representation of the ID
   * @returns The ID as a Uint8Array of length `byteLength`
   */
  idFromString(str: string): Uint8Array;
}

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
      const { IdProviderError } = require('../errors/id-provider');
      const { IdProviderErrorType } = require('../enumerations/id-provider-error-type');
      throw new IdProviderError(
        IdProviderErrorType.InvalidLength,
        undefined,
        undefined,
        { context, expected: this.byteLength, actual: id.length }
      );
    }
  }
}
