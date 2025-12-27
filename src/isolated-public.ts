import { PublicKey } from 'paillier-bigint';
import { VOTING } from './constants';
import { VotingErrorType } from './enumerations/voting-error-type';
import { VotingError } from './errors/voting';
import { IIsolatedPublicKey } from './interfaces/isolated-keys';

/**
 * IsolatedPublicKey extends Paillier PublicKey with instance isolation capabilities.
 *
 * This class provides:
 * - keyId: A deterministic SHA-256 hash of the public key 'n' value for verification
 * - instanceId: A unique identifier per key instance to prevent cross-instance operations
 * - HMAC-tagged ciphertexts that bind encrypted values to a specific key instance
 *
 * Instance isolation ensures that ciphertexts encrypted with one instance cannot be
 * used with another instance, even if they share the same underlying key material.
 * This is critical for voting systems where ballot tampering must be prevented.
 */
export class IsolatedPublicKey
  extends PublicKey
  implements IIsolatedPublicKey<Uint8Array, 'async'>
{
  /**
   * Type guard to check if a PublicKey is an IsolatedPublicKey
   */
  public static isIsolatedPublicKey(key: PublicKey): key is IsolatedPublicKey {
    return key instanceof IsolatedPublicKey;
  }

  /**
   * Deterministic identifier derived from the public key (SHA-256 of 'n')
   */
  public readonly keyId: Uint8Array;

  /**
   * Original instance ID generated at construction time
   */
  private readonly _originalInstanceId: Uint8Array;

  /**
   * Current instance ID (can be updated via updateInstanceId())
   */
  private _currentInstanceId: Uint8Array;

  /**
   * Unique salt used for instance ID generation
   */
  private readonly uniqueInstanceSalt: Uint8Array;

  /**
   * Updates the current instance ID to a new random value.
   * This invalidates all previously encrypted ciphertexts.
   */
  public async updateInstanceId(): Promise<void> {
    const randomSalt = new Uint8Array(32);
    crypto.getRandomValues(randomSalt);
    this._currentInstanceId = await this.generateInstanceId(
      this.keyId,
      this.n,
      randomSalt,
    );
  }

  /**
   * Generates a deterministic instance ID from keyId, n, and a unique salt
   */
  private async generateInstanceId(
    keyId: Uint8Array,
    n: bigint,
    uniqueInstanceSalt: Uint8Array,
  ): Promise<Uint8Array> {
    // Convert n to hex string with proper padding
    const nHex = n
      .toString(VOTING.KEY_RADIX)
      .padStart(VOTING.PUB_KEY_OFFSET, '0');
    const nBytes = this.hexToUint8Array(nHex);

    // Concatenate keyId + nBytes + salt
    const combined = new Uint8Array(
      keyId.length + nBytes.length + uniqueInstanceSalt.length,
    );
    combined.set(keyId, 0);
    combined.set(nBytes, keyId.length);
    combined.set(uniqueInstanceSalt, keyId.length + nBytes.length);

    // Return async hash
    return this.sha256Async(combined);
  }

  /**
   * Async SHA-256 hash using Web Crypto API
   */
  private async sha256Async(data: Uint8Array): Promise<Uint8Array> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  /**
   * Converts hex string to Uint8Array
   */
  private hexToUint8Array(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
      hex = '0' + hex;
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Converts Uint8Array to hex string
   */
  private uint8ArrayToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  constructor(n: bigint, g: bigint, keyId: Uint8Array) {
    super(n, g);
    this.keyId = keyId;

    // Generate unique salt for this instance
    const uniqueInstanceSalt = new Uint8Array(32);
    crypto.getRandomValues(uniqueInstanceSalt);
    this.uniqueInstanceSalt = uniqueInstanceSalt;

    // Generate instance IDs (this is problematic with sync constructor)
    // We'll need to handle this differently
    this._originalInstanceId = new Uint8Array(32); // Placeholder
    this._currentInstanceId = new Uint8Array(32); // Placeholder

    // TODO: This needs to be refactored to use async factory method
  }

  /**
   * Static factory method to create IsolatedPublicKey asynchronously
   */
  public static async create(
    n: bigint,
    g: bigint,
    keyId: Uint8Array,
  ): Promise<IsolatedPublicKey> {
    const key = new IsolatedPublicKey(n, g, keyId);

    // Generate unique salt
    const uniqueInstanceSalt = new Uint8Array(32);
    crypto.getRandomValues(uniqueInstanceSalt);

    // Generate instance ID asynchronously
    const nHex = n
      .toString(VOTING.KEY_RADIX)
      .padStart(VOTING.PUB_KEY_OFFSET, '0');
    const nBytes = key.hexToUint8Array(nHex);
    const combined = new Uint8Array(
      keyId.length + nBytes.length + uniqueInstanceSalt.length,
    );
    combined.set(keyId, 0);
    combined.set(nBytes, keyId.length);
    combined.set(uniqueInstanceSalt, keyId.length + nBytes.length);

    const instanceId = await key.sha256Async(combined);

    // Use Object.defineProperty to set readonly fields
    Object.defineProperty(key, 'uniqueInstanceSalt', {
      value: uniqueInstanceSalt,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(key, '_originalInstanceId', {
      value: instanceId,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    Object.defineProperty(key, '_currentInstanceId', {
      value: new Uint8Array(instanceId),
      writable: true,
      enumerable: false,
      configurable: false,
    });

    return key;
  }

  /**
   * Static factory method to create IsolatedPublicKey from deserialized data
   * Used when reconstructing a key from a buffer with a stored instanceId
   */
  public static fromBuffer(
    n: bigint,
    g: bigint,
    keyId: Uint8Array,
    instanceId: Uint8Array,
  ): IsolatedPublicKey {
    const key = new IsolatedPublicKey(n, g, keyId);

    // For deserialized keys, we don't have the original salt
    // Set uniqueInstanceSalt to empty array
    const uniqueInstanceSalt = new Uint8Array(0);

    // Use Object.defineProperty to set readonly fields
    Object.defineProperty(key, 'uniqueInstanceSalt', {
      value: uniqueInstanceSalt,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(key, '_originalInstanceId', {
      value: instanceId,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    Object.defineProperty(key, '_currentInstanceId', {
      value: new Uint8Array(instanceId),
      writable: true,
      enumerable: false,
      configurable: false,
    });

    return key;
  }

  /**
   * Returns a copy of the keyId
   */
  public getKeyId(): Uint8Array {
    return new Uint8Array(this.keyId);
  }

  /**
   * Returns a copy of the current instance ID
   */
  public getInstanceId(): Uint8Array {
    return new Uint8Array(this._currentInstanceId);
  }

  /**
   * Tags a ciphertext with an HMAC using keyId + instanceId
   * Returns a new bigint with the HMAC appended
   */
  private async tagCiphertext(ciphertext: bigint): Promise<bigint> {
    // Create HMAC key from keyId + instanceId
    const hmacKeyMaterial = new Uint8Array(
      this.keyId.length + this._currentInstanceId.length,
    );
    hmacKeyMaterial.set(this.keyId, 0);
    hmacKeyMaterial.set(this._currentInstanceId, this.keyId.length);

    // Import HMAC key
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      hmacKeyMaterial,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    // Sign the ciphertext
    const ciphertextHex = ciphertext.toString(VOTING.KEY_RADIX);
    const ciphertextBytes = new TextEncoder().encode(ciphertextHex);
    const signature = await crypto.subtle.sign(
      'HMAC',
      hmacKey,
      ciphertextBytes,
    );
    const signatureBytes = new Uint8Array(signature);
    const signatureHex = this.uint8ArrayToHex(signatureBytes);

    // Pad ciphertext and append HMAC
    const hmacLength = 64; // 256 bits = 64 hex chars
    const paddedCiphertext = ciphertextHex.padStart(hmacLength * 2, '0');
    const taggedCiphertextString = paddedCiphertext + signatureHex;

    return BigInt(`0x${taggedCiphertextString}`);
  }

  /**
   * Extracts and validates the instance ID from a tagged ciphertext
   * Returns the instance ID if valid, or zero-filled array if invalid
   */
  public async extractInstanceId(ciphertext: bigint): Promise<Uint8Array> {
    try {
      const hmacLength = 64;
      const ciphertextString = ciphertext.toString(16);
      const receivedHmac = ciphertextString.slice(-hmacLength);
      const calculatedCiphertext = BigInt(
        `0x${ciphertextString.slice(0, -hmacLength)}`,
      );

      // Create HMAC key from keyId + current instanceId
      const hmacKeyMaterial = new Uint8Array(
        this.keyId.length + this._currentInstanceId.length,
      );
      hmacKeyMaterial.set(this.keyId, 0);
      hmacKeyMaterial.set(this._currentInstanceId, this.keyId.length);

      const hmacKey = await crypto.subtle.importKey(
        'raw',
        hmacKeyMaterial,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );

      // Calculate expected HMAC
      const ciphertextHex = calculatedCiphertext.toString(VOTING.KEY_RADIX);
      const ciphertextBytes = new TextEncoder().encode(ciphertextHex);
      const signature = await crypto.subtle.sign(
        'HMAC',
        hmacKey,
        ciphertextBytes,
      );
      const expectedHmac = this.uint8ArrayToHex(new Uint8Array(signature));

      // If HMAC matches, return current instance ID
      return receivedHmac === expectedHmac
        ? new Uint8Array(this._currentInstanceId)
        : new Uint8Array([0]);
    } catch (_error) {
      // If any error occurs, return invalid instance ID
      return new Uint8Array([0]);
    }
  }

  /**
   * Encrypts a message and tags it with instance HMAC
   */
  public async encryptAsync(m: bigint): Promise<bigint> {
    await this.verifyKeyIdAsync();
    const ciphertext = super.encrypt(m);
    return this.tagCiphertext(ciphertext);
  }

  /**
   * Synchronous encrypt override (throws error - use encryptAsync instead)
   */
  override encrypt(_m: bigint): bigint {
    throw new VotingError(VotingErrorType.KeyPairValidationFailed);
  }

  /**
   * Multiplies a ciphertext by a constant, preserving instance HMAC
   */
  public async multiplyAsync(
    ciphertext: bigint,
    constant: bigint,
  ): Promise<bigint> {
    await this.verifyKeyIdAsync();
    const instanceId = await this.extractInstanceId(ciphertext);

    // Check if instance IDs match
    if (!this.uint8ArrayEquals(instanceId, this._currentInstanceId)) {
      throw new VotingError(VotingErrorType.InstanceIdMismatch);
    }

    const hmacLength = 64;
    const ciphertextString = ciphertext.toString(VOTING.KEY_RADIX);
    const actualCiphertext = BigInt(
      `0x${ciphertextString.slice(0, -hmacLength)}`,
    );

    const product = super.multiply(actualCiphertext, constant);
    return this.tagCiphertext(product);
  }

  /**
   * Synchronous multiply override (throws error - use multiplyAsync instead)
   */
  override multiply(_ciphertext: bigint, _constant: bigint): bigint {
    throw new VotingError(VotingErrorType.KeyPairValidationFailed);
  }

  /**
   * Adds two ciphertexts, preserving instance HMAC
   */
  public async additionAsync(a: bigint, b: bigint): Promise<bigint> {
    await this.verifyKeyIdAsync();
    const aInstanceID = await this.extractInstanceId(a);
    const bInstanceID = await this.extractInstanceId(b);

    if (
      !this.uint8ArrayEquals(aInstanceID, this._currentInstanceId) ||
      !this.uint8ArrayEquals(bInstanceID, this._currentInstanceId)
    ) {
      throw new VotingError(VotingErrorType.InstanceIdMismatch);
    }

    const hmacLength = 64;
    const aCiphertextString = a.toString(VOTING.KEY_RADIX);
    const bCiphertextString = b.toString(VOTING.KEY_RADIX);

    const aCiphertext = BigInt(`0x${aCiphertextString.slice(0, -hmacLength)}`);
    const bCiphertext = BigInt(`0x${bCiphertextString.slice(0, -hmacLength)}`);

    const sum = super.addition(aCiphertext, bCiphertext);
    return this.tagCiphertext(sum);
  }

  /**
   * Synchronous addition override (throws error - use additionAsync instead)
   */
  override addition(_a: bigint, _b: bigint): bigint {
    throw new VotingError(VotingErrorType.KeyPairValidationFailed);
  }

  /**
   * Verifies that the keyId matches the SHA-256 hash of the public key 'n'
   */
  public async verifyKeyIdAsync(): Promise<void> {
    const nHex = this.n
      .toString(VOTING.KEY_RADIX)
      .padStart(VOTING.PUB_KEY_OFFSET, '0');
    // Encode the hex string as UTF-8 bytes (not parse as hex digits)
    const encoder = new TextEncoder();
    const nBytes = encoder.encode(nHex);
    const computedKeyId = await this.sha256Async(nBytes);

    if (!this.uint8ArrayEquals(this.keyId, computedKeyId)) {
      throw new VotingError(VotingErrorType.InvalidPublicKeyIdMismatch);
    }
  }

  /**
   * Compares two Uint8Arrays for equality
   */
  private uint8ArrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Encrypts a message and tags it with instance HMAC
   * Implements both sync and async interfaces
   */
  public encryptIsolated(m: bigint): Promise<bigint> {
    return this.encryptAsync(m);
  }

  /**
   * Multiplies a ciphertext by a constant, preserving instance HMAC
   * Implements both sync and async interfaces
   */
  public multiplyIsolated(
    ciphertext: bigint,
    constant: bigint,
  ): Promise<bigint> {
    return this.multiplyAsync(ciphertext, constant);
  }

  /**
   * Adds two ciphertexts, preserving instance HMAC
   * Implements both sync and async interfaces
   */
  public additionIsolated(a: bigint, b: bigint): Promise<bigint> {
    return this.additionAsync(a, b);
  }

  /**
   * Verifies that the keyId matches the SHA-256 hash of the public key 'n'
   * Sync version for interface compatibility
   */
  public verifyKeyId(): void {
    throw new VotingError(VotingErrorType.KeyPairValidationFailed);
  }
}
