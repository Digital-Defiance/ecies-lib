import type { PlatformBuffer } from './platform-buffer';

/**
 * Extended interface for IsolatedPublicKey with async methods
 * These are the actual methods used by the voting service implementations
 */
export interface IIsolatedPublicKeyAsync {
  readonly keyId: PlatformBuffer;
  getKeyId(): PlatformBuffer;
  getInstanceId(): PlatformBuffer;
  updateInstanceId(): Promise<void>;
  verifyKeyIdAsync(): Promise<void>;
  encryptAsync(m: bigint): Promise<bigint>;
  multiplyAsync(ciphertext: bigint, constant: bigint): Promise<bigint>;
  additionAsync(a: bigint, b: bigint): Promise<bigint>;
  extractInstanceId(ciphertext: bigint): Promise<PlatformBuffer>;
}
