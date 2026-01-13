import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { ECIESErrorTypeEnum, EciesStringKey } from './enumerations';
import { Pbkdf2ProfileEnum } from './enumerations/pbkdf2-profile';
import { ECIESError } from './errors/ecies';
import { EciesComponentId, getEciesI18nEngine } from './i18n-setup';
import type { IChecksumConsts } from './interfaces/checksum-consts';
import type { IConfigurationProvenance } from './interfaces/configuration-provenance';
import type { IConstants } from './interfaces/constants';
import type { IECIESConstants } from './interfaces/ecies-consts';
import type { IPBkdf2Consts } from './interfaces/pbkdf2-consts';
import { ObjectIdProvider } from './lib/id-providers/objectid-provider';
import { InvariantValidator } from './lib/invariant-validator';
import type { IVotingConsts } from './lib/voting/interfaces/voting-consts';
import type { Pbkdf2Profiles } from './pbkdf2-profiles';
import { MNEMONIC_REGEX, PASSWORD_REGEX } from './regexes';
import type { DeepPartial } from './types/deep-partial';

/**
 * Calculates a SHA-256 checksum for a configuration object.
 * Creates a stable JSON representation with BigInt support.
 * @param config The configuration object to checksum
 * @returns Hexadecimal string representation of the SHA-256 hash
 */
