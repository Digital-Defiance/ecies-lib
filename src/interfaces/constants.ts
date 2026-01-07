import type { Pbkdf2Profiles } from '../pbkdf2-profiles';
import type { IChecksumConsts } from './checksum-consts';
import type { IECIESConstants } from './ecies-consts';
import type { IIdProviderBase } from './id-provider';
import type { IPBkdf2Consts } from './pbkdf2-consts';
import type { IVotingConsts } from './voting-consts';

export interface IConstants {
  UINT8_SIZE: number;
  UINT16_SIZE: number;
  UINT16_MAX: number;
  UINT32_SIZE: number;
  UINT32_MAX: number;
  UINT64_SIZE: number;
  UINT64_MAX: bigint;
  HEX_RADIX: number;

  /**
   * The length of user IDs in the system.
   * This is dynamically determined by the configured ID provider.
   * @deprecated Use idProvider.byteLength instead for direct access
   */
  MEMBER_ID_LENGTH: number;

  /**
   * The length of a raw object ID (not the hex string representation).
   * Standard MongoDB ObjectID is 12 bytes.
   * @deprecated Use idProvider.byteLength instead for direct access
   */
  OBJECT_ID_LENGTH: number;

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

  CHECKSUM: IChecksumConsts;
  ECIES: IECIESConstants;
  PBKDF2: IPBkdf2Consts;
  PBKDF2_PROFILES: Pbkdf2Profiles;
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
