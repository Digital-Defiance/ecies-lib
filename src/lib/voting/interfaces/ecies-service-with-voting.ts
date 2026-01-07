import { KeyPair, PrivateKey, PublicKey } from 'paillier-bigint';
import type { PlatformBuffer } from '../../../interfaces/platform-buffer.js';
import { IVotingKeyDerivationOptions } from './voting-key-derivation-options.js';

/**
 * Integrated ECIES service with voting support.
 * Provides access to voting key derivation and serialization.
 */
export interface IECIESServiceWithVoting {
  /** Voting service accessor */
  readonly voting: {
    /**
     * Derive Paillier voting keys from ECDH key pair.
     * @param ecdhPrivateKey - ECDH private key
     * @param ecdhPublicKey - ECDH public key
     * @param options - Derivation options
     * @returns Paillier key pair
     */
    deriveVotingKeysFromECDH(
      ecdhPrivateKey: PlatformBuffer,
      ecdhPublicKey: PlatformBuffer,
      options?: IVotingKeyDerivationOptions,
    ): Promise<KeyPair>;

    /**
     * Generate deterministic key pair from seed.
     * WARNING: For testing only!
     * @param seed - Random seed (min 32 bytes)
     * @param bitLength - Key bit length
     * @param iterations - Prime test iterations
     * @returns Paillier key pair
     */
    generateDeterministicKeyPair(
      seed: PlatformBuffer,
      bitLength?: number,
      iterations?: number,
    ): Promise<KeyPair>;

    /**
     * Serialize public key to buffer.
     * @param publicKey - Public key
     * @returns Serialized buffer
     */
    votingPublicKeyToBuffer(
      publicKey: PublicKey,
    ): PlatformBuffer | Promise<PlatformBuffer>;
    /**
     * Deserialize public key from buffer.
     * @param buffer - Serialized buffer
     * @returns Public key
     */
    bufferToVotingPublicKey(buffer: PlatformBuffer): Promise<PublicKey>;
    /**
     * Serialize private key to buffer.
     * @param privateKey - Private key
     * @returns Serialized buffer
     */
    votingPrivateKeyToBuffer(privateKey: PrivateKey): PlatformBuffer;
    /**
     * Deserialize private key from buffer.
     * @param buffer - Serialized buffer
     * @param publicKey - Corresponding public key
     * @returns Private key
     */
    bufferToVotingPrivateKey(
      buffer: PlatformBuffer,
      publicKey: PublicKey,
    ): Promise<PrivateKey>;
  };
}
