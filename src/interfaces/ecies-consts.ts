/**
 * Type definition for GCM cipher algorithms supported by Node.js crypto module.
 */
export type CipherGCMTypes = 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm';

/**
 * ECIES (Elliptic Curve Integrated Encryption Scheme) constants interface.
 * Defines all cryptographic parameters and message format specifications.
 */
export interface IECIESConstants {
  /** The elliptic curve to use for all ECDSA operations */
  CURVE_NAME: string;

  /** The primary key derivation path for HD wallets */
  PRIMARY_KEY_DERIVATION_PATH: string;

  SYMMETRIC_ALGORITHM_CONFIGURATION: CipherGCMTypes;

  /** Length of ECDSA signatures in bytes */
  SIGNATURE_SIZE: number;

  /** Length of raw public keys in bytes (without 0x04 prefix) */
  RAW_PUBLIC_KEY_LENGTH: number;

  /** Length of public keys in bytes (with 0x04 prefix) */
  PUBLIC_KEY_LENGTH: number;

  PUBLIC_KEY_MAGIC: number;

  /** Mnemonic strength in bits. This will produce a 32-bit key for ECDSA */
  MNEMONIC_STRENGTH: number;

  /** Symmetric encryption algorithm configuration */
  SYMMETRIC: {
    /** Encryption algorithm name */
    ALGORITHM: string;
    /** Encryption mode */
    MODE: string;
    /** Key size in bits */
    KEY_BITS: number;
    /** Key size in bytes (KEY_BITS / 8) */
    KEY_SIZE: number;
  };

  /** Initialization vector size in bytes */
  IV_SIZE: number;
  /** Authentication tag size in bytes */
  AUTH_TAG_SIZE: number;
  /** Maximum raw data size (2^53 - 1, max safe integer for JavaScript) */
  MAX_RAW_DATA_SIZE: number;

  /** Protocol version field size in bytes */
  VERSION_SIZE: number;
  /** Cipher suite field size in bytes */
  CIPHER_SUITE_SIZE: number;
  /** Encryption type field size in bytes */
  ENCRYPTION_TYPE_SIZE: number;

  /**
   * Basic encryption mode constants.
   * Message encrypts without data length or CRC.
   */
  BASIC: {
    /** Fixed overhead size: version + cipher suite + type + public key + IV + auth tag */
    FIXED_OVERHEAD_SIZE: number;
    /** Data length field size (0 for basic mode) */
    DATA_LENGTH_SIZE: number;
  };

  /**
   * Single recipient encryption mode constants (with length).
   * Message encrypts with data length but no CRC (AES-GCM provides authentication).
   */
  WITH_LENGTH: {
    /** Fixed overhead size: version + cipher suite + type + public key + IV + auth tag + data length */
    FIXED_OVERHEAD_SIZE: number;
    /** Data length field size in bytes */
    DATA_LENGTH_SIZE: number;
  };

  /**
   * Multiple recipient encryption mode constants.
   * Message encrypts for multiple recipients with shared data.
   */
  MULTIPLE: {
    /** Fixed overhead size for the message header */
    FIXED_OVERHEAD_SIZE: number;
    /** Size of each encrypted key entry */
    ENCRYPTED_KEY_SIZE: number;
    /** Maximum number of recipients supported */
    MAX_RECIPIENTS: number;
    /** Maximum data size for multi-recipient messages */
    MAX_DATA_SIZE: number;
    /** Size of recipient ID field in bytes */
    RECIPIENT_ID_SIZE: number;
    /** Size of recipient count field in bytes */
    RECIPIENT_COUNT_SIZE: number;
    /** Size of data length field in bytes */
    DATA_LENGTH_SIZE: number;
  };

  /** Encryption type identifiers */
  ENCRYPTION_TYPE: {
    /** Simple encryption type identifier */
    BASIC: number;
    /** Single recipient encryption type identifier */
    WITH_LENGTH: number;
    /** Multiple recipient encryption type identifier */
    MULTIPLE: number;
  };
}
