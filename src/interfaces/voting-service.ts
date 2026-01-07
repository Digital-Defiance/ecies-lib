import type { KeyPair, PrivateKey, PublicKey } from 'paillier-bigint';
import type { IsolatedPrivateKey } from '../isolated-private';
import type { IsolatedPublicKey } from '../isolated-public';
import type { PlatformBuffer } from './platform-buffer';

/**
 * Common interface for VotingService implementations
 */
export interface IVotingService {
  votingPublicKeyToBuffer(
    publicKey: PublicKey,
  ): PlatformBuffer | Promise<PlatformBuffer>;
  bufferToVotingPublicKey(buffer: PlatformBuffer): Promise<PublicKey>;
  votingPrivateKeyToBuffer(privateKey: PrivateKey): PlatformBuffer;
  bufferToVotingPrivateKey(
    buffer: PlatformBuffer,
    publicKey: PublicKey,
  ): Promise<PrivateKey>;
  isolatedPublicKeyToBuffer(publicKey: IsolatedPublicKey): PlatformBuffer;
  bufferToIsolatedPublicKey(buffer: PlatformBuffer): Promise<IsolatedPublicKey>;
  isolatedPrivateKeyToBuffer(privateKey: IsolatedPrivateKey): PlatformBuffer;
  bufferToIsolatedPrivateKey(
    buffer: PlatformBuffer,
    publicKey: IsolatedPublicKey,
  ): Promise<IsolatedPrivateKey>;
  deriveVotingKeysFromECDH(
    ecdhPrivateKey: PlatformBuffer,
    ecdhPublicKey: PlatformBuffer,
    options?: Record<string, unknown>,
  ): Promise<KeyPair>;
  generateDeterministicKeyPair(
    seed: PlatformBuffer,
    bitLength?: number,
    iterations?: number,
  ): Promise<KeyPair>;
}
