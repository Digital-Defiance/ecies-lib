/**
 * Configuration interface for ECIES encryption parameters.
 */
export interface IECIESConfig {
  curveName: string;
  primaryKeyDerivationPath: string;
  mnemonicStrength: number;
  symmetricAlgorithm: string;
  symmetricKeyBits: number;
  symmetricKeyMode: string;
}
