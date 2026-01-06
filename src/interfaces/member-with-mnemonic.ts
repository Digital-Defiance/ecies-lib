import type { SecureString } from '../secure-string';
import type { IMember } from './member';
import type { PlatformID } from './platform-id';

export interface IMemberWithMnemonic<TID extends PlatformID = Uint8Array> {
  member: IMember<TID>;
  mnemonic: SecureString;
}
