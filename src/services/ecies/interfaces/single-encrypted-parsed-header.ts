import { EciesEncryptionTypeEnum } from '../../../enumerations/ecies-encryption-type';

export interface ISingleEncryptedParsedHeader {
  preamble?: Uint8Array;
  encryptionType: EciesEncryptionTypeEnum;
  ephemeralPublicKey: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
  dataLength: number;
  headerSize: number;
}
