import type { PlatformID } from '../../../interfaces';

export interface IMultiRecipient<TID extends PlatformID = Uint8Array> {
  id: TID;
  publicKey: Uint8Array;
}
