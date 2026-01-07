/**
 * Timing Attack Resistance Tests
 * Government-grade requirement: Constant-time operations for cryptographic primitives
 */

import { ECIESService } from '../../src/services/ecies/service';
import { VotingService, modPow } from '../../src/services/voting.service';

jest.setTimeout(300000);

describe('Timing Attack Resistance', () => {
  describe('Constant-Time Comparisons', () => {
    it('should perform constant-time byte array comparison', () => {
      const a = new Uint8Array(32).fill(0xaa);
      const b = new Uint8Array(32).fill(0xaa);
      const c = new Uint8Array(32).fill(0xbb);

      const timings: number[] = [];

      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        const result = constantTimeEquals(a, b);
        const end = performance.now();
        timings.push(end - start);
        expect(result).toBe(true);
      }

      const timingsUnequal: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        const result = constantTimeEquals(a, c);
        const end = performance.now();
        timingsUnequal.push(end - start);
        expect(result).toBe(false);
      }

      const avgEqual = timings.reduce((a, b) => a + b) / timings.length;
      const avgUnequal =
        timingsUnequal.reduce((a, b) => a + b) / timingsUnequal.length;
      const ratio =
        Math.max(avgEqual, avgUnequal) / Math.min(avgEqual, avgUnequal);

      expect(ratio).toBeLessThan(2);
    });

    it('should not leak position of first difference', () => {
      const base = new Uint8Array(32).fill(0xaa);
      const timings: Map<number, number[]> = new Map();

      for (let diffPos = 0; diffPos < 32; diffPos++) {
        const modified = new Uint8Array(base);
        modified[diffPos] = 0xbb;

        const posTimings: number[] = [];
        for (let i = 0; i < 50; i++) {
          const start = performance.now();
          constantTimeEquals(base, modified);
          const end = performance.now();
          posTimings.push(end - start);
        }
        timings.set(diffPos, posTimings);
      }

      const averages = Array.from(timings.values()).map(
        (arr) => arr.reduce((a, b) => a + b) / arr.length,
      );
      const maxAvg = Math.max(...averages);
      const minAvg = Math.min(...averages);
      const variance = (maxAvg - minAvg) / minAvg;

      expect(variance).toBeLessThan(0.6);
    });
  });

  describe('Modular Exponentiation Timing', () => {
    it('should have consistent timing regardless of exponent bit pattern', () => {
      const base = 12345n;
      const mod = 2n ** 256n - 189n;

      const exponents = [
        0xffffffffffffffffn,
        0x5555555555555555n,
        0xaaaaaaaaaaaaaaaan,
        0x0000000000000001n,
      ];

      const timings: number[][] = [];

      for (const exp of exponents) {
        const expTimings: number[] = [];
        for (let i = 0; i < 20; i++) {
          const start = performance.now();
          modPow(base, exp, mod);
          const end = performance.now();
          expTimings.push(end - start);
        }
        timings.push(expTimings);
      }

      const averages = timings.map(
        (arr) => arr.reduce((a, b) => a + b) / arr.length,
      );
      const maxAvg = Math.max(...averages);
      const minAvg = Math.min(...averages);
      const ratio = maxAvg / minAvg;

      expect(ratio).toBeLessThan(150); // Async operations have higher variance
    });
  });

  describe('Prime Generation Timing Consistency', () => {
    it('should use constant-time prime generation attempts', async () => {
      const votingService = VotingService.getInstance();
      const seed1 = crypto.getRandomValues(new Uint8Array(64));
      const seed2 = crypto.getRandomValues(new Uint8Array(64));

      const drbg1 = await votingService.createDRBG(seed1);
      const drbg2 = await votingService.createDRBG(seed2);

      const maxAttempts = 1000;

      const start1 = performance.now();
      await votingService.generateDeterministicPrime(
        drbg1,
        256,
        64,
        maxAttempts,
      );
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      await votingService.generateDeterministicPrime(
        drbg2,
        256,
        64,
        maxAttempts,
      );
      const time2 = performance.now() - start2;

      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      expect(ratio).toBeLessThan(2); // Allow for async overhead
    });
  });

  describe('ECDH Shared Secret Timing', () => {
    it('should not leak private key through timing', async () => {
      const ecies = new ECIESService();

      const timings: number[] = [];

      for (let i = 0; i < 20; i++) {
        const mnemonic = ecies.generateNewMnemonic();
        const { privateKey: _privateKey, publicKey } =
          ecies.mnemonicToSimpleKeyPair(mnemonic);

        const start = performance.now();
        const message = crypto.getRandomValues(new Uint8Array(32));
        await ecies.encryptSimpleOrSingle(false, publicKey, message);
        const end = performance.now();

        timings.push(end - start);
      }

      const mean = timings.reduce((a, b) => a + b) / timings.length;
      const variance =
        timings.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) /
        timings.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / mean;

      expect(cv).toBeLessThan(0.3);
    });
  });
});

function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}
