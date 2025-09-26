import { Pbkdf2ProfileEnum } from './enumerations/pbkdf2-profile';
import { IPbkdf2Config } from './interfaces/pbkdf2-config';

export type Pbkdf2Profiles = {
  [key in Pbkdf2ProfileEnum]: IPbkdf2Config;
};
