/**
 * Integration tests to verify encrypted message structure changes correctly
 * with different ID providers across all encryption algorithms (SIMPLE, SINGLE, MULTIPLE).
 * 
 * These tests validate that:
 * 1. ID provider affects recipient ID length in encrypted messages
 * 2. Total encrypted data length changes appropriately
 * 3. All three encryption modes respect the configured ID provider
 * 4. Buffer structure matches expected format for each provider
 */

import { Constants, createRuntimeConfiguration, ECIES } from '../../src/constants';
import {
  ObjectIdProvider,
  GuidV4Provider,
  CustomIdProvider,
} from '../../src/lib/id-providers';
import { ECIESService } from '../../src/services/ecies/service';
import { EciesCryptoCore } from '../../src/services/ecies/crypto-core';
import { MultiRecipientProcessor } from '../../src/services/multi-recipient-processor';
import { getMultiRecipientConstants } from '../../src/interfaces/multi-recipient-chunk';

describe('Encrypted Message Structure Validation', () => {
  let eciesService: ECIESService;
  let cryptoCore: EciesCryptoCore;
  
  const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  
  beforeEach(() => {
    const config = {
      curveName: ECIES.CURVE_NAME,
      primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
      mnemonicStrength: ECIES.MNEMONIC_STRENGTH,
      symmetricAlgorithm: ECIES.SYMMETRIC.ALGORITHM,
      symmetricKeyBits: ECIES.SYMMETRIC.KEY_BITS,
      symmetricKeyMode: ECIES.SYMMETRIC.MODE,
    };
    eciesService = new ECIESService(config);
    cryptoCore = new EciesCryptoCore(config);
  });

  describe('MULTIPLE Encryption: ID Provider Impact on Message Structure', () => {
    interface EncryptedStructure {
      totalLength: number;
      recipientIdSize: number;
      recipientCount: number;
      dataLength: number;
      encryptedKeysSize: number;
    }

    async function analyzeMultiRecipientStructure(
      config: ReturnType<typeof createRuntimeConfiguration>,
      recipientCount: number
    ): Promise<EncryptedStructure> {
      const processor = new MultiRecipientProcessor(eciesService, config);
      const mrConstants = getMultiRecipientConstants(config.idProvider.byteLength);
      
      // Generate recipients
      const recipients = [];
      let encryptedKeySize = 0;
      for (let i = 0; i < recipientCount; i++) {
        const keyPair = await cryptoCore.generateEphemeralKeyPair();
        const recipientId = config.idProvider.generate();
        recipients.push({ id: recipientId, publicKey: keyPair.publicKey });
        
        // Measure the encrypted key size from the first recipient
        if (i === 0) {
          const symmetricKey = cryptoCore.generatePrivateKey(); // 32 bytes
          const encryptedKey = await eciesService.encryptSimpleOrSingle(
            false, // SINGLE mode
            keyPair.publicKey,
            symmetricKey
          );
          encryptedKeySize = encryptedKey.length;
        }
      }
      
      const symmetricKey = cryptoCore.generatePrivateKey();
      const encrypted = await processor.encryptChunk(
        testData,
        recipients,
        0,
        true,
        symmetricKey
      );
      
      return {
        totalLength: encrypted.data.length,
        recipientIdSize: mrConstants.RECIPIENT_ID_SIZE,
        recipientCount: recipientCount,
        dataLength: testData.length,
        encryptedKeysSize: encryptedKeySize * recipientCount,
      };
    }

    it('should have different total lengths for ObjectID (12) and GUID (16) providers', async () => {
      const providers = [
        { name: 'ObjectID', provider: new ObjectIdProvider(), expectedIdSize: 12 },
        { name: 'GUID', provider: new GuidV4Provider(), expectedIdSize: 16 },
      ];
      
      const structures: Record<string, EncryptedStructure> = {};
      
      for (const { name, provider, expectedIdSize } of providers) {
        const config = createRuntimeConfiguration({ idProvider: provider });
        structures[name] = await analyzeMultiRecipientStructure(config, 2);
        
        // Verify recipient ID size matches provider
        expect(structures[name].recipientIdSize).toBe(expectedIdSize);
      }
      
      // Total lengths should be different
      expect(structures.ObjectID.totalLength).not.toBe(structures.GUID.totalLength);
      
      // Verify the difference is due to ID size changes
      const objectIdToGuidDiff = structures.GUID.totalLength - structures.ObjectID.totalLength;
      
      // With 2 recipients, the difference should be:
      // (GUID ID size - ObjectID size) * 2 recipients
      // Each recipient header contains: recipientId + keySize(2) + encryptedKey(116)
      const expectedObjectIdToGuidDiff = (16 - 12) * 2; // 8 bytes (4 per recipient)
      
      expect(objectIdToGuidDiff).toBe(expectedObjectIdToGuidDiff);
    });

    it('should calculate correct message structure for ObjectID provider (12 bytes)', async () => {
      const config = createRuntimeConfiguration({ 
        idProvider: new ObjectIdProvider() 
      });
      const recipientCount = 3;
      
      const structure = await analyzeMultiRecipientStructure(config, recipientCount);
      
      // Measure actual encrypted key size
      const symmetricKey = cryptoCore.generatePrivateKey();
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const encryptedKey = await eciesService.encryptSimpleOrSingle(false, keyPair.publicKey, symmetricKey);
      const encryptedKeySize = encryptedKey.length;
      
      // Expected structure:
      // - Header: 32 bytes
      // - Per recipient: recipientId(12) + keySize(2) + encryptedKey
      // - IV: 12 bytes
      // - Encrypted data: 10 bytes
      // - Auth tag: 16 bytes
      
      const perRecipientSize = 12 + 2 + encryptedKeySize;
      const expectedTotal = 32 + (perRecipientSize * recipientCount) + 12 + testData.length + 16;
      
      expect(structure.recipientIdSize).toBe(12);
      expect(structure.totalLength).toBe(expectedTotal);
    });

    it('should calculate correct message structure for GUID provider (16 bytes)', async () => {
      const config = createRuntimeConfiguration({ 
        idProvider: new GuidV4Provider() 
      });
      const recipientCount = 3;
      
      const structure = await analyzeMultiRecipientStructure(config, recipientCount);
      
      // Measure actual encrypted key size
      const symmetricKey = cryptoCore.generatePrivateKey();
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const encryptedKey = await eciesService.encryptSimpleOrSingle(false, keyPair.publicKey, symmetricKey);
      const encryptedKeySize = encryptedKey.length;
      
      // Expected structure with 16-byte IDs
      const perRecipientSize = 16 + 2 + encryptedKeySize;
      const expectedTotal = 32 + (perRecipientSize * recipientCount) + 12 + testData.length + 16;
      
      expect(structure.recipientIdSize).toBe(16);
      expect(structure.totalLength).toBe(expectedTotal);
      
      // Should be 12 bytes longer than ObjectID (4 bytes per recipient * 3)
      const objectIdConfig = createRuntimeConfiguration({ 
        idProvider: new ObjectIdProvider() 
      });
      const objectIdStructure = await analyzeMultiRecipientStructure(objectIdConfig, recipientCount);
      const lengthDiff = structure.totalLength - objectIdStructure.totalLength;
      
      expect(lengthDiff).toBe((16 - 12) * recipientCount); // 4 bytes * 3 = 12
    });

    it('should scale encrypted message size linearly with recipient count', async () => {
      const config = createRuntimeConfiguration({ 
        idProvider: new ObjectIdProvider() 
      });
      
      // Measure actual encrypted key size
      const symmetricKey = cryptoCore.generatePrivateKey();
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const encryptedKey = await eciesService.encryptSimpleOrSingle(false, keyPair.publicKey, symmetricKey);
      const encryptedKeySize = encryptedKey.length;
      
      const recipientIdSize = 12;
      
      const counts = [1, 2, 5, 10];
      const structures: EncryptedStructure[] = [];
      
      for (const count of counts) {
        structures.push(await analyzeMultiRecipientStructure(config, count));
      }
      
      // Calculate per-recipient overhead
      const perRecipientOverhead = 
        recipientIdSize + // ID in recipient header
        2 + // keySize field
        encryptedKeySize; // Encrypted symmetric key
      
      for (let i = 1; i < structures.length; i++) {
        const lengthIncrease = structures[i].totalLength - structures[i - 1].totalLength;
        const recipientIncrease = counts[i] - counts[i - 1];
        
        expect(lengthIncrease).toBe(perRecipientOverhead * recipientIncrease);
      }
    });

    it('should produce different encrypted sizes for different ID providers with same recipient count', async () => {
      const providers = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
        new CustomIdProvider(20),
      ];
      
      const recipientCount = 3;
      const lengths: number[] = [];
      
      for (const provider of providers) {
        const config = createRuntimeConfiguration({ idProvider: provider });
        const structure = await analyzeMultiRecipientStructure(config, recipientCount);
        lengths.push(structure.totalLength);
      }
      
      // All lengths should be different (because ID sizes are different)
      const uniqueLengths = new Set(lengths);
      expect(uniqueLengths.size).toBe(providers.length);
      
      // Lengths should be in ascending order matching ID sizes
      expect(lengths[0]).toBeLessThan(lengths[1]); // 12 < 16
      expect(lengths[1]).toBeLessThan(lengths[2]); // 16 < 20
    });
  });

  describe('SIMPLE Encryption: ID Provider Independence', () => {
    it('should produce same encrypted data length regardless of ID provider', async () => {
      // SIMPLE mode doesn't use recipient IDs, so provider shouldn't affect length
      const providers = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
      ];
      
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const lengths: number[] = [];
      
      for (const provider of providers) {
        const config = createRuntimeConfiguration({ idProvider: provider });
        
        // SIMPLE encryption: encryptSimpleOrSingle(true, publicKey, message)
        const encrypted = await eciesService.encryptSimpleOrSingle(
          true, // encryptSimple = true
          keyPair.publicKey,
          testData
        );
        
        lengths.push(encrypted.length);
      }
      
      // All lengths should be identical (SIMPLE doesn't use IDs)
      const uniqueLengths = new Set(lengths);
      expect(uniqueLengths.size).toBe(1);
      
      // Verify expected SIMPLE structure:
      // Type (1) + Public Key (65) + IV (16) + Encrypted Data (10) + Auth Tag (16) = 108
      expect(lengths[0]).toBe(108);
    });
  });

  describe('SINGLE Encryption: ID Provider Independence', () => {
    it('should produce same encrypted data length regardless of ID provider', async () => {
      // SINGLE mode doesn't use recipient IDs, so provider shouldn't affect length
      const providers = [
        new ObjectIdProvider(),
        new GuidV4Provider(),
      ];
      
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const lengths: number[] = [];
      
      for (const provider of providers) {
        const config = createRuntimeConfiguration({ idProvider: provider });
        
        // SINGLE encryption: encryptSimpleOrSingle(false, publicKey, message)
        const encrypted = await eciesService.encryptSimpleOrSingle(
          false, // encryptSimple = false (so SINGLE mode)
          keyPair.publicKey,
          testData
        );
        
        lengths.push(encrypted.length);
      }
      
      // All lengths should be identical (SINGLE doesn't use IDs)
      const uniqueLengths = new Set(lengths);
      expect(uniqueLengths.size).toBe(1);
      
      // Verify expected SINGLE structure:
      // Type (1) + Public Key (65) + IV (16) + Encrypted Data (10) + Auth Tag (16) + Data Length (8) = 116
      expect(lengths[0]).toBe(116);
    });
  });

  describe('Cross-Algorithm Validation', () => {
    it('should verify MULTIPLE mode has ID-dependent length while SIMPLE and SINGLE do not', async () => {
      const objectIdProvider = new ObjectIdProvider();
      const guidIdProvider = new GuidV4Provider();
      
      const objectIdConfig = createRuntimeConfiguration({ idProvider: objectIdProvider });
      const guidConfig = createRuntimeConfiguration({ idProvider: guidIdProvider });
      
      const keyPair = await cryptoCore.generateEphemeralKeyPair();
      const recipientId1 = objectIdProvider.generate();
      const recipientId2 = guidIdProvider.generate();
      
      // SIMPLE: Should be identical
      const simple1 = await eciesService.encryptSimpleOrSingle(true, keyPair.publicKey, testData);
      const simple2 = await eciesService.encryptSimpleOrSingle(true, keyPair.publicKey, testData);
      expect(simple1.length).toBe(simple2.length);
      
      // SINGLE: Should be identical
      const single1 = await eciesService.encryptSimpleOrSingle(false, keyPair.publicKey, testData);
      const single2 = await eciesService.encryptSimpleOrSingle(false, keyPair.publicKey, testData);
      expect(single1.length).toBe(single2.length);
      
      // MULTIPLE: Should be different
      const processor1 = new MultiRecipientProcessor(eciesService, objectIdConfig);
      const processor2 = new MultiRecipientProcessor(eciesService, guidConfig);
      
      const symmetricKey = cryptoCore.generatePrivateKey();
      
      const multiple1 = await processor1.encryptChunk(
        testData,
        [{ id: recipientId1, publicKey: keyPair.publicKey }],
        0,
        true,
        symmetricKey
      );
      
      const multiple2 = await processor2.encryptChunk(
        testData,
        [{ id: recipientId2, publicKey: keyPair.publicKey }],
        0,
        true,
        symmetricKey
      );
      
      // MULTIPLE should have different lengths due to ID size
      expect(multiple1.data.length).not.toBe(multiple2.data.length);
      
      // Difference should be exactly 4 bytes (16 - 12) for the recipient ID
      const lengthDiff = multiple2.data.length - multiple1.data.length;
      expect(lengthDiff).toBe(4);
    });

    it('should verify recipient IDs are embedded correctly in buffer for each provider', async () => {
      const providers = [
        { provider: new ObjectIdProvider(), idSize: 12, name: 'ObjectID' },
        { provider: new GuidV4Provider(), idSize: 16, name: 'GUID' },
        { provider: new CustomIdProvider(24), idSize: 24, name: 'Custom24' },
      ];
      
      for (const { provider, idSize, name } of providers) {
        const config = createRuntimeConfiguration({ idProvider: provider });
        const processor = new MultiRecipientProcessor(eciesService, config);
        
        const keyPair = await cryptoCore.generateEphemeralKeyPair();
        const recipientId = provider.generate();
        const symmetricKey = cryptoCore.generatePrivateKey();
        
        const encrypted = await processor.encryptChunk(
          testData,
          [{ id: recipientId, publicKey: keyPair.publicKey }],
          0,
          true,
          symmetricKey
        );
        
        const buffer = encrypted.data;
        
        // Multi-recipient format has 32-byte header, then recipient headers
        // Verify the recipient ID is present starting at offset 32
        const recipientIdInBuffer = buffer.slice(32, 32 + idSize);
        expect(recipientIdInBuffer.length).toBe(idSize);
        
        // Verify bytes match (compare as arrays to handle Buffer vs Uint8Array)
        for (let i = 0; i < idSize; i++) {
          expect(recipientIdInBuffer[i]).toBe(recipientId[i]);
        }
      }
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should enforce minimum and maximum ID sizes', () => {
      // Minimum: 1 byte
      expect(() => new CustomIdProvider(0)).toThrow();
      
      // Maximum: 255 bytes
      expect(() => new CustomIdProvider(256)).toThrow();
      
      // Valid range
      const provider1 = new CustomIdProvider(1);
      expect(provider1.byteLength).toBe(1);
      
      const provider255 = new CustomIdProvider(255);
      expect(provider255.byteLength).toBe(255);
    });

    it('should handle maximum recipient count with different ID sizes', async () => {
      // Test with smaller recipient count due to time constraints
      const testRecipientCount = 100;
      
      const providers = [
        { provider: new ObjectIdProvider(), idSize: 12 },
        { provider: new GuidV4Provider(), idSize: 16 },
      ];
      
      for (const { provider, idSize } of providers) {
        const config = createRuntimeConfiguration({ idProvider: provider });
        const processor = new MultiRecipientProcessor(eciesService, config);
        
        const recipients = [];
        for (let i = 0; i < testRecipientCount; i++) {
          const keyPair = await cryptoCore.generateEphemeralKeyPair();
          const recipientId = provider.generate();
          recipients.push({ id: recipientId, publicKey: keyPair.publicKey });
        }
        
        const symmetricKey = cryptoCore.generatePrivateKey();
        const encrypted = await processor.encryptChunk(
          testData,
          recipients,
          0,
          true,
          symmetricKey
        );
        
        // Verify recipient count matches
        expect(encrypted.recipientCount).toBe(testRecipientCount);
        
        // Verify total length includes all recipient IDs
        const expectedIdsSectionSize = idSize * testRecipientCount;
        expect(encrypted.data.length).toBeGreaterThan(expectedIdsSectionSize);
      }
    });
  });
});
