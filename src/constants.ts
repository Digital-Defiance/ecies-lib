import { ECIESErrorTypeEnum, EciesStringKey } from './enumerations';
import { Pbkdf2ProfileEnum } from './enumerations/pbkdf2-profile';
import { ECIESError } from './errors/ecies';
import { EciesComponentId, getEciesI18nEngine } from './i18n-setup';
import { IChecksumConsts } from './interfaces';
import { IConstants } from './interfaces/constants';
import { DeepPartial } from './types/deep-partial';
import { IECIESConstants } from './interfaces/ecies-consts';
import { IPBkdf2Consts } from './interfaces/pbkdf2-consts';
import { Pbkdf2Profiles } from './pbkdf2-profiles';
import { MNEMONIC_REGEX, PASSWORD_REGEX } from './regexes';

export const UINT8_SIZE: number = 1 as const;
export const UINT16_SIZE: number = 2 as const;
export const UINT16_MAX: number = 65535 as const;
export const UINT32_SIZE: number = 4 as const;
export const UINT32_MAX: number = 4294967295 as const;
export const UINT64_SIZE: number = 8 as const;
export const UINT64_MAX: bigint = 18446744073709551615n as const;
export const OBJECT_ID_LENGTH: number = 12 as const;

if (OBJECT_ID_LENGTH !== 12) {
  console.warn(
    'ObjectID length may have changed, breaking encryption',
    OBJECT_ID_LENGTH,
  );
}

/**
 * Constants for checksum operations
 * These values are critical for data integrity and MUST NOT be changed
 * in an already established system as it will break all existing checksums.
 */
export const CHECKSUM: IChecksumConsts = Object.freeze({
  /** Default hash bits for SHA3 */
  SHA3_DEFAULT_HASH_BITS: 512 as const,

  /** Length of a SHA3 checksum buffer in bytes */
  SHA3_BUFFER_LENGTH: 64 as const,

  /** algorithm to use for checksum */
  ALGORITHM: 'sha3-512' as const,

  /** encoding to use for checksum */
  ENCODING: 'hex' as const,
} as const);

export const PBKDF2: IPBkdf2Consts = Object.freeze({
  ALGORITHM: 'SHA-256' as const,
  SALT_BYTES: 32 as const,
  /**
   * Number of pbkdf2 iterations per second when hashing a password.
   * This is the high-security default for user login operations.
   */
  ITERATIONS_PER_SECOND: 1304000 as const,
} as const);

export const PBKDF2_PROFILES: Pbkdf2Profiles = Object.freeze({
  [Pbkdf2ProfileEnum.BROWSER_PASSWORD]: Object.freeze({
    hashBytes: 32 as const,
    saltBytes: 64 as const,
    iterations: 2000000 as const,
    algorithm: 'SHA-512' as const,
  } as const),
  [Pbkdf2ProfileEnum.HIGH_SECURITY]: Object.freeze({
    hashBytes: 64 as const,
    saltBytes: 32 as const,
    iterations: 5000000 as const,
    algorithm: 'SHA-256' as const,
  } as const),
  [Pbkdf2ProfileEnum.TEST_FAST]: Object.freeze({
    hashBytes: 32 as const,
    saltBytes: 64 as const,
    iterations: 1000 as const,
    algorithm: 'SHA-512' as const,
  } as const),
} as const);

const ECIES_SYMMETRIC_KEY_SIZE = 32 as const;
const ECIES_PUBLIC_KEY_LENGTH = 65 as const;
const ECIES_RAW_PUBLIC_KEY_LENGTH = 64 as const;
const ECIES_IV_SIZE = 16 as const;
const ECIES_AUTH_TAG_SIZE = 16 as const;
const ECIES_MULTIPLE_RECIPIENT_ID_SIZE = 12 as const;

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

