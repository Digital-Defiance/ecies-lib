import type { ObjectId } from 'bson';
import { SecureStorageErrorType } from './enumerations/secure-storage-error-type';
import { DisposedError } from './errors/disposed';
import { SecureStorageError } from './errors/secure-storage';
import type { IIdProvider } from './interfaces/id-provider';
import { ObjectIdProvider } from './lib/id-providers/objectid-provider';
import { XorService } from './services/xor';
import { uint8ArrayToHex } from './utils';

/**
 * Default ID provider (singleton, no circular dependency)
 */
const DEFAULT_ID_PROVIDER = new ObjectIdProvider();

/**
 * A secure string buffer that prevents raw sensitive data from being stored in memory.
 * Similar to SecureBuffer but specifically designed for string data.
 *
 * Features:
 * - XOR obfuscation of sensitive string data
 * - Null value support
 * - Checksum validation for data integrity
 * - Stack trace capture for debugging disposed access
 * - Configurable ID provider
 *
 * @example
 * ```typescript
 * const securePassword = new SecureString('myPassword123');
 * const password = securePassword.value; // Retrieves the original string
 * securePassword.dispose(); // Zeroes out sensitive data
 * ```
 */
export class SecureString {
  private _disposed: boolean = false;
  private readonly _isNull: boolean;
  private readonly _id: Uint8Array;
  private readonly _idProvider: IIdProvider<ObjectId>;
  private readonly _length: number;
  private readonly _obfuscatedValue: Uint8Array;
  private readonly _key: Uint8Array;
  private readonly _obfuscatedChecksum: Uint8Array;
  private _disposedAt?: string;
  /**
   * Creates a new SecureString instance.
   * @param data Optional data to secure (string, Uint8Array, or null)
   * @param idProvider ID provider for generating unique IDs (defaults to ObjectIdProvider)
   */
  constructor(
    data?: string | Uint8Array | null,
    idProvider: IIdProvider<ObjectId> = DEFAULT_ID_PROVIDER,
  ) {
    this._idProvider = idProvider;
    this._id = this._idProvider.generate();
    // only treat null/undefined as null, empty strings/arrays are valid empty data
    if (data === null || data === undefined) {
      this._isNull = true;
      this._length = 0;
      this._obfuscatedValue = new Uint8Array(0);
      this._key = new Uint8Array(0);
      this._obfuscatedChecksum = new Uint8Array(0);
      return;
    }
    this._isNull = false;
    this._key = this._id;
    const dataAsUint8Array =
      typeof data === 'string'
        ? new TextEncoder().encode(data)
        : (data as Uint8Array);
    // Store the byte length, not the character length
    this._length = dataAsUint8Array.length;
    this._obfuscatedValue = this.obfuscateData(dataAsUint8Array);
    this._obfuscatedChecksum =
      this.createSimpleObfuscatedChecksum(dataAsUint8Array);
  }

  /**
   * Factory method for backward compatibility that uses the default ObjectIdProvider
   * @param data Optional data to secure
   * @returns A new SecureString instance using the default ID provider
   */
  static create(data?: string | Uint8Array | null): SecureString {
    return new SecureString(data, DEFAULT_ID_PROVIDER);
  }

