import {
  Constants,
  UINT16_SIZE,
  UINT32_SIZE,
  UINT64_SIZE,
  OBJECT_ID_LENGTH,
} from '../src/constants';
import {
  ECIES,
  PBKDF2,
  PBKDF2_PROFILES,
} from '../src/constants';
const sampleMnemonic =
  'ability ability ability ability ability ability ability ability ability ability ability able';

describe('constants module', () => {
  it('should expose the recommended PBKDF2 settings', () => {
    expect(PBKDF2.ALGORITHM).toBe('SHA-256');
    expect(PBKDF2.SALT_BYTES).toBe(32);
    expect(PBKDF2.ITERATIONS_PER_SECOND).toBeGreaterThan(1_000_000);

    expect(PBKDF2_PROFILES.BROWSER_PASSWORD.iterations).toBe(2_000_000);
    expect(PBKDF2_PROFILES.BROWSER_PASSWORD.algorithm).toBe('SHA-512');
  });

  it('should describe ECIES layout invariants', () => {
    expect(ECIES.CURVE_NAME).toBe('secp256k1');
    expect(ECIES.SYMMETRIC.ALGORITHM).toBe('aes');
    expect(ECIES.SYMMETRIC.MODE).toBe('gcm');
    expect(ECIES.SYMMETRIC.KEY_BITS).toBe(256);
    expect(ECIES.SYMMETRIC.KEY_SIZE).toBe(32);
    expect(ECIES.MULTIPLE.ENCRYPTED_KEY_SIZE).toBe(129);
    expect(ECIES.MULTIPLE.RECIPIENT_COUNT_SIZE).toBe(UINT16_SIZE);
    expect(ECIES.MULTIPLE.DATA_LENGTH_SIZE).toBe(UINT64_SIZE);
    expect(ECIES.MULTIPLE.RECIPIENT_ID_SIZE).toBe(OBJECT_ID_LENGTH);
    expect(ECIES.PUBLIC_KEY_LENGTH).toBe(ECIES.RAW_PUBLIC_KEY_LENGTH + 1);
  });

  it('should aggregate values on the Constants object', () => {
    expect(Constants.OBJECT_ID_LENGTH).toBe(12);
    expect(Constants.UINT16_SIZE).toBe(UINT16_SIZE);
    expect(Constants.UINT32_SIZE).toBe(UINT32_SIZE);
    expect(Constants.UINT64_SIZE).toBe(UINT64_SIZE);
    expect(Constants.OBJECT_ID_LENGTH).toBe(OBJECT_ID_LENGTH);
    expect(Constants.PasswordRegex.test('Passw0rd!')).toBe(true);
    expect(Constants.PasswordRegex.test('short1!')).toBe(false);
    expect(Constants.MnemonicRegex.test(sampleMnemonic)).toBe(true);
  });
});