function calculateConfigChecksum(config: IConstants): string {
  // Create a stable JSON representation with BigInt support
  const replacer = (_key: string, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value;
  const stable = JSON.stringify(config, replacer);
  const encoder = new TextEncoder();
  const data = encoder.encode(stable);
  return bytesToHex(sha256(data));
}

/**
 * Captures a stack trace for provenance tracking.
 * Used to track where configuration objects are created.
 * @returns Stack trace string or 'stack unavailable' if not supported
 */
function captureCreationStack(): string {
  const stack = new Error().stack;
  if (!stack) return 'stack unavailable';

  // Remove the first two lines (Error message and this function)
  const lines = stack.split('\n').slice(2);
  return lines.join('\n');
}

/** Size of an 8-bit unsigned integer in bytes */
export const UINT8_SIZE: number = 1 as const;
/** Size of a 16-bit unsigned integer in bytes */
export const UINT16_SIZE: number = 2 as const;
/** Maximum value for a 16-bit unsigned integer */
export const UINT16_MAX: number = 65535 as const;
/** Size of a 32-bit unsigned integer in bytes */
export const UINT32_SIZE: number = 4 as const;
/** Maximum value for a 32-bit unsigned integer */
export const UINT32_MAX: number = 4294967295 as const;
/** Size of a 64-bit unsigned integer in bytes */
export const UINT64_SIZE: number = 8 as const;
/** Maximum value for a 64-bit unsigned integer */
export const UINT64_MAX: bigint = 18446744073709551615n as const;
/** Length of MongoDB ObjectID in bytes */
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
const ECIES_PUBLIC_KEY_LENGTH = 33 as const;
const ECIES_RAW_PUBLIC_KEY_LENGTH = 32 as const;
const ECIES_IV_SIZE = 12 as const;
const ECIES_AUTH_TAG_SIZE = 16 as const;
const ECIES_MULTIPLE_RECIPIENT_ID_SIZE = 12 as const;
const ECIES_MULTIPLE_MAX_DATA_SIZE = 1048576 as const; //1024 * 1024 as const; // 1MB guardrail for multi-recipient payloads
const ECIES_VERSION_SIZE = 1 as const;
const ECIES_CIPHER_SUITE_SIZE = 1 as const;

// Define the expected value for SIMPLE.FIXED_OVERHEAD_SIZE
const expectedSimpleOverhead =
  ECIES_VERSION_SIZE +
  ECIES_CIPHER_SUITE_SIZE +
  UINT8_SIZE +
  ECIES_PUBLIC_KEY_LENGTH +
  ECIES_IV_SIZE +
  ECIES_AUTH_TAG_SIZE;

// Define the expected value for MULTIPLE.FIXED_OVERHEAD_SIZE
// Includes: version (1) + cipher suite (1) + type (1) + public key (33) + IV (16) + auth tag (16) = 68 (no CRC, AES-GCM provides authentication)
const expectedMultipleOverhead =
  ECIES_VERSION_SIZE +
  ECIES_CIPHER_SUITE_SIZE +
  UINT8_SIZE +
  ECIES_PUBLIC_KEY_LENGTH +
  ECIES_IV_SIZE +
  ECIES_AUTH_TAG_SIZE;

// Update ENCRYPTED_KEY_SIZE to match Simple encryption (no CRC)
// Now only contains IV + Tag + EncryptedSymKey (Public Key is moved to global header)
const expectedMultipleEncryptedKeySize =
  ECIES_IV_SIZE + ECIES_AUTH_TAG_SIZE + ECIES_SYMMETRIC_KEY_SIZE;

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

  /** Length of public keys in bytes (with 0x02/0x03 prefix) */
  PUBLIC_KEY_LENGTH: ECIES_PUBLIC_KEY_LENGTH,

  PUBLIC_KEY_MAGIC: 0x02 as const, // Compressed keys start with 0x02 or 0x03

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

  VERSION_SIZE: ECIES_VERSION_SIZE,
  CIPHER_SUITE_SIZE: ECIES_CIPHER_SUITE_SIZE,
  ENCRYPTION_TYPE_SIZE: 1 as const,

  /**
   * Message encrypts without data length or crc
   */
  SIMPLE: Object.freeze({
    FIXED_OVERHEAD_SIZE: expectedSimpleOverhead, // version (1) + cipher suite (1) + type (1) + public key (33) + IV (16) + auth tag (16)
    DATA_LENGTH_SIZE: 0 as const,
  } as const),

  /**
   * Message encrypts with data length but no CRC (AES-GCM provides authentication)
   */
  SINGLE: Object.freeze({
    FIXED_OVERHEAD_SIZE: expectedSimpleOverhead + 8, // version (1) + cipher suite (1) + type (1) + public key (33) + IV (16) + auth tag (16) + data length (8)
    DATA_LENGTH_SIZE: 8,
  } as const),

  /**
   * Message encrypts for multiple recipients
   */
  MULTIPLE: Object.freeze({
    FIXED_OVERHEAD_SIZE: expectedMultipleOverhead, // version (1) + cipher suite (1) + type (1) + public key (33) + IV (16) + auth tag (16)
    ENCRYPTED_KEY_SIZE: expectedMultipleEncryptedKeySize, // 64
    MAX_RECIPIENTS: 65535,
    MAX_DATA_SIZE: ECIES_MULTIPLE_MAX_DATA_SIZE,
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

/**
 * Constants for voting operations using Paillier homomorphic encryption.
 * These values are critical for cryptographic operations and MUST match
 * across all implementations (ecies-lib, node-ecies-lib, BrightChain).
 */
export const VOTING: IVotingConsts = Object.freeze({
  PRIME_GEN_INFO: 'PaillierPrimeGen' as const,
  PRIME_TEST_ITERATIONS: 256 as const,
  KEYPAIR_BIT_LENGTH: 3072 as const,
  PUB_KEY_OFFSET: 768 as const,
  HKDF_LENGTH: 64 as const,
  HMAC_ALGORITHM: 'sha512' as const,
  HASH_ALGORITHM: 'sha256' as const,
  BITS_RADIX: 2 as const,
  KEY_RADIX: 16 as const,
  KEY_FORMAT: 'hex' as const,
  DIGEST_FORMAT: 'hex' as const,
  KEY_VERSION: 1 as const,
  KEY_MAGIC: 'BCVK' as const,
  DRBG_PRIME_ATTEMPTS: 20000 as const,
  KEY_ID_LENGTH: 32 as const,
  INSTANCE_ID_LENGTH: 32 as const,
});

/**
 * Default ID provider instance (singleton).
 * Uses MongoDB ObjectID format (12 bytes).
 */
const DEFAULT_ID_PROVIDER = new ObjectIdProvider();

export const Constants: IConstants = Object.freeze({
  UINT8_SIZE: UINT8_SIZE,
  UINT16_SIZE: UINT16_SIZE,
  UINT16_MAX: UINT16_MAX,
  UINT32_SIZE: UINT32_SIZE,
  UINT32_MAX: UINT32_MAX,
  UINT64_SIZE: UINT64_SIZE,
  UINT64_MAX: UINT64_MAX,
  HEX_RADIX: 16 as const,
  MEMBER_ID_LENGTH: DEFAULT_ID_PROVIDER.byteLength,
  OBJECT_ID_LENGTH: OBJECT_ID_LENGTH,
  idProvider: DEFAULT_ID_PROVIDER,
  CHECKSUM: CHECKSUM,
  ECIES: ECIES,
  PBKDF2: PBKDF2,
  PBKDF2_PROFILES: PBKDF2_PROFILES,
  VOTING: VOTING,
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
  MnemonicHmacRegex: /^[a-f0-9]{64}$/,
} as const);

export type ConfigurationKey = string | symbol;

const DEFAULT_CONFIGURATION_KEY: ConfigurationKey = Symbol.for(
  'digitaldefiance.ecies.constants.default',
);

/**
 * Validates if a value is a plain JavaScript object.
 * Excludes arrays, RegExp, Date, and other special objects.
 * @param value The value to check
 * @returns True if value is a plain object
 */
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

/**
 * Creates a deep clone of an object, handling arrays, RegExp, Date, and plain objects.
 * @param input The value to clone
 * @returns Deep cloned copy of the input
 */
function deepClone<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item: unknown) => deepClone(item)) as T;
  }

  if (input instanceof RegExp) {
    return new RegExp(input.source, input.flags) as T;
  }

  if (input instanceof Date) {
    return new Date(input.getTime()) as T;
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

/**
 * Applies partial overrides to a target object, merging nested objects recursively.
 * @param target The target object to modify
 * @param overrides Partial overrides to apply
 * @returns The modified target object
 */
function applyOverrides<T>(target: T, overrides?: DeepPartial<T>): T {
  if (!overrides) {
    return target;
  }

  for (const [key, overrideValue] of Object.entries(overrides)) {
    const typedKey = key as keyof T;
    if (overrideValue === undefined) {
      continue;
    }

    const currentValue = target[typedKey];

    if (isPlainObject(currentValue) && isPlainObject(overrideValue)) {
      (target as Record<string, unknown>)[typedKey as string] = applyOverrides(
        currentValue,
        overrideValue as DeepPartial<typeof currentValue>,
      );
    } else {
      (target as Record<string, unknown>)[typedKey as string] =
        deepClone(overrideValue);
    }
  }

  return target;
}

/**
 * Recursively freezes an object and all its nested properties.
 * @param value The value to freeze
 * @returns The frozen value
 */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);

  for (const property of Object.getOwnPropertyNames(value)) {
    const nestedValue = (value as Record<string, unknown>)[property];
    if (nestedValue && typeof nestedValue === 'object') {
      deepFreeze(nestedValue);
    }
  }

  return value;
}

