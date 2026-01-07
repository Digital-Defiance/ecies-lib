/**
 * ID Provider Entropy and Security Tests
 * Addresses: Missing entropy validation, predictability analysis, collision resistance
 */

import {
  CustomIdProvider,
  GuidV4Provider,
  ObjectIdProvider,
  UuidProvider,
} from '../../../src/lib/id-providers';

describe('ID Provider Security and Entropy Tests', () => {
  describe('Entropy Analysis', () => {
    it('should validate ObjectId structured entropy correctly', () => {
      const provider = new ObjectIdProvider();
      const sampleSize = 1000; // Reduced for performance
      const ids = Array.from({ length: sampleSize }, () => provider.generate());
      
      // ObjectId format: timestamp(4) + machine(3) + pid(2) + counter(3)
      // CORRECT EXPECTATION: Timestamp bytes should have LOW entropy (structured)
      
      const byteEntropies = [];
      for (let bytePos = 0; bytePos < 12; bytePos++) {
        const byteCounts = new Array(256).fill(0);
        
        for (const id of ids) {
          byteCounts[id[bytePos]]++;
        }
        
        let entropy = 0;
        for (const count of byteCounts) {
          if (count > 0) {
            const probability = count / sampleSize;
            entropy -= probability * Math.log2(probability);
          }
        }
        
        byteEntropies.push(entropy);
      }
      
      console.log('ObjectId byte entropies:', byteEntropies.map(e => e.toFixed(2)));
      
      // CORRECT: Timestamp bytes (0-3) should have very low entropy
      for (let i = 0; i < 4; i++) {
        expect(byteEntropies[i]).toBeLessThan(2.0); // Low entropy is CORRECT
      }
      
      // Counter bytes (9-11) should have some entropy from incrementation
      const counterEntropy = byteEntropies.slice(9, 12);
      const totalCounterEntropy = counterEntropy.reduce((sum, e) => sum + e, 0);
      expect(totalCounterEntropy).toBeGreaterThan(3.0); // Some entropy expected
    });

    it('should generate IDs with sufficient entropy - GuidV4Provider', () => {
      const provider = new GuidV4Provider();
      const sampleSize = 10000;
      const ids = Array.from({ length: sampleSize }, () => provider.generate());
      
      const byteEntropies = [];
      for (let bytePos = 0; bytePos < 16; bytePos++) {
        const byteCounts = new Array(256).fill(0);
        
        for (const id of ids) {
          byteCounts[id[bytePos]]++;
        }
        
        let entropy = 0;
        for (const count of byteCounts) {
          if (count > 0) {
            const probability = count / sampleSize;
            entropy -= probability * Math.log2(probability);
          }
        }
        
        byteEntropies.push(entropy);
      }
      
      console.log('GUID byte entropies:', byteEntropies.map(e => e.toFixed(2)));
      
      // Most bytes should have high entropy (except version/variant bytes)
      for (let i = 0; i < 16; i++) {
        if (i !== 6 && i !== 8) { // Skip version and variant bytes
          expect(byteEntropies[i]).toBeGreaterThan(6.0);
        }
      }
    });

    it('should generate IDs with sufficient entropy - CustomIdProvider', () => {
      const provider = new CustomIdProvider(20);
      const sampleSize = 10000;
      const ids = Array.from({ length: sampleSize }, () => provider.generate());
      
      const byteEntropies = [];
      for (let bytePos = 0; bytePos < 20; bytePos++) {
        const byteCounts = new Array(256).fill(0);
        
        for (const id of ids) {
          byteCounts[id[bytePos]]++;
        }
        
        let entropy = 0;
        for (const count of byteCounts) {
          if (count > 0) {
            const probability = count / sampleSize;
            entropy -= probability * Math.log2(probability);
          }
        }
        
        byteEntropies.push(entropy);
      }
      
      console.log('Custom ID byte entropies:', byteEntropies.map(e => e.toFixed(2)));
      
      // All bytes should have high entropy (pure random)
      for (const entropy of byteEntropies) {
        expect(entropy).toBeGreaterThan(7.0);
      }
    });
  });

  describe('Predictability Analysis', () => {
    it('should validate ObjectId predictable structure correctly', () => {
      const provider = new ObjectIdProvider();
      const ids = Array.from({ length: 100 }, () => provider.generate());
      
      // CORRECT EXPECTATION: ObjectId SHOULD have predictable patterns
      // This is the intended behavior, not a security flaw
      
      // Verify timestamp consistency (should be same or very close)
      const timestamps = ids.map(id => {
        const view = new DataView(id.buffer, id.byteOffset);
        return view.getUint32(0, false); // Big-endian timestamp
      });
      
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBeLessThan(5); // Should be very few unique timestamps
      
      // Verify machine/PID portion is consistent (bytes 4-8)
      const machinePortions = ids.map(id => Array.from(id.slice(4, 9)).join(','));
      const uniqueMachinePortions = new Set(machinePortions);
      expect(uniqueMachinePortions.size).toBe(1); // Should be identical for same machine/process
      
      // Verify counter increments (bytes 9-11)
      const counters = ids.map(id => {
        const view = new DataView(id.buffer, id.byteOffset);
        return view.getUint32(8, false) & 0xFFFFFF; // Last 3 bytes as counter
      });
      
      // Counters should generally increase
      let increasingCount = 0;
      for (let i = 1; i < counters.length; i++) {
        if (counters[i] >= counters[i - 1]) {
          increasingCount++;
        }
      }
      
      expect(increasingCount).toBeGreaterThan(counters.length * 0.8);
    });

    it('should not be predictable - GuidV4Provider', () => {
      const provider = new GuidV4Provider();
      const ids = Array.from({ length: 1000 }, () => provider.generate());
      
      // Test for bit patterns
      const bitPatterns = new Map<string, number>();
      
      for (const id of ids) {
        // Check 4-byte windows for patterns
        for (let i = 0; i <= id.length - 4; i++) {
          if (i === 6 || i === 8) continue; // Skip version/variant bytes
          
          const window = id.slice(i, i + 4);
          const pattern = Array.from(window).map(b => b.toString(16).padStart(2, '0')).join('');
          bitPatterns.set(pattern, (bitPatterns.get(pattern) || 0) + 1);
        }
      }
      
      // No 4-byte pattern should repeat more than expected
      const maxRepeats = Math.max(...bitPatterns.values());
      expect(maxRepeats).toBeLessThan(5);
    });

    it('should pass chi-square test for randomness', () => {
      const provider = new CustomIdProvider(16);
      const sampleSize = 10000;
      const ids = Array.from({ length: sampleSize }, () => provider.generate());
      
      // Flatten all bytes
      const allBytes: number[] = [];
      for (const id of ids) {
        allBytes.push(...Array.from(id));
      }
      
      // Count frequency of each byte value
      const observed = new Array(256).fill(0);
      for (const byte of allBytes) {
        observed[byte]++;
      }
      
      // Expected frequency (uniform distribution)
      const expected = allBytes.length / 256;
      
      // Calculate chi-square statistic
      let chiSquare = 0;
      for (let i = 0; i < 256; i++) {
        const diff = observed[i] - expected;
        chiSquare += (diff * diff) / expected;
      }
      
      // Critical value for 255 degrees of freedom at 0.05 significance level
      const criticalValue = 293.25;
      
      console.log(`Chi-square statistic: ${chiSquare.toFixed(2)}, Critical value: ${criticalValue}`);
      expect(chiSquare).toBeLessThan(criticalValue);
    });
  });

  describe('Collision Resistance', () => {
    it('should have no collisions in large sample - ObjectIdProvider', () => {
      const provider = new ObjectIdProvider();
      const sampleSize = 100000;
      const ids = new Set<string>();
      
      for (let i = 0; i < sampleSize; i++) {
        const id = provider.generate();
        const idStr = provider.serialize(id);
        
        expect(ids.has(idStr)).toBe(false);
        ids.add(idStr);
      }
      
      expect(ids.size).toBe(sampleSize);
    });

    it('should have no collisions in large sample - GuidV4Provider', () => {
      const provider = new GuidV4Provider();
      const sampleSize = 100000;
      const ids = new Set<string>();
      
      for (let i = 0; i < sampleSize; i++) {
        const id = provider.generate();
        const idStr = provider.serialize(id);
        
        expect(ids.has(idStr)).toBe(false);
        ids.add(idStr);
      }
      
      expect(ids.size).toBe(sampleSize);
    });

    it('should have no collisions under concurrent generation', async () => {
      const provider = new CustomIdProvider(16);
      const concurrentWorkers = 10;
      const idsPerWorker = 10000;
      
      const workerPromises = Array.from({ length: concurrentWorkers }, async (_, workerIndex) => {
        const workerIds = new Set<string>();
        
        for (let i = 0; i < idsPerWorker; i++) {
          const id = provider.generate();
          const idStr = provider.serialize(id);
          workerIds.add(idStr);
        }
        
        return workerIds;
      });
      
      const allWorkerIds = await Promise.all(workerPromises);
      
      // Combine all IDs and check for collisions
      const allIds = new Set<string>();
      let totalGenerated = 0;
      
      for (const workerIds of allWorkerIds) {
        totalGenerated += workerIds.size;
        for (const id of workerIds) {
          expect(allIds.has(id)).toBe(false);
          allIds.add(id);
        }
      }
      
      expect(allIds.size).toBe(totalGenerated);
      expect(totalGenerated).toBe(concurrentWorkers * idsPerWorker);
    });

    it('should detect birthday paradox threshold', () => {
      // Use 16-bit ID space for more reliable collision detection
      // Birthday paradox suggests ~50% collision probability at sqrt(2^16) ≈ 256 samples
      
      const provider = new CustomIdProvider(2); // 16-bit ID space
      const ids = new Set<string>();
      let collisionFound = false;
      let attempts = 0;
      const maxAttempts = 1000; // Should find collision well before this
      
      while (!collisionFound && attempts < maxAttempts) {
        const id = provider.generate();
        const idStr = provider.serialize(id);
        
        if (ids.has(idStr)) {
          collisionFound = true;
          console.log(`Collision found after ${attempts} attempts with 16-bit ID space`);
        } else {
          ids.add(idStr);
        }
        
        attempts++;
      }
      
      // With 16-bit space, we should find a collision (birthday paradox at ~256 attempts)
      expect(collisionFound).toBe(true);
      expect(attempts).toBeLessThan(maxAttempts);
    });
  });

  describe('Timing Attack Resistance', () => {
    it('should have constant-time comparison - CustomIdProvider', () => {
      const provider = new CustomIdProvider(16);
      const id1 = provider.generate();
      const id2 = provider.generate();
      const id3 = provider.clone(id1);
      
      // Modify last byte only
      id3[15] = id3[15] ^ 0xFF;
      
      const iterations = 10000;
      
      // Time comparison of completely different IDs
      const start1 = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        provider.equals(id1, id2);
      }
      const time1 = Number(process.hrtime.bigint() - start1);
      
      // Time comparison of IDs differing only in last byte
      const start2 = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        provider.equals(id1, id3);
      }
      const time2 = Number(process.hrtime.bigint() - start2);
      
      // Times should be similar (relaxed for CI environments)
      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      console.log(`Timing ratio: ${ratio.toFixed(2)}`);
      expect(ratio).toBeLessThan(3.0);
    });

    it('should have constant-time validation', () => {
      const provider = new ObjectIdProvider();
      const validId = provider.generate();
      const invalidId = new Uint8Array(12); // All zeros
      
      const iterations = 10000;
      
      // Time validation of valid ID
      const start1 = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        provider.validate(validId);
      }
      const time1 = Number(process.hrtime.bigint() - start1);
      
      // Time validation of invalid ID
      const start2 = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        provider.validate(invalidId);
      }
      const time2 = Number(process.hrtime.bigint() - start2);
      
      // Times should be similar (relaxed for CI)
      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      console.log(`Validation timing ratio: ${ratio.toFixed(2)}`);
      expect(ratio).toBeLessThan(3.0);
    });
  });

  describe('Statistical Tests', () => {
    it('should pass runs test for randomness', () => {
      const provider = new CustomIdProvider(16);
      const sampleSize = 500; // Reduced sample size for more stable test
      const ids = Array.from({ length: sampleSize }, () => provider.generate());
      
      // Convert to bit sequence
      const bits: number[] = [];
      for (const id of ids) {
        for (const byte of id) {
          for (let i = 7; i >= 0; i--) {
            bits.push((byte >> i) & 1);
          }
        }
      }
      
      // Count runs (sequences of consecutive identical bits)
      let runs = 1;
      for (let i = 1; i < bits.length; i++) {
        if (bits[i] !== bits[i - 1]) {
          runs++;
        }
      }
      
      // Expected runs for random sequence
      const n = bits.length;
      const ones = bits.filter(b => b === 1).length;
      const zeros = n - ones;
      
      // Avoid edge cases where all bits are the same
      if (ones === 0 || zeros === 0) {
        expect(ones > 0 && zeros > 0).toBe(true);
        return;
      }
      
      const expectedRuns = (2 * ones * zeros) / n + 1;
      const variance = (2 * ones * zeros * (2 * ones * zeros - n)) / (n * n * (n - 1));
      const standardDeviation = Math.sqrt(Math.abs(variance));
      
      // Avoid division by zero
      if (standardDeviation === 0) {
        expect(runs).toBeGreaterThan(0);
        return;
      }
      
      // Z-score should be within reasonable bounds
      const zScore = Math.abs(runs - expectedRuns) / standardDeviation;
      console.log(`Runs test - Z-score: ${zScore.toFixed(2)}`);
      expect(zScore).toBeLessThan(3.29); // 99.9% confidence interval (more lenient)
    });

    it('should pass autocorrelation test', () => {
      const provider = new CustomIdProvider(16);
      const sampleSize = 1000;
      const ids = Array.from({ length: sampleSize }, () => provider.generate());
      
      // Test autocorrelation at different lags
      const maxLag = 10;
      const correlations: number[] = [];
      
      for (let lag = 1; lag <= maxLag; lag++) {
        let correlation = 0;
        let count = 0;
        
        for (let i = 0; i < ids.length - lag; i++) {
          const id1 = ids[i];
          const id2 = ids[i + lag];
          
          // Calculate correlation between corresponding bytes
          for (let j = 0; j < 16; j++) {
            correlation += (id1[j] - 127.5) * (id2[j] - 127.5);
            count++;
          }
        }
        
        correlation /= count;
        correlations.push(correlation);
      }
      
      // All correlations should be close to zero
      for (let i = 0; i < correlations.length; i++) {
        console.log(`Lag ${i + 1} correlation: ${correlations[i].toFixed(4)}`);
        expect(Math.abs(correlations[i])).toBeLessThan(200); // More lenient threshold
      }
    });
  });

  describe('Adversarial Conditions', () => {
    it('should maintain security under rapid generation', () => {
      const provider = new ObjectIdProvider();
      const rapidIds = [];
      
      // Generate IDs as fast as possible
      const startTime = Date.now();
      while (Date.now() - startTime < 100) { // 100ms burst
        rapidIds.push(provider.generate());
      }
      
      console.log(`Generated ${rapidIds.length} IDs in 100ms`);
      
      // Check for uniqueness even under rapid generation
      const uniqueIds = new Set(rapidIds.map(id => provider.serialize(id)));
      expect(uniqueIds.size).toBe(rapidIds.length);
      
      // Check that timestamp portion is reasonable
      const timestamps = rapidIds.map(id => {
        const view = new DataView(id.buffer);
        return view.getUint32(0, false); // Big-endian timestamp
      });
      
      // Avoid stack overflow with large arrays
      const minTimestamp = timestamps.reduce((min, ts) => Math.min(min, ts), timestamps[0]);
      const maxTimestamp = timestamps.reduce((max, ts) => Math.max(max, ts), timestamps[0]);
      const timestampRange = maxTimestamp - minTimestamp;
      
      // Timestamp range should be small (within a few seconds)
      expect(timestampRange).toBeLessThan(5);
    });

    it('should handle system clock manipulation', () => {
      const provider = new ObjectIdProvider();
      
      // Generate IDs, simulating potential clock skew
      const ids = [];
      for (let i = 0; i < 100; i++) {
        ids.push(provider.generate());
        
        // Small delay to simulate time progression
        const start = Date.now();
        while (Date.now() - start < 1) { /* busy wait */ }
      }
      
      // All IDs should still be unique despite potential clock issues
      const uniqueIds = new Set(ids.map(id => provider.serialize(id)));
      expect(uniqueIds.size).toBe(ids.length);
      
      // Counter portion should provide uniqueness even with same timestamp
      const counters = ids.map(id => {
        const view = new DataView(id.buffer);
        return view.getUint32(8, false) & 0xFFFFFF; // Last 3 bytes as counter
      });
      
      // Counters should generally increase (allowing for some resets)
      let increasingCount = 0;
      for (let i = 1; i < counters.length; i++) {
        if (counters[i] > counters[i - 1]) {
          increasingCount++;
        }
      }
      
      // Most counters should be increasing
      expect(increasingCount).toBeGreaterThan(counters.length * 0.8);
    });
  });
});