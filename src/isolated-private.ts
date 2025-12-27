import { PrivateKey, PublicKey } from 'paillier-bigint';
import { VOTING } from './constants';
import { VotingErrorType } from './enumerations/voting-error-type';
import { VotingError } from './errors/voting';
import { IIsolatedPrivateKey } from './interfaces/isolated-keys';
import { IsolatedPublicKey } from './isolated-public';

/**
 * IsolatedPrivateKey extends Paillier PrivateKey with instance isolation validation.
 *
 * This class ensures that:
 * - Decryption only works with ciphertexts encrypted by the matching IsolatedPublicKey instance
 * - Instance ID verification prevents cross-instance decryption attacks
 * - HMAC validation ensures ciphertext integrity
 *
 * The private key stores the original keyId and instanceId from construction time,
 * and validates them before any decryption operation.
 */
export class IsolatedPrivateKey
  extends PrivateKey
  implements IIsolatedPrivateKey<Uint8Array, 'async'>
{
  /**
   * Original keyId from the IsolatedPublicKey at construction time
   */
  private readonly _originalKeyId: Uint8Array;

  /**
   * Original instanceId from the IsolatedPublicKey at construction time
   */
  private readonly _originalInstanceId: Uint8Array;

  /**
   * Reference to the original IsolatedPublicKey
   */
  private readonly _originalPublicKey: IsolatedPublicKey;

  constructor(lambda: bigint, mu: bigint, publicKey: IsolatedPublicKey) {
    if (!IsolatedPublicKey.isIsolatedPublicKey(publicKey)) {
      throw new VotingError(VotingErrorType.InvalidPublicKeyFormat);
    }

    // Create a base PublicKey instance for the parent constructor
    const basePublicKey = new PublicKey(publicKey.n, publicKey.g);
    super(lambda, mu, basePublicKey);

    // Store the isolated public key for our own use
    this._originalKeyId = publicKey.getKeyId();
    this._originalInstanceId = publicKey.getInstanceId();
    this._originalPublicKey = publicKey;
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
   * Decrypts a tagged ciphertext after validating instance ID and HMAC
   */
  public async decryptAsync(taggedCiphertext: bigint): Promise<bigint> {
    // First verify if we're using a recovered key by checking the public key instance
    if (!IsolatedPublicKey.isIsolatedPublicKey(this._originalPublicKey)) {
      throw new VotingError(VotingErrorType.InvalidPublicKeyFormat);
    }

    // Compare instance IDs before any ciphertext operations
    const currentInstanceId = this._originalPublicKey.getInstanceId();

    // This check must happen before any ciphertext operations
    if (!this.uint8ArrayEquals(currentInstanceId, this._originalInstanceId)) {
      throw new VotingError(VotingErrorType.InstanceIdMismatch);
    }

    // Now that we've verified the instance ID, we can proceed with ciphertext operations
    try {
      const hmacLength = 64;
      const ciphertextString = taggedCiphertext.toString(VOTING.KEY_RADIX);
      const receivedHmac = ciphertextString.slice(-hmacLength);
      const ciphertextHex = ciphertextString.slice(0, -hmacLength);
      const ciphertextBigInt = BigInt(`0x${ciphertextHex}`);

      // Create HMAC key from originalKeyId + originalInstanceId
      const hmacKeyMaterial = new Uint8Array(
        this._originalKeyId.length + this._originalInstanceId.length,
      );
      hmacKeyMaterial.set(this._originalKeyId, 0);
      hmacKeyMaterial.set(this._originalInstanceId, this._originalKeyId.length);

      const hmacKey = await crypto.subtle.importKey(
        'raw',
        hmacKeyMaterial,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );

      // Calculate expected HMAC
      const ciphertextBytes = new TextEncoder().encode(
        ciphertextBigInt.toString(VOTING.KEY_RADIX),
      );
      const signature = await crypto.subtle.sign(
        'HMAC',
        hmacKey,
        ciphertextBytes,
      );
      const expectedHmac = this.uint8ArrayToHex(new Uint8Array(signature));

      // Verify HMAC
      if (receivedHmac !== expectedHmac) {
        throw new VotingError(VotingErrorType.InvalidCiphertextHmac);
      }

      // Finally decrypt the ciphertext using the parent class implementation
      return super.decrypt(ciphertextBigInt);
    } catch (error) {
      if (error instanceof VotingError) {
        throw error;
      }
      throw new VotingError(
        VotingErrorType.InvalidPrivateKeyBufferFailedToParse,
      );
    }
  }

  /**
   * Synchronous decrypt override (throws error - use decryptAsync instead)
   */
  override decrypt(_taggedCiphertext: bigint): bigint {
    throw new VotingError(VotingErrorType.KeyPairValidationFailed);
  }

  /**
   * Gets a copy of the original keyId
   */
  public getOriginalKeyId(): Uint8Array {
    return new Uint8Array(this._originalKeyId);
  }

  /**
   * Gets a copy of the original instanceId
   */
  public getOriginalInstanceId(): Uint8Array {
    return new Uint8Array(this._originalInstanceId);
  }

  /**
   * Gets the original public key reference
   */
  public getOriginalPublicKey(): IsolatedPublicKey {
    return this._originalPublicKey;
  }

  /**
   * Decrypts a tagged ciphertext after validating instance ID and HMAC
   * Implements both sync and async interfaces
   */
  public decryptIsolated(taggedCiphertext: bigint): Promise<bigint> {
    return this.decryptAsync(taggedCiphertext);
  }
}
