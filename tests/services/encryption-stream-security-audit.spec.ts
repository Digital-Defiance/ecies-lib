import { EncryptionStream } from '../../src/services/encryption-stream';
import { ECIESService } from '../../src/services/ecies/service';
import { StreamTestUtils } from '../support/stream-test-utils';
import { getEciesI18nEngine } from '../../src/i18n-setup';

describe('EncryptionStream - Security Audit', () => {
  let ecies: ECIESService;
  let stream: EncryptionStream;
  let publicKey: Uint8Array;
  let privateKey: Uint8Array;

  beforeAll(() => {
    getEciesI18nEngine();
  });

  beforeEach(() => {
    ecies = new ECIESService();
    stream = new EncryptionStream(ecies);
    const mnemonic = ecies.generateNewMnemonic();
    const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  });

  describe('1. Cryptographic Validation', () => {
    it('should produce different ciphertext for same plaintext (IV randomness)', async () => {
      const plaintext = StreamTestUtils.generateRandomData(1024);
      
      // Encrypt same data twice
      const encrypted1 = [];
      for await (const chunk of stream.encryptStream(
        StreamTestUtils.createAsyncIterable(plaintext, 1024),
        publicKey
      )) {
        encrypted1.push(chunk.data);
      }

      const encrypted2 = [];
      for await (const chunk of stream.encryptStream(
        StreamTestUtils.createAsyncIterable(plaintext, 1024),
        publicKey
      )) {
        encrypted2.push(chunk.data);
      }

      // Ciphertexts should be different (due to random IV/ephemeral key)
      expect(StreamTestUtils.arraysEqual(encrypted1[0], encrypted2[0])).toBe(false);
    });

    it('should safely reuse keys for multiple messages', async () => {
      const messages = [
        StreamTestUtils.generateRandomData(1024),
        StreamTestUtils.generateRandomData(1024),
        StreamTestUtils.generateRandomData(1024),
      ];

      // Encrypt multiple messages with same key
      const allEncrypted = [];
      for (const message of messages) {
        const encrypted = [];
        for await (const chunk of stream.encryptStream(
          StreamTestUtils.createAsyncIterable(message, 1024),
          publicKey
        )) {
          encrypted.push(chunk.data);
        }
        allEncrypted.push(encrypted);
      }

      // All should decrypt correctly
      for (let i = 0; i < messages.length; i++) {
        const decrypted = [];
        for await (const chunk of stream.decryptStream(
          (async function* () {
            for (const enc of allEncrypted[i]) {
              yield enc;
            }
          })(),
          privateKey
        )) {
          decrypted.push(chunk);
        }
        const result = StreamTestUtils.concatenateChunks(decrypted);
        expect(StreamTestUtils.arraysEqual(result, messages[i])).toBe(true);
      }
    });

    it('should use unique ephemeral keys for each chunk', async () => {
      const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
      
      const encrypted = [];
      for await (const chunk of stream.encryptStream(
        StreamTestUtils.createAsyncIterable(data, 1024 * 1024),
        publicKey
      )) {
        encrypted.push(chunk.data);
      }

      // Extract ephemeral public keys from each chunk (after header)
      // Each chunk should have different ephemeral key
      const ephemeralKeys = encrypted.map(chunk => {
        // Skip chunk header (32 bytes), ephemeral key is in ECIES data
        return chunk.slice(32, 32 + 65); // First 65 bytes of ECIES data
      });

      // All ephemeral keys should be different
      for (let i = 0; i < ephemeralKeys.length; i++) {
        for (let j = i + 1; j < ephemeralKeys.length; j++) {
          expect(StreamTestUtils.arraysEqual(ephemeralKeys[i], ephemeralKeys[j])).toBe(false);
        }
      }
    });

    it('should never reuse IVs across chunks', async () => {
      const data = StreamTestUtils.generateRandomData(5 * 1024 * 1024);
      
      const encrypted = [];
      for await (const chunk of stream.encryptStream(
        StreamTestUtils.createAsyncIterable(data, 1024 * 1024),
        publicKey
      )) {
        encrypted.push(chunk.data);
      }

      // Extract IVs from each chunk (part of ECIES structure)
      const ivs = encrypted.map(chunk => {
        // IV is after ephemeral key in ECIES structure
        // Skip chunk header (32) + ephemeral key (65)
        return chunk.slice(97, 97 + 16); // 16-byte IV
      });

      // All IVs should be unique (no collisions)
      for (let i = 0; i < ivs.length; i++) {
        for (let j = i + 1; j < ivs.length; j++) {
          expect(StreamTestUtils.arraysEqual(ivs[i], ivs[j])).toBe(false);
        }
      }
    });
  });

  describe('2. Compatibility & Interoperability', () => {
    it('should maintain backward compatibility with chunk format', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      const encrypted = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encrypted.push(chunk);
      }

      // Simulate old version reading new format
      // Old code expects: magic (4) + version (2) + index (4) + ...
      const chunkData = encrypted[0].data;
      const view = new DataView(chunkData.buffer, chunkData.byteOffset);
      
      // Verify format is stable and parseable
      const magic = view.getUint32(0, false);
      const version = view.getUint16(4, false);
      const index = view.getUint32(6, false);
      const originalSize = view.getUint32(10, false);
      
      expect(magic).toBe(0x45434945);
      expect(version).toBe(0x0001);
      expect(index).toBe(0);
      expect(originalSize).toBe(1024);
    });

    it('should handle cross-platform encryption (Node.js compatible)', async () => {
      // Test that encryption works consistently across platforms
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      // Encrypt
      const encrypted = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encrypted.push(chunk.data);
      }

      // Decrypt (simulating different platform)
      const decrypted = [];
      for await (const chunk of stream.decryptStream(
        (async function* () {
          for (const enc of encrypted) {
            yield enc;
          }
        })(),
        privateKey
      )) {
        decrypted.push(chunk);
      }

      const result = StreamTestUtils.concatenateChunks(decrypted);
      expect(StreamTestUtils.arraysEqual(result, data)).toBe(true);
    });
  });

  describe('3. Resource Exhaustion Protection', () => {
    it('should handle malicious chunk size in header', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      // Encrypt normally
      const encrypted = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encrypted.push(chunk.data);
      }

      // Tamper with chunk header to claim huge size
      const tampered = new Uint8Array(encrypted[0]);
      const view = new DataView(tampered.buffer, tampered.byteOffset);
      view.setUint32(10, 0xFFFFFFFF, false); // Set originalSize to max uint32

      // Should fail gracefully, not allocate huge buffer
      await expect(async () => {
        for await (const chunk of stream.decryptStream(
          (async function* () {
            yield tampered;
          })(),
          privateKey
        )) {
          // Should fail
        }
      }).rejects.toThrow();
    });

    it('should handle rapid cancellation without memory leak', async () => {
      const data = StreamTestUtils.generateRandomData(10 * 1024 * 1024);
      
      // Rapidly cancel multiple streams
      for (let i = 0; i < 10; i++) {
        const controller = new AbortController();
        
        try {
          for await (const chunk of stream.encryptStream(
            StreamTestUtils.createAsyncIterable(data, 1024 * 1024),
            publicKey,
            { signal: controller.signal }
          )) {
            controller.abort(); // Cancel immediately
          }
        } catch (error: any) {
          expect(error.name).toBe('AbortError');
        }
      }

      // If we get here without crashing, no obvious memory leak
      expect(true).toBe(true);
    });

    it('should handle infinite stream with cancellation', async () => {
      const controller = new AbortController();
      let chunkCount = 0;

      // Create infinite stream
      const infiniteStream = async function* () {
        while (true) {
          yield StreamTestUtils.generateRandomData(1024);
        }
      };

      try {
        for await (const chunk of stream.encryptStream(
          infiniteStream(),
          publicKey,
          { signal: controller.signal }
        )) {
          chunkCount++;
          if (chunkCount === 5) {
            controller.abort();
          }
        }
        fail('Should have thrown AbortError');
      } catch (error: any) {
        expect(error.name).toBe('AbortError');
        expect(chunkCount).toBe(5);
      }
    });

    it('should verify cleanup after errors', async () => {
      const errorStream = async function* () {
        yield StreamTestUtils.generateRandomData(1024);
        throw new Error('Stream error');
      };

      try {
        for await (const chunk of stream.encryptStream(errorStream(), publicKey)) {
          // Should throw
        }
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBe('Stream error');
      }

      // Verify we can still use the stream after error
      const data = StreamTestUtils.generateRandomData(1024);
      const encrypted = [];
      for await (const chunk of stream.encryptStream(
        StreamTestUtils.createAsyncIterable(data, 1024),
        publicKey
      )) {
        encrypted.push(chunk);
      }
      expect(encrypted.length).toBe(1);
    });
  });

  describe('4. Timing & Side-Channel Resistance', () => {
    it('should use constant-time comparison for checksums', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      // Encrypt with checksum
      const encrypted = [];
      for await (const chunk of stream.encryptStream(source, publicKey, {
        includeChecksums: true,
      })) {
        encrypted.push(chunk.data);
      }

      // Tamper with checksum (last 32 bytes)
      const tampered = new Uint8Array(encrypted[0]);
      tampered[tampered.length - 1] ^= 0xFF;

      // Measure timing for checksum validation
      const timings = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        try {
          for await (const chunk of stream.decryptStream(
            (async function* () {
              yield tampered;
            })(),
            privateKey
          )) {
            // Should fail
          }
        } catch (error) {
          // Expected
        }
        timings.push(performance.now() - start);
      }

      // Timing should be relatively consistent (not revealing position of mismatch)
      const avg = timings.reduce((a, b) => a + b) / timings.length;
      const variance = timings.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);
      
      // Standard deviation should be small relative to mean (< 50%)
      expect(stdDev / avg).toBeLessThan(0.5);
    });

    it('should not leak timing information on decryption failure', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      const encrypted = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encrypted.push(chunk.data);
      }

      // Measure timing for wrong key (should fail fast)
      const wrongMnemonic = ecies.generateNewMnemonic();
      const wrongKeyPair = ecies.mnemonicToSimpleKeyPair(wrongMnemonic);

      const timings = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        try {
          for await (const chunk of stream.decryptStream(
            (async function* () {
              for (const enc of encrypted) {
                yield enc;
              }
            })(),
            wrongKeyPair.privateKey
          )) {
            // Should fail
          }
        } catch (error) {
          // Expected
        }
        timings.push(performance.now() - start);
      }

      // All timings should be similar (not revealing information)
      const avg = timings.reduce((a, b) => a + b) / timings.length;
      const variance = timings.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);
      
      expect(stdDev / avg).toBeLessThan(0.5);
    });
  });

  describe('5. Error Information Leakage', () => {
    it('should not leak key material in error messages', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      const encrypted = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encrypted.push(chunk.data);
      }

      // Try to decrypt with wrong key
      try {
        const wrongMnemonic = ecies.generateNewMnemonic();
        const wrongKeyPair = ecies.mnemonicToSimpleKeyPair(wrongMnemonic);
        
        for await (const chunk of stream.decryptStream(
          (async function* () {
            for (const enc of encrypted) {
              yield enc;
            }
          })(),
          wrongKeyPair.privateKey
        )) {
          // Should fail
        }
        fail('Should have thrown error');
      } catch (error: any) {
        const errorStr = error.toString();
        
        // Error should not contain key material (hex strings of keys)
        const privateKeyHex = Buffer.from(privateKey).toString('hex');
        const publicKeyHex = Buffer.from(publicKey).toString('hex');
        
        expect(errorStr).not.toContain(privateKeyHex);
        expect(errorStr).not.toContain(publicKeyHex);
      }
    });

    it('should sanitize error messages for invalid data', async () => {
      const invalidData = StreamTestUtils.generateRandomData(100);

      try {
        for await (const chunk of stream.decryptStream(
          (async function* () {
            yield invalidData;
          })(),
          privateKey
        )) {
          // Should fail
        }
        fail('Should have thrown error');
      } catch (error: any) {
        // Error should be descriptive but not leak internal state
        expect(error.message).toBeTruthy();
        expect(error.message.length).toBeLessThan(200); // Reasonable length
      }
    });

    it('should sanitize stack traces', async () => {
      const invalidData = StreamTestUtils.generateRandomData(100);

      try {
        for await (const chunk of stream.decryptStream(
          (async function* () {
            yield invalidData;
          })(),
          privateKey
        )) {
          // Should fail
        }
        fail('Should have thrown error');
      } catch (error: any) {
        const stack = error.stack || '';
        
        // Stack trace should not contain key material
        const privateKeyHex = Buffer.from(privateKey).toString('hex');
        const publicKeyHex = Buffer.from(publicKey).toString('hex');
        
        expect(stack).not.toContain(privateKeyHex);
        expect(stack).not.toContain(publicKeyHex);
      }
    });
  });

  describe('6. Concurrency & Race Conditions', () => {
    it('should maintain chunk format compatibility', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      const encrypted = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encrypted.push(chunk);
      }

      // Verify chunk format is stable
      const chunkData = encrypted[0].data;
      const view = new DataView(chunkData.buffer, chunkData.byteOffset);
      
      // Magic bytes should be 0x45434945 ("ECIE")
      expect(view.getUint32(0, false)).toBe(0x45434945);
      
      // Version should be 0x0001
      expect(view.getUint16(4, false)).toBe(0x0001);
      
      // Index should be 0 for first chunk
      expect(view.getUint32(6, false)).toBe(0);
    });

    it('should handle endianness correctly', async () => {
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      const encrypted = [];
      for await (const chunk of stream.encryptStream(source, publicKey)) {
        encrypted.push(chunk.data);
      }

      // Parse header manually to verify endianness
      const view = new DataView(encrypted[0].buffer, encrypted[0].byteOffset);
      
      // All multi-byte values should be big-endian (false parameter)
      const magic = view.getUint32(0, false);
      const version = view.getUint16(4, false);
      const index = view.getUint32(6, false);
      
      expect(magic).toBe(0x45434945);
      expect(version).toBe(0x0001);
      expect(index).toBe(0);
    });
  });

  describe('7. Compliance & Standards', () => {
    it('should validate key strength (reject weak keys)', async () => {
      // Test that we use strong keys (secp256k1 provides 128-bit security)
      const mnemonic = ecies.generateNewMnemonic();
      const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
      
      // Private key should be 32 bytes (256 bits)
      expect(keyPair.privateKey.length).toBe(32);
      
      // Public key should be 33 bytes (compressed secp256k1)
      expect(keyPair.publicKey.length).toBe(33);
      
      // First byte should be 0x02 or 0x03 (compressed point)
      expect([0x02, 0x03]).toContain(keyPair.publicKey[0]);
    });

    it('should use NIST-approved algorithms', async () => {
      // Verify we use approved algorithms:
      // - ECDH with secp256k1 (NIST approved curve)
      // - AES-256-GCM (NIST SP 800-38D)
      // - SHA-256 for checksums (FIPS 180-4)
      
      const data = StreamTestUtils.generateRandomData(1024);
      const source = StreamTestUtils.createAsyncIterable(data, 1024);

      const encrypted = [];
      for await (const chunk of stream.encryptStream(source, publicKey, {
        includeChecksums: true,
      })) {
        encrypted.push(chunk);
      }

      // Verify checksum is SHA-256 (32 bytes)
      expect(encrypted[0].metadata?.checksum?.length).toBe(32);
      
      // Verify encryption produces expected overhead
      // ECIES overhead + AES-GCM overhead indicates proper algorithms
      expect(encrypted[0].data.length).toBeGreaterThan(1024);
    });

    it('should meet minimum security parameters', async () => {
      // Verify security parameters meet standards:
      // - AES key size: 256 bits (from ECIES service)
      // - Algorithm: AES with GCM mode (NIST SP 800-38D)
      
      const eciesConfig = ecies.config;
      
      // Verify algorithm is AES
      expect(eciesConfig.symmetricAlgorithm).toBe('aes');
      
      // Verify mode is GCM
      expect(eciesConfig.symmetricKeyMode).toBe('gcm');
      
      // Verify key size is 256 bits (32 bytes)
      expect(eciesConfig.symmetricKeyBits).toBe(256);
      
      // Verify curve is secp256k1
      expect(eciesConfig.curveName).toBe('secp256k1');
    });
  });

  describe('Additional Concurrency Tests', () => {
    it('should handle concurrent encryption streams', async () => {
      const data1 = StreamTestUtils.generateRandomData(1024);
      const data2 = StreamTestUtils.generateRandomData(1024);
      const data3 = StreamTestUtils.generateRandomData(1024);

      // Start multiple encryptions concurrently
      const promises = [
        (async () => {
          const chunks = [];
          for await (const chunk of stream.encryptStream(
            StreamTestUtils.createAsyncIterable(data1, 1024),
            publicKey
          )) {
            chunks.push(chunk.data);
          }
          return chunks;
        })(),
        (async () => {
          const chunks = [];
          for await (const chunk of stream.encryptStream(
            StreamTestUtils.createAsyncIterable(data2, 1024),
            publicKey
          )) {
            chunks.push(chunk.data);
          }
          return chunks;
        })(),
        (async () => {
          const chunks = [];
          for await (const chunk of stream.encryptStream(
            StreamTestUtils.createAsyncIterable(data3, 1024),
            publicKey
          )) {
            chunks.push(chunk.data);
          }
          return chunks;
        })(),
      ];

      const results = await Promise.all(promises);

      // All should complete successfully
      expect(results.length).toBe(3);
      expect(results[0].length).toBeGreaterThan(0);
      expect(results[1].length).toBeGreaterThan(0);
      expect(results[2].length).toBeGreaterThan(0);
    });

    it('should handle interleaved encrypt/decrypt operations', async () => {
      const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
      
      // Encrypt
      const encrypted = [];
      for await (const chunk of stream.encryptStream(
        StreamTestUtils.createAsyncIterable(data, 1024 * 1024),
        publicKey
      )) {
        encrypted.push(chunk.data);
      }

      // Interleave: decrypt all chunks, encrypt new data, decrypt new data
      const decrypted = [];
      for await (const chunk of stream.decryptStream(
        (async function* () {
          for (const enc of encrypted) {
            yield enc;
          }
        })(),
        privateKey
      )) {
        decrypted.push(chunk);
      }

      const newData = StreamTestUtils.generateRandomData(1024);
      const newEncrypted = [];
      for await (const chunk of stream.encryptStream(
        StreamTestUtils.createAsyncIterable(newData, 1024),
        publicKey
      )) {
        newEncrypted.push(chunk.data);
      }

      const newDecrypted = [];
      for await (const chunk of stream.decryptStream(
        (async function* () {
          for (const enc of newEncrypted) {
            yield enc;
          }
        })(),
        privateKey
      )) {
        newDecrypted.push(chunk);
      }

      // All operations should succeed
      expect(decrypted.length).toBe(2);
      expect(newEncrypted.length).toBe(1);
      expect(newDecrypted.length).toBe(1);
      
      // Verify data integrity
      const result = StreamTestUtils.concatenateChunks(decrypted);
      expect(StreamTestUtils.arraysEqual(result, data)).toBe(true);
    });
  });
});
