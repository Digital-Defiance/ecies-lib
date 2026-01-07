import type { IIsolatedPublicKeyAsync } from './isolated-public-key-async';
import type { PlatformBuffer } from './platform-buffer';

/**
 * Extended interface for IsolatedPrivateKey with async methods
 * These are the actual methods used by the voting service implementations
 */
export interface IIsolatedPrivateKeyAsync {
  decryptAsync(taggedCiphertext: bigint): Promise<bigint>;
  getOriginalKeyId(): PlatformBuffer;
  getOriginalInstanceId(): PlatformBuffer;
  getOriginalPublicKey(): IIsolatedPublicKeyAsync;
}
