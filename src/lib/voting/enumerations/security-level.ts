/**
 * Security levels for voting encryption schemes.
 */
export enum SecurityLevel {
  FullyHomomorphic = 'fully-homomorphic', // No intermediate decryption
  MultiRound = 'multi-round', // Requires intermediate decryption
  Insecure = 'insecure', // Cannot be made secure with Paillier
}
