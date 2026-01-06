import { ObjectId } from 'bson';
import { IdProviderErrorType } from '../../enumerations/id-provider-error-type';
import { IdProviderError } from '../../errors/id-provider';
import { BaseIdProvider } from '../base-id-provider';

/**
 * ID provider for MongoDB/BSON ObjectIDs (12 bytes).
 *
 * Format: 4-byte timestamp + 5-byte random + 3-byte counter
 * This matches the MongoDB ObjectID specification.
 *
 * @see https://docs.mongodb.com/manual/reference/method/ObjectId/
 */
export class ObjectIdProvider extends BaseIdProvider {
  readonly byteLength = 12;
  readonly name = 'ObjectID';

  constructor() {
    super();
  }

  /**
   * Generate a new MongoDB-style ObjectID.
   * Format: [timestamp:4][random:5][counter:3]
   */
  generate(): Uint8Array {
    const buffer = new Uint8Array(12);
    const objectId = new ObjectId();

    if (typeof objectId.id === 'string') {
      const hex = objectId.id as string;
      for (let i = 0; i < 12; i++) {
        buffer[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      }
    } else {
      buffer.set(objectId.id, 0);
    }

    return buffer;
  }

  /**
   * Validate an ObjectID buffer.
   * Checks length and ensures it's not all zeros (invalid ObjectID).
   */
  validate(id: Uint8Array): boolean {
    if (id.length !== this.byteLength) {
      return false;
    }

    // Check if all bytes are zero (invalid ObjectID)
    let allZeros = true;
    for (let i = 0; i < id.length; i++) {
      if (id[i] !== 0) {
        allZeros = false;
        break;
      }
    }

    return !allZeros;
  }

  /**
   * Serialize ObjectID to 24-character hex string (MongoDB standard).
   */
  serialize(id: Uint8Array): string {
    this.validateLength(id, 'ObjectIdProvider.serialize');

    return Array.from(id)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Deserialize a 24-character hex string to ObjectID buffer.
   */
  deserialize(str: string): Uint8Array {
    if (typeof str !== 'string') {
      throw new IdProviderError(IdProviderErrorType.InputMustBeString);
    }

    if (str.length !== 24) {
      throw new IdProviderError(
        IdProviderErrorType.InvalidStringLength,
        undefined,
        undefined,
        { expected: 24, actual: str.length },
      );
    }

    if (!/^[0-9a-fA-F]{24}$/.test(str)) {
      throw new IdProviderError(IdProviderErrorType.InvalidCharacters);
    }

    const buffer = new Uint8Array(12);
    for (let i = 0; i < 12; i++) {
      buffer[i] = parseInt(str.substr(i * 2, 2), 16);
    }

    if (!this.validate(buffer)) {
      throw new IdProviderError(IdProviderErrorType.InvalidDeserializedId);
    }

    return buffer;
  }

  /**
   * Convert an ID of unknown type to a string representation.
   * Handles Uint8Array, ObjectId instances, and falls back to String().
   */
  override idToString(id: ObjectId): string {
    if (id instanceof ObjectId) {
      return id.toHexString();
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

  /**
   * Convert any ID representation to canonical Uint8Array format.
   */
  override toBytes(id: ObjectId): Uint8Array {
    if (id instanceof ObjectId) {
      return new Uint8Array(id.id);
    }
    return super.toBytes(id);
  }

  /**
   * Convert Uint8Array to ObjectId bytes (stays as Uint8Array for consistency).
   */
  override fromBytes(bytes: Uint8Array): Uint8Array {
    this.validateLength(bytes, 'ObjectIdProvider.fromBytes');
    return this.clone(bytes);
  }
}
