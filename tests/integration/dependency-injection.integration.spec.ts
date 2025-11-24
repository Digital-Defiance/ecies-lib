/**
 * Dependency Injection Integration Test
 * Tests that Member can be created with injected services
 * Tests that services can be created with injected dependencies
 * Verifies all functionality works with dependency injection
 * Validates Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { EmailString } from '../../src/email-string';
import { MemberType } from '../../src/enumerations/member-type';
import { Member } from '../../src/member';
import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { ProgressTracker } from '../../src/services/progress-tracker';

describe('Dependency Injection Integration', () => {
  describe('12.2 Dependency injection integration test', () => {
    let eciesService: ECIESService;

    beforeEach(() => {
      eciesService = new ECIESService();
    });

    it('should create Member with injected ECIESService and perform full workflow', async () => {
      // Create member with injected service
      const { member, mnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'Alice',
        new EmailString('alice@example.com'),
      );

      // Verify member was created
      expect(member).toBeDefined();
      expect(member.name).toBe('Alice');
      expect(member.hasPrivateKey).toBe(true);

      // Test signing
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const signature = member.sign(data);
      expect(signature).toBeDefined();
      expect(member.verify(signature, data)).toBe(true);

      // Test encryption/decryption
      const message = 'Hello, World!';
      const encrypted = await member.encryptData(message);
      const decrypted = await member.decryptData(encrypted);
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(message);

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });

    it('should create multiple Members with same service instance', async () => {
      // Create two members with the same service
      const { member: alice, mnemonic: aliceMnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'Alice',
        new EmailString('alice@example.com'),
      );

      const { member: bob, mnemonic: bobMnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'Bob',
        new EmailString('bob@example.com'),
      );

      // Verify both members work
      expect(alice.name).toBe('Alice');
      expect(bob.name).toBe('Bob');

      // Test cross-member encryption
      const message = 'Secret message from Alice to Bob';
      const encrypted = await alice.encryptData(message, bob.publicKey);
      const decrypted = await bob.decryptData(encrypted);
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(message);

      // Clean up
      alice.dispose();
      bob.dispose();
      aliceMnemonic.dispose();
      bobMnemonic.dispose();
    });

    it('should create EncryptionStream with injected ECIESService', async () => {
      // Create encryption stream with injected service
      const stream = new EncryptionStream(eciesService);

      // Generate key pair
      const mnemonic = eciesService.generateNewMnemonic();
      const keyPair = eciesService.mnemonicToSimpleKeyPair(mnemonic);

      // Test encryption/decryption
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const source = (async function* () {
        yield data;
      })();

      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.encryptStream(
        source,
        keyPair.publicKey,
      )) {
        encryptedChunks.push(chunk.data);
      }

      expect(encryptedChunks.length).toBeGreaterThan(0);

      // Decrypt
      const decryptSource = (async function* () {
        for (const chunk of encryptedChunks) {
          yield chunk;
        }
      })();

      const decryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.decryptStream(
        decryptSource,
        keyPair.privateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      // Verify decrypted data matches original
      expect(decryptedChunks.length).toBe(1);
      expect(decryptedChunks[0]).toEqual(data);

      // Clean up
      mnemonic.dispose();
    });

    it('should create Member from mnemonic with injected service', () => {
      // Generate mnemonic
      const mnemonic = eciesService.generateNewMnemonic();

      // Create member from mnemonic with injected service
      const member = Member.fromMnemonic(
        mnemonic,
        eciesService,
        undefined,
        'Charlie',
        new EmailString('charlie@example.com'),
      );

      // Verify member works
      expect(member).toBeDefined();
      expect(member.name).toBe('Charlie');
      expect(member.hasPrivateKey).toBe(true);

      // Test signing
      const data = new Uint8Array([10, 20, 30]);
      const signature = member.sign(data);
      expect(member.verify(signature, data)).toBe(true);

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });

    it('should create Member from JSON with injected service', () => {
      // Create original member
      const { member: original, mnemonic } = Member.newMember(
        eciesService,
        MemberType.User,
        'David',
        new EmailString('david@example.com'),
      );

      // Serialize to JSON
      const json = original.toJson();

      // Create member from JSON with injected service
      const restored = Member.fromJson(json, eciesService);

      // Verify restored member matches original
      expect(restored.name).toBe(original.name);
      expect(restored.email.toString()).toBe(original.email.toString());
      expect(restored.publicKey).toEqual(original.publicKey);

      // Clean up
      original.dispose();
      restored.dispose();
      mnemonic.dispose();
    });

    it('should support complex workflow with multiple services and members', async () => {
      // Create multiple service instances
      const service1 = new ECIESService();
      const service2 = new ECIESService();

      // Create members with different services
      const { member: alice, mnemonic: aliceMnemonic } = Member.newMember(
        service1,
        MemberType.User,
        'Alice',
        new EmailString('alice@example.com'),
      );

      const { member: bob, mnemonic: bobMnemonic } = Member.newMember(
        service2,
        MemberType.User,
        'Bob',
        new EmailString('bob@example.com'),
      );

      // Create encryption streams with different services
      const stream1 = new EncryptionStream(service1);
      const stream2 = new EncryptionStream(service2);

      // Alice encrypts data for Bob using stream1
      const message = 'Cross-service message';
      const data = new TextEncoder().encode(message);
      const source = (async function* () {
        yield data;
      })();

      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream1.encryptStream(source, bob.publicKey)) {
        encryptedChunks.push(chunk.data);
      }

      // Bob decrypts using stream2
      const decryptSource = (async function* () {
        for (const chunk of encryptedChunks) {
          yield chunk;
        }
      })();

      const decryptedChunks: Uint8Array[] = [];
      const bobPrivateKey = bob.privateKey?.value;
      if (!bobPrivateKey) {
        throw new Error('Bob private key not available');
      }
      for await (const chunk of stream2.decryptStream(
        decryptSource,
        bobPrivateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      // Verify decryption worked
      const decrypted = new Uint8Array(
        decryptedChunks.reduce((acc, chunk) => acc + chunk.length, 0),
      );
      let offset = 0;
      for (const chunk of decryptedChunks) {
        decrypted.set(chunk, offset);
        offset += chunk.length;
      }

      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(message);

      // Clean up
      alice.dispose();
      bob.dispose();
      aliceMnemonic.dispose();
      bobMnemonic.dispose();
    });

    it('should support Member with custom service configuration', async () => {
      // Create service with custom configuration
      const customService = new ECIESService();

      // Create member with custom service
      const { member, mnemonic } = Member.newMember(
        customService,
        MemberType.System,
        'System User',
        new EmailString('system@example.com'),
      );

      // Verify member works with custom service
      expect(member).toBeDefined();
      expect(member.type).toBe(MemberType.System);

      // Test encryption with custom service
      const message = 'System message';
      const encrypted = await member.encryptData(message);
      const decrypted = await member.decryptData(encrypted);
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(message);

      // Clean up
      member.dispose();
      mnemonic.dispose();
    });

    it('should support service reuse across multiple operations', async () => {
      // Create single service instance
      const sharedService = new ECIESService();

      // Create multiple members
      const members: Member[] = [];
      const mnemonics: any[] = [];

      for (let i = 0; i < 3; i++) {
        const { member, mnemonic } = Member.newMember(
          sharedService,
          MemberType.User,
          `User ${i}`,
          new EmailString(`user${i}@example.com`),
        );
        members.push(member);
        mnemonics.push(mnemonic);
      }

      // Verify all members work
      for (let i = 0; i < 3; i++) {
        expect(members[i].name).toBe(`User ${i}`);

        // Test signing
        const data = new Uint8Array([i, i + 1, i + 2]);
        const signature = members[i].sign(data);
        expect(members[i].verify(signature, data)).toBe(true);
      }

      // Test cross-member encryption
      const message = 'Shared service message';
      const encrypted = await members[0].encryptData(
        message,
        members[1].publicKey,
      );
      const decrypted = await members[1].decryptData(encrypted);
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(message);

      // Clean up
      members.forEach((m) => m.dispose());
      mnemonics.forEach((m) => m.dispose());
    });

    it('should support ProgressTracker with dependency injection', () => {
      // Create progress tracker
      const tracker = new ProgressTracker(100);

      // Verify tracker works
      expect(tracker).toBeDefined();

      // Test progress tracking
      tracker.update(50);
      const progress = tracker.getProgress();
      expect(progress.bytesProcessed).toBe(50);
      expect(progress.totalBytes).toBe(100);
    });

    it('should support full encryption workflow with all injected dependencies', async () => {
      // Create all services
      const ecies = new ECIESService();
      const stream = new EncryptionStream(ecies);
      const tracker = new ProgressTracker();

      // Create sender and recipient
      const { member: sender, mnemonic: senderMnemonic } = Member.newMember(
        ecies,
        MemberType.User,
        'Sender',
        new EmailString('sender@example.com'),
      );

      const { member: recipient, mnemonic: recipientMnemonic } =
        Member.newMember(
          ecies,
          MemberType.User,
          'Recipient',
          new EmailString('recipient@example.com'),
        );

      // Encrypt data using stream
      const message = 'Full workflow test message';
      const data = new TextEncoder().encode(message);
      const source = (async function* () {
        yield data;
      })();

      const encryptedChunks: Uint8Array[] = [];
      for await (const chunk of stream.encryptStream(
        source,
        recipient.publicKey,
        {
          onProgress: (processed, total) => {
            tracker.update(processed);
          },
        },
      )) {
        encryptedChunks.push(chunk.data);
      }

      // Decrypt using stream
      const decryptSource = (async function* () {
        for (const chunk of encryptedChunks) {
          yield chunk;
        }
      })();

      const decryptedChunks: Uint8Array[] = [];
      const recipientPrivateKey = recipient.privateKey?.value;
      if (!recipientPrivateKey) {
        throw new Error('Recipient private key not available');
      }
      for await (const chunk of stream.decryptStream(
        decryptSource,
        recipientPrivateKey,
      )) {
        decryptedChunks.push(chunk);
      }

      // Verify decryption
      const decrypted = new Uint8Array(
        decryptedChunks.reduce((acc, chunk) => acc + chunk.length, 0),
      );
      let offset = 0;
      for (const chunk of decryptedChunks) {
        decrypted.set(chunk, offset);
        offset += chunk.length;
      }

      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(message);

      // Clean up
      sender.dispose();
      recipient.dispose();
      senderMnemonic.dispose();
      recipientMnemonic.dispose();
    });
  });
});
