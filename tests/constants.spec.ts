import {
  Constants,
  UINT16_SIZE,
  UINT32_SIZE,
  UINT64_SIZE,
  OBJECT_ID_LENGTH,
  createRuntimeConfiguration,
} from '../src/constants';
import {
  ECIES,
  PBKDF2,
  PBKDF2_PROFILES,
} from '../src/constants';
import { ObjectIdProvider, GuidV4Provider } from '../src/lib/id-providers';

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
    expect(ECIES.MULTIPLE.ENCRYPTED_KEY_SIZE).toBe(64);
    expect(ECIES.MULTIPLE.RECIPIENT_COUNT_SIZE).toBe(UINT16_SIZE);
    expect(ECIES.MULTIPLE.DATA_LENGTH_SIZE).toBe(UINT64_SIZE);
    // RECIPIENT_ID_SIZE should match the configured ID provider
    expect(ECIES.MULTIPLE.RECIPIENT_ID_SIZE).toBe(Constants.idProvider.byteLength);
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

  it('should have default ID provider (ObjectID, 12 bytes)', () => {
    expect(Constants.idProvider).toBeInstanceOf(ObjectIdProvider);
    expect(Constants.idProvider.byteLength).toBe(12);
    expect(Constants.idProvider.name).toBe('ObjectID');
    expect(Constants.MEMBER_ID_LENGTH).toBe(12);
  });

  it('should allow creating runtime configuration with different ID provider', () => {
    const guidConfig = createRuntimeConfiguration({
      idProvider: new GuidV4Provider(),
    });

    expect(guidConfig.idProvider).toBeInstanceOf(GuidV4Provider);
    expect(guidConfig.idProvider.byteLength).toBe(16);
    expect(guidConfig.idProvider.name).toBe('GUIDv4');
    expect(guidConfig.MEMBER_ID_LENGTH).toBe(16);
  });

  it('should validate ID provider byteLength matches MEMBER_ID_LENGTH', () => {
    expect(() => {
      createRuntimeConfiguration({
        MEMBER_ID_LENGTH: 99, // Mismatched with default provider
      });
    }).toThrow('MEMBER_ID_LENGTH');
  });
});