/**
 * Computes the expected encrypted key size for multiple recipient encryption.
 * @param ecies The ECIES constants configuration
 * @returns The computed encrypted key size in bytes
 */
function computeMultipleEncryptedKeySize(ecies: IECIESConstants): number {
  return ecies.IV_SIZE + ecies.AUTH_TAG_SIZE + ecies.SYMMETRIC.KEY_SIZE;
}

/**
 * Validates the internal consistency of constants configuration.
 * Checks that all derived values match their expected calculations.
 * @param config The constants configuration to validate
 * @throws {Error} If any validation check fails
 */
function validateConstants(config: IConstants): void {
  const checksum = config.CHECKSUM;
  const ecies = config.ECIES;

  if (
    checksum.SHA3_BUFFER_LENGTH !== checksum.SHA3_DEFAULT_HASH_BITS / 8 ||
    checksum.SHA3_BUFFER_LENGTH !== checksum.SHA3_DEFAULT_HASH_BITS / 8
  ) {
    const engine = getEciesI18nEngine();
    throw new Error(
      engine.translate(
        EciesComponentId,
        EciesStringKey.Error_ECIESError_InvalidChecksumConstants,
      ),
    );
  }

  const expectedEncryptedKeySize = computeMultipleEncryptedKeySize(ecies);
  if (ecies.MULTIPLE.ENCRYPTED_KEY_SIZE !== expectedEncryptedKeySize) {
    throw new ECIESError(
      ECIESErrorTypeEnum.InvalidECIESMultipleEncryptedKeySize,
    );
  }

  if (ecies.PUBLIC_KEY_LENGTH !== ecies.RAW_PUBLIC_KEY_LENGTH + 1) {
    throw new ECIESError(ECIESErrorTypeEnum.InvalidECIESPublicKeyLength);
  }

  if (ecies.MULTIPLE.RECIPIENT_COUNT_SIZE !== UINT16_SIZE) {
    throw new ECIESError(
      ECIESErrorTypeEnum.InvalidECIESMultipleRecipientCountSize,
    );
  }

  if (ecies.MULTIPLE.DATA_LENGTH_SIZE !== UINT64_SIZE) {
    throw new ECIESError(ECIESErrorTypeEnum.InvalidECIESMultipleDataLengthSize);
  }

  // Validate ID provider is present and valid
  if (!config.idProvider) {
    throw new Error('ID provider is required in constants configuration');
  }

  if (
    typeof config.idProvider.byteLength !== 'number' ||
    config.idProvider.byteLength < 1 ||
    config.idProvider.byteLength > 255
  ) {
    throw new Error(
      `Invalid ID provider byteLength: ${config.idProvider.byteLength}. Must be between 1 and 255.`,
    );
  }

  // Validate MEMBER_ID_LENGTH matches ID provider
  if (config.MEMBER_ID_LENGTH !== config.idProvider.byteLength) {
    throw new Error(
      `MEMBER_ID_LENGTH (${config.MEMBER_ID_LENGTH}) must match idProvider.byteLength (${config.idProvider.byteLength})`,
    );
  }

  // NOTE: We now validate against idProvider.byteLength instead of OBJECT_ID_LENGTH
  // This allows for flexible ID sizes (12 bytes for ObjectID, 16 for GUID, 32 for legacy, etc.)
  if (ecies.MULTIPLE.RECIPIENT_ID_SIZE !== config.idProvider.byteLength) {
    throw new ECIESError(
      ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
    );
  }
}

