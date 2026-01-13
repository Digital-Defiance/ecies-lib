import { SecureStorageErrorType } from './enumerations/secure-storage-error-type';
import { DisposedError } from './errors/disposed';
import { SecureStorageError } from './errors/secure-storage';
import { ObjectIdProvider } from './lib/id-providers/objectid-provider';
import { XorService } from './services/xor';
import { uint8ArrayToHex } from './utils';

/**
 * A secure buffer that prevents raw sensitive data from being stored in memory.
 * The buffer is obfuscated with a key derived from a random ID.
 *
 * Features:
 * - XOR obfuscation of sensitive data
 * - Automatic disposal support (TC39 explicit resource management)
 * - Checksum validation for data integrity
 * - Stack trace capture for debugging disposed access
 *
 * @example
 * ```typescript
 * // Using explicit resource management
 * using buffer = new SecureBuffer(sensitiveData);
 * // buffer automatically disposed when leaving scope
 *
 * // Manual disposal
 * const buffer = new SecureBuffer(sensitiveData);
 * try {
 *   const data = buffer.value;
 * } finally {
 *   buffer.dispose();
 * }
 * ```
 */
export class SecureBuffer implements Disposable {
  private _disposed: boolean = false;
  private readonly _id: Uint8Array;
  private readonly _idProvider: ObjectIdProvider;
  private readonly _length: number;
  private readonly _obfuscatedValue: Uint8Array;
  private readonly _key: Uint8Array;
  private readonly _obfuscatedChecksum: Uint8Array;
  private _disposedAt?: string;

  /**
   * Creates a new SecureBuffer instance.
   * @param data Optional data to secure. If undefined or empty, creates an empty buffer.
   */
  constructor(data?: Uint8Array) {
    this._idProvider = new ObjectIdProvider();
    this._id = this._idProvider.generate();
    // don't bother encrypting an empty buffer
    if (data === undefined || data.length === 0) {
      this._length = 0;
      this._obfuscatedValue = new Uint8Array(0);
      this._key = new Uint8Array(0);
      this._obfuscatedChecksum = new Uint8Array(0);
      return;
    }
    this._length = data.length;
    this._key = this._id;
    this._obfuscatedValue = this.obfuscateData(data);
    // Create a simple checksum without crypto for synchronous operation
    this._obfuscatedChecksum = this.createSimpleObfuscatedChecksum(data);
  }
  /**
   * Disposes the secure buffer, zeroing out all sensitive data.
   * Captures a stack trace for debugging if the buffer is accessed after disposal.
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
   * Symbol.dispose implementation for explicit resource management
   * Allows using 'using' keyword (TC39 proposal)
   */
  [Symbol.dispose](): void {
    this.dispose();
  }

  /**
   * Factory method for backward compatibility that uses the default ObjectIdProvider.
   * @param data Optional data to secure
   * @returns A new SecureBuffer instance using the default ID provider
   */
  static create(data?: Uint8Array): SecureBuffer {
    return new SecureBuffer(data);
  }

  /**
   * Static factory method that creates a SecureBuffer for a symmetric key.
   * Useful for managing encryption keys securely.
   * @param sizeBytes Size of the key in bytes (default: 32)
   * @returns A new SecureBuffer instance for the key
   */
  static allocateKey(sizeBytes: number = 32): SecureBuffer {
    const keyData = new Uint8Array(sizeBytes);
    // Will be filled by crypto.getRandomValues by caller
    return new SecureBuffer(keyData);
  }

