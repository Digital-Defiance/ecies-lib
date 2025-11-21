import { IConstants } from '../../interfaces/constants';
import { BaseInvariant } from '../../interfaces/invariant';

/**
 * Validates that encryption algorithm parameters are consistent.
 * 
 * Checks:
 * - Symmetric key size matches the algorithm (AES-256 = 32 bytes)
 * - Curve name is supported
 * - Key derivation path is valid
 */
export class EncryptionAlgorithmConsistencyInvariant extends BaseInvariant {
  private static readonly SUPPORTED_CURVES = [
    'secp256k1',
    'p256',
    'p384',
    'p521',
  ];

  constructor() {
    super(
      'EncryptionAlgorithmConsistency',
      'Encryption algorithm parameters must be consistent'
    );
  }

  check(config: IConstants): boolean {
    // AES-256 requires 32-byte keys
    if (config.ECIES.SYMMETRIC.KEY_SIZE !== 32) {
      return false;
    }

    // Check curve is supported
    if (!EncryptionAlgorithmConsistencyInvariant.SUPPORTED_CURVES.includes(
      config.ECIES.CURVE_NAME
    )) {
      return false;
    }

    // Key derivation path should be valid BIP32 path
    if (!config.ECIES.PRIMARY_KEY_DERIVATION_PATH.startsWith('m/')) {
      return false;
    }

    return true;
  }

  errorMessage(config: IConstants): string {
    const issues: string[] = [];

    if (config.ECIES.SYMMETRIC.KEY_SIZE !== 32) {
      issues.push(
        `SYMMETRIC.KEY_SIZE (${config.ECIES.SYMMETRIC.KEY_SIZE}) must be 32 for AES-256`
      );
    }

    if (!EncryptionAlgorithmConsistencyInvariant.SUPPORTED_CURVES.includes(
      config.ECIES.CURVE_NAME
    )) {
      issues.push(
        `CURVE_NAME (${config.ECIES.CURVE_NAME}) must be one of: ${EncryptionAlgorithmConsistencyInvariant.SUPPORTED_CURVES.join(', ')}`
      );
    }

    if (!config.ECIES.PRIMARY_KEY_DERIVATION_PATH.startsWith('m/')) {
      issues.push(
        `PRIMARY_KEY_DERIVATION_PATH (${config.ECIES.PRIMARY_KEY_DERIVATION_PATH}) must be a valid BIP32 path starting with 'm/'`
      );
    }

    return `Invariant '${this.name}' failed:\n  ${issues.join('\n  ')}`;
  }
}