validateConstants(Constants);

const configurationRegistry = new Map<ConfigurationKey, IConstants>();
configurationRegistry.set(DEFAULT_CONFIGURATION_KEY, Constants);

// Provenance tracking
const provenanceRegistry = new Map<
  ConfigurationKey,
  IConfigurationProvenance
>();
provenanceRegistry.set(DEFAULT_CONFIGURATION_KEY, {
  baseConfigKey: 'none',
  overrides: {},
  timestamp: new Date(),
  source: 'default',
  checksum: calculateConfigChecksum(Constants),
  description: 'Built-in default configuration',
});

/**
 * Checks if a value is a complete IConstants configuration object.
 * @param value The value to check
 * @returns True if value contains all required IConstants properties
 */
function isFullConstantsConfig(value: unknown): value is IConstants {
  if (!isPlainObject(value)) {
    return false;
  }
  const candidate = value as Partial<IConstants>;
  return (
    candidate.CHECKSUM !== undefined &&
    candidate.ECIES !== undefined &&
    candidate.PBKDF2 !== undefined &&
    candidate.PBKDF2_PROFILES !== undefined &&
    candidate.idProvider !== undefined
  );
}

/**
 * Creates a runtime configuration by merging overrides with a base configuration.
 * Validates the result and freezes it to prevent modification.
 * @param overrides Partial configuration overrides
 * @param base Base configuration to extend (defaults to Constants)
 * @returns Frozen, validated configuration object
 */