export const ECIES: IECIESConstants = Object.freeze({
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
  SYMMETRIC: Object.freeze({
    ALGORITHM: 'aes' as const,
    MODE: 'gcm' as const,
    KEY_BITS: 256 as const,
    KEY_SIZE: ECIES_SYMMETRIC_KEY_SIZE, // KEY_BITS / 8
  } as const),

  IV_SIZE: ECIES_IV_SIZE,
  AUTH_TAG_SIZE: ECIES_AUTH_TAG_SIZE,
  MAX_RAW_DATA_SIZE: 9007199254740991 as const, // 2^53 - 1 (max safe integer for JS)

  /**
   * Message encrypts without data length or crc
   */
  SIMPLE: Object.freeze({
    FIXED_OVERHEAD_SIZE: expectedSimpleOverhead, // type (1) + public key (65) + IV (16) + auth tag (16)
    DATA_LENGTH_SIZE: 0 as const,
  } as const),

  /**
   * Message encrypts with data length but no CRC (AES-GCM provides authentication)
   */
  SINGLE: Object.freeze({
    FIXED_OVERHEAD_SIZE: 106 as const, // type (1) + public key (65) + IV (16) + auth tag (16) + data length (8)
    DATA_LENGTH_SIZE: 8,
  } as const),

  /**
   * Message encrypts for multiple recipients
   */
  MULTIPLE: Object.freeze({
    FIXED_OVERHEAD_SIZE: expectedMultipleOverhead, // type (1) + IV (16) + auth tag (16), no CRC
    ENCRYPTED_KEY_SIZE: expectedMultipleEncryptedKeySize, // 129
    MAX_RECIPIENTS: 65535,
    RECIPIENT_ID_SIZE: ECIES_MULTIPLE_RECIPIENT_ID_SIZE,
    RECIPIENT_COUNT_SIZE: 2,
    DATA_LENGTH_SIZE: 8,
  } as const),

  ENCRYPTION_TYPE: Object.freeze({
    SIMPLE: 33 as const,
    SINGLE: 66 as const,
    MULTIPLE: 99 as const,
  } as const),
});

export const Constants: IConstants = Object.freeze({
  UINT8_SIZE: UINT8_SIZE,
  UINT16_SIZE: UINT16_SIZE,
  UINT16_MAX: UINT16_MAX,
  UINT32_SIZE: UINT32_SIZE,
  UINT32_MAX: UINT32_MAX,
  UINT64_SIZE: UINT64_SIZE,
  UINT64_MAX: UINT64_MAX,
  HEX_RADIX: 16 as const,
  OBJECT_ID_LENGTH: OBJECT_ID_LENGTH,
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
  PasswordRegex: PASSWORD_REGEX,
  /**
   * The regular expression for valid mnemonic phrases.
   * BIP39 - supports 12, 15, 18, 21, or 24 word mnemonics
   */
  MnemonicRegex: MNEMONIC_REGEX,
  /**
   * Matches a 64-character hexadecimal string (SHA-256).
   */
  HmacRegex: /^[a-f0-9]{64}$/,
} as const);

export type ConfigurationKey = string | symbol;

const DEFAULT_CONFIGURATION_KEY: ConfigurationKey = Symbol.for(
  'digitaldefiance.ecies.constants.default',
);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null) {
    return false;
  }
  if (typeof value !== 'object') {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  if (value instanceof RegExp || value instanceof Date) {
    return false;
  }
  return Object.getPrototypeOf(value) === Object.prototype;
}

function deepClone<T>(input: T): T {
  if (input === null) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => deepClone(item)) as unknown as T;
  }
  if (input instanceof RegExp) {
    return new RegExp(input.source, input.flags) as unknown as T;
  }
  if (input instanceof Date) {
    return new Date(input.getTime()) as unknown as T;
  }
  if (isPlainObject(input)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = deepClone(value);
    }
    return result as T;
  }
  return input;
}

function applyOverrides<T>(target: T, overrides?: DeepPartial<T>): T {
  if (!overrides) {
    return target;
  }

  for (const [key, overrideValue] of Object.entries(overrides)) {
    const typedKey = key as keyof T;
    if (overrideValue === undefined) {
      continue;
    }

    const currentValue = (target as any)[typedKey];

    if (isPlainObject(currentValue) && isPlainObject(overrideValue)) {
      (target as any)[typedKey] = applyOverrides(
        currentValue,
        overrideValue as any,
      );
    } else {
      (target as any)[typedKey] = deepClone(overrideValue);
    }
  }

  return target;
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);

  for (const property of Object.getOwnPropertyNames(value)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nestedValue = (value as any)[property];
    deepFreeze(nestedValue);
  }

  return value;
}

function computeMultipleEncryptedKeySize(ecies: IECIESConstants): number {
  return (
    ecies.PUBLIC_KEY_LENGTH +
    ecies.IV_SIZE +
    ecies.AUTH_TAG_SIZE +
    ecies.SYMMETRIC.KEY_SIZE
  );
}

