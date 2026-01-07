/**
 * Options for deriving Paillier voting keys from ECDH keys.
 */
export interface IVotingKeyDerivationOptions {
  /** Elliptic curve name (default: 'secp256k1') */
  curveName?: string;
  /** Public key magic byte (default: 0x04) */
  publicKeyMagic?: number;
  /** Raw public key length (default: 64) */
  rawPublicKeyLength?: number;
  /** Public key length with prefix (default: 65) */
  publicKeyLength?: number;
  /** HMAC algorithm (default: 'sha512') */
  hmacAlgorithm?: string;
  /** HKDF info string (default: 'PaillierPrimeGen') */
  hkdfInfo?: string;
  /** HKDF output length (default: 64) */
  hkdfLength?: number;
  /** Key pair bit length (default: 3072) */
  keypairBitLength?: number;
  /** Prime test iterations (default: 256) */
  primeTestIterations?: number;
  /** Max prime generation attempts (default: 20000) */
  maxPrimeAttempts?: number;
}
