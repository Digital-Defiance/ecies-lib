import { IdProviderErrorType } from '../../enumerations';
import { IdProviderError } from '../../errors';
import { arraysEqual, hexToUint8Array, uint8ArrayToHex } from '../../utils';
import { BaseIdProvider } from '../base-id-provider';

/**
 * Uint8Array ID provider that accepts any fixed byte length.
 *
 * Use this when you need a non-standard ID size or custom validation logic with Node.js Uint8Arrays.
 * For standard formats, prefer ObjectIdProvider, GuidV4Provider, or UuidProvider.
 *
 * Example:
 * ```typescript
 * // 20-byte SHA-1 hash as recipient ID
 * const provider = new Uint8ArrayIdProvider(20, 'SHA1Hash');
 * ```
 */
export class Uint8ArrayIdProvider extends BaseIdProvider<Uint8Array> {
  readonly byteLength: number;
  readonly name: string;

  constructor(byteLength: number, name = 'Uint8Array') {
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
    const bytes = new Uint8Array(this.byteLength);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  /**
   * Validate an ID Uint8Array.
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
    return uint8ArrayToHex(id);
  }

  /**
   * Deserialize a hexadecimal string to Uint8Array.
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

    return hexToUint8Array(str);
  }

  /**
   * Create a defensive copy of an ID.
   */
  clone(id: Uint8Array): Uint8Array {
    return Uint8Array.from(id);
  }

  /**
   * Convert Uint8Array to the provider's native representation.
   * For Uint8ArrayIdProvider, the native type is Uint8Array, so this is a pass-through.
   */
  fromBytes(bytes: Uint8Array): Uint8Array {
    return bytes;
  }

  /**
   * Convert the provider's native representation to Uint8Array.
   * For Uint8ArrayIdProvider, the native type is Uint8Array, so this is a pass-through.
   */
  toBytes(id: Uint8Array): Uint8Array {
    return id;
  }

  /**
   * Compare two IDs for equality.
   */
  equals(a: Uint8Array, b: Uint8Array): boolean {
    return arraysEqual(a, b);
  }
}
