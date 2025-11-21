import { IConstants } from '../../interfaces/constants';
import { BaseInvariant } from '../../interfaces/invariant';

/**
 * Validates that all recipient ID size configurations are consistent.
 * 
 * This invariant would have caught the 12 vs 32 byte discrepancy.
 * 
 * Checks:
 * - MEMBER_ID_LENGTH === idProvider.byteLength
 * - ECIES.MULTIPLE.RECIPIENT_ID_SIZE === idProvider.byteLength
 * - All three values must be in sync
 */
export class RecipientIdConsistencyInvariant extends BaseInvariant {
  constructor() {
    super(
      'RecipientIdConsistency',
      'All recipient ID size configurations must match the ID provider byte length'
    );
  }

  check(config: IConstants): boolean {
    return (
      config.MEMBER_ID_LENGTH === config.idProvider.byteLength &&
      config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE === config.idProvider.byteLength
    );
  }

  errorMessage(config: IConstants): string {
    const issues: string[] = [];

    if (config.MEMBER_ID_LENGTH !== config.idProvider.byteLength) {
      issues.push(
        `MEMBER_ID_LENGTH (${config.MEMBER_ID_LENGTH}) !== idProvider.byteLength (${config.idProvider.byteLength})`
      );
    }

    if (config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE !== config.idProvider.byteLength) {
      issues.push(
        `ECIES.MULTIPLE.RECIPIENT_ID_SIZE (${config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE}) !== idProvider.byteLength (${config.idProvider.byteLength})`
      );
    }

    return `Invariant '${this.name}' failed:\n  ${issues.join('\n  ')}`;
  }
}
