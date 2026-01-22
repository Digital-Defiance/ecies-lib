import { EmailString } from '../src/email-string';
import { EciesCipherSuiteEnum } from '../src/enumerations/ecies-cipher-suite';
import { EciesEncryptionTypeEnum } from '../src/enumerations/ecies-encryption-type';
import { EciesVersionEnum } from '../src/enumerations/ecies-version';
import { MemberType } from '../src/enumerations/member-type';
import { Member } from '../src/member';
import { ECIESService } from '../src/services/ecies/service';

describe('ECIESService - Coverage Tests', () => {
  let service: ECIESService;
  let member1: Member;
  beforeEach(() => {
    service = new ECIESService();
    member1 = Member.newMember(
      service,
      MemberType.User,
      'user1',
      new EmailString('user1@test.com'),
    ).member;
  });

  describe('encrypt method', () => {
    it('should throw error for multiple encryption type', async () => {
      const message = Buffer.from('test');
      expect(() =>
        service.encrypt(
          EciesEncryptionTypeEnum.Multiple,
          member1.publicKey,
          message,
        ),
      ).rejects.toThrow(Error);
    });

    it('should encrypt with simple mode and single recipient', async () => {
      const message = Buffer.from('test');
      const encrypted = await service.encrypt(
        EciesEncryptionTypeEnum.Basic,
        member1.publicKey,
        message,
      );
      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(encrypted.length).toBeGreaterThan(message.length);
    });

    it('should encrypt with single mode and single recipient', async () => {
      const message = Buffer.from('test');
      const encrypted = await service.encrypt(
        EciesEncryptionTypeEnum.WithLength,
        member1.publicKey,
        message,
      );
      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(encrypted.length).toBeGreaterThan(message.length);
    });

    it('should handle preamble in simple encryption', async () => {
      const message = Buffer.from('test');
      const preamble = Buffer.from('preamble');
      const encrypted = await service.encrypt(
        EciesEncryptionTypeEnum.Basic,
        member1.publicKey,
        message,
        preamble,
      );
      expect(encrypted).toBeInstanceOf(Uint8Array);
    });
  });

  describe('decryptSingleWithComponents', () => {
    it('should decrypt and return ciphertextLength', async () => {
      if (!member1.privateKey) throw new Error('Private key required');

      const message = Buffer.from('test message');
      const encrypted = await service.encryptWithLength(
        member1.publicKey,
        message,
      );
      const header = service.parseSingleEncryptedHeader(
        EciesEncryptionTypeEnum.WithLength,
        encrypted,
      );

      // Construct AAD
      const versionBuffer = Buffer.alloc(1);
      versionBuffer.writeUint8(EciesVersionEnum.V1);
      const cipherSuiteBuffer = Buffer.alloc(1);
      cipherSuiteBuffer.writeUint8(
        EciesCipherSuiteEnum.Secp256k1_Aes256Gcm_Sha256,
      );
      const encryptionTypeBuffer = Buffer.alloc(1);
      encryptionTypeBuffer.writeUint8(header.encryptionType);

      const aad = Buffer.concat([
        header.preamble ?? Buffer.alloc(0),
        versionBuffer,
        cipherSuiteBuffer,
        encryptionTypeBuffer,
        header.ephemeralPublicKey,
      ]);

      const result = await service.decryptWithComponents(
        Buffer.from(member1.privateKey.value),
        header.ephemeralPublicKey,
        header.iv,
        header.authTag,
        encrypted.subarray(header.headerSize),
        aad,
      );

      expect(result.decrypted).toBeDefined();
      expect(result.ciphertextLength).toBeDefined();
      expect(result.ciphertextLength).toBeGreaterThan(0);
    });
  });

  describe('config and getters', () => {
    it('should expose core getter', () => {
      expect(service.core).toBeDefined();
      expect(service.core.constructor.name).toBe('EciesCryptoCore');
    });

    it('should expose config getter', () => {
      expect(service.config).toBeDefined();
      expect(service.config.curveName).toBeDefined();
    });

    it('should expose curveName getter', () => {
      expect(service.curveName).toBeDefined();
      expect(typeof service.curveName).toBe('string');
    });
  });
});
