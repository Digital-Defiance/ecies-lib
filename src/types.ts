import { Brand } from 'ts-brand';

export type SignatureUint8Array = Uint8Array &
  Brand<Uint8Array, 'SignatureArray'>;
export type ChecksumUint8Array = Uint8Array &
  Brand<Uint8Array, 'Sha3Checksum', 'ChecksumArray'>;
export type SignatureString = string & Brand<string, 'SignatureString'>;
export type HexString = Brand<string, 'HexString'>;
export type ChecksumString = Brand<HexString, 'Sha3Checksum', 'ChecksumString'>;
