/**
 * Main constants interface for the ECIES library.
 * Contains all configuration constants including cryptographic parameters,
 * ID provider configuration, and validation rules.
 */

import type { IVotingConsts } from '../lib/voting/interfaces/voting-consts';
import type { Pbkdf2Profiles } from '../pbkdf2-profiles';
import type { IChecksumConsts } from './checksum-consts';
import type { IECIESConfig } from './ecies-config';
import type { IECIESConstants } from './ecies-consts';
import type { IIdProviderBase } from './id-provider';
import type { IPBkdf2Consts } from './pbkdf2-consts';

export interface IConstants {
  /** Size of an 8-bit unsigned integer in bytes */
  UINT8_SIZE: number;
  /** Size of a 16-bit unsigned integer in bytes */
  UINT16_SIZE: number;
  /** Maximum value for a 16-bit unsigned integer */
  UINT16_MAX: number;
  /** Size of a 32-bit unsigned integer in bytes */
  UINT32_SIZE: number;
  /** Maximum value for a 32-bit unsigned integer */
  UINT32_MAX: number;
  /** Size of a 64-bit unsigned integer in bytes */
  UINT64_SIZE: number;
  /** Maximum value for a 64-bit unsigned integer */
  UINT64_MAX: bigint;
  /** Radix for hexadecimal number conversion */
  HEX_RADIX: number;

  /**
   * The length of user IDs in the system.
   * This is dynamically determined by the configured ID provider.
   * @deprecated Use idProvider.byteLength instead for direct access
   */
  MEMBER_ID_LENGTH: number;

  /**
   * ID provider for recipient identification in multi-recipient encryption.
   * This determines the format and size of recipient IDs used throughout the system.
   *
   * Default: ObjectIdProvider (12 bytes, MongoDB compatible)
   *
   * The base interface provides Uint8Array-based operations (generate, validate,
   * serialize, deserialize). For typed operations with the native ID type,
   * cast to the specific provider type or use IIdProvider<T>.
   *
   * @example
   * ```typescript
   * import { GuidV4Provider } from './lib/id-providers';
   *
   * // Use GUIDs instead of ObjectIDs
   * const config = createRuntimeConfiguration({
   *   idProvider: new GuidV4Provider()
   * });
   *
   * // For typed access:
   * const provider = config.idProvider as GuidV4Provider;
   * const guid = provider.fromBytes(provider.generate());
   * ```
   */
  idProvider: IIdProviderBase;

  /** Checksum algorithm constants */
  CHECKSUM: IChecksumConsts;
  /** ECIES encryption constants */
  ECIES: IECIESConstants;
  /** ECIES configuration parameters */
  ECIES_CONFIG: IECIESConfig;
  /** PBKDF2 key derivation constants */
  PBKDF2: IPBkdf2Consts;
  /** Predefined PBKDF2 configuration profiles */
  PBKDF2_PROFILES: Pbkdf2Profiles;
  /** Voting system constants for homomorphic encryption */
  VOTING: IVotingConsts;

  /**
   * Number of rounds for bcrypt hashing. Higher values increase security but also consume more CPU resources.
   */
  BcryptRounds: number;
  /**
   * Minimum password length
   */
  PasswordMinLength: number;
  /**
   * The regular expression for valid passwords.
   */
  PasswordRegex: RegExp;
  /**
   * The regular expression for valid mnemonic phrases.
   * BIP39
   */
  MnemonicRegex: RegExp;
  /**
   * The regular expression for valid HMAC keys.
   */
  MnemonicHmacRegex: RegExp;
}
