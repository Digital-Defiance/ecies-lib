import { ObjectId } from 'bson';
import { ECIESErrorTypeEnum } from './enumerations';
import { Pbkdf2ProfileEnum } from './enumerations/pbkdf2-profile';
import { ECIESError } from './errors/ecies';
import { IChecksumConsts } from './interfaces';
import { IConstants } from './interfaces/constants';
import { IECIESConstants } from './interfaces/ecies-consts';
import { IPBkdf2Consts } from './interfaces/pbkdf2-consts';
import { Pbkdf2Profiles } from './pbkdf2-profiles';
import { getEciesI18nEngine } from './i18n-setup';

export const UINT8_SIZE: number = 1 as const;
export const UINT16_SIZE: number = 2 as const;
export const UINT16_MAX: number = 65535 as const;
export const UINT32_SIZE: number = 4 as const;
export const UINT32_MAX: number = 4294967295 as const;
export const UINT64_SIZE: number = 8 as const;
export const UINT64_MAX: bigint = 18446744073709551615n as const;
/**
 * Standard size of a UUID v4 in bytes.
 */
export const GUID_SIZE: number = 16 as const;

/**
 * Constants for checksum operations
 * These values are critical for data integrity and MUST NOT be changed
 * in an already established system as it will break all existing checksums.
 */
export const CHECKSUM: IChecksumConsts = {
  /** Default hash bits for SHA3 */
  SHA3_DEFAULT_HASH_BITS: 512 as const,

  /** Length of a SHA3 checksum buffer in bytes */
  SHA3_BUFFER_LENGTH: 64 as const,

  /** algorithm to use for checksum */
  ALGORITHM: 'sha3-512' as const,

  /** encoding to use for checksum */
  ENCODING: 'hex' as const,
} as const;

export const PBKDF2: IPBkdf2Consts = {
  ALGORITHM: 'SHA-256' as const,
  SALT_BYTES: 32 as const,
  /**
   * Number of pbkdf2 iterations per second when hashing a password.
   * This is the high-security default for user login operations.
   */
  ITERATIONS_PER_SECOND: 1304000 as const,
} as const;

export const PBKDF2_PROFILES: Pbkdf2Profiles = {
  [Pbkdf2ProfileEnum.BROWSER_PASSWORD]: {
    hashBytes: 32 as const,
    saltBytes: 64 as const,
    iterations: 2000000 as const,
    algorithm: 'SHA-512' as const,
  } as const,
  [Pbkdf2ProfileEnum.HIGH_SECURITY]: {
    hashBytes: 64 as const,
    saltBytes: 32 as const,
    iterations: 5000000 as const,
    algorithm: 'SHA-256' as const,
  } as const,
  [Pbkdf2ProfileEnum.TEST_FAST]: {
    hashBytes: 32 as const,
    saltBytes: 64 as const,
    iterations: 1000 as const,
    algorithm: 'SHA-512' as const,
  } as const,
};

const ECIES_SYMMETRIC_KEY_SIZE = 32 as const;
const ECIES_PUBLIC_KEY_LENGTH = 65 as const;
const ECIES_RAW_PUBLIC_KEY_LENGTH = 64 as const;
const ECIES_IV_SIZE = 16 as const;
const ECIES_AUTH_TAG_SIZE = 16 as const;
const ECIES_MULTIPLE_RECIPIENT_ID_SIZE = 16 as const;

// Define the expected value for SIMPLE.FIXED_OVERHEAD_SIZE
const expectedSimpleOverhead =
  UINT8_SIZE + ECIES_PUBLIC_KEY_LENGTH + ECIES_IV_SIZE + ECIES_AUTH_TAG_SIZE;

// Define the expected value for MULTIPLE.FIXED_OVERHEAD_SIZE
// Includes: type (1) + IV (16) + auth tag (16) = 33 (no CRC, AES-GCM provides authentication)
const expectedMultipleOverhead =
  UINT8_SIZE + ECIES_IV_SIZE + ECIES_AUTH_TAG_SIZE;

// Update ENCRYPTED_KEY_SIZE to match Simple encryption (no CRC)
const expectedMultipleEncryptedKeySize =
  ECIES_PUBLIC_KEY_LENGTH +
  ECIES_IV_SIZE +
  ECIES_AUTH_TAG_SIZE +
  ECIES_SYMMETRIC_KEY_SIZE;