  /**
   * Asserts that the string has not been disposed.
   * @throws {DisposedError} If the string has been disposed
   */
  private assertNotDisposed(): void {
    if (this._disposed) {
      const e = new DisposedError();
      try {
        e.disposedAt = this._disposedAt;
      } catch {
        // ignore if Error object is sealed/frozen
      }
      throw e;
    }
  }
  /**
   * Disposes the secure string, zeroing out all sensitive data.
   * Captures a stack trace for debugging if the string is accessed after disposal.
   */
  public dispose(): void {
    const err = new DisposedError();
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(err, this.dispose);
    }
    this._disposedAt = err.stack ?? 'stack unavailable';
    this._obfuscatedValue.fill(0);
    this._key.fill(0);
    this._obfuscatedChecksum.fill(0);
    this._disposed = true;
  }
  /**
   * Gets the stack trace from when the string was disposed.
   * Useful for debugging access-after-dispose errors.
   */
  public get disposedAtStack(): string | undefined {
    return this._disposedAt;
  }
  /**
   * Gets the string's unique ID as a string.
   * @throws {DisposedError} If the string has been disposed
   */
  public get id(): string {
    this.assertNotDisposed();
    return this._idProvider.serialize(this._id);
  }
  /**
   * Gets the string's unique ID as a Uint8Array.
   * @throws {DisposedError} If the string has been disposed
   */
  public get idUint8Array(): Uint8Array {
    this.assertNotDisposed();
    return this._id;
  }
  /**
   * Gets the original length of the secured data in bytes.
   * @throws {DisposedError} If the string has been disposed
   */
  public get originalLength(): number {
    this.assertNotDisposed();
    return this._length;
  }
  /**
   * Gets the decrypted value as a Uint8Array.
   * Validates the checksum to ensure data integrity.
   * @throws {DisposedError} If the string has been disposed
   * @throws {SecureStorageError} If decryption fails or checksum is invalid
   */
  public get valueAsUint8Array(): Uint8Array {
    this.assertNotDisposed();
    if (this._isNull) {
      return new Uint8Array(0);
    }
    try {
      const deobfuscatedResult = this.deobfuscateData(this._obfuscatedValue);
      if (deobfuscatedResult.length !== this._length) {
        throw new SecureStorageError(
          SecureStorageErrorType.DecryptedValueLengthMismatch,
        );
      }

      // Validate checksum
      const expectedChecksum = this.createSimpleChecksum(deobfuscatedResult);
      const storedChecksum = new TextDecoder().decode(
        this.deobfuscateData(this._obfuscatedChecksum),
      );

      const expectedBytes = new TextEncoder().encode(expectedChecksum);
      const storedBytes = new TextEncoder().encode(storedChecksum);
      if (!this.timingSafeEqual(expectedBytes, storedBytes)) {
        throw new SecureStorageError(
          SecureStorageErrorType.DecryptedValueChecksumMismatch,
        );
      }

      return deobfuscatedResult;
    } catch (error) {
      // If it's already a SecureStorageError, re-throw it
      if (error instanceof SecureStorageError) {
        throw error;
      }
      // Convert any other error to SecureStorageError
      throw new SecureStorageError(
        SecureStorageErrorType.DecryptedValueChecksumMismatch,
      );
    }
  }
  /**
   * Gets the decrypted value as a string, or null if the value is null.
   * @throws {DisposedError} If the string has been disposed
   */
  public get value(): string | null {
    this.assertNotDisposed();
    if (this._isNull) {
      return null;
    }
    return new TextDecoder().decode(this.valueAsUint8Array);
  }
  /**
   * Gets the decrypted value as a string, throwing if the value is null.
   * @throws {DisposedError} If the string has been disposed
   * @throws {SecureStorageError} If the value is null
   */
  public get notNullValue(): string {
    this.assertNotDisposed();
    if (this._isNull) {
      throw new SecureStorageError(SecureStorageErrorType.ValueIsNull);
    }
    return new TextDecoder().decode(this.valueAsUint8Array);
  }
  /**
   * Gets the decrypted value as a hexadecimal string.
   * @throws {DisposedError} If the string has been disposed
   */
  public get valueAsHexString(): string {
    this.assertNotDisposed();
    return uint8ArrayToHex(this.valueAsUint8Array);
  }
  /**
   * Gets the decrypted value as a Base64 string.
   * @throws {DisposedError} If the string has been disposed
   */
  public get valueAsBase64String(): string {
    this.assertNotDisposed();
    return btoa(String.fromCharCode(...this.valueAsUint8Array));
  }
  /**
   * Checks if the string has a non-null, non-empty value.
   * @throws {DisposedError} If the string has been disposed
   */
  public get hasValue(): boolean {
    this.assertNotDisposed();
    return !this._isNull && this._length > 0;
  }
  /**
   * Gets the checksum of the secured data.
   * @throws {DisposedError} If the string has been disposed
   */
  public get checksum(): string {
    this.assertNotDisposed();
    const deobfuscatedChecksum = new TextDecoder().decode(
      this.deobfuscateData(this._obfuscatedChecksum),
    );
    return deobfuscatedChecksum;
  }
  /**
   * Gets the length of the secured data in bytes.
   * @throws {DisposedError} If the string has been disposed
   */
  public get length(): number {
    this.assertNotDisposed();
    return this._length;
  }
  /**
   * Generates a SHA-256 checksum for data validation (async).
   * @param data The data to checksum (string or Uint8Array)
   * @returns Promise resolving to hexadecimal checksum string
   */
  private async generateChecksum(data: string | Uint8Array): Promise<string> {
    const dataBytes =
      typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const hashArray = await crypto.subtle.digest(
      'SHA-256',
      new Uint8Array(dataBytes),
    );
    return uint8ArrayToHex(new Uint8Array(hashArray));
  }
  /**
   * Creates a simple checksum for data validation (synchronous).
   * @param data The data to checksum
   * @returns Hexadecimal checksum string
   */
  private createSimpleChecksum(data: Uint8Array): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
    }
    return hash.toString(16);
  }

  /**
   * Creates an obfuscated checksum for the data (synchronous).
   * @param data The data to checksum
   * @returns Obfuscated checksum as Uint8Array
   */
  private createSimpleObfuscatedChecksum(
    data: string | Uint8Array,
  ): Uint8Array {
    const dataBytes =
      typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const checksum = this.createSimpleChecksum(dataBytes);
    return this.obfuscateData(new TextEncoder().encode(checksum));
  }

  private async __createObfuscatedChecksum(
    data: string | Uint8Array,
  ): Promise<Uint8Array> {
    const checksum = await this.generateChecksum(data);
    const result = this.obfuscateData(new TextEncoder().encode(checksum));
    return result;
  }
  /**
   * Validates a checksum against data using timing-safe comparison (async).
   * @param data The data to validate
   * @param checksum The expected checksum
   * @returns Promise resolving to true if checksum is valid
   */
  private async validateChecksum(
    data: string | Uint8Array,
    checksum: string,
  ): Promise<boolean> {
    const generatedChecksum = await this.generateChecksum(data);
    return generatedChecksum === checksum;
  }

  /**
   * Performs timing-safe equality comparison of two byte arrays.
   * Prevents timing attacks by always comparing all bytes.
   * @param a First array
   * @param b Second array
   * @returns True if arrays are equal
   */
  private timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }
  private async __validateObfuscatedChecksum(
    data: string | Uint8Array,
  ): Promise<boolean> {
    const deobfuscatedChecksum = new TextDecoder().decode(
      this.deobfuscateData(this._obfuscatedChecksum),
    );
    return this.validateChecksum(data, deobfuscatedChecksum);
  }
  /**
   * Obfuscates data using XOR with the key.
   * @param data The data to obfuscate
   * @returns Obfuscated data
   */
  private obfuscateData(data: Uint8Array): Uint8Array {
    return XorService.xor(data, this._key);
  }
  /**
   * Deobfuscates data using XOR with the key.
   * @param data The data to deobfuscate
   * @returns Deobfuscated data
   */
  private deobfuscateData(data: Uint8Array): Uint8Array {
    return XorService.xor(data, this._key);
  }
}
