import type { Member } from '../member';
import type { SecureString } from '../secure-string';

export interface IMemberWithMnemonic {
  member: Member;
  mnemonic: SecureString;
}
