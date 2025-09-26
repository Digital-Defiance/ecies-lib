import { Member } from '../member';
import { SecureString } from '../secure-string';

export interface IMemberWithMnemonic {
  member: Member;
  mnemonic: SecureString;
}