export const ECIES: IECIESConstants = {
  /** The elliptic curve to use for all ECDSA operations */
  CURVE_NAME: 'secp256k1' as const,

  /** The primary key derivation path for HD wallets */
  PRIMARY_KEY_DERIVATION_PATH: "m/44'/60'/0'/0/0" as const,

  SYMMETRIC_ALGORITHM_CONFIGURATION: 'aes-256-gcm' as const,

  /** Length of ECDSA signatures in bytes */
  SIGNATURE_SIZE: 64 as const,

  /** Length of raw public keys in bytes (without 0x04 prefix) */
  RAW_PUBLIC_KEY_LENGTH: ECIES_RAW_PUBLIC_KEY_LENGTH,

  /** Length of public keys in bytes (with 0x04 prefix) */
  PUBLIC_KEY_LENGTH: ECIES_PUBLIC_KEY_LENGTH,

  PUBLIC_KEY_MAGIC: 0x04 as const,

  /** Mnemonic strength in bits. This will produce a 32-bit key for ECDSA */
  MNEMONIC_STRENGTH: 256 as const,

  /** Symmetric encryption algorithm configuration */
  SYMMETRIC: {
    ALGORITHM: 'aes' as const,
    MODE: 'gcm' as const,
    KEY_BITS: 256 as const,
    KEY_SIZE: ECIES_SYMMETRIC_KEY_SIZE, // KEY_BITS / 8
  } as const,

  IV_SIZE: ECIES_IV_SIZE,
  AUTH_TAG_SIZE: ECIES_AUTH_TAG_SIZE,
  MAX_RAW_DATA_SIZE: 9007199254740991 as const, // 2^53 - 1 (max safe integer for JS)

  /**
   * Message encrypts without data length or crc
   */
  SIMPLE: {
    FIXED_OVERHEAD_SIZE: expectedSimpleOverhead, // type (1) + public key (65) + IV (16) + auth tag (16)
    DATA_LENGTH_SIZE: 0 as const,
  } as const,

  /**
   * Message encrypts with data length but no CRC (AES-GCM provides authentication)
   */
  SINGLE: {
    FIXED_OVERHEAD_SIZE: 106 as const, // type (1) + public key (65) + IV (16) + auth tag (16) + data length (8)
    DATA_LENGTH_SIZE: 8,
  } as const,

  /**
   * Message encrypts for multiple recipients
   */
  MULTIPLE: {
    FIXED_OVERHEAD_SIZE: expectedMultipleOverhead, // type (1) + IV (16) + auth tag (16), no CRC
    ENCRYPTED_KEY_SIZE: expectedMultipleEncryptedKeySize, // 129
    MAX_RECIPIENTS: 65535,
    RECIPIENT_ID_SIZE: ECIES_MULTIPLE_RECIPIENT_ID_SIZE,
    RECIPIENT_COUNT_SIZE: 2,
    DATA_LENGTH_SIZE: 8,
  } as const,

  ENCRYPTION_TYPE: {
    SIMPLE: 33 as const,
    SINGLE: 66 as const,
    MULTIPLE: 99 as const,
  } as const,
};
const objectIdLength = new ObjectId().toHexString().length / 2;

export const Constants: IConstants = {
  /**
   * The length of a raw object ID (not the hex string representation)
   */
  OBJECT_ID_LENGTH: objectIdLength,

  UINT8_SIZE: UINT8_SIZE,
  UINT16_SIZE: UINT16_SIZE,
  UINT16_MAX: UINT16_MAX,
  UINT32_SIZE: UINT32_SIZE,
  UINT32_MAX: UINT32_MAX,
  UINT64_SIZE: UINT64_SIZE,
  UINT64_MAX: UINT64_MAX,
  HEX_RADIX: 16 as const,
  GUID_SIZE: GUID_SIZE,

  CHECKSUM: CHECKSUM,

  ECIES: ECIES,

  PBKDF2: PBKDF2,
  PBKDF2_PROFILES: PBKDF2_PROFILES,

  /**
   * Number of rounds for bcrypt hashing. Higher values increase security but also consume more CPU resources.
   */
  BcryptRounds: 10 as const,
  /**
   * Minimum password length
   */
  PasswordMinLength: 8 as const,
  /**
   * The regular expression for valid passwords.
   */
  PasswordRegex:
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/,
  /**
   * The regular expression for valid mnemonic phrases.
   * BIP39 - supports 12, 15, 18, 21, or 24 word mnemonics
   */
  MnemonicRegex:
    /^(?:\w+\s){11}\w+$|^(?:\w+\s){14}\w+$|^(?:\w+\s){17}\w+$|^(?:\w+\s){20}\w+$|^(?:\w+\s){23}\w+$/i,
  /**
   * Matches a 64-character hexadecimal string (SHA-256).
   */
  HmacRegex: /^[a-f0-9]{64}$/,
} as const;

if (
  CHECKSUM.SHA3_BUFFER_LENGTH !== CHECKSUM.SHA3_DEFAULT_HASH_BITS / 8 ||
  CHECKSUM.SHA3_BUFFER_LENGTH !== CHECKSUM.SHA3_DEFAULT_HASH_BITS / 8
) {
  throw new Error('Invalid checksum constants');
}

if (objectIdLength !== 12) {
  console.warn(
    'ObjectID length may have changed, breaking encryption',
    objectIdLength,
  );
}

if (ECIES.MULTIPLE.ENCRYPTED_KEY_SIZE !== 129) {
  throw new ECIESError(ECIESErrorTypeEnum.InvalidECIESMultipleEncryptedKeySize, getEciesI18nEngine());
}

if (ECIES.PUBLIC_KEY_LENGTH !== ECIES.RAW_PUBLIC_KEY_LENGTH + 1) {
  throw new ECIESError(ECIESErrorTypeEnum.InvalidECIESPublicKeyLength, getEciesI18nEngine());
}

if (ECIES.MULTIPLE.RECIPIENT_COUNT_SIZE !== UINT16_SIZE) {
  throw new ECIESError(
    ECIESErrorTypeEnum.InvalidECIESMultipleRecipientCountSize, getEciesI18nEngine()
  );
}

if (ECIES.MULTIPLE.DATA_LENGTH_SIZE !== UINT64_SIZE) {
  throw new ECIESError(ECIESErrorTypeEnum.InvalidECIESMultipleDataLengthSize, getEciesI18nEngine());
}

if (ECIES.MULTIPLE.RECIPIENT_ID_SIZE !== GUID_SIZE) {
  throw new ECIESError(ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize, getEciesI18nEngine());
}
