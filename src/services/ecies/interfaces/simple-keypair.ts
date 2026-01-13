/**
 * Simple key pair structure containing private and public keys.
 */
export interface ISimpleKeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}