  /**
   * Asserts that the buffer has not been disposed.
   * @throws {DisposedError} If the buffer has been disposed
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
   * Creates a SecureBuffer from a string.
   * @param data The string to secure
   * @returns A new SecureBuffer containing the UTF-8 encoded string
   */
  public static fromString(data: string): SecureBuffer {
    return new SecureBuffer(new TextEncoder().encode(data));
  }
  /**
   * Gets the stack trace from when the buffer was disposed.
   * Useful for debugging access-after-dispose errors.
   */
  public get disposedAtStack(): string | undefined {
    return this._disposedAt;
  }
  /**
   * Gets the buffer's unique ID as a string.
   * @throws {DisposedError} If the buffer has been disposed
   */
  public get id(): string {
    this.assertNotDisposed();
    return this._idProvider.serialize(this._id);
  }
  /**
   * Gets the buffer's unique ID as a Uint8Array.
   * @throws {DisposedError} If the buffer has been disposed
   */
  public get idUint8Array(): Uint8Array {
    this.assertNotDisposed();
    return this._id;
  }
  /**
   * Gets the original length of the secured data in bytes.
   * @throws {DisposedError} If the buffer has been disposed
   */
  public get originalLength(): number {
    this.assertNotDisposed();
    return this._length;
  }
  /**
   * Gets the decrypted value as a Uint8Array.
   * Validates the checksum to ensure data integrity.
   * @throws {DisposedError} If the buffer has been disposed
   * @throws {SecureStorageError} If decryption fails or checksum is invalid
   */
  public get value(): Uint8Array {
    this.assertNotDisposed();
    if (this._length === 0) {
      return new Uint8Array(0);
    }
    try {
      const deobfuscatedResult = this.deobfuscateData(this._obfuscatedValue);
      if (deobfuscatedResult.length !== this._length) {
        throw new SecureStorageError(
          SecureStorageErrorType.DecryptedValueLengthMismatch,
        );
      }
      if (!this.validateObfuscatedChecksum(deobfuscatedResult)) {
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
      // Convert any other error (including AES-GCM authentication errors) to SecureStorageError
      throw new SecureStorageError(
        SecureStorageErrorType.DecryptedValueChecksumMismatch,
      );
    }
  }
  /**
   * Gets the decrypted value as a UTF-8 string.
   * @throws {DisposedError} If the buffer has been disposed
   */
  public get valueAsString(): string {
    this.assertNotDisposed();
    return new TextDecoder().decode(this.value);
  }
  /**
   * Gets the decrypted value as a hexadecimal string.
   * @throws {DisposedError} If the buffer has been disposed
   */
  public get valueAsHexString(): string {
    this.assertNotDisposed();
    return uint8ArrayToHex(this.value);
  }
  /**
   * Gets the decrypted value as a Base64 string.
   * @throws {DisposedError} If the buffer has been disposed
   */
  public get valueAsBase64String(): string {
    this.assertNotDisposed();
    return btoa(String.fromCharCode(...this.value));
  }
  /**
   * Gets the checksum of the secured data.
   * @throws {DisposedError} If the buffer has been disposed
   */
  public get checksum(): string {
    this.assertNotDisposed();
    const deobfuscatedChecksum = new TextDecoder().decode(
      this.deobfuscateData(this._obfuscatedChecksum),
    );
    return deobfuscatedChecksum;
  }
  /**
   * Generates a simple checksum for data validation.
   * @param data The data to checksum (string or Uint8Array)
   * @returns Hexadecimal checksum string
   */
  private generateSimpleChecksum(data: string | Uint8Array): string {
    const dataBytes =
      typeof data === 'string' ? new TextEncoder().encode(data) : data;
    let hash = 0;
    for (let i = 0; i < dataBytes.length; i++) {
      hash = ((hash << 5) - hash + dataBytes[i]) & 0xffffffff;
    }
    return hash.toString(16);
  }
  /**
   * Creates an obfuscated checksum for the data.
   * @param data The data to checksum
   * @returns Obfuscated checksum as Uint8Array
   */
  private createSimpleObfuscatedChecksum(
    data: string | Uint8Array,
  ): Uint8Array {
    const checksum = this.generateSimpleChecksum(data);
    const result = this.obfuscateData(new TextEncoder().encode(checksum));
    return result;
  }
  /**
   * Validates a checksum against data using timing-safe comparison.
   * @param data The data to validate
   * @param checksum The expected checksum
   * @returns True if checksum is valid
   */
  private validateSimpleChecksum(
    data: string | Uint8Array,
    checksum: string,
  ): boolean {
    const generatedChecksum = this.generateSimpleChecksum(data);
    const a = new TextEncoder().encode(generatedChecksum);
    const b = new TextEncoder().encode(checksum);
    return this.timingSafeEqual(a, b);
  }

  /**
   * Performs timing-safe equality comparison of two byte arrays.
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
  /**
   * Validates the obfuscated checksum against data.
   * @param data The data to validate
   * @returns True if checksum is valid
   */
  private validateObfuscatedChecksum(data: string | Uint8Array): boolean {
    const deobfuscatedChecksum = new TextDecoder().decode(
      this.deobfuscateData(this._obfuscatedChecksum),
    );
    return this.validateSimpleChecksum(data, deobfuscatedChecksum);
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
  /**
   * Gets the length of the secured data in bytes.
   * @throws {DisposedError} If the buffer has been disposed
   */
  public get length(): number {
    this.assertNotDisposed();
    return this._length;
  }
}
