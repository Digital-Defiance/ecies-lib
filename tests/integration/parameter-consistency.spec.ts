/**
 * Parameter Consistency Tests
 *
 * Verifies that all cryptographic parameter values documented in the DD-ECIES
 * specification match the actual values defined in constants.ts.
 *
 * Requirements: 2.1–2.5, 6.1–6.3, 10.1–10.3, 12.1, 13.1–13.5
 */
import * as fs from 'fs';
import * as path from 'path';
import { ECIES, PBKDF2_PROFILES, VOTING } from '../../src/constants';
import { Pbkdf2ProfileEnum } from '../../src/enumerations/pbkdf2-profile';

// ecies-lib package root (2 levels up from tests/integration)
const eciesLibRoot = path.resolve(__dirname, '..', '..');

const DD_ECIES_SPEC_PATH = path.join(
  eciesLibRoot,
  'docs',
  'DD-ECIES-SPECIFICATION.md',
);

describe('Parameter Consistency', () => {
  let spec: string;

  beforeAll(() => {
    spec = fs.readFileSync(DD_ECIES_SPEC_PATH, 'utf-8');
  });

  describe('Elliptic Curve Parameters (Req 2.1–2.5)', () => {
    it('should document the correct curve name (secp256k1)', () => {
      expect(ECIES.CURVE_NAME).toBe('secp256k1');
      expect(spec).toContain(`ECIES.CURVE_NAME = '${ECIES.CURVE_NAME}'`);
    });

    it('should document the correct public key length (33)', () => {
      expect(ECIES.PUBLIC_KEY_LENGTH).toBe(33);
      expect(spec).toContain(
        `ECIES.PUBLIC_KEY_LENGTH = ${ECIES.PUBLIC_KEY_LENGTH}`,
      );
    });

    it('should document the correct raw public key length (32)', () => {
      expect(ECIES.RAW_PUBLIC_KEY_LENGTH).toBe(32);
      expect(spec).toContain(
        `ECIES.RAW_PUBLIC_KEY_LENGTH = ${ECIES.RAW_PUBLIC_KEY_LENGTH}`,
      );
    });

    it('should document the correct signature size (64)', () => {
      expect(ECIES.SIGNATURE_SIZE).toBe(64);
      expect(spec).toContain(`ECIES.SIGNATURE_SIZE = ${ECIES.SIGNATURE_SIZE}`);
    });

    it('should document the correct public key magic (0x02)', () => {
      expect(ECIES.PUBLIC_KEY_MAGIC).toBe(0x02);
      expect(spec).toContain('ECIES.PUBLIC_KEY_MAGIC = 0x02');
    });
  });

  describe('Symmetric Encryption Parameters (Req 6.1–6.3)', () => {
    it('should document the correct symmetric key size (32)', () => {
      expect(ECIES.SYMMETRIC.KEY_SIZE).toBe(32);
      // The spec documents this as KEY_BITS = 256 and KEY_SIZE = 32
      expect(spec).toMatch(/256-bit key|KEY_BITS.*256|AES-256/);
    });

    it('should document the correct IV size (12)', () => {
      expect(ECIES.IV_SIZE).toBe(12);
      expect(spec).toMatch(/IV.*12 bytes|12-byte IV/);
    });

    it('should document the correct auth tag size (16)', () => {
      expect(ECIES.AUTH_TAG_SIZE).toBe(16);
      expect(spec).toMatch(
        /authentication tag.*16 bytes|16-byte.*authentication tag|auth.*tag.*16 bytes|16 bytes.*128 bits/i,
      );
    });
  });

  describe('Key Management Parameters (Req 3.1–3.5)', () => {
    it('should document the correct derivation path', () => {
      expect(ECIES.PRIMARY_KEY_DERIVATION_PATH).toBe("m/44'/60'/0'/0/0");
      expect(spec).toContain(ECIES.PRIMARY_KEY_DERIVATION_PATH);
    });

    it('should document the correct mnemonic strength (256)', () => {
      expect(ECIES.MNEMONIC_STRENGTH).toBe(256);
      expect(spec).toContain(
        `ECIES.MNEMONIC_STRENGTH = ${ECIES.MNEMONIC_STRENGTH}`,
      );
    });
  });

  describe('Registry Values (Req 10.1–10.3)', () => {
    it('should document the correct encryption type values', () => {
      expect(ECIES.ENCRYPTION_TYPE.BASIC).toBe(0x21);
      expect(ECIES.ENCRYPTION_TYPE.WITH_LENGTH).toBe(0x42);
      expect(ECIES.ENCRYPTION_TYPE.MULTIPLE).toBe(0x63);

      // Verify spec contains these values
      expect(spec).toMatch(/Basic.*0x21|0x21.*Basic/i);
      expect(spec).toMatch(/WithLength.*0x42|0x42.*WithLength/i);
      expect(spec).toMatch(/Multiple.*0x63|0x63.*Multiple/i);
    });

    it('should document Version 1 = 0x01', () => {
      expect(spec).toMatch(/Version.*0x01|0x01.*Version/i);
    });

    it('should document Cipher Suite Secp256k1_Aes256Gcm_Sha256 = 0x01', () => {
      expect(spec).toMatch(
        /Secp256k1_Aes256Gcm_Sha256.*0x01|0x01.*Secp256k1_Aes256Gcm_Sha256/i,
      );
    });
  });

  describe('Wire Format Overhead (Req 7.4, 8.3)', () => {
    it('should document the correct Basic mode fixed overhead (64)', () => {
      expect(ECIES.BASIC.FIXED_OVERHEAD_SIZE).toBe(64);
      expect(spec).toContain(
        `ECIES.BASIC.FIXED_OVERHEAD_SIZE = ${ECIES.BASIC.FIXED_OVERHEAD_SIZE}`,
      );
    });

    it('should document the correct WithLength mode fixed overhead (72)', () => {
      expect(ECIES.WITH_LENGTH.FIXED_OVERHEAD_SIZE).toBe(72);
      expect(spec).toContain(
        `ECIES.WITH_LENGTH.FIXED_OVERHEAD_SIZE = ${ECIES.WITH_LENGTH.FIXED_OVERHEAD_SIZE}`,
      );
    });

    it('should have Basic overhead equal to version + cipherSuite + type + pubKey + IV + authTag', () => {
      const computed =
        ECIES.VERSION_SIZE +
        ECIES.CIPHER_SUITE_SIZE +
        ECIES.ENCRYPTION_TYPE_SIZE +
        ECIES.PUBLIC_KEY_LENGTH +
        ECIES.IV_SIZE +
        ECIES.AUTH_TAG_SIZE;
      expect(ECIES.BASIC.FIXED_OVERHEAD_SIZE).toBe(computed);
    });

    it('should have WithLength overhead equal to Basic overhead + 8', () => {
      expect(ECIES.WITH_LENGTH.FIXED_OVERHEAD_SIZE).toBe(
        ECIES.BASIC.FIXED_OVERHEAD_SIZE + 8,
      );
    });
  });

  describe('PBKDF2 Profile Parameters (Req 12.1)', () => {
    it('should document BROWSER_PASSWORD profile values matching constants', () => {
      const profile = PBKDF2_PROFILES[Pbkdf2ProfileEnum.BROWSER_PASSWORD];
      expect(profile.hashBytes).toBe(32);
      expect(profile.saltBytes).toBe(64);
      expect(profile.iterations).toBe(2000000);
      expect(profile.algorithm).toBe('SHA-512');

      // Verify spec contains these values for BROWSER_PASSWORD
      expect(spec).toContain('BROWSER_PASSWORD');
      expect(spec).toMatch(/BROWSER_PASSWORD[\s\S]*?hashBytes.*32/);
      expect(spec).toMatch(/BROWSER_PASSWORD[\s\S]*?saltBytes.*64/);
      expect(spec).toMatch(
        /BROWSER_PASSWORD[\s\S]*?iterations.*2[,.]?000[,.]?000/,
      );
      expect(spec).toMatch(/BROWSER_PASSWORD[\s\S]*?algorithm.*SHA-512/);
    });

    it('should document HIGH_SECURITY profile values matching constants', () => {
      const profile = PBKDF2_PROFILES[Pbkdf2ProfileEnum.HIGH_SECURITY];
      expect(profile.hashBytes).toBe(64);
      expect(profile.saltBytes).toBe(32);
      expect(profile.iterations).toBe(5000000);
      expect(profile.algorithm).toBe('SHA-256');

      // Verify spec contains these values for HIGH_SECURITY
      expect(spec).toContain('HIGH_SECURITY');
      expect(spec).toMatch(/HIGH_SECURITY[\s\S]*?hashBytes.*64/);
      expect(spec).toMatch(/HIGH_SECURITY[\s\S]*?saltBytes.*32/);
      expect(spec).toMatch(
        /HIGH_SECURITY[\s\S]*?iterations.*5[,.]?000[,.]?000/,
      );
      expect(spec).toMatch(/HIGH_SECURITY[\s\S]*?algorithm.*SHA-256/);
    });

    it('should document TEST_FAST profile values matching constants', () => {
      const profile = PBKDF2_PROFILES[Pbkdf2ProfileEnum.TEST_FAST];
      expect(profile.hashBytes).toBe(32);
      expect(profile.saltBytes).toBe(64);
      expect(profile.iterations).toBe(1000);
      expect(profile.algorithm).toBe('SHA-512');

      // Verify spec contains these values for TEST_FAST
      expect(spec).toContain('TEST_FAST');
      expect(spec).toMatch(/TEST_FAST[\s\S]*?hashBytes.*32/);
      expect(spec).toMatch(/TEST_FAST[\s\S]*?saltBytes.*64/);
      expect(spec).toMatch(/TEST_FAST[\s\S]*?iterations.*1[,.]?000[^0]/);
      expect(spec).toMatch(/TEST_FAST[\s\S]*?algorithm.*SHA-512/);
    });
  });

  describe('Voting Subsystem Parameters (Req 13.1–13.5)', () => {
    it('should document the correct Paillier key length (3072 bits)', () => {
      expect(VOTING.KEYPAIR_BIT_LENGTH).toBe(3072);
      expect(spec).toContain(
        `VOTING.KEYPAIR_BIT_LENGTH = ${VOTING.KEYPAIR_BIT_LENGTH}`,
      );
    });

    it('should document the correct HKDF info string (PaillierPrimeGen)', () => {
      expect(VOTING.PRIME_GEN_INFO).toBe('PaillierPrimeGen');
      expect(spec).toContain(
        `VOTING.PRIME_GEN_INFO = '${VOTING.PRIME_GEN_INFO}'`,
      );
    });

    it('should document the correct HKDF output length (64 bytes)', () => {
      expect(VOTING.HKDF_LENGTH).toBe(64);
      expect(spec).toContain(`VOTING.HKDF_LENGTH = ${VOTING.HKDF_LENGTH}`);
    });

    it('should document the correct HMAC algorithm (sha512)', () => {
      expect(VOTING.HMAC_ALGORITHM).toBe('sha512');
      expect(spec).toContain(
        `VOTING.HMAC_ALGORITHM = '${VOTING.HMAC_ALGORITHM}'`,
      );
    });

    it('should document the correct Miller-Rabin iterations (256)', () => {
      expect(VOTING.PRIME_TEST_ITERATIONS).toBe(256);
      expect(spec).toContain(
        `VOTING.PRIME_TEST_ITERATIONS = ${VOTING.PRIME_TEST_ITERATIONS}`,
      );
    });

    it('should document the correct key magic (BCVK)', () => {
      expect(VOTING.KEY_MAGIC).toBe('BCVK');
      // Spec uses table format: | `VOTING.KEY_MAGIC` | `'BCVK'` |
      expect(spec).toMatch(/VOTING\.KEY_MAGIC.*BCVK/);
    });

    it('should document the correct key version (2)', () => {
      expect(VOTING.KEY_VERSION).toBe(2);
      expect(spec).toMatch(/VOTING\.KEY_VERSION.*`2`/);
    });

    it('should document the correct key ID length (32 bytes)', () => {
      expect(VOTING.KEY_ID_LENGTH).toBe(32);
      expect(spec).toMatch(/VOTING\.KEY_ID_LENGTH.*`32`/);
    });

    it('should document the correct instance ID length (32 bytes)', () => {
      expect(VOTING.INSTANCE_ID_LENGTH).toBe(32);
      expect(spec).toMatch(/VOTING\.INSTANCE_ID_LENGTH.*`32`/);
    });

    it('should document the correct checksum length (32 bytes)', () => {
      expect(VOTING.CHECKSUM_LENGTH).toBe(32);
      expect(spec).toMatch(/VOTING\.CHECKSUM_LENGTH.*`32`/);
    });

    it('should document the correct public key offset (768)', () => {
      expect(VOTING.PUB_KEY_OFFSET).toBe(768);
      expect(spec).toMatch(/VOTING\.PUB_KEY_OFFSET.*`768`/);
    });
  });
});
