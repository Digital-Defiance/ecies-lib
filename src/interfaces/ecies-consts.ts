import { CipherGCMTypes } from 'crypto';
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
    ALGORITHM: string;
    MODE: string;
    KEY_BITS: number;
    KEY_SIZE: number; // KEY_BITS / 8
  };

  IV_SIZE: number;
  AUTH_TAG_SIZE: number;
  MAX_RAW_DATA_SIZE: number; // 2^53 - 1 (max safe integer for JS)

  VERSION_SIZE: number;
  CIPHER_SUITE_SIZE: number;
  ENCRYPTION_TYPE_SIZE: number;

  /**
   * Message encrypts without data length or crc
   */
  SIMPLE: {
    FIXED_OVERHEAD_SIZE: number; // type (1) + public key (65) + IV (16) + auth tag (16)
    DATA_LENGTH_SIZE: number;
  };

  /**
   * Message encrypts like single but with data Length and crc
   */
  SINGLE: {
    FIXED_OVERHEAD_SIZE: number; // type (1) + public key (65) + IV (16) + auth tag (16) + data length (8) + crc16 (2)
    DATA_LENGTH_SIZE: number;
  };

  /**
   * Message encrypts for multiple recipients
   */
  MULTIPLE: {
    FIXED_OVERHEAD_SIZE: number;
    ENCRYPTED_KEY_SIZE: number;
    MAX_RECIPIENTS: number;
    RECIPIENT_ID_SIZE: number;
    RECIPIENT_COUNT_SIZE: number;
    DATA_LENGTH_SIZE: number;
  };

  ENCRYPTION_TYPE: {
    SIMPLE: number;
    SINGLE: number;
    MULTIPLE: number;
  };
}
