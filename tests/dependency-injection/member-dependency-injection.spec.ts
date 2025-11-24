/**
 * Member Dependency Injection Tests
 * Tests that Member can be instantiated with injected service
 * Tests that Member uses injected service correctly
 * Validates Requirements 2.1, 2.2, 2.3
 */

import { EmailString } from '../../src/email-string';
import MemberType from '../../src/enumerations/member-type';
import { Member } from '../../src/member';
import { SecureBuffer } from '../../src/secure-buffer';
import { ECIESService } from '../../src/services/ecies/service';

describe('Member Dependency Injection', () => {
  describe('10.4 Member can be instantiated with injected service', () => {
    let eciesService: ECIESService;

    beforeEach(() => {
      // Create a fresh service instance for each test
      eciesService = new ECIESService();
    });

    it('should create Member with injected ECIESService', () => {
      // Generate a key pair using the service
      const mnemonic = eciesService.generateNewMnemonic();
      const { wallet } = eciesService.walletAndSeedFromMnemonic(mnemonic);
      const privateKey = wallet.getPrivateKey();
      const publicKey = eciesService.getPublicKey(privateKey);

      // Create Member with injected service
      const member = new Member(
        eciesService, // Injected service
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
        publicKey,
        new SecureBuffer(privateKey),
        wallet,
      );

      // Verify member was created successfully
      expect(member).toBeDefined();
      expect(member.name).toBe('Test User');
      expect(member.email.toString()).toBe('test@example.com');
      expect(member.publicKey).toEqual(publicKey);
      expect(member.hasPrivateKey).toBe(true);

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });

    it('should create Member using static newMember with injected service', () => {
      // Use static factory method with injected service
      const { member, mnemonic } = Member.newMember(
        eciesService, // Injected service
        MemberType.User,
        'Alice',
        new EmailString('alice@example.com'),
      );

      // Verify member was created successfully
      expect(member).toBeDefined();
      expect(member.name).toBe('Alice');
      expect(member.email.toString()).toBe('alice@example.com');
      expect(member.hasPrivateKey).toBe(true);
      expect(mnemonic).toBeDefined();
      expect(mnemonic.value).toBeDefined();

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });

    it('should create Member using fromMnemonic with injected service', () => {
      // Generate a mnemonic
      const mnemonic = eciesService.generateNewMnemonic();

      // Create member from mnemonic with injected service
      const member = Member.fromMnemonic(
        mnemonic,
        eciesService, // Injected service
        undefined,
        'Bob',
        new EmailString('bob@example.com'),
      );

      // Verify member was created successfully
      expect(member).toBeDefined();
      expect(member.name).toBe('Bob');
      expect(member.email.toString()).toBe('bob@example.com');
      expect(member.hasPrivateKey).toBe(true);

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });

    it('should create Member using fromJson with injected service', () => {
      // First create a member and serialize it
      const { member: originalMember, mnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'Charlie',
        new EmailString('charlie@example.com'),
      );

      const json = originalMember.toJson();

      // Create member from JSON with injected service
      const restoredMember = Member.fromJson(json, eciesService);

      // Verify member was restored successfully
      expect(restoredMember).toBeDefined();
      expect(restoredMember.name).toBe('Charlie');
      expect(restoredMember.email.toString()).toBe('charlie@example.com');
      expect(restoredMember.publicKey).toEqual(originalMember.publicKey);

      // Clean up
      originalMember.dispose();
      restoredMember.dispose();
      mnemonic.dispose();
    });

    it('should verify Member uses injected service for signing', () => {
      // Create member with injected service
      const { member, mnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'Signer',
        new EmailString('signer@example.com'),
      );

      // Sign some data
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = member.sign(data);

      // Verify signature was created
      expect(signature).toBeDefined();
      expect(signature.length).toBeGreaterThan(0);

      // Verify signature using the member's verify method
      const isValid = member.verify(signature, data);
      expect(isValid).toBe(true);

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });

    it('should verify Member uses injected service for encryption', async () => {
      // Create member with injected service
      const { member, mnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'Encryptor',
        new EmailString('encryptor@example.com'),
      );

      // Encrypt some data
      const plaintext = 'secret message';
      const encrypted = await member.encryptData(plaintext);

      // Verify encryption worked
      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(plaintext.length);

      // Decrypt the data
      const decrypted = await member.decryptData(encrypted);
      const decryptedText = new TextDecoder().decode(decrypted);

      expect(decryptedText).toBe(plaintext);

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });

    it('should verify Member uses injected service for wallet operations', () => {
      // Create member with injected service
      const { member, mnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'Wallet User',
        new EmailString('wallet@example.com'),
      );

      // Verify wallet is available
      expect(member.wallet).toBeDefined();

      // Unload wallet
      member.unloadWallet();

      // Reload wallet using mnemonic
      member.loadWallet(mnemonic);

      // Verify wallet is available again
      expect(member.wallet).toBeDefined();

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });

    it('should verify multiple Members can use the same service instance', () => {
      // Create multiple members with the same service
      const { member: member1, mnemonic: mnemonic1 } = Member.newMember(
        eciesService,
        MemberType.User,
        'User 1',
        new EmailString('user1@example.com'),
      );

      const { member: member2, mnemonic: mnemonic2 } = Member.newMember(
        eciesService,
        MemberType.User,
        'User 2',
        new EmailString('user2@example.com'),
      );

      // Verify both members work correctly
      expect(member1.name).toBe('User 1');
      expect(member2.name).toBe('User 2');

      // Verify they have different keys
      expect(member1.publicKey).not.toEqual(member2.publicKey);

      // Clean up
      member1.dispose();
      member2.dispose();
      mnemonic1.dispose();
      mnemonic2.dispose();
    });

    it('should verify Members can use different service instances', () => {
      // Create two service instances
      const service1 = new ECIESService();
      const service2 = new ECIESService();

      // Create members with different services
      const { member: member1, mnemonic: mnemonic1 } = Member.newMember(
        service1,
        MemberType.User,
        'User A',
        new EmailString('usera@example.com'),
      );

      const { member: member2, mnemonic: mnemonic2 } = Member.newMember(
        service2,
        MemberType.User,
        'User B',
        new EmailString('userb@example.com'),
      );

      // Verify both members work correctly
      expect(member1.name).toBe('User A');
      expect(member2.name).toBe('User B');

      // Clean up
      member1.dispose();
      member2.dispose();
      mnemonic1.dispose();
      mnemonic2.dispose();
    });

    it('should verify Member encryption/decryption works with injected service', async () => {
      // Create sender and recipient
      const { member: sender, mnemonic: senderMnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'Sender',
        new EmailString('sender@example.com'),
      );

      const { member: recipient, mnemonic: recipientMnemonic } =
        Member.newMember(
          eciesService,
          MemberType.User,
          'Recipient',
          new EmailString('recipient@example.com'),
        );

      // Sender encrypts data for recipient
      const message = 'Hello, recipient!';
      const encrypted = await sender.encryptData(message, recipient.publicKey);

      // Recipient decrypts the data
      const decrypted = await recipient.decryptData(encrypted);
      const decryptedText = new TextDecoder().decode(decrypted);

      expect(decryptedText).toBe(message);

      // Clean up
      sender.dispose();
      recipient.dispose();
      senderMnemonic.dispose();
      recipientMnemonic.dispose();
    });

    it('should verify Member signature verification works with injected service', () => {
      // Create signer and verifier
      const { member: signer, mnemonic: signerMnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'Signer',
        new EmailString('signer@example.com'),
      );

      const { member: verifier, mnemonic: verifierMnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'Verifier',
        new EmailString('verifier@example.com'),
      );

      // Signer signs data
      const data = new Uint8Array([10, 20, 30, 40, 50]);
      const signature = signer.sign(data);

      // Verifier verifies signature using signer's public key
      const isValid = verifier.verifySignature(
        data,
        signature,
        signer.publicKey,
      );
      expect(isValid).toBe(true);

      // Verify with wrong data fails
      const wrongData = new Uint8Array([10, 20, 30, 40, 51]);
      const isInvalid = verifier.verifySignature(
        wrongData,
        signature,
        signer.publicKey,
      );
      expect(isInvalid).toBe(false);

      // Clean up
      signer.dispose();
      verifier.dispose();
      signerMnemonic.dispose();
      verifierMnemonic.dispose();
    });

    it('should verify Member can be created without wallet', () => {
      // Generate keys
      const mnemonic = eciesService.generateNewMnemonic();
      const { wallet } = eciesService.walletAndSeedFromMnemonic(mnemonic);
      const privateKey = wallet.getPrivateKey();
      const publicKey = eciesService.getPublicKey(privateKey);

      // Create member without wallet
      const member = new Member(
        eciesService,
        MemberType.User,
        'No Wallet User',
        new EmailString('nowallet@example.com'),
        publicKey,
        new SecureBuffer(privateKey),
        undefined, // No wallet
      );

      // Verify member works without wallet
      expect(member).toBeDefined();
      expect(member.hasPrivateKey).toBe(true);

      // Signing should still work
      const data = new Uint8Array([1, 2, 3]);
      const signature = member.sign(data);
      expect(signature).toBeDefined();

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });

    it('should verify Member can be created without private key', () => {
      // Generate keys
      const mnemonic = eciesService.generateNewMnemonic();
      const { wallet } = eciesService.walletAndSeedFromMnemonic(mnemonic);
      const privateKey = wallet.getPrivateKey();
      const publicKey = eciesService.getPublicKey(privateKey);

      // Create member without private key
      const member = new Member(
        eciesService,
        MemberType.User,
        'Public Only User',
        new EmailString('publiconly@example.com'),
        publicKey,
        undefined, // No private key
        undefined, // No wallet
      );

      // Verify member works without private key
      expect(member).toBeDefined();
      expect(member.hasPrivateKey).toBe(false);

      // Verification should still work
      const data = new Uint8Array([1, 2, 3]);
      const signature = eciesService.signMessage(privateKey, data);
      const isValid = member.verify(signature, data);
      expect(isValid).toBe(true);

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });
  });
});