export function createRuntimeConfiguration(
  overrides?: DeepPartial<IConstants>,
  base: IConstants = Constants,
): IConstants {
  const merged = deepClone(base);
  applyOverrides(merged, overrides);

  // Auto-sync MEMBER_ID_LENGTH with idProvider.byteLength if provider changed
  if (merged.idProvider && merged.idProvider !== base.idProvider) {
    merged.MEMBER_ID_LENGTH = merged.idProvider.byteLength;
  }

  // Auto-sync ECIES.MULTIPLE.RECIPIENT_ID_SIZE with idProvider.byteLength if provider changed
  if (merged.idProvider && merged.idProvider !== base.idProvider) {
    merged.ECIES = {
      ...merged.ECIES,
      MULTIPLE: {
        ...merged.ECIES.MULTIPLE,
        RECIPIENT_ID_SIZE: merged.idProvider.byteLength,
      },
    };
  }

  // Validate individual properties
  validateConstants(merged);

  // Validate all invariants (relationships between properties)
  InvariantValidator.validateAll(merged);

  return deepFreeze(merged);
}

/**
 * Registry for managing multiple named configuration instances.
 * Provides methods to register, retrieve, and manage configurations with provenance tracking.
 */
export class ConstantsRegistry {
  /**
   * Default configuration key symbol.
   */
  public static readonly DEFAULT_KEY = DEFAULT_CONFIGURATION_KEY;

  /**
   * Lists all registered configuration keys.
   * @returns Array of configuration keys
   */
  public static listKeys(): ConfigurationKey[] {
    return Array.from(configurationRegistry.keys());
  }

  /**
   * Checks if a configuration key exists in the registry.
   * @param key The configuration key to check
   * @returns True if the key exists
   */
  public static has(key: ConfigurationKey): boolean {
    return configurationRegistry.has(key);
  }

  /**
   * Retrieves a configuration by key.
   * @param key The configuration key (defaults to DEFAULT_KEY)
   * @returns The configuration object
   */
  public static get(
    key: ConfigurationKey = DEFAULT_CONFIGURATION_KEY,
  ): IConstants {
    return (
      configurationRegistry.get(key) ??
      configurationRegistry.get(DEFAULT_CONFIGURATION_KEY)!
    );
  }

  /**
   * Gets provenance information for a configuration.
   * @param key The configuration key (defaults to DEFAULT_KEY)
   * @returns Provenance information or undefined if not found
   */
  public static getProvenance(
    key: ConfigurationKey = DEFAULT_CONFIGURATION_KEY,
  ): IConfigurationProvenance | undefined {
    return provenanceRegistry.get(key);
  }

  /**
   * Lists all configurations with their provenance information.
   * @returns Array of configuration entries with keys, configs, and provenance
   */
  public static listWithProvenance(): Array<{
    key: ConfigurationKey;
    config: IConstants;
    provenance?: IConfigurationProvenance;
  }> {
    return Array.from(configurationRegistry.entries()).map(([key, config]) => ({
      key,
      config,
      provenance: provenanceRegistry.get(key),
    }));
  }

  /**
   * Creates a new configuration from overrides without registering it.
   * @param overrides Partial configuration overrides
   * @param baseKey Key of the base configuration to extend
   * @returns New configuration object
   */
  public static create(
    overrides?: DeepPartial<IConstants>,
    baseKey: ConfigurationKey = DEFAULT_CONFIGURATION_KEY,
  ): IConstants {
    const baseConfig = ConstantsRegistry.get(baseKey);
    return createRuntimeConfiguration(overrides, baseConfig);
  }

