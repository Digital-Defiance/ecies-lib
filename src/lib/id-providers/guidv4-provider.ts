import { IdProviderErrorType } from '../../enumerations/id-provider-error-type';
import { IdProviderError } from '../../errors/id-provider';
import { BaseIdProvider } from '../base-id-provider';
import { Buffer } from '../buffer-compat';
import { GuidV4 } from '../guid';

/**
 * ID provider for GUIDv4 (16 bytes raw, 24 bytes base64).
 *
 * Uses the GuidV4 class which provides RFC 4122 compliant v4 GUIDs.
 * The raw binary representation is 16 bytes (128 bits).
 *
 * Serialization uses base64 for compactness (24 characters vs 36 for hex with dashes).
 */
export class GuidV4Provider extends BaseIdProvider {
  readonly byteLength = 16;
  readonly name = 'GUIDv4';

  /**
   * Generate a new random GUIDv4.
   */
  generate(): Uint8Array {
    const guid = GuidV4.generate();
    return guid.asRawGuidBufferUnsafe;
  }

  /**
   * Validate a GUID buffer.
   * Checks length and RFC 4122 v4 compliance.
   */
  validate(id: Uint8Array): boolean {
    if (id.length !== this.byteLength) {
      return false;
    }

    try {
      // Convert to GuidV4 and validate
      const guid = new GuidV4(Buffer.from(id));
      return guid.isValidV4();
    } catch {
      return false;
    }
  }

  /**
   * Serialize GUID to base64 string (24 characters).
   */
  serialize(id: Uint8Array): string {
    this.validateLength(id, 'GuidV4Provider.serialize');

    try {
      const guid = new GuidV4(Buffer.from(id));
      return guid.asBase64Guid;
    } catch (error) {
      throw new IdProviderError(
        IdProviderErrorType.InvalidGuidBuffer,
        { cause: error instanceof Error ? error : undefined },
        undefined,
        { message: error instanceof Error ? error.message : String(error) },
      );
    }
  }

  /**
   * Deserialize a base64 or hex GUID string to buffer.
   * Accepts multiple formats: base64 (24 chars), short hex (32 chars), full hex (36 chars).
   */
  deserialize(str: string): Uint8Array {
    if (typeof str !== 'string') {
      throw new IdProviderError(IdProviderErrorType.InputMustBeString);
    }

    try {
      const guid = GuidV4.parse(str);
      return guid.asRawGuidBufferUnsafe;
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
   * Create a GUID from a namespace and name (v5 - SHA-1 based).
   * Useful for deterministic GUIDs.
   */
  fromNamespace(namespace: string, name: string): Uint8Array {
    const guid = GuidV4.v5(name, namespace);
    return guid.asRawGuidBufferUnsafe;
  }

  /**
   * Get the GUID version from a buffer.
   * Should return 4 for valid v4 GUIDs.
   */
  getVersion(id: Uint8Array): number | undefined {
    this.validateLength(id, 'GuidV4Provider.getVersion');

    try {
      const guid = new GuidV4(Buffer.from(id));
      return guid.getVersion();
    } catch {
      return undefined;
    }
  }

  /**
   * Check if a GUID is the empty/nil GUID (all zeros).
   */
  isEmpty(id: Uint8Array): boolean {
    this.validateLength(id, 'GuidV4Provider.isEmpty');

    try {
      const guid = new GuidV4(Buffer.from(id));
      return guid.isEmpty();
    } catch {
      return false;
    }
  }

  /**
   * Convert an ID of unknown type to a string representation.
   * Handles Uint8Array, GuidV4 instances, and falls back to String().
   */
  override idToString(id: unknown): string {
    if (id instanceof GuidV4) {
      return id.asBase64Guid;
    }
    return super.idToString(id);
  }

  /**
   * Convert a string representation of an ID back to an ID buffer.
   * Delegates to deserialize.
   */
  override idFromString(str: string): Uint8Array {
    return this.deserialize(str);
  }
}
