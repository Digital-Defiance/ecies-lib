import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha2';
import { SignatureString, SignatureUint8Array } from '../../ecies_types';
import { uint8ArrayToHex } from '../../utils';
import { EciesCryptoCore } from './crypto-core';

/**
 * Browser-compatible ECDSA signature operations
 */
export class EciesSignature {
  private readonly cryptoCore: EciesCryptoCore;

  constructor(cryptoCore: EciesCryptoCore) {
    this.cryptoCore = cryptoCore;
  }

  /**
   * Sign arbitrary binary data with a secp256k1 private key.
   * Returns 64 bytes: [r(32) | s(32)]
   */
  public signMessage(
    privateKey: Uint8Array,
    data: Uint8Array,
  ): SignatureUint8Array {
    const hash = sha256(data);
    // Use deterministic signatures (RFC 6979) for consistency
    // sign() returns a RecoveredSignature object with toCompactRawBytes() for 64-byte output
    return secp256k1
      .sign(hash, privateKey, {
        extraEntropy: false,
        prehash: false,
      })
      .toCompactRawBytes() as SignatureUint8Array;
  }

  /**
   * Verify signature (64 bytes: [r|s]) over arbitrary binary data against a public key.
   */
  public verifyMessage(
    publicKey: Uint8Array,
    data: Uint8Array,
    signature: SignatureUint8Array,
  ): boolean {
    try {
      if (!signature || signature.length !== 64) return false;
      const hash = sha256(data);
      const normalizedPublicKey = this.cryptoCore.normalizePublicKey(publicKey);

      // Parse the 64-byte compact signature into a Signature object (r, s bigints).
      // This bypasses verify()'s internal DER→compact fallback which uses
      // `instanceof DER.Err` — that check breaks when bundlers (e.g. Vite)
      // load multiple copies of @noble/curves/abstract/weierstrass.
      const sig = secp256k1.Signature.fromCompact(signature);
      return secp256k1.verify(sig, hash, normalizedPublicKey, {
        prehash: false,
      });
    } catch (err) {
      console.error('Signature verification failed:', err);
      return false;
    }
  }

  /**
   * Convert signature string to signature Uint8Array
   */
  public signatureStringToSignatureUint8Array(
    signatureString: SignatureString,
  ): SignatureUint8Array {
    const cleanHex = signatureString.replace(/^0x/, '');
    const result = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      result[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
    return result as SignatureUint8Array;
  }

  /**
   * Convert signature buffer to signature string
   */
  public signatureUint8ArrayToSignatureString(
    signatureArray: SignatureUint8Array,
  ): SignatureString {
    return uint8ArrayToHex(signatureArray) as SignatureString;
  }
}