  /**
   * Registers a new configuration in the registry.
   * @param key Unique key for the configuration
   * @param configOrOverrides Full configuration or partial overrides
   * @param options Registration options (baseKey, description)
   * @returns The registered configuration
   * @throws {Error} If attempting to overwrite the default configuration
   */
  public static register(
    key: ConfigurationKey,
    configOrOverrides?: DeepPartial<IConstants> | IConstants,
    options?: { baseKey?: ConfigurationKey; description?: string },
  ): IConstants {
    if (key === DEFAULT_CONFIGURATION_KEY) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_CannotOverwriteDefaultConfiguration,
        ),
      );
    }

    const baseKey = options?.baseKey ?? DEFAULT_CONFIGURATION_KEY;
    const baseConfig = ConstantsRegistry.get(baseKey);

    const isFullConfig = isFullConstantsConfig(configOrOverrides);
    const configuration = isFullConfig
      ? createRuntimeConfiguration(undefined, configOrOverrides)
      : createRuntimeConfiguration(configOrOverrides, baseConfig);

    // Track provenance
    const provenance: IConfigurationProvenance = {
      baseConfigKey: typeof baseKey === 'symbol' ? baseKey.toString() : baseKey,
      overrides: isFullConfig ? {} : (configOrOverrides ?? {}),
      timestamp: new Date(),
      source: isFullConfig ? 'custom' : 'runtime',
      checksum: calculateConfigChecksum(configuration),
      description: options?.description,
      creationStack: captureCreationStack(),
    };

    configurationRegistry.set(key, configuration);
    provenanceRegistry.set(key, provenance);
    return configuration;
  }

  /**
   * Unregisters a configuration from the registry.
   * @param key The configuration key to remove
   * @returns True if the configuration was removed, false if it didn't exist or is the default
   */
  public static unregister(key: ConfigurationKey): boolean {
    if (key === DEFAULT_CONFIGURATION_KEY) {
      return false;
    }
    provenanceRegistry.delete(key);
    return configurationRegistry.delete(key);
  }

  /**
   * Clears all configurations except the default.
   */
  public static clear(): void {
    const defaultProvenance = provenanceRegistry.get(DEFAULT_CONFIGURATION_KEY);
    configurationRegistry.clear();
    provenanceRegistry.clear();
    configurationRegistry.set(DEFAULT_CONFIGURATION_KEY, Constants);
    if (defaultProvenance) {
      provenanceRegistry.set(DEFAULT_CONFIGURATION_KEY, defaultProvenance);
    }
  }
}

/**
 * Retrieves a runtime configuration by key.
 * Convenience function that delegates to ConstantsRegistry.get.
 * @param key The configuration key (defaults to DEFAULT_KEY)
 * @returns The configuration object
 */
export function getRuntimeConfiguration(
  key: ConfigurationKey = DEFAULT_CONFIGURATION_KEY,
): IConstants {
  return ConstantsRegistry.get(key);
}

/**
 * Registers a runtime configuration.
 * Convenience function that delegates to ConstantsRegistry.register.
 * @param key Unique key for the configuration
 * @param configOrOverrides Full configuration or partial overrides
 * @param options Registration options
 * @returns The registered configuration
 */
export function registerRuntimeConfiguration(
  key: ConfigurationKey,
  configOrOverrides?: DeepPartial<IConstants> | IConstants,
  options?: { baseKey?: ConfigurationKey },
): IConstants {
  return ConstantsRegistry.register(key, configOrOverrides, options);
}

/**
 * Unregisters a runtime configuration.
 * Convenience function that delegates to ConstantsRegistry.unregister.
 * @param key The configuration key to remove
 * @returns True if the configuration was removed
 */
export function unregisterRuntimeConfiguration(key: ConfigurationKey): boolean {
  return ConstantsRegistry.unregister(key);
}

/**
 * Clears all runtime configurations except the default.
 * Convenience function that delegates to ConstantsRegistry.clear.
 */
export function clearRuntimeConfigurations(): void {
  ConstantsRegistry.clear();
}

export { MNEMONIC_REGEX, PASSWORD_REGEX } from './regexes';

// Export utility functions
export { calculateConfigChecksum, captureCreationStack };
