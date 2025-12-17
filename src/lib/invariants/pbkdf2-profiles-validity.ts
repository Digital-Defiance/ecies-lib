import { Pbkdf2ProfileEnum } from '../../enumerations/pbkdf2-profile';
import { IConstants } from '../../interfaces/constants';
import { BaseInvariant } from '../../interfaces/invariant';

/**
 * Validates that PBKDF2 profiles have sensible parameters.
 *
 * Checks:
 * - iterations > 0 and not too low (security risk)
 * - saltBytes > 0 and reasonable
 * - hashBytes > 0 and matches expected hash output
 */
export class Pbkdf2ProfilesValidityInvariant extends BaseInvariant {
  constructor() {
    super(
      'Pbkdf2ProfilesValidity',
      'PBKDF2 profiles must have valid cryptographic parameters',
    );
  }

  check(config: IConstants): boolean {
    const profiles = [
      config.PBKDF2_PROFILES[Pbkdf2ProfileEnum.BROWSER_PASSWORD],
      config.PBKDF2_PROFILES[Pbkdf2ProfileEnum.HIGH_SECURITY],
      config.PBKDF2_PROFILES[Pbkdf2ProfileEnum.TEST_FAST],
    ];

    for (const profile of profiles) {
      // iterations must be positive and reasonable
      if (profile.iterations < 1000 || profile.iterations > 10_000_000) {
        return false;
      }

      // saltBytes must be at least 16 bytes (128 bits)
      if (profile.saltBytes < 16 || profile.saltBytes > 256) {
        return false;
      }

      // hashBytes must be positive and reasonable for sha256
      if (profile.hashBytes < 16 || profile.hashBytes > 64) {
        return false;
      }
    }

    return true;
  }

  errorMessage(config: IConstants): string {
    const issues: string[] = [];
    const profileTests = [
      {
        name: 'BROWSER_PASSWORD',
        profile: config.PBKDF2_PROFILES[Pbkdf2ProfileEnum.BROWSER_PASSWORD],
      },
      {
        name: 'HIGH_SECURITY',
        profile: config.PBKDF2_PROFILES[Pbkdf2ProfileEnum.HIGH_SECURITY],
      },
      {
        name: 'TEST_FAST',
        profile: config.PBKDF2_PROFILES[Pbkdf2ProfileEnum.TEST_FAST],
      },
    ];

    for (const { name, profile } of profileTests) {
      if (profile.iterations < 1000 || profile.iterations > 10_000_000) {
        issues.push(
          `${name}.iterations (${profile.iterations}) must be between 1000 and 10,000,000`,
        );
      }

      if (profile.saltBytes < 16 || profile.saltBytes > 256) {
        issues.push(
          `${name}.saltBytes (${profile.saltBytes}) must be between 16 and 256`,
        );
      }

      if (profile.hashBytes < 16 || profile.hashBytes > 64) {
        issues.push(
          `${name}.hashBytes (${profile.hashBytes}) must be between 16 and 64`,
        );
      }
    }

    return `Invariant '${this.name}' failed:\n  ${issues.join('\n  ')}`;
  }
}
