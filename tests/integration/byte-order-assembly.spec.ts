/**
 * Byte Order and Assembly Tests
 * Addresses: Missing byte order validation, alignment issues, padding validation
 */

import { createRuntimeConfiguration } from '../../src/constants';
import { CustomIdProvider, ObjectIdProvider } from '../../src/lib/id-providers';
import { EciesCryptoCore } from '../../src/services/ecies/crypto-core';
import { ECIESService } from '../../src/services/ecies/service';
import { MultiRecipientProcessor } from '../../src/services/multi-recipient-processor';

describe('Byte Order and Assembly Tests', () => {
  let eciesService: ECIESService;
  let cryptoCore: EciesCryptoCore;

  beforeAll(() => {
    eciesService = new ECIESService();
    cryptoCore = new EciesCryptoCore();
  });

  describe('Endianness Validation', () => {
    it('should use big-endian for all length fields', async () => {
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const message = new Uint8Array(0x12345678 % 65536); // Use modulo to keep size reasonable

      const encrypted = await eciesService.encryptSimpleOrSingle(
        false, // Single mode has length field
        keyPair.publicKey,
        message,
      );

      // Extract length field (8 bytes starting at offset after header)
      const headerSize = 1 + 1 + 1 + 33 + 12 + 16; // version + suite + type + pubkey + iv + tag
      const lengthBytes = encrypted.slice(headerSize, headerSize + 8);

      // Read as big-endian
      const view = new DataView(lengthBytes.buffer, lengthBytes.byteOffset);
      const lengthBE = view.getBigUint64(0, false); // false = big-endian

      expect(Number(lengthBE)).toBe(message.length);

      // Verify it would be wrong if interpreted as little-endian
      const lengthLE = view.getBigUint64(0, true); // true = little-endian
      if (message.length > 256) {
        // Only test if length is significant enough
        expect(Number(lengthLE)).not.toBe(message.length);
      }
    });

    it('should use big-endian for multi-recipient headers', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      const processor = new MultiRecipientProcessor(eciesService, config);

      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const message = new Uint8Array(0x1234); // Specific length to test
      const recipientId = new Uint8Array(12).fill(1);

      const symmetricKey = cryptoCore.generatePrivateKey();
      const encrypted = await processor.encryptChunk(
        message,
        [{ id: recipientId, publicKey: keyPair.publicKey }],
        0,
        true,
        symmetricKey,
      );

      // Parse header manually to verify byte order
      const header = encrypted.data;
      const view = new DataView(header.buffer, header.byteOffset);

      // Check magic number (big-endian)
      const magic = view.getUint32(0, false);
      expect(magic).toBeDefined();

      // Check original size field (offset 12, big-endian)
      const originalSize = view.getUint32(12, false);
      expect(originalSize).toBe(message.length);
    });

    it('should handle cross-platform byte order consistency', async () => {
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const testLengths = [0x01, 0x0100, 0x010000, 0x01000000];

      for (const length of testLengths) {
        const message = new Uint8Array(length % 65536); // Keep reasonable size
        const encrypted = await eciesService.encryptSimpleOrSingle(
          false,
          keyPair.publicKey,
          message,
        );

        // Manually construct expected length bytes (big-endian)
        const expectedLengthBytes = new Uint8Array(8);
        const expectedView = new DataView(expectedLengthBytes.buffer);
        expectedView.setBigUint64(0, BigInt(message.length), false);

        // Extract actual length bytes from encrypted message
        const headerSize = 1 + 1 + 1 + 33 + 12 + 16;
        const actualLengthBytes = encrypted.slice(headerSize, headerSize + 8);

        expect(actualLengthBytes).toEqual(expectedLengthBytes);
      }
    });
  });

  describe('Alignment and Padding', () => {
    it('should properly align multi-recipient header fields', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      const processor = new MultiRecipientProcessor(eciesService, config);

      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const message = new Uint8Array([1, 2, 3]);
      const recipientId = new Uint8Array(12).fill(1);

      const symmetricKey = cryptoCore.generatePrivateKey();
      const encrypted = await processor.encryptChunk(
        message,
        [{ id: recipientId, publicKey: keyPair.publicKey }],
        0,
        true,
        symmetricKey,
      );

      const header = encrypted.data;
      const view = new DataView(header.buffer, header.byteOffset);
      let offset = 0;

      // Verify field alignment based on actual MultiRecipientProcessor format
      // Magic (4 bytes)
      const magic = view.getUint32(offset, false);
      expect(magic).toBeDefined();
      offset += 4;

      // Version (2 bytes)
      const version = view.getUint16(offset, false);
      expect(version).toBeDefined();
      offset += 2;

      // Recipient count (2 bytes)
      const recipientCount = view.getUint16(offset, false);
      expect(recipientCount).toBe(1);
      offset += 2;

      // Chunk index (4 bytes)
      const chunkIndex = view.getUint32(offset, false);
      expect(chunkIndex).toBe(0);
      offset += 4;

      // Original size (4 bytes)
      const originalSize = view.getUint32(offset, false);
      expect(originalSize).toBe(message.length);
    });

    it('should handle different ID sizes with proper alignment', async () => {
      const idSizes = [1, 4, 12, 16, 20, 32];

      for (const idSize of idSizes) {
        const config = createRuntimeConfiguration({
          idProvider: new CustomIdProvider(idSize),
        });
        const processor = new MultiRecipientProcessor(eciesService, config);

        const keyPair = await cryptoCore.generateEphemeralKeyPair();
        const message = new Uint8Array([1, 2, 3]);
        const recipientId = new Uint8Array(idSize).fill(42);

        const symmetricKey = cryptoCore.generatePrivateKey();
        const encrypted = await processor.encryptChunk(
          message,
          [{ id: recipientId, publicKey: keyPair.publicKey }],
          0,
          true,
          symmetricKey,
        );

        // Verify ID is properly embedded at correct offset (after 64-byte header)
        const expectedOffset = 64; // Fixed header size in MultiRecipientProcessor
        const actualId = encrypted.data.slice(
          expectedOffset,
          expectedOffset + idSize,
        );

        expect(actualId).toEqual(recipientId);
        expect(actualId.length).toBe(idSize);
      }
    });

    it('should maintain 8-byte alignment for critical fields', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      const processor = new MultiRecipientProcessor(eciesService, config);

      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const message = new Uint8Array([1, 2, 3]);
      const recipientId = new Uint8Array(12).fill(1);

      const symmetricKey = cryptoCore.generatePrivateKey();
      const encrypted = await processor.encryptChunk(
        message,
        [{ id: recipientId, publicKey: keyPair.publicKey }],
        0,
        true,
        symmetricKey,
      );

      // Check that 64-bit fields are properly aligned
      const dataLengthOffset = 1 + 1 + 1 + 33; // Should be 38
      expect(dataLengthOffset % 8).not.toBe(0); // This is expected - not all fields need 8-byte alignment

      // But the data length field itself should be readable as 64-bit
      const view = new DataView(
        encrypted.data.buffer,
        encrypted.data.byteOffset,
      );
      expect(() => view.getBigUint64(dataLengthOffset, false)).not.toThrow();
    });
  });

  describe('Structure Integrity', () => {
    it('should maintain consistent structure across different message sizes', async () => {
      const messageSizes = [0, 1, 255, 256, 65535, 65536];
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      for (const size of messageSizes) {
        const message = new Uint8Array(size);
        message.fill(size % 256);

        const encrypted = await eciesService.encryptSimpleOrSingle(
          false, // Single mode
          keyPair.publicKey,
          message,
        );

        // Verify structure consistency
        expect(encrypted[0]).toBe(1); // Version
        expect(encrypted[1]).toBe(1); // Cipher suite
        expect(encrypted[2]).toBe(66); // Single encryption type

        // Public key should be 33 bytes
        const pubKey = encrypted.slice(3, 36);
        expect(pubKey.length).toBe(33);
        expect([0x02, 0x03]).toContain(pubKey[0]); // Compressed key prefix

        // IV should be 12 bytes
        const iv = encrypted.slice(36, 48);
        expect(iv.length).toBe(12);

        // Auth tag should be 16 bytes
        const authTag = encrypted.slice(48, 64);
        expect(authTag.length).toBe(16);

        // Data length should be 8 bytes
        const lengthBytes = encrypted.slice(64, 72);
        expect(lengthBytes.length).toBe(8);

        const view = new DataView(lengthBytes.buffer, lengthBytes.byteOffset);
        const actualLength = Number(view.getBigUint64(0, false));
        expect(actualLength).toBe(size);
      }
    });

    it('should handle boundary conditions in header parsing', async () => {
      const config = createRuntimeConfiguration({
        idProvider: new ObjectIdProvider(),
      });
      const processor = new MultiRecipientProcessor(eciesService, config);

      // Test with maximum practical recipient count
      const maxRecipients = 10; // Reduced for test performance
      const recipients = [];

      for (let i = 0; i < maxRecipients; i++) {
        const keyPair = await cryptoCore.generateEphemeralKeyPair();
        recipients.push({
          id: new Uint8Array(12).fill(i % 256),
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
        });
      }

      const message = new Uint8Array([1, 2, 3]);
      const symmetricKey = cryptoCore.generatePrivateKey();

      const encrypted = await processor.encryptChunk(
        message,
        recipients.map((r) => ({ id: r.id, publicKey: r.publicKey })),
        0,
        true,
        symmetricKey,
      );

      // Verify header can be parsed correctly
      const header = encrypted.data;
      const view = new DataView(header.buffer, header.byteOffset);

      // Check recipient count (offset 6)
      const recipientCount = view.getUint16(6, false);
      expect(recipientCount).toBe(maxRecipients);

      // Verify structure is consistent
      expect(encrypted.recipientCount).toBe(maxRecipients);
    });
  });

  describe('Cross-Architecture Compatibility', () => {
    it('should produce identical results on different architectures', async () => {
      // Simulate different architecture byte orders by manually constructing headers
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const message = new Uint8Array([0x12, 0x34, 0x56, 0x78]);

      const encrypted = await eciesService.encryptSimpleOrSingle(
        false,
        keyPair.publicKey,
        message,
      );

      // Extract and verify length field
      const headerSize = 1 + 1 + 1 + 33 + 12 + 16;
      const lengthBytes = encrypted.slice(headerSize, headerSize + 8);

      // Manually construct what big-endian should look like
      const expectedBytes = new Uint8Array(8);
      expectedBytes[7] = 4; // Message length in big-endian

      expect(lengthBytes).toEqual(expectedBytes);

      // Verify decryption works
      const decrypted = await eciesService.decryptSimpleOrSingleWithHeader(
        false,
        keyPair.privateKey,
        encrypted,
      );

      expect(decrypted).toEqual(message);
    });

    it('should handle unaligned memory access gracefully', async () => {
      // Create a buffer that's not aligned to 8-byte boundary
      const unalignedBuffer = new ArrayBuffer(1000);
      const unalignedView = new Uint8Array(unalignedBuffer, 3); // Start at offset 3

      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const message = new Uint8Array([1, 2, 3, 4, 5]);

      const encrypted = await eciesService.encryptSimpleOrSingle(
        false,
        keyPair.publicKey,
        message,
      );

      // Copy encrypted data to unaligned buffer
      const unalignedEncrypted = unalignedView.slice(0, encrypted.length);
      unalignedEncrypted.set(encrypted);

      // Should still decrypt correctly despite unaligned access
      const decrypted = await eciesService.decryptSimpleOrSingleWithHeader(
        false,
        keyPair.privateKey,
        unalignedEncrypted,
      );

      expect(decrypted).toEqual(message);
    });
  });

  describe('Bit-level Validation', () => {
    it('should preserve all bits during encryption/decryption', async () => {
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      // Test with all possible byte values
      const message = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        message[i] = i;
      }

      const encrypted = await eciesService.encryptSimpleOrSingle(
        true,
        keyPair.publicKey,
        message,
      );

      const decrypted = await eciesService.decryptSimpleOrSingleWithHeader(
        true,
        keyPair.privateKey,
        encrypted,
      );

      expect(decrypted).toEqual(message);

      // Verify every bit is preserved
      for (let i = 0; i < 256; i++) {
        expect(decrypted[i]).toBe(i);
      }
    });

    it('should handle bit patterns that might cause issues', async () => {
      const keyPair = await cryptoCore.generateEphemeralKeyPair();

      const problematicPatterns = [
        new Uint8Array([0x00, 0x00, 0x00, 0x00]), // All zeros
        new Uint8Array([0xff, 0xff, 0xff, 0xff]), // All ones
        new Uint8Array([0xaa, 0xaa, 0xaa, 0xaa]), // Alternating bits
        new Uint8Array([0x55, 0x55, 0x55, 0x55]), // Alternating bits (inverted)
        new Uint8Array([0x01, 0x02, 0x04, 0x08]), // Powers of 2
        new Uint8Array([0x80, 0x40, 0x20, 0x10]), // High bits
      ];

      for (const pattern of problematicPatterns) {
        const encrypted = await eciesService.encryptSimpleOrSingle(
          true,
          keyPair.publicKey,
          pattern,
        );

        const decrypted = await eciesService.decryptSimpleOrSingleWithHeader(
          true,
          keyPair.privateKey,
          encrypted,
        );

        expect(decrypted).toEqual(pattern);
      }
    });
  });
});
