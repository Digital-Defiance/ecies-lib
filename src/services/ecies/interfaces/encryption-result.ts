export interface IEncryptionResult {
  encryptedData: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
}
