import type { SecureString } from '../secure-string';
import type { IMember } from './member';

export interface IMemberWithMnemonic {
  member: IMember;
  mnemonic: SecureString;
}
