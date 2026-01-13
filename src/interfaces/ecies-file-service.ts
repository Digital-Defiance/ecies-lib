/**
 * Service interface for file encryption and decryption operations.
 */
export interface IEciesFileService {
  encryptFile(file: File, recipientPublicKey: Uint8Array): Promise<Uint8Array>;
  decryptFile(encryptedData: Uint8Array): Promise<Uint8Array>;
  downloadEncryptedFile(encryptedData: Uint8Array, filename: string): void;
  downloadDecryptedFile(decryptedData: Uint8Array, filename: string): void;
}
