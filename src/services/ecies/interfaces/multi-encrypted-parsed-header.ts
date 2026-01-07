import type { PlatformID } from '../../../interfaces';

export interface IMultiEncryptedParsedHeader<
  TID extends PlatformID = Uint8Array,
> {
  dataLength: number;
  recipientCount: number;
  recipientIds: TID[];
  recipientKeys: Uint8Array[];
  headerSize: number;
  ephemeralPublicKey?: Uint8Array; // Added for shared ephemeral key optimization
}
