/**
 * @fileoverview Comprehensive tests for the Member class (Web/Browser version)
 * Tests cover:
 * - Basic member creation and properties
 * - Key management (loading/unloading)
 * - Cryptographic operations (sign/verify, encrypt/decrypt)
 * - Voting key integration (ECIES-to-Paillier bridge)
 * - Stream encryption/decryption
 * - Error handling and validation
 * - State management and lifecycle
 *
 * Note: All cryptographic operations in this version are async due to Web Crypto API
 */

import { EmailString } from './email-string';
import { MemberType } from './enumerations/member-type';
import { MemberError } from './errors/member';
import { Member } from './member';
import { SecureString } from './secure-string';
import { ECIESService } from './services/ecies/service';
import { VotingService } from './services/voting.service';

describe('Member (Web)', () => {
  let eciesService: ECIESService;
  let votingService: VotingService;

  beforeEach(async () => {
    eciesService = new ECIESService();
    votingService = VotingService.getInstance();
  });

  describe('Member Creation', () => {
    it('should create a new member with all required properties', async () => {
      const { member, mnemonic } = await Member.newMember(
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      expect(member).toBeDefined();
      expect(member.id).toBeDefined();
      expect(member.type).toBe(MemberType.User);
      expect(member.name).toBe('Test User');
      expect(member.email.toString()).toBe('test@example.com');
      expect(member.publicKey).toBeDefined();
      expect(member.publicKey.length).toBeGreaterThan(0);
      expect(member.hasPrivateKey).toBe(true);
      expect(mnemonic).toBeDefined();
      expect(typeof mnemonic.value).toBe('string');
    });

    it('should create a member from mnemonic', async () => {
      // First create a member to get a mnemonic
      const { mnemonic } = await Member.newMember(
        eciesService,
        MemberType.User,
        'Original User',
        new EmailString('original@example.com'),
      );

      // Create a new member from the mnemonic
      const member = await Member.fromMnemonic(
        mnemonic,
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      expect(member).toBeDefined();
      expect(member.hasPrivateKey).toBe(true);
      expect(member.publicKey).toBeDefined();
    });

    it('should create members with different IDs', async () => {
      const { member: member1 } = await Member.newMember(
        eciesService,
        MemberType.User,
        'User 1',
        new EmailString('user1@example.com'),
      );
      const { member: member2 } = await Member.newMember(
        eciesService,
        MemberType.User,
        'User 2',
        new EmailString('user2@example.com'),
      );

      expect(member1.id).not.toEqual(member2.id);
    });

    it('should throw error for empty name', async () => {
      await expect(async () => {
        await Member.newMember(
          eciesService,
          MemberType.User,
          '',
          new EmailString('test@example.com'),
        );
      }).rejects.toThrow();
    });

    it('should throw error for whitespace-only name', async () => {
      await expect(async () => {
        await Member.newMember(
          eciesService,
          MemberType.User,
          '   ',
          new EmailString('test@example.com'),
        );
      }).rejects.toThrow();
    });

    it('should throw error for name with leading whitespace', async () => {
      await expect(async () => {
        await Member.newMember(
          eciesService,
          MemberType.User,
          ' Test User',
          new EmailString('test@example.com'),
        );
      }).rejects.toThrow();
    });

    it('should throw error for name with trailing whitespace', async () => {
      await expect(async () => {
        await Member.newMember(
          eciesService,
          MemberType.User,
          'Test User ',
          new EmailString('test@example.com'),
        );
      }).rejects.toThrow();
    });
  });

  describe('Key Management', () => {
    let member: Member;
    let originalMnemonic: SecureString;

    beforeEach(async () => {
      const result = await Member.newMember(
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );
      member = result.member;
      originalMnemonic = result.mnemonic;
    });

    it('should have private key after creation', () => {
      expect(member.hasPrivateKey).toBe(true);
      expect(member.privateKey).toBeDefined();
    });

    it('should unload private key', () => {
      member.unloadPrivateKey();
      expect(member.hasPrivateKey).toBe(false);
      expect(member.privateKey).toBeUndefined();
      expect(member.publicKey).toBeDefined(); // Public key should remain
    });

    it('should unload wallet', () => {
      const walletBefore = member.wallet;
      expect(walletBefore).toBeDefined();

      member.unloadWallet();
      expect(() => member.wallet).toThrow(MemberError);
    });

    it('should unload both wallet and private key', () => {
      member.unloadWalletAndPrivateKey();
      expect(member.hasPrivateKey).toBe(false);
      expect(member.privateKey).toBeUndefined();
      expect(() => member.wallet).toThrow(MemberError);
      expect(member.publicKey).toBeDefined(); // Public key should remain
    });

    it('should reload wallet from mnemonic', async () => {
      member.unloadWallet();
      expect(() => member.wallet).toThrow(MemberError);

      member.loadWallet(originalMnemonic);
      expect(member.wallet).toBeDefined();
    });

    it('should reload private key', () => {
      const originalPrivateKey = member.privateKey;
      expect(originalPrivateKey).toBeDefined();

      member.unloadPrivateKey();
      expect(member.hasPrivateKey).toBe(false);

      member.loadPrivateKey(originalPrivateKey!);
      expect(member.hasPrivateKey).toBe(true);
      expect(member.privateKey).toEqual(originalPrivateKey);
    });
  });

  describe('Cryptographic Operations - Sign/Verify', () => {
    let alice: Member;
    let bob: Member;

    beforeEach(async () => {
      alice = (
        await Member.newMember(
          eciesService,
          MemberType.User,
          'Alice',
          new EmailString('alice@example.com'),
        )
      ).member;
      bob = (
        await Member.newMember(
          eciesService,
          MemberType.User,
          'Bob',
          new EmailString('bob@example.com'),
        )
      ).member;
    });

    it('should sign and verify data', async () => {
      const data = new Uint8Array(Buffer.from('Hello, World!'));
      const signature = await alice.sign(data);

      expect(signature).toBeDefined();
      expect(signature.length).toBeGreaterThan(0);
      expect(await alice.verify(signature, data)).toBe(true);
    });

    it('should fail to verify tampered data', async () => {
      const data = new Uint8Array(Buffer.from('Hello, World!'));
      const signature = await alice.sign(data);
      const tamperedData = new Uint8Array(Buffer.from('Hello, World?'));

      expect(await alice.verify(signature, tamperedData)).toBe(false);
    });

    it('should fail to verify with wrong public key', async () => {
      const data = new Uint8Array(Buffer.from('Hello, World!'));
      const signature = await alice.sign(data);

      // Bob's member should not verify Alice's signature
      expect(await bob.verify(signature, data)).toBe(false);
    });

    it('should throw error when signing without private key', async () => {
      alice.unloadPrivateKey();
      const data = new Uint8Array(Buffer.from('Test data'));

      await expect(async () => {
        await alice.sign(data);
      }).rejects.toThrow();
    });

    it('should support signData alias', async () => {
      const data = new Uint8Array(Buffer.from('Test message'));
      const signature = await alice.signData(data);

      expect(signature).toBeDefined();
      expect(await alice.verify(signature, data)).toBe(true);
    });
  });

  describe('Cryptographic Operations - Encrypt/Decrypt', () => {
    let alice: Member;
    let bob: Member;

    beforeEach(async () => {
      alice = (
        await Member.newMember(
          eciesService,
          MemberType.User,
          'Alice',
          new EmailString('alice@example.com'),
        )
      ).member;
      bob = (
        await Member.newMember(
          eciesService,
          MemberType.User,
          'Bob',
          new EmailString('bob@example.com'),
        )
      ).member;
    });

    it('should encrypt and decrypt data', async () => {
      const plaintext = new Uint8Array(Buffer.from('Secret message'));
      const encrypted = await alice.encryptData(plaintext, alice.publicKey);

      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(plaintext.length); // Encrypted data should be larger

      const decrypted = await alice.decryptData(encrypted);
      expect(decrypted).toEqual(plaintext);
    });

    it('should encrypt for another member', async () => {
      const plaintext = new Uint8Array(Buffer.from('Message for Bob'));
      const encrypted = await alice.encryptData(plaintext, bob.publicKey);

      // Bob should be able to decrypt
      const decrypted = await bob.decryptData(encrypted);
      expect(decrypted).toEqual(plaintext);
    });

    it('should support string encryption', async () => {
      const plaintext = 'String message';
      const encrypted = await alice.encryptData(plaintext, alice.publicKey);
      const decrypted = await alice.decryptData(encrypted);

      expect(new TextDecoder().decode(decrypted)).toBe(plaintext);
    });

    it('should throw error when decrypting without private key', async () => {
      const plaintext = new Uint8Array(Buffer.from('Test data'));
      const encrypted = await alice.encryptData(plaintext, alice.publicKey);

      alice.unloadPrivateKey();

      await expect(async () => {
        await alice.decryptData(encrypted);
      }).rejects.toThrow();
    });

    it('should fail to decrypt data encrypted for another member', async () => {
      const plaintext = new Uint8Array(Buffer.from('Message for Bob'));
      const encrypted = await alice.encryptData(plaintext, bob.publicKey);

      // Alice should not be able to decrypt
      await expect(async () => {
        await alice.decryptData(encrypted);
      }).rejects.toThrow();
    });
  });

  describe('Stream Encryption/Decryption', () => {
    let alice: Member;

    beforeEach(async () => {
      alice = (
        await Member.newMember(
          eciesService,
          MemberType.User,
          'Alice',
          new EmailString('alice@example.com'),
        )
      ).member;
    });

    it('should encrypt and decrypt data stream', async () => {
      const chunks = [
        new Uint8Array(Buffer.from('First chunk')),
        new Uint8Array(Buffer.from('Second chunk')),
        new Uint8Array(Buffer.from('Third chunk')),
      ];

      async function* sourceGenerator() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      // Collect encrypted chunks
      const encryptedChunks: Uint8Array[] = [];
      for await (const encryptedChunk of alice.encryptDataStream(
        sourceGenerator(),
        {
          recipientPublicKey: alice.publicKey,
        },
      )) {
        encryptedChunks.push(encryptedChunk.data);
      }

      expect(encryptedChunks.length).toBeGreaterThan(0);

      // Decrypt the stream
      async function* encryptedGenerator() {
        for (const chunk of encryptedChunks) {
          yield chunk;
        }
      }

      const decryptedChunks: Uint8Array[] = [];
      for await (const decryptedChunk of alice.decryptDataStream(
        encryptedGenerator(),
      )) {
        decryptedChunks.push(decryptedChunk);
      }

      const originalData = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0),
      );
      let offset = 0;
      for (const chunk of chunks) {
        originalData.set(chunk, offset);
        offset += chunk.length;
      }

      const decryptedData = new Uint8Array(
        decryptedChunks.reduce((acc, chunk) => acc + chunk.length, 0),
      );
      offset = 0;
      for (const chunk of decryptedChunks) {
        decryptedData.set(chunk, offset);
        offset += chunk.length;
      }

      expect(decryptedData).toEqual(originalData);
    });

    it('should support progress callback for encryption', async () => {
      const chunks = [
        new Uint8Array(1000).fill(65), // 'A' repeated
        new Uint8Array(1000).fill(66), // 'B' repeated
      ];
      let progressCallCount = 0;

      async function* sourceGenerator() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      for await (const _ of alice.encryptDataStream(sourceGenerator(), {
        recipientPublicKey: alice.publicKey,
        onProgress: (progress) => {
          progressCallCount++;
          expect(progress.bytesProcessed).toBeGreaterThan(0);
        },
      })) {
        // Just iterate
      }

      expect(progressCallCount).toBeGreaterThan(0);
    });

    it('should support abort signal for encryption', async () => {
      const controller = new AbortController();
      const chunks = Array(100).fill(new Uint8Array(Buffer.from('Data')));

      async function* sourceGenerator() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      let chunkCount = 0;
      try {
        for await (const _ of alice.encryptDataStream(sourceGenerator(), {
          recipientPublicKey: alice.publicKey,
          signal: controller.signal,
          chunkSize: 10,
        })) {
          chunkCount++;
          if (chunkCount === 5) {
            controller.abort();
          }
        }
      } catch (error: unknown) {
        expect((error as Error).name).toBe('AbortError');
      }

      expect(chunkCount).toBe(5);
    });
  });

  describe('Voting Keys Integration', () => {
    let member: Member;

    beforeEach(async () => {
      member = (
        await Member.newMember(
          eciesService,
          MemberType.User,
          'Test User',
          new EmailString('test@example.com'),
        )
      ).member;
    });

    it('should not have voting keys initially', () => {
      expect(member.votingPublicKey).toBeUndefined();
      expect(member.votingPrivateKey).toBeUndefined();
      expect(member.hasVotingPrivateKey).toBe(false);
    });

    it('should derive voting keys from ECDH', async () => {
      await member.deriveVotingKeys({
        keypairBitLength: 2048,
        primeTestIterations: 64,
      });

      expect(member.votingPublicKey).toBeDefined();
      expect(member.votingPrivateKey).toBeDefined();
      expect(member.hasVotingPrivateKey).toBe(true);
    }, 120000);

    it('should derive consistent voting keys from same ECDH keys', async () => {
      const options = { keypairBitLength: 2048, primeTestIterations: 64 };
      await member.deriveVotingKeys(options);
      const publicKey1 = member.votingPublicKey;
      const privateKey1 = member.votingPrivateKey;

      // Unload and derive again
      member.unloadVotingPrivateKey();
      await member.deriveVotingKeys(options);
      const publicKey2 = member.votingPublicKey;
      const privateKey2 = member.votingPrivateKey;

      // Compare using serialization since direct comparison may fail
      expect(await votingService.serializePublicKey(publicKey1!)).toEqual(
        await votingService.serializePublicKey(publicKey2!),
      );
      expect(await votingService.serializePrivateKey(privateKey1!)).toEqual(
        await votingService.serializePrivateKey(privateKey2!),
      );
    }, 120000);

    it('should throw error when deriving voting keys without private key', async () => {
      member.unloadPrivateKey();

      await expect(async () => {
        await member.deriveVotingKeys();
      }).rejects.toThrow();
    });

    it('should load voting keys manually', async () => {
      // Generate a voting key pair
      const seed = new Uint8Array(64).fill(0x42);
      const votingKeyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      member.loadVotingKeys(votingKeyPair.publicKey, votingKeyPair.privateKey);

      expect(member.votingPublicKey).toEqual(votingKeyPair.publicKey);
      expect(member.votingPrivateKey).toEqual(votingKeyPair.privateKey);
      expect(member.hasVotingPrivateKey).toBe(true);
    }, 120000);

    it('should load only voting public key', async () => {
      const seed = new Uint8Array(64).fill(0x42);
      const votingKeyPair = await votingService.generateDeterministicKeyPair(
        seed,
        2048,
        64,
      );

      member.loadVotingKeys(votingKeyPair.publicKey);

      expect(member.votingPublicKey).toEqual(votingKeyPair.publicKey);
      expect(member.votingPrivateKey).toBeUndefined();
      expect(member.hasVotingPrivateKey).toBe(false);
    }, 120000);

    it('should unload voting private key', async () => {
      await member.deriveVotingKeys({
        keypairBitLength: 2048,
        primeTestIterations: 64,
      });
      const publicKey = member.votingPublicKey;

      expect(member.hasVotingPrivateKey).toBe(true);

      member.unloadVotingPrivateKey();

      expect(member.votingPublicKey).toEqual(publicKey); // Public key should remain
      expect(member.votingPrivateKey).toBeUndefined();
      expect(member.hasVotingPrivateKey).toBe(false);
    }, 120000);

    it('should support custom key size for voting keys', async () => {
      await member.deriveVotingKeys({
        keypairBitLength: 2048,
        primeTestIterations: 64,
      });

      expect(member.votingPublicKey).toBeDefined();
      expect(member.votingPrivateKey).toBeDefined();

      // Check that the modulus is approximately 2048 bits
      const n = member.votingPublicKey!.n;
      const bitLength = n.toString(2).length;
      expect(bitLength).toBeGreaterThanOrEqual(2040);
      expect(bitLength).toBeLessThanOrEqual(2048);
    }, 120000);

    it('should support custom Miller-Rabin rounds for voting keys', async () => {
      // Should not throw with custom rounds
      await expect(
        member.deriveVotingKeys({ primeTestIterations: 64 }),
      ).resolves.not.toThrow();

      expect(member.votingPublicKey).toBeDefined();
      expect(member.votingPrivateKey).toBeDefined();
    }, 120000);

    it('should throw error for invalid key size', async () => {
      await expect(
        member.deriveVotingKeys({ keypairBitLength: 1024 }),
      ).rejects.toThrow('Key size must be at least 2048 bits');
    });

    it('should throw error for insufficient Miller-Rabin rounds', async () => {
      await expect(
        member.deriveVotingKeys({ primeTestIterations: 32 }),
      ).rejects.toThrow('Must perform at least 64 Miller-Rabin iterations');
    });

    it('should throw error for odd key size', async () => {
      await expect(
        member.deriveVotingKeys({ keypairBitLength: 2049 }),
      ).rejects.toThrow('Key size must be even');
    });

    it('should handle voting key serialization', async () => {
      await member.deriveVotingKeys({
        keypairBitLength: 2048,
        primeTestIterations: 64,
      });

      const publicKeySerialized = await votingService.serializePublicKey(
        member.votingPublicKey!,
      );
      const privateKeySerialized = await votingService.serializePrivateKey(
        member.votingPrivateKey!,
      );

      expect(publicKeySerialized).toBeDefined();
      expect(privateKeySerialized).toBeDefined();

      const publicKeyDeserialized =
        await votingService.deserializePublicKey(publicKeySerialized);
      const privateKeyDeserialized = await votingService.deserializePrivateKey(
        privateKeySerialized,
        publicKeyDeserialized,
      );

      expect(publicKeyDeserialized.n).toBe(member.votingPublicKey!.n);
      expect(privateKeyDeserialized.lambda).toBe(
        member.votingPrivateKey!.lambda,
      );
    }, 120000);
  });

  describe('Voting Operations with Paillier', () => {
    let member: Member;

    beforeEach(async () => {
      member = (
        await Member.newMember(
          eciesService,
          MemberType.User,
          'Test User',
          new EmailString('test@example.com'),
        )
      ).member;
      await member.deriveVotingKeys({
        keypairBitLength: 2048,
        primeTestIterations: 64,
      });
    });

    it('should encrypt and decrypt with derived voting keys', () => {
      const message = 42n;
      const publicKey = member.votingPublicKey!;
      const privateKey = member.votingPrivateKey!;

      const ciphertext = publicKey.encrypt(message);
      const decrypted = privateKey.decrypt(ciphertext);

      expect(decrypted).toBe(message);
    });

    it('should support homomorphic addition', () => {
      const a = 10n;
      const b = 32n;
      const publicKey = member.votingPublicKey!;
      const privateKey = member.votingPrivateKey!;

      const encryptedA = publicKey.encrypt(a);
      const encryptedB = publicKey.encrypt(b);

      // Homomorphic addition: E(a) + E(b) = E(a + b)
      const encryptedSum = publicKey.addition(encryptedA, encryptedB);
      const decryptedSum = privateKey.decrypt(encryptedSum);

      expect(decryptedSum).toBe(a + b);
    });

    it('should fail to decrypt without private key', () => {
      const message = 42n;
      const publicKey = member.votingPublicKey!;

      const ciphertext = publicKey.encrypt(message);

      member.unloadVotingPrivateKey();

      expect(() => {
        member.votingPrivateKey!.decrypt(ciphertext);
      }).toThrow();
    });
  });

  describe('Serialization', () => {
    let member: Member;

    beforeEach(async () => {
      member = (
        await Member.newMember(
          eciesService,
          MemberType.User,
          'Test User',
          new EmailString('test@example.com'),
        )
      ).member;
    });

    it('should serialize to JSON', () => {
      const json = member.toJson();

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed.id).toBeDefined();
      expect(parsed.type).toBe(MemberType.User);
      expect(parsed.name).toBe('Test User');
      expect(parsed.email).toBe('test@example.com');
      expect(parsed.publicKey).toBeDefined();
    });

    it('should not include private key in JSON by default', () => {
      const json = member.toJson();
      const parsed = JSON.parse(json);

      expect(parsed.privateKey).toBeUndefined();
      expect(parsed.wallet).toBeUndefined();
    });
  });

  describe('Lifecycle and Cleanup', () => {
    it('should dispose member properly', async () => {
      const { member } = await Member.newMember(
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      expect(() => {
        member.dispose();
      }).not.toThrow();
    });

    it('should clear sensitive data on dispose', async () => {
      const { member } = await Member.newMember(
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      member.dispose();

      // After disposal, sensitive operations should fail or return undefined
      expect(member.hasPrivateKey).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should support complete workflow: create, sign, encrypt, voting', async () => {
      // Create member
      const { member, mnemonic } = await Member.newMember(
        eciesService,
        MemberType.User,
        'Alice',
        new EmailString('alice@example.com'),
      );

      expect(member).toBeDefined();
      expect(mnemonic).toBeDefined();

      // Sign data
      const data = new Uint8Array(Buffer.from('Important message'));
      const signature = await member.sign(data);
      expect(await member.verify(signature, data)).toBe(true);

      // Encrypt data
      const plaintext = new Uint8Array(Buffer.from('Secret data'));
      const encrypted = await member.encryptData(plaintext, member.publicKey);
      const decrypted = await member.decryptData(encrypted);
      expect(decrypted).toEqual(plaintext);

      // Derive voting keys
      await member.deriveVotingKeys({
        keypairBitLength: 2048,
        primeTestIterations: 64,
      });
      expect(member.votingPublicKey).toBeDefined();
      expect(member.votingPrivateKey).toBeDefined();

      // Encrypt a vote
      const vote = 1n;
      const encryptedVote = member.votingPublicKey!.encrypt(vote);
      const decryptedVote = member.votingPrivateKey!.decrypt(encryptedVote);
      expect(decryptedVote).toBe(vote);

      // Unload sensitive data
      member.unloadWalletAndPrivateKey();
      member.unloadVotingPrivateKey();
      expect(member.hasPrivateKey).toBe(false);
      expect(member.hasVotingPrivateKey).toBe(false);

      // Public key should still be available
      expect(member.publicKey).toBeDefined();
      expect(member.votingPublicKey).toBeDefined();
    });

    it('should support member-to-member encrypted communication', async () => {
      const { member: alice } = await Member.newMember(
        eciesService,
        MemberType.User,
        'Alice',
        new EmailString('alice@example.com'),
      );

      const { member: bob } = await Member.newMember(
        eciesService,
        MemberType.User,
        'Bob',
        new EmailString('bob@example.com'),
      );

      // Alice encrypts a message for Bob
      const message = new Uint8Array(Buffer.from('Hello Bob!'));
      const encrypted = await alice.encryptData(message, bob.publicKey);

      // Bob decrypts the message
      const decrypted = await bob.decryptData(encrypted);
      expect(decrypted).toEqual(message);

      // Alice signs the message
      const signature = await alice.sign(message);

      // Bob verifies Alice's signature
      expect(
        await bob.verifySignature(message, signature, alice.publicKey),
      ).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty data encryption', async () => {
      const { member } = await Member.newMember(
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      const empty = new Uint8Array(0);
      const encrypted = await member.encryptData(empty, member.publicKey);
      const decrypted = await member.decryptData(encrypted);

      expect(decrypted.length).toBe(0);
    });

    it('should handle large data encryption', async () => {
      const { member } = await Member.newMember(
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      const largeData = new Uint8Array(1024 * 1024); // 1MB
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = i % 256;
      }

      const encrypted = await member.encryptData(largeData, member.publicKey);
      const decrypted = await member.decryptData(encrypted);

      expect(decrypted).toEqual(largeData);
    });

    it('should maintain state correctly after multiple operations', async () => {
      const { member } = await Member.newMember(
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      // Initial state
      expect(member.hasPrivateKey).toBe(true);
      expect(member.hasVotingPrivateKey).toBe(false);

      // Derive voting keys
      await member.deriveVotingKeys({
        keypairBitLength: 2048,
        primeTestIterations: 64,
      });
      expect(member.hasPrivateKey).toBe(true);
      expect(member.hasVotingPrivateKey).toBe(true);

      // Unload ECIES private key
      member.unloadPrivateKey();
      expect(member.hasPrivateKey).toBe(false);
      expect(member.hasVotingPrivateKey).toBe(true); // Voting key should remain

      // Unload voting private key
      member.unloadVotingPrivateKey();
      expect(member.hasPrivateKey).toBe(false);
      expect(member.hasVotingPrivateKey).toBe(false);
    });
  });
});
