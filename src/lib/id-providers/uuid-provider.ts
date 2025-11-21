import { BaseIdProvider } from '../../interfaces/id-provider';
import { v4 as uuidv4, validate as uuidValidate, parse as uuidParse } from 'uuid';
import { IdProviderError } from '../../errors/id-provider';
import { IdProviderErrorType } from '../../enumerations/id-provider-error-type';

/**
 * ID provider for standard RFC 4122 UUIDs (16 bytes).
 * 
 * Uses the 'uuid' npm package for UUID generation and validation.
 * Serialization uses the standard UUID format with dashes (36 characters).
 * 
 * This is functionally similar to GuidV4Provider but uses standard UUID
 * string formatting (with dashes) instead of base64.
 */
export class UuidProvider extends BaseIdProvider {
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
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Insert dashes at proper positions
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
        { input: str }
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
        { input: str, message: error instanceof Error ? error.message : String(error) }
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
    return (versionByte >> 4) & 0x0F;
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
}
