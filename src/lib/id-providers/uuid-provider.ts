import {
  parse as uuidParse,
  v4 as uuidv4,
  validate as uuidValidate,
} from 'uuid';
import { IdProviderErrorType } from '../../enumerations/id-provider-error-type';
import { IdProviderError } from '../../errors/id-provider';
import { BaseIdProvider } from '../base-id-provider';

/**
 * ID provider for standard RFC 4122 UUIDs (16 bytes).
 *
 * Uses the 'uuid' npm package for UUID generation and validation.
 * Serialization uses the standard UUID format with dashes (36 characters).
 *
 * This is functionally similar to GuidV4Provider but uses standard UUID
 * string formatting (with dashes) instead of base64.
 */
export class UuidProvider extends BaseIdProvider<string> {
  readonly byteLength = 16;
  readonly name = 'UUID';

  /**
   * Generate a new random UUIDv4.
   */
  generate(): Uint8Array {
    const buffer = new Uint8Array(16);
    uuidv4(undefined, buffer);
    return buffer;
  }

  /**
   * Validate a UUID buffer.
   * Checks length and RFC 4122 compliance.
   */
  validate(id: Uint8Array): boolean {
    if (id.length !== this.byteLength) {
      return false;
    }

    try {
      // Convert to string and validate
      const str = this.serialize(id);
      return uuidValidate(str);
    } catch {
      return false;
    }
  }

  /**
   * Serialize UUID to standard format with dashes (36 characters).
   * Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   */
  serialize(id: Uint8Array): string {
    this.validateLength(id, 'UuidProvider.serialize');

    const hex = Array.from(id)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Insert dashes at proper positions
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
      12,
      16,
    )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  /**
   * Deserialize a UUID string (with or without dashes) to buffer.
   */
  deserialize(str: string): Uint8Array {
    if (typeof str !== 'string') {
      throw new IdProviderError(IdProviderErrorType.InputMustBeString);
    }

    // Validate format
    if (!uuidValidate(str)) {
      throw new IdProviderError(
        IdProviderErrorType.InvalidUuidFormat,
        undefined,
        undefined,
        { input: str },
      );
    }

    try {
      const buffer = uuidParse(str);
      return buffer;
    } catch (error) {
      throw new IdProviderError(
        IdProviderErrorType.ParseFailed,
        { cause: error instanceof Error ? error : undefined },
        undefined,
        {
          input: str,
          message: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Extract the version from a UUID buffer.
   * Should return 4 for v4 UUIDs.
   */
  getVersion(id: Uint8Array): number | undefined {
    this.validateLength(id, 'UuidProvider.getVersion');

    // Version is in the most significant 4 bits of byte 6
    const versionByte = id[6];
    return (versionByte >> 4) & 0x0f;
  }

  /**
   * Check if a UUID is the nil UUID (all zeros).
   */
  isNil(id: Uint8Array): boolean {
    this.validateLength(id, 'UuidProvider.isNil');

    for (let i = 0; i < id.length; i++) {
      if (id[i] !== 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Convert an ID of unknown type to a string representation.
   * Delegates to base implementation.
   */
  override idToString(id: string): string {
    return super.idToString(id);
  }

  /**
   * Convert a string representation of an ID back to an ID buffer.
   * Delegates to deserialize.
   */
  override idFromString(str: string): string {
    return this.fromBytes(this.deserialize(str));
  }

  override equals(a: string, b: string): boolean {
    return a === b;
  }

  clone(id: string): string {
    return id; // strings are immutable, no need to copy
  }

  toBytes(id: string): Uint8Array {
    return this.deserialize(id); // UUID string → bytes
  }

  fromBytes(bytes: Uint8Array): string {
    return this.serialize(bytes); // bytes → UUID string
  }

  /**
   * Safely parse a UUID from a string, returning undefined if invalid instead of throwing.
   * Accepts multiple formats:
   * - Standard with dashes: '550e8400-e29b-41d4-a716-446655440000'
   * - Without dashes (32 hex chars): '550e8400e29b41d4a716446655440000'
   * - With braces: '{550e8400-e29b-41d4-a716-446655440000}'
   * - URN format: 'urn:uuid:550e8400-e29b-41d4-a716-446655440000'
   * - Whitespace-padded strings
   * - Case-insensitive
   * @param str The string to parse as a UUID
   * @returns The parsed UUID string in standard format, or undefined if invalid
   */
  parseSafe(str: string): string | undefined {
    try {
      let cleaned = str.trim();

      // Strip urn:uuid: prefix (case-insensitive)
      if (cleaned.toLowerCase().startsWith('urn:uuid:')) {
        cleaned = cleaned.slice(9);
      }

      // Strip braces
      if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        cleaned = cleaned.slice(1, -1);
      }

      // Insert dashes if 32 hex chars without dashes
      if (/^[0-9a-fA-F]{32}$/.test(cleaned)) {
        cleaned = `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}-${cleaned.slice(16, 20)}-${cleaned.slice(20)}`;
      }

      return this.fromBytes(this.deserialize(cleaned));
    } catch {
      return undefined;
    }
  }
}
