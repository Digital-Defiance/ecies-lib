import { Pbkdf2ProfileEnum } from './enumerations/pbkdf2-profile';
import { IPbkdf2Config } from './interfaces/pbkdf2-config';

/**
 * Type definition for PBKDF2 configuration profiles.
 * Maps profile names to their configuration settings.
 */
export type Pbkdf2Profiles = {
  [key in Pbkdf2ProfileEnum]: IPbkdf2Config;
};
