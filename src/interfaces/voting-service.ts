import type { KeyPair, PrivateKey, PublicKey } from 'paillier-bigint';
import type { IIsolatedPrivateKey, IIsolatedPublicKey } from './isolated-keys';
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
  isolatedPublicKeyToBuffer(publicKey: IIsolatedPublicKey): PlatformBuffer;
  bufferToIsolatedPublicKey(
    buffer: PlatformBuffer,
  ): Promise<IIsolatedPublicKey>;
  isolatedPrivateKeyToBuffer(privateKey: IIsolatedPrivateKey): PlatformBuffer;
  bufferToIsolatedPrivateKey(
    buffer: PlatformBuffer,
    publicKey: IIsolatedPublicKey,
  ): Promise<IIsolatedPrivateKey>;
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
