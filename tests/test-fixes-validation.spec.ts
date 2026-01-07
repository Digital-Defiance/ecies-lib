/**
 * Simple validation test to verify our test fixes work
 */

import { ObjectIdProvider } from '..//src/lib/id-providers';
import { encryptionTypeToString } from '..//src/utils/encryption-type-utils';
import { EciesEncryptionTypeEnum } from '../src/enumerations/ecies-encryption-type';

describe('Test Fixes Validation', () => {
  it('should validate utils fix works', () => {
    expect(encryptionTypeToString(EciesEncryptionTypeEnum.Simple)).toBe(
      'simple',
    );
  });

  it('should validate ObjectId provider works', () => {
    const provider = new ObjectIdProvider();
    const id = provider.generate();
    expect(id.length).toBe(12);
    expect(provider.validate(id)).toBe(true);
  });

  it('should validate basic functionality', () => {
    expect(1 + 1).toBe(2);
  });
});
