/**
 * Cipher suite enumeration for ECIES encryption.
 * Defines the cryptographic algorithms used for encryption operations.
 */
export enum EciesCipherSuiteEnum {
  /**
   * Cipher suite using:
   * - Curve: secp256k1
   * - KDF: PBKDF2/HKDF
   * - Symmetric: AES-256-GCM
   * - Hash: SHA-256
   */
  Secp256k1_Aes256Gcm_Sha256 = 1,
}
