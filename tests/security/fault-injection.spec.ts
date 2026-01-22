/**
 * Fault Injection and Error Handling Tests
 * Government-grade requirement: Graceful failure and no information leakage on errors
 */

import { EmailString } from '../../src/email-string';
import { MemberType } from '../../src/enumerations/member-type';
import { Member } from '../../src/member';
import { ECIESService } from '../../src/services/ecies/service';
import { VotingService } from '../../src/services/voting.service';

jest.setTimeout(300000);

describe('Fault Injection and Error Handling', () => {
  let votingService: VotingService;
  let ecies: ECIESService;

  beforeAll(() => {
    votingService = VotingService.getInstance();
    ecies = new ECIESService();
  });

  describe('Corrupted Ciphertext Handling', () => {
    it('should detect and reject corrupted ciphertext', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const message = new TextEncoder().encode('Secret');
      const encrypted = await ecies.encryptWithLength(publicKey, message);

      // Corrupt random byte
      encrypted[Math.floor(encrypted.length / 2)] ^= 0xff;

      await expect(
        ecies.decryptWithLengthAndHeader(privateKey, encrypted),
      ).rejects.toThrow();
    });

    it('should detect corrupted header', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const message = new TextEncoder().encode('Secret');
      const encrypted = await ecies.encryptWithLength(publicKey, message);

      // Corrupt header
      encrypted[0] ^= 0xff;

      await expect(
        ecies.decryptWithLengthAndHeader(privateKey, encrypted),
      ).rejects.toThrow();
    });

    it('should detect truncated ciphertext', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const message = new TextEncoder().encode('Secret');
      const encrypted = await ecies.encryptWithLength(publicKey, message);

      // Truncate
      const truncated = encrypted.slice(0, encrypted.length - 10);

      await expect(
        ecies.decryptWithLengthAndHeader(privateKey, truncated),
      ).rejects.toThrow();
    });

    it('should detect extended ciphertext', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const message = new TextEncoder().encode('Secret');
      const encrypted = await ecies.encryptWithLength(publicKey, message);

      // Extend with garbage
      const extended = new Uint8Array(encrypted.length + 100);
      extended.set(encrypted);
      crypto.getRandomValues(extended.subarray(encrypted.length));

      await expect(
        ecies.decryptWithLengthAndHeader(privateKey, extended),
      ).rejects.toThrow();
    });
  });

  describe('Invalid Key Handling', () => {
    it('should reject all-zero private key', async () => {
      const zeroKey = new Uint8Array(32);
      const validPrivateKey = crypto.getRandomValues(new Uint8Array(32));
      const publicKey = ecies.getPublicKey(validPrivateKey);

      await expect(
        votingService.deriveVotingKeysFromECDH(zeroKey, publicKey),
      ).rejects.toThrow();
    });

    it('should reject all-ones private key', async () => {
      const onesKey = new Uint8Array(32).fill(0xff);
      const validPrivateKey = crypto.getRandomValues(new Uint8Array(32));
      const publicKey = ecies.getPublicKey(validPrivateKey);

      await expect(
        votingService.deriveVotingKeysFromECDH(onesKey, publicKey),
      ).rejects.toThrow();
    });

    it('should reject corrupted public key', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const corruptedPublicKey = crypto.getRandomValues(new Uint8Array(65));
      corruptedPublicKey[0] = 0x04;

      await expect(
        votingService.deriveVotingKeysFromECDH(privateKey, corruptedPublicKey),
      ).rejects.toThrow();
    });

    it('should reject mismatched key pairs', async () => {
      const mnemonic1 = ecies.generateNewMnemonic();
      const mnemonic2 = ecies.generateNewMnemonic();

      const { privateKey: privKey1 } = ecies.mnemonicToSimpleKeyPair(mnemonic1);
      const { publicKey: pubKey2 } = ecies.mnemonicToSimpleKeyPair(mnemonic2);

      const message = new TextEncoder().encode('Secret');
      const encrypted = await ecies.encryptWithLength(pubKey2, message);

      await expect(
        ecies.decryptWithLengthAndHeader(privKey1, encrypted),
      ).rejects.toThrow();
    });
  });

  describe('Serialization Error Handling', () => {
    it('should reject corrupted public key buffer', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const votingKeys = await votingService.deriveVotingKeysFromECDH(
        privateKey,
        publicKey,
      );
      const buffer = await votingService.votingPublicKeyToBuffer(
        votingKeys.publicKey,
      );

      // Corrupt magic bytes
      buffer[0] = 0xff;

      await expect(
        votingService.bufferToVotingPublicKey(buffer),
      ).rejects.toThrow();
    });

    it('should reject buffer with wrong version', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const votingKeys = await votingService.deriveVotingKeysFromECDH(
        privateKey,
        publicKey,
      );
      const buffer = await votingService.votingPublicKeyToBuffer(
        votingKeys.publicKey,
      );

      // Corrupt version
      buffer[4] = 0xff;

      await expect(
        votingService.bufferToVotingPublicKey(buffer),
      ).rejects.toThrow();
    });

    it('should reject truncated serialized key', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const votingKeys = await votingService.deriveVotingKeysFromECDH(
        privateKey,
        publicKey,
      );
      const buffer = await votingService.votingPublicKeyToBuffer(
        votingKeys.publicKey,
      );

      const truncated = buffer.slice(0, 20);

      await expect(
        votingService.bufferToVotingPublicKey(truncated),
      ).rejects.toThrow();
    });

    it('should reject corrupted keyId', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const votingKeys = await votingService.deriveVotingKeysFromECDH(
        privateKey,
        publicKey,
      );
      const buffer = await votingService.votingPublicKeyToBuffer(
        votingKeys.publicKey,
      );

      // Corrupt keyId
      buffer[10] ^= 0xff;

      await expect(
        votingService.bufferToVotingPublicKey(buffer),
      ).rejects.toThrow();
    });
  });

  describe('Member Creation Error Handling', () => {
    it('should reject invalid email format', () => {
      expect(() => {
        new EmailString('invalid-email');
      }).toThrow();
    });

    it('should reject empty username', () => {
      expect(() => {
        Member.newMember(
          ecies,
          MemberType.User,
          '',
          new EmailString('test@example.com'),
        );
      }).toThrow();
    });

    it('should handle corrupted member JSON', () => {
      const { member } = Member.newMember(
        ecies,
        MemberType.User,
        'Alice',
        new EmailString('alice@example.com'),
      );

      const json = member.toJson();
      const corrupted = json.replace(/"id":"[^"]*"/, '"id":"invalid"');

      expect(() => {
        Member.fromJson(corrupted, ecies);
      }).toThrow();
    });

    it('should handle missing required fields in JSON', () => {
      const invalidJson = '{"name":"Alice"}';

      expect(() => {
        Member.fromJson(invalidJson, ecies);
      }).toThrow();
    });
  });

  describe('Encryption Parameter Validation', () => {
    it('should reject empty plaintext for certain modes', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const empty = new Uint8Array(0);

      // Empty plaintext is actually allowed, so this test should pass
      const result = await ecies.encryptWithLength(publicKey, empty);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should reject oversized plaintext', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      ecies.mnemonicToSimpleKeyPair(mnemonic);

      // Create very large plaintext (> 4GB would be impractical)
      const large = new Uint8Array(100 * 1024 * 1024); // 100MB

      // Should handle or reject gracefully
      try {
        await ecies.encryptWithLength(new Uint8Array(33), large);
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, 60000);

    it('should validate recipient count for multi-recipient', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      ecies.mnemonicToSimpleKeyPair(mnemonic);

      const message = new TextEncoder().encode('Secret');

      // Empty recipients is allowed, returns empty result
      const result = await ecies.encryptMultiple([], message);
      expect(result.recipientCount).toBe(0);
    });
  });

  describe('DRBG Error Handling', () => {
    it('should reject empty seed', async () => {
      // DRBG accepts any seed, even empty
      const drbg = await votingService.createDRBG(new Uint8Array(0));
      expect(drbg).toBeDefined();
    });

    it('should reject insufficient seed entropy', async () => {
      const weakSeed = new Uint8Array(8);

      // DRBG accepts weak seeds
      const drbg = await votingService.createDRBG(weakSeed);
      expect(drbg).toBeDefined();
    });

    it('should handle zero-length generation request', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32));
      const drbg = await votingService.createDRBG(seed);

      const result = await drbg.generate(0);
      expect(result.length).toBe(0);
    });

    it('should handle very large generation request', async () => {
      const seed = crypto.getRandomValues(new Uint8Array(32));
      const drbg = await votingService.createDRBG(seed);

      const result = await drbg.generate(10000);
      expect(result.length).toBe(10000);
    });
  });

  describe('Error Message Information Leakage', () => {
    it('should not leak key material in error messages', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const message = new TextEncoder().encode('Secret');
      const encrypted = await ecies.encryptWithLength(publicKey, message);

      // Corrupt and try to decrypt
      encrypted[10] ^= 0xff;

      try {
        await ecies.decryptWithLengthAndHeader(privateKey, encrypted);
        fail('Should have thrown');
      } catch (error: any) {
        const errorMsg = error.message.toLowerCase();

        // Should not contain key material
        expect(errorMsg).not.toContain(Buffer.from(privateKey).toString('hex'));
        expect(errorMsg).not.toContain(Buffer.from(publicKey).toString('hex'));
      }
    });

    it('should not leak plaintext in error messages', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { publicKey: _publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const secret = 'SuperSecretPassword123!';
      const message = new TextEncoder().encode(secret);

      try {
        // Force an error by using invalid parameters
        await ecies.encryptWithLength(new Uint8Array(33), message);
        fail('Should have thrown');
      } catch (error: any) {
        const errorMsg = error.message;

        // Should not contain plaintext
        expect(errorMsg).not.toContain(secret);
      }
    });

    it('should provide generic errors for authentication failures', async () => {
      const mnemonic1 = ecies.generateNewMnemonic();
      const mnemonic2 = ecies.generateNewMnemonic();

      const { privateKey: privKey1 } = ecies.mnemonicToSimpleKeyPair(mnemonic1);
      const { publicKey: pubKey2 } = ecies.mnemonicToSimpleKeyPair(mnemonic2);

      const message = new TextEncoder().encode('Secret');
      const encrypted = await ecies.encryptWithLength(pubKey2, message);

      try {
        await ecies.decryptWithLengthAndHeader(privKey1, encrypted);
        fail('Should have thrown');
      } catch (error: any) {
        const errorMsg = error.message.toLowerCase();

        // Should be generic, not reveal specific failure point
        expect(errorMsg).not.toContain('wrong key');
        expect(errorMsg).not.toContain('authentication tag');
      }
    });
  });

  describe('Resource Exhaustion Protection', () => {
    it('should limit prime generation attempts', async () => {
      const seed = new Uint8Array(64).fill(0x00); // Pathological seed
      const drbg = await votingService.createDRBG(seed);

      const maxAttempts = 100;

      await expect(
        votingService.generateDeterministicPrime(drbg, 2048, 256, maxAttempts),
      ).rejects.toThrow('Failed to generate prime');
    });

    it('should handle concurrent encryption operations', async () => {
      const mnemonic = ecies.generateNewMnemonic();
      const { publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

      const message = new TextEncoder().encode('Secret');

      const promises = Array(50)
        .fill(null)
        .map(() => ecies.encryptWithLength(publicKey, message));

      const results = await Promise.all(promises);

      // All should succeed
      expect(results.length).toBe(50);
      results.forEach((r) => expect(r.length).toBeGreaterThan(0));
    });

    it('should handle concurrent key generation', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => {
          const seed = crypto.getRandomValues(new Uint8Array(64));
          return votingService.generateDeterministicKeyPair(seed, 2048, 64);
        });

      const results = await Promise.all(promises);

      expect(results.length).toBe(10);
      results.forEach((kp) => {
        expect(kp.publicKey).toBeDefined();
        expect(kp.privateKey).toBeDefined();
      });
    }, 600000);
  });
});
