/**
 * Interface defining the subset of ECIESService that Member depends on.
 *
 * This allows the base Member class to accept any service implementation
 * (browser or Node.js) without requiring a concrete class dependency,
 * enabling proper inheritance where Node_Member extends Base_Member
 * without needing `as unknown as` casts for the service parameter.
 *
 * Both `@digitaldefiance/ecies-lib` ECIESService and
 * `@digitaldefiance/node-ecies-lib` ECIESService structurally satisfy
 * this interface.
 */
import type { SecureString } from '../secure-string';
import type { IWalletSeed } from '../services/ecies/interfaces/wallet-seed';
import type { IConstants } from './constants';

/**
 * Minimal service contract that Member requires for cryptographic operations.
 *
 * Signature types use plain Uint8Array rather than branded types so that both
 * SignatureUint8Array (ecies-lib) and SignatureBuffer (node-ecies-lib) satisfy
 * the contract without casts.
 *
 * @template TID - The platform ID type (Uint8Array for browser, Buffer for Node.js)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface IMemberECIESService<TID> {
  /** Runtime constants including idProvider configuration */
  readonly constants: IConstants;

  /** Generate a new BIP39 mnemonic phrase */
  generateNewMnemonic(): SecureString;

  /** Derive wallet and seed from a mnemonic phrase */
  walletAndSeedFromMnemonic(mnemonic: SecureString): IWalletSeed;

  /** Derive compressed public key from private key */
  getPublicKey(privateKey: Uint8Array): Uint8Array;

  /** Sign a message with ECDSA, returning a compact signature */
  signMessage(privateKey: Uint8Array, data: Uint8Array): Uint8Array;

  /** Verify an ECDSA signature */
  verifyMessage(
    publicKey: Uint8Array,
    data: Uint8Array,
    signature: Uint8Array,
  ): boolean;

  /**
   * Encrypt data for a single recipient with run-length encoding.
   * Returns Promise<Uint8Array> in browser, Buffer (sync) in Node.js.
   */
  encryptWithLength(
    receiverPublicKey: Uint8Array,
    message: Uint8Array,
    preamble?: Uint8Array,
  ): Promise<Uint8Array> | Uint8Array;

  /**
   * Decrypt single-recipient data with header parsing.
   * Returns Promise<Uint8Array> in browser, Buffer (sync) in Node.js.
   */
  decryptWithLengthAndHeader(
    privateKey: Uint8Array,
    encryptedData: Uint8Array,
    preambleSize?: number,
    options?: { dataLength?: number },
  ): Promise<Uint8Array> | Uint8Array;
}