function validateConstants(config: IConstants): void {
  const checksum = config.CHECKSUM;
  const ecies = config.ECIES;

  if (
    checksum.SHA3_BUFFER_LENGTH !== checksum.SHA3_DEFAULT_HASH_BITS / 8 ||
    checksum.SHA3_BUFFER_LENGTH !== checksum.SHA3_DEFAULT_HASH_BITS / 8
  ) {
    const engine = getEciesI18nEngine();
    throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_InvalidChecksumConstants));
  }

  const expectedEncryptedKeySize = computeMultipleEncryptedKeySize(ecies);
  if (ecies.MULTIPLE.ENCRYPTED_KEY_SIZE !== expectedEncryptedKeySize) {
    throw new ECIESError(
      ECIESErrorTypeEnum.InvalidECIESMultipleEncryptedKeySize,
      getEciesI18nEngine() as any,
    );
  }

  if (ecies.PUBLIC_KEY_LENGTH !== ecies.RAW_PUBLIC_KEY_LENGTH + 1) {
    throw new ECIESError(
      ECIESErrorTypeEnum.InvalidECIESPublicKeyLength,
      getEciesI18nEngine() as any,
    );
  }

  if (ecies.MULTIPLE.RECIPIENT_COUNT_SIZE !== UINT16_SIZE) {
    throw new ECIESError(
      ECIESErrorTypeEnum.InvalidECIESMultipleRecipientCountSize,
      getEciesI18nEngine() as any,
    );
  }

  if (ecies.MULTIPLE.DATA_LENGTH_SIZE !== UINT64_SIZE) {
    throw new ECIESError(
      ECIESErrorTypeEnum.InvalidECIESMultipleDataLengthSize,
      getEciesI18nEngine() as any,
    );
  }

  if (ecies.MULTIPLE.RECIPIENT_ID_SIZE !== config.OBJECT_ID_LENGTH) {
    throw new ECIESError(
      ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
      getEciesI18nEngine() as any,
    );
  }
}

validateConstants(Constants);

const configurationRegistry = new Map<ConfigurationKey, IConstants>();
configurationRegistry.set(DEFAULT_CONFIGURATION_KEY, Constants);

function isFullConstantsConfig(value: unknown): value is IConstants {
  if (!isPlainObject(value)) {
    return false;
  }
  const candidate = value as Partial<IConstants>;
  return (
    candidate.CHECKSUM !== undefined &&
    candidate.ECIES !== undefined &&
    candidate.PBKDF2 !== undefined &&
    candidate.PBKDF2_PROFILES !== undefined
  );
}

export function createRuntimeConfiguration(
  overrides?: DeepPartial<IConstants>,
  base: IConstants = Constants,
): IConstants {
  const merged = deepClone(base);
  applyOverrides(merged, overrides);
  validateConstants(merged);
  return deepFreeze(merged);
}

export class ConstantsRegistry {
  public static readonly DEFAULT_KEY = DEFAULT_CONFIGURATION_KEY;

  public static listKeys(): ConfigurationKey[] {
    return Array.from(configurationRegistry.keys());
  }

  public static has(key: ConfigurationKey): boolean {
    return configurationRegistry.has(key);
  }

  public static get(key: ConfigurationKey = DEFAULT_CONFIGURATION_KEY): IConstants {
    return (
      configurationRegistry.get(key) ??
      configurationRegistry.get(DEFAULT_CONFIGURATION_KEY)!
    );
  }

  public static create(
    overrides?: DeepPartial<IConstants>,
    baseKey: ConfigurationKey = DEFAULT_CONFIGURATION_KEY,
  ): IConstants {
    const baseConfig = ConstantsRegistry.get(baseKey);
    return createRuntimeConfiguration(overrides, baseConfig);
  }

  public static register(
    key: ConfigurationKey,
    configOrOverrides?: DeepPartial<IConstants> | IConstants,
    options?: { baseKey?: ConfigurationKey },
  ): IConstants {
    if (key === DEFAULT_CONFIGURATION_KEY) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_ECIESError_CannotOverwriteDefaultConfiguration));
    }

    const baseKey = options?.baseKey ?? DEFAULT_CONFIGURATION_KEY;
    const baseConfig = ConstantsRegistry.get(baseKey);

    const configuration = isFullConstantsConfig(configOrOverrides)
      ? createRuntimeConfiguration(undefined, configOrOverrides)
      : createRuntimeConfiguration(configOrOverrides, baseConfig);

    configurationRegistry.set(key, configuration);
    return configuration;
  }

  public static unregister(key: ConfigurationKey): boolean {
    if (key === DEFAULT_CONFIGURATION_KEY) {
      return false;
    }
    return configurationRegistry.delete(key);
  }

  public static clear(): void {
    configurationRegistry.clear();
    configurationRegistry.set(DEFAULT_CONFIGURATION_KEY, Constants);
  }
}

export function getRuntimeConfiguration(
  key: ConfigurationKey = DEFAULT_CONFIGURATION_KEY,
): IConstants {
  return ConstantsRegistry.get(key);
}

export function registerRuntimeConfiguration(
  key: ConfigurationKey,
  configOrOverrides?: DeepPartial<IConstants> | IConstants,
  options?: { baseKey?: ConfigurationKey },
): IConstants {
  return ConstantsRegistry.register(key, configOrOverrides, options);
}

export function unregisterRuntimeConfiguration(
  key: ConfigurationKey,
): boolean {
  return ConstantsRegistry.unregister(key);
}

export function clearRuntimeConfigurations(): void {
  ConstantsRegistry.clear();
}

export { PASSWORD_REGEX, MNEMONIC_REGEX } from './regexes';
