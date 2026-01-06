import { randomBytes } from '@noble/hashes/utils.js';
import { IdProviderErrorType } from '../../enumerations/id-provider-error-type';
import { IdProviderError } from '../../errors/id-provider';
import { BaseIdProvider } from '../base-id-provider';

/**
 * Custom ID provider that accepts any fixed byte length.
 *
 * Use this when you need a non-standard ID size or custom validation logic.
 * For standard formats, prefer ObjectIdProvider, GuidV4Provider, or UuidProvider.
 *
 * Example:
 * ```typescript
 * // 20-byte SHA-1 hash as recipient ID
 * const provider = new CustomIdProvider(20, 'SHA1Hash');
 * ```
 */
export class CustomIdProvider extends BaseIdProvider<Uint8Array> {
  readonly byteLength: number;
  readonly name: string;

  constructor(byteLength: number, name = 'Custom') {
    super();

    if (!Number.isInteger(byteLength) || byteLength < 1 || byteLength > 255) {
      throw new IdProviderError(
        IdProviderErrorType.InvalidByteLengthParameter,
        undefined,
        undefined,
        { value: byteLength },
      );
    }

    this.byteLength = byteLength;
    this.name = name;
  }

  /**
   * Generate a new random ID of the specified byte length.
   */
  generate(): Uint8Array {
    return randomBytes(this.byteLength);
  }

  /**
   * Validate an ID buffer.
   * Only checks length - override this method for custom validation.
   */
  validate(id: Uint8Array): boolean {
    return id.length === this.byteLength;
  }

  /**
   * Serialize to hexadecimal string.
   */
  serialize(id: Uint8Array): string {
    this.validateLength(id, `${this.name}.serialize`);

    return Array.from(id)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Deserialize a hexadecimal string to buffer.
   */
  deserialize(str: string): Uint8Array {
    if (typeof str !== 'string') {
      throw new IdProviderError(IdProviderErrorType.InputMustBeString);
    }

    const expectedLength = this.byteLength * 2;
    if (str.length !== expectedLength) {
      throw new IdProviderError(
        IdProviderErrorType.InvalidStringLength,
        undefined,
        undefined,
        { expected: expectedLength, actual: str.length },
      );
    }

    if (!/^[0-9a-fA-F]+$/.test(str)) {
      throw new IdProviderError(IdProviderErrorType.InvalidCharacters);
    }

    const buffer = new Uint8Array(this.byteLength);
    for (let i = 0; i < this.byteLength; i++) {
      buffer[i] = parseInt(str.substr(i * 2, 2), 16);
    }

    return buffer;
  }

  /**
   * Create a defensive copy of an ID.
   */
  clone(id: Uint8Array): Uint8Array {
    return new Uint8Array(id);
  }

  /**
   * Convert Uint8Array to the provider's native representation.
   * For CustomIdProvider, the native type is Uint8Array, so this is a pass-through.
   */
  fromBytes(bytes: Uint8Array): Uint8Array {
    return bytes;
  }

  /**
   * Convert the provider's native representation to Uint8Array.
   * For CustomIdProvider, the native type is Uint8Array, so this is a pass-through.
   */
  toBytes(id: Uint8Array): Uint8Array {
    return id;
  }

  /**
   * Compare two IDs for equality using constant-time comparison.
   */
  equals(a: Uint8Array, b: Uint8Array): boolean {
    return this.constantTimeEquals(a, b);
  }
}
