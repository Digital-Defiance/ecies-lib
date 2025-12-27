import { Wallet } from '@ethereumjs/wallet';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { HDKey } from '@scure/bip32';
import {
  generateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { Constants } from '../../constants';
import { EciesStringKey } from '../../enumerations';
import { EciesComponentId, getEciesI18nEngine } from '../../i18n-setup';
import { IECIESConfig } from '../../interfaces/ecies-config';
import { IECIESConstants } from '../../interfaces/ecies-consts';
import { SecureString } from '../../secure-string';
import { ISimpleKeyPair, IWalletSeed } from './interfaces';

/**
 * Browser-compatible crypto core for ECIES operations
 * Uses @scure libraries for browser compatibility
 */
export class EciesCryptoCore {
  protected readonly _config: IECIESConfig;
  protected readonly _eciesConsts: IECIESConstants;

  constructor(
    config: IECIESConfig,
    eciesParams: IECIESConstants = Constants.ECIES,
  ) {
    this._config = config;
    this._eciesConsts = eciesParams;
  }

  public get config(): IECIESConfig {
    return this._config;
  }

  /**
   * Validates and normalizes a public key for ECIES operations
   */
  public normalizePublicKey(publicKey: Uint8Array): Uint8Array {
    if (!publicKey) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey,
        ),
      );
    }

    const keyLength = publicKey.length;
    let normalizedKey: Uint8Array;

    // Compressed key (33 bytes) - 0x02 or 0x03 prefix
    if (keyLength === 33 && (publicKey[0] === 0x02 || publicKey[0] === 0x03)) {
      normalizedKey = publicKey;
    }
    // Uncompressed key (65 bytes) - 0x04 prefix
    // We accept this for backward compatibility with existing keys
    else if (keyLength === 65 && publicKey[0] === 0x04) {
      normalizedKey = publicKey;
    }
    // Raw key without prefix (64 bytes) - add the 0x04 prefix
    // Legacy support
    else if (keyLength === 64) {
      normalizedKey = new Uint8Array(65);
      normalizedKey[0] = 0x04;
      normalizedKey.set(publicKey, 1);
    } else {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate,
          { keyLength },
        ),
      );
    }

    // Basic validation: check it's not all zeros
    let allZeros = true;
    for (let i = 1; i < normalizedKey.length; i++) {
      // Skip first byte (prefix)
      if (normalizedKey[i] !== 0) {
        allZeros = false;
        break;
      }
    }
    if (allZeros) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidPublicKeyNotOnCurve,
        ),
      );
    }

    return normalizedKey;
  }

  /**
   * Generate a new mnemonic
   */
  public generateNewMnemonic(): SecureString {
    return new SecureString(
      generateMnemonic(wordlist, this._config.mnemonicStrength),
    );
  }

  /**
   * Generate wallet and seed from mnemonic
   */
  public walletAndSeedFromMnemonic(mnemonic: SecureString): IWalletSeed {
    if (!mnemonic || !validateMnemonic(mnemonic.value ?? '', wordlist)) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidMnemonic,
        ),
      );
    }

    const seed = mnemonicToSeedSync(mnemonic.value ?? '');
    const hdKey = HDKey.fromMasterSeed(seed);
    const derivedKey = hdKey.derive(this._config.primaryKeyDerivationPath);

    if (!derivedKey.privateKey) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey,
        ),
      );
    }

    const privateKey = derivedKey.privateKey;

    const wallet = new Wallet(privateKey);

    return {
      wallet,
      seed,
    };
  }

  /**
   * Create a simple key pair from a seed
   */
  public seedToSimpleKeyPair(seed: Uint8Array): ISimpleKeyPair {
    const hdKey = HDKey.fromMasterSeed(seed);
    const derivedKey = hdKey.derive(this._config.primaryKeyDerivationPath);

    if (!derivedKey.privateKey) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey,
        ),
      );
    }

    const privateKey = derivedKey.privateKey;
    const publicKey = secp256k1.getPublicKey(privateKey, true); // compressed

    return {
      privateKey,
      publicKey,
    };
  }

  /**
   * Create a simple key pair from a mnemonic
   */
  public mnemonicToSimpleKeyPair(mnemonic: SecureString): ISimpleKeyPair {
    const { seed } = this.walletAndSeedFromMnemonic(mnemonic);
    return this.seedToSimpleKeyPair(seed);
  }

  /**
   * Generate a random private key
   *
   * Implements private key generation directly to avoid @noble/curves' internal
   * Uint8Array type checking which can fail in bundled browser environments
   * due to multiple Uint8Array realms.
   *
   * A valid secp256k1 private key is a 32-byte value in range [1, n-1]
   * where n is the curve order.
   */
  public generatePrivateKey(): Uint8Array {
    // secp256k1 curve order
    const CURVE_ORDER = BigInt(
      '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
    );

    // Generate 48 bytes of randomness for bias elimination
    // (extra entropy ensures uniform distribution after modular reduction)
    const randomBytes = new Uint8Array(48);
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.crypto?.getRandomValues
    ) {
      globalThis.crypto.getRandomValues(randomBytes);
    } else if (
      typeof window !== 'undefined' &&
      window.crypto?.getRandomValues
    ) {
      window.crypto.getRandomValues(randomBytes);
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
    } else {
      throw new Error('No secure random source available');
    }

    // Convert bytes to BigInt (big-endian)
    let num = BigInt(0);
    for (let i = 0; i < randomBytes.length; i++) {
      num = (num << BigInt(8)) | BigInt(randomBytes[i]);
    }

    // Reduce to valid range: 1 <= key < n
    // Using (num % (n-1)) + 1 ensures we never get 0
    const reduced = (num % (CURVE_ORDER - BigInt(1))) + BigInt(1);

    // Convert back to 32-byte Uint8Array (big-endian)
    const result = new Uint8Array(32);
    let temp = reduced;
    for (let i = 31; i >= 0; i--) {
      result[i] = Number(temp & BigInt(0xff));
      temp = temp >> BigInt(8);
    }

    return result;
  }

  /**
   * Get public key from private key
   */
  public getPublicKey(privateKey: Uint8Array): Uint8Array {
    const publicKeyPoint = secp256k1.getPublicKey(privateKey, true); // compressed
    return publicKeyPoint;
  }

  /**
   * Generate ephemeral key pair for ECIES
   */
  public async generateEphemeralKeyPair(): Promise<ISimpleKeyPair> {
    const privateKey = this.generatePrivateKey();
    const publicKey = this.getPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  /**
   * Compute ECDH shared secret
   */
  public computeSharedSecret(
    privateKey: Uint8Array,
    publicKey: Uint8Array,
  ): Uint8Array {
    // Normalize the public key to ensure it has the correct format
    const normalizedPublicKey = this.normalizePublicKey(publicKey);

    // Use uncompressed shared secret to match Node.js ECDH behavior
    // Node.js ECDH.computeSecret() returns the x-coordinate of the shared point
    const sharedSecret = secp256k1.getSharedSecret(
      privateKey,
      normalizedPublicKey,
      false,
    );
    // Return only the x-coordinate (first 32 bytes after the 0x04 prefix)
    return sharedSecret.slice(1, 33);
  }

  /**
   * Derive a symmetric key from a shared secret using HKDF
   * @param sharedSecret The shared secret (ECDH output)
   * @param salt Optional salt
   * @param info Optional context info
   * @param length Length of the output key (default 32 for AES-256)
   */
  public deriveSharedKey(
    sharedSecret: Uint8Array,
    salt: Uint8Array = new Uint8Array(0),
    info: Uint8Array = new Uint8Array(0),
    length: number = 32,
  ): Uint8Array {
    return hkdf(sha256, sharedSecret, salt, info, length);
  }

  /**
   * Sign a message using ECDSA
   * @param privateKey The private key to sign with
   * @param message The message to sign
   */
  public sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array {
    const hash = sha256(message);
    const signature = secp256k1.sign(hash, privateKey);
    if (signature instanceof Uint8Array) {
      return signature;
    }
    // Check if signature has toCompactRawBytes method
    if (
      signature &&
      typeof signature === 'object' &&
      'toCompactRawBytes' in signature
    ) {
      const sig = signature as { toCompactRawBytes: () => Uint8Array };
      if (typeof sig.toCompactRawBytes === 'function') {
        return sig.toCompactRawBytes();
      }
    }
    // Fallback or error
    throw new Error('Unknown signature format');
  }

  /**
   * Verify a signature using ECDSA
   * @param publicKey The public key to verify with
   * @param message The message that was signed
   * @param signature The signature to verify
   */
  public verify(
    publicKey: Uint8Array,
    message: Uint8Array,
    signature: Uint8Array,
  ): boolean {
    const hash = sha256(message);
    try {
      return secp256k1.verify(signature, hash, publicKey);
    } catch (_e) {
      return false;
    }
  }
}
