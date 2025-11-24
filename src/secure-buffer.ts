/// <reference path="../../../types/global.d.ts" />
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
 * A secure string buffer is a buffer whose intent is to prevent the raw password from being stored in memory.
 * The buffer is encrypted with a key derived from a random ID.
 * The ID is stored in the clear, but the buffer is encrypted with a key derived from the ID.
 * This allows the buffer to be decrypted, but only if the ID and salt are known.
 *
 * Supports explicit resource management (TC39 proposal) for automatic disposal:
 * ```typescript
 * using buffer = new SecureBuffer(sensitiveData);
 * // buffer automatically disposed when leaving scope
 * ```
 */
export class SecureBuffer implements Disposable {
  private _disposed: boolean = false;
  private readonly _id: Uint8Array;
  private readonly _idProvider: IIdProvider;
  private readonly _length: number;
  private readonly _obfuscatedValue: Uint8Array;
  private readonly _key: Uint8Array;
  private readonly _obfuscatedChecksum: Uint8Array;
  private _disposedAt?: string;

  constructor(
    data?: Uint8Array,
    idProvider: IIdProvider = DEFAULT_ID_PROVIDER,
  ) {
    this._idProvider = idProvider;
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
   * Factory method for backward compatibility that uses Constants.idProvider
   * @param data Optional data to secure
   * @returns A new SecureBuffer instance using the global ID provider
   */
  static create(data?: Uint8Array): SecureBuffer {
    const { Constants } = require('./constants');
    return new SecureBuffer(data, Constants.idProvider);
  }

  /**
   * Static factory method that creates a SecureBuffer for a symmetric key
   * Useful for managing encryption keys securely
   */
  static allocateKey(sizeBytes: number = 32): SecureBuffer {
    const keyData = new Uint8Array(sizeBytes);
    // Will be filled by crypto.getRandomValues by caller
    return new SecureBuffer(keyData);
  }

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
  public static fromString(data: string): SecureBuffer {
    return new SecureBuffer(new TextEncoder().encode(data));
  }
  public get disposedAtStack(): string | undefined {
    return this._disposedAt;
  }
  public get id(): string {
    this.assertNotDisposed();
    return this._idProvider.serialize(this._id);
  }
  public get idUint8Array(): Uint8Array {
    this.assertNotDisposed();
    return this._id;
  }
  public get originalLength(): number {
    this.assertNotDisposed();
    return this._length;
  }
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
  public get valueAsString(): string {
    this.assertNotDisposed();
    return new TextDecoder().decode(this.value);
  }
  public get valueAsHexString(): string {
    this.assertNotDisposed();
    return uint8ArrayToHex(this.value);
  }
  public get valueAsBase64String(): string {
    this.assertNotDisposed();
    return btoa(String.fromCharCode(...this.value));
  }
  public get checksum(): string {
    this.assertNotDisposed();
    const deobfuscatedChecksum = new TextDecoder().decode(
      this.deobfuscateData(this._obfuscatedChecksum),
    );
    return deobfuscatedChecksum;
  }
  private generateSimpleChecksum(data: string | Uint8Array): string {
    const dataBytes =
      typeof data === 'string' ? new TextEncoder().encode(data) : data;
    let hash = 0;
    for (let i = 0; i < dataBytes.length; i++) {
      hash = ((hash << 5) - hash + dataBytes[i]) & 0xffffffff;
    }
    return hash.toString(16);
  }
  private createSimpleObfuscatedChecksum(
    data: string | Uint8Array,
  ): Uint8Array {
    const checksum = this.generateSimpleChecksum(data);
    const result = this.obfuscateData(new TextEncoder().encode(checksum));
    return result;
  }
  private validateSimpleChecksum(
    data: string | Uint8Array,
    checksum: string,
  ): boolean {
    const generatedChecksum = this.generateSimpleChecksum(data);
    const a = new TextEncoder().encode(generatedChecksum);
    const b = new TextEncoder().encode(checksum);
    return this.timingSafeEqual(a, b);
  }

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
  private validateObfuscatedChecksum(data: string | Uint8Array): boolean {
    const deobfuscatedChecksum = new TextDecoder().decode(
      this.deobfuscateData(this._obfuscatedChecksum),
    );
    return this.validateSimpleChecksum(data, deobfuscatedChecksum);
  }
  private obfuscateData(data: Uint8Array): Uint8Array {
    return XorService.xor(data, this._key);
  }
  private deobfuscateData(data: Uint8Array): Uint8Array {
    return XorService.xor(data, this._key);
  }
  public get length(): number {
    this.assertNotDisposed();
    return this._length;
  }
}
