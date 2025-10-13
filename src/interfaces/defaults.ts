import { DeepPartial } from '../types/deep-partial';
import { Pbkdf2Profiles } from '../pbkdf2-profiles';
import { IChecksumConsts } from './checksum-consts';
import { IECIESConstants } from './ecies-consts';
import { IPBkdf2Consts } from './pbkdf2-consts';

export interface IDefaults {

  CHECKSUM: IChecksumConsts;

  ECIES: IECIESConstants;

  PBKDF2: IPBkdf2Consts;

  PBKDF2_PROFILES: Pbkdf2Profiles;

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
  HmacRegex: RegExp;
}

export type IRuntimeConfiguration = IDefaults;

export type IDefaultsOverrides = DeepPartial<IDefaults>;