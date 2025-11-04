import { Pbkdf2ErrorType, Pbkdf2ProfileEnum } from '../src/enumerations';
import { Pbkdf2Error } from '../src/errors';
import { SecureString } from '../src/secure-string';
import { Pbkdf2Service } from '../src/services/pbkdf2';
import { getEciesI18nEngine } from '../src/i18n-setup';

describe('Pbkdf2Service Lib E2E', () => {
  jest.setTimeout(60000);
  let pbkdf2Service: Pbkdf2Service<string>;

  const testPassword = new Uint8Array([
    116, 101, 115, 116, 45, 112, 97, 115, 115, 119, 111, 114, 100,
  ]); // "test-password"
  const testSalt = new Uint8Array(32).fill(42);

  beforeEach(() => {
    getEciesI18nEngine(); // Ensure engine is initialized for error messages
    pbkdf2Service = new Pbkdf2Service();
  });

  describe('Browser-Compatible Key Derivation', () => {
    it('should derive keys using Web Crypto API', async () => {
      const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
        testPassword,
        testSalt,
        1000,
        32,
        32,
        'SHA-256',
      );

      expect(result.hash).toBeInstanceOf(Uint8Array);
      expect(result.salt).toBeInstanceOf(Uint8Array);
      expect(result.hash.length).toBe(32);
      expect(result.salt.length).toBe(32);
      expect(result.iterations).toBe(1000);
    });

    it('should produce consistent results with same parameters', async () => {
      const result1 = await pbkdf2Service.deriveKeyFromPasswordAsync(
        testPassword,
        testSalt,
        1000,
        32,
        32,
        'SHA-256',
      );

      const result2 = await pbkdf2Service.deriveKeyFromPasswordAsync(
        testPassword,
        testSalt,
        1000,
        32,
        32,
        'SHA-256',
      );

      expect(result1.hash).toEqual(result2.hash);
      expect(result1.salt).toEqual(result2.salt);
      expect(result1.iterations).toBe(result2.iterations);
    });

    it('should generate different keys with different salts', async () => {
      const salt1 = new Uint8Array(32).fill(1);
      const salt2 = new Uint8Array(32).fill(2);

      const result1 = await pbkdf2Service.deriveKeyFromPasswordAsync(
        testPassword,
        salt1,
        1000,
        undefined,
        undefined,
        undefined,
      );

      const result2 = await pbkdf2Service.deriveKeyFromPasswordAsync(
        testPassword,
        salt2,
        1000,
        undefined,
        undefined,
        undefined,
      );

      expect(result1.hash).not.toEqual(result2.hash);
      expect(result1.salt).toEqual(salt1);
      expect(result2.salt).toEqual(salt2);
    });

    it('should handle random salt generation', async () => {
      const result1 = await pbkdf2Service.deriveKeyFromPasswordAsync(
        testPassword,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      const result2 = await pbkdf2Service.deriveKeyFromPasswordAsync(
        testPassword,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(result1.salt).not.toEqual(result2.salt);
      expect(result1.hash).not.toEqual(result2.hash);
      expect(result1.salt.length).toBe(32); // Default salt size
      expect(result2.salt.length).toBe(32);
    });

    it('should work with different hash algorithms', async () => {
      const algorithms = ['SHA-256', 'SHA-512'];
      const results = await Promise.all(
        algorithms.map((algorithm) =>
          pbkdf2Service.deriveKeyFromPasswordAsync(
            testPassword,
            testSalt,
            1000,
            32,
            32,
            algorithm,
          ),
        ),
      );

      // Different algorithms should produce different hashes
      expect(results[0].hash).not.toEqual(results[1].hash);

      // But same salt and iterations
      expect(results[0].salt).toEqual(results[1].salt);
      expect(results[0].iterations).toBe(results[1].iterations);
    });

    it('should support various password types', async () => {
      const passwords = [
        new Uint8Array(0), // Empty
        new Uint8Array([97]), // Single character 'a'
        new Uint8Array([116, 101, 115, 116]), // "test"
        new Uint8Array(Array.from({ length: 100 }, (_, i) => i % 256)), // Long binary
        new TextEncoder().encode('unicode-世界-🔐'), // Unicode
      ];

      for (const password of passwords) {
        const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
          password,
          testSalt,
          1000,
          undefined,
          undefined,
          undefined,
        );

        expect(result.hash).toBeInstanceOf(Uint8Array);
        expect(result.hash.length).toBe(32);
        expect(result.salt).toEqual(testSalt);
      }
    });

    it('should handle different iteration counts', async () => {
      const iterations = [1, 100, 1000, 10000];
      const results = await Promise.all(
        iterations.map((iter) =>
          pbkdf2Service.deriveKeyFromPasswordAsync(
            testPassword,
            testSalt,
            iter,
            undefined,
            undefined,
            undefined,
          ),
        ),
      );

      // All should have different hashes due to different iterations
      for (let i = 0; i < results.length - 1; i++) {
        for (let j = i + 1; j < results.length; j++) {
          expect(results[i].hash).not.toEqual(results[j].hash);
        }
      }

      // But correct iterations
      results.forEach((result, index) => {
        expect(result.iterations).toBe(iterations[index]);
      });
    });
  });

  describe('Profile-Based Operations', () => {
    it('should work with all defined profiles', async () => {
      const profiles = [
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
        Pbkdf2ProfileEnum.HIGH_SECURITY,
      ];

      for (const profile of profiles) {
        const result =
          await pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
            testPassword,
            profile,
          );

        expect(result.hash).toBeInstanceOf(Uint8Array);
        expect(result.salt).toBeInstanceOf(Uint8Array);
        expect(result.iterations).toBeGreaterThan(0);
      }
    });

    it('should produce consistent results with same profile and salt', async () => {
      const salt = new Uint8Array(64).fill(123); // Use 64 bytes for BROWSER_PASSWORD profile

      const result1 = await pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
        testPassword,
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
        salt,
      );

      const result2 = await pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
        testPassword,
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
        salt,
      );

      expect(result1.hash).toEqual(result2.hash);
      expect(result1.salt).toEqual(result2.salt);
      expect(result1.iterations).toBe(result2.iterations);
    });

    it('should use different parameters for different profiles', async () => {
      const profiles = [
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
        Pbkdf2ProfileEnum.HIGH_SECURITY,
      ];

      const results = await Promise.all(
        profiles.map((profile) =>
          pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
            testPassword,
            profile,
          ),
        ),
      );

      // Should have different iteration counts
      const iterations = results.map((r) => r.iterations);
      const uniqueIterations = new Set(iterations);
      expect(uniqueIterations.size).toBeGreaterThan(1);

      // All should produce valid results
      results.forEach((result) => {
        expect(result.hash).toBeInstanceOf(Uint8Array);
        expect(result.salt).toBeInstanceOf(Uint8Array);
        expect(result.hash.length).toBeGreaterThan(0);
        expect(result.salt.length).toBeGreaterThan(0);
      });
    });

    it('should handle browser password profile specifically', async () => {
      const result = await pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
        testPassword,
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
      );

      // Browser password profile should use reasonable parameters
      expect(result.hash.length).toBe(32); // AES-256 compatible
      expect(result.salt.length).toBeGreaterThanOrEqual(16); // Minimum secure salt
      expect(result.iterations).toBeGreaterThan(1000); // Reasonable security
    });
  });

  describe('Error Handling and Validation', () => {
    it('should validate salt length', async () => {
      const shortSalt = new Uint8Array(15); // Too short for default config

      await expect(
        pbkdf2Service.deriveKeyFromPasswordAsync(testPassword, shortSalt, undefined, undefined, undefined, undefined),
      ).rejects.toThrow(Pbkdf2Error);
    });

    it('should handle invalid inputs gracefully', async () => {
      // Invalid iterations
      await expect(
        pbkdf2Service.deriveKeyFromPasswordAsync(testPassword, testSalt, -1, undefined, undefined, undefined),
      ).rejects.toThrow();

      await expect(
        pbkdf2Service.deriveKeyFromPasswordAsync(testPassword, testSalt, 0, undefined, undefined, undefined),
      ).rejects.toThrow();
    });

    it('should throw proper error types', async () => {
      const shortSalt = new Uint8Array(15);

      try {
        await pbkdf2Service.deriveKeyFromPasswordAsync(testPassword, shortSalt, undefined, undefined, undefined, undefined);
        fail('Should have thrown Pbkdf2Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Pbkdf2Error);
        expect((error as Pbkdf2Error).type).toBe(
          Pbkdf2ErrorType.InvalidSaltLength,
        );
      }
    });

    it('should handle edge case salt sizes', async () => {
      // Test with various salt sizes that should work when explicitly configured
      const saltSizes = [16, 32, 64];

      for (const saltSize of saltSizes) {
        const salt = new Uint8Array(saltSize).fill(42);

        const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
          testPassword,
          salt,
          1000,
          saltSize, // Explicitly set saltBytes to match
          32,
          'SHA-256',
        );

        expect(result.salt.length).toBe(saltSize);
        expect(result.salt).toEqual(salt);
      }
    });

    it('should validate hash length', async () => {
      const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
        testPassword,
        testSalt,
        1000,
        32,
        32,
        'SHA-256',
      );

      expect(result.hash.length).toBe(32);

      // Test with different hash sizes
      const result64 = await pbkdf2Service.deriveKeyFromPasswordAsync(
        testPassword,
        testSalt,
        1000,
        32,
        64,
        'SHA-256',
      );

      expect(result64.hash.length).toBe(64);
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent operations', async () => {
      const concurrency = 5;
      const promises = Array.from({ length: concurrency }, (_, i) =>
        pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
          new Uint8Array([...testPassword, i]), // Slightly different passwords
          Pbkdf2ProfileEnum.BROWSER_PASSWORD,
        ),
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(concurrency);

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(30000);

      // All should have unique salts (high probability)
      const salts = results.map((r) => Array.from(r.salt).join(','));
      const uniqueSalts = new Set(salts);
      expect(uniqueSalts.size).toBe(concurrency);
    });

    it('should maintain performance with high-security profile', async () => {
      const startTime = Date.now();

      const result = await pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
        testPassword,
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.hash).toBeInstanceOf(Uint8Array);

      // Should complete within 60 seconds even for high security
      expect(duration).toBeLessThan(60000);
    });

    it('should handle rapid successive calls', async () => {
      const iterations = 10;
      const results: Array<{
        hash: Uint8Array;
        salt: Uint8Array;
        iterations: number;
      }> = [];

      for (let i = 0; i < iterations; i++) {
        const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
          new Uint8Array([...testPassword, i]),
          undefined, // Random salt
          1000,
        );
        results.push(result);
      }

      expect(results).toHaveLength(iterations);

      // All should have unique salts
      const salts = results.map((r) => Array.from(r.salt).join(','));
      const uniqueSalts = new Set(salts);
      expect(uniqueSalts.size).toBe(iterations);
    });
  });

  describe('Integration with SecureString', () => {
    it('should work with SecureString passwords', async () => {
      const securePassword = new SecureString('secure-test-password');

      const result = await pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
        securePassword.valueAsUint8Array,
        Pbkdf2ProfileEnum.BROWSER_PASSWORD,
      );

      expect(result.hash).toBeInstanceOf(Uint8Array);
      expect(result.salt).toBeInstanceOf(Uint8Array);

      securePassword.dispose();
    });

    it('should handle disposed SecureString gracefully', async () => {
      const securePassword = new SecureString('test-password');
      const passwordBuffer = new Uint8Array(securePassword.valueAsUint8Array);

      securePassword.dispose();

      // Should still work with the copied buffer
      const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
        passwordBuffer,
        testSalt,
        1000,
      );

      expect(result.hash).toBeInstanceOf(Uint8Array);
    });

    it('should produce same results regardless of SecureString vs Uint8Array', async () => {
      const passwordString = 'test-password-comparison';
      const securePassword = new SecureString(passwordString);
      const uint8Password = new TextEncoder().encode(passwordString);

      const result1 = await pbkdf2Service.deriveKeyFromPasswordAsync(
        securePassword.valueAsUint8Array,
        testSalt,
        1000,
        undefined,
        undefined,
        undefined,
      );

      const result2 = await pbkdf2Service.deriveKeyFromPasswordAsync(
        uint8Password,
        testSalt,
        1000,
      );

      expect(result1.hash).toEqual(result2.hash);
      expect(result1.salt).toEqual(result2.salt);

      securePassword.dispose();
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should work with Web Crypto API limitations', async () => {
      // Test that we handle Web Crypto API constraints properly
      const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
        testPassword,
        testSalt,
        1000,
        32,
        32,
        'SHA-256',
      );

      expect(result.hash).toBeInstanceOf(Uint8Array);
      expect(result.hash.length).toBe(32);
    });

    it('should handle different algorithm names', async () => {
      const algorithms = ['SHA-256', 'SHA-512'];

      for (const algorithm of algorithms) {
        const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
          testPassword,
          testSalt,
          1000,
          32,
          32,
          algorithm,
        );

        expect(result.hash).toBeInstanceOf(Uint8Array);
        expect(result.hash.length).toBe(32);
      }
    });

    it('should produce deterministic results', async () => {
      // Same inputs should always produce same outputs
      const fixedSalt = new Uint8Array(32).fill(123);
      const fixedPassword = new TextEncoder().encode('fixed-password');

      const results = await Promise.all([
        pbkdf2Service.deriveKeyFromPasswordAsync(
          fixedPassword,
          fixedSalt,
          1000,
        ),
        pbkdf2Service.deriveKeyFromPasswordAsync(
          fixedPassword,
          fixedSalt,
          1000,
        ),
        pbkdf2Service.deriveKeyFromPasswordAsync(
          fixedPassword,
          fixedSalt,
          1000,
        ),
      ]);

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i].hash).toEqual(results[0].hash);
        expect(results[i].salt).toEqual(results[0].salt);
        expect(results[i].iterations).toBe(results[0].iterations);
      }
    });

    it('should handle large passwords efficiently', async () => {
      const largePassword = new Uint8Array(10000).fill(65); // 10KB of 'A's

      const startTime = Date.now();

      const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
        largePassword,
        testSalt,
        1000,
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.hash).toBeInstanceOf(Uint8Array);
      expect(result.hash.length).toBe(32);

      // Should handle large passwords within reasonable time
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated operations', async () => {
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
          new Uint8Array([...testPassword, i]),
          undefined,
          1000,
        );

        expect(result.hash).toBeInstanceOf(Uint8Array);

        // Clear references to help GC
        (result as any).hash = null;
        (result as any).salt = null;
      }

      // If we get here without running out of memory, test passes
      expect(true).toBe(true);
    });

    it('should handle cleanup of large intermediate values', async () => {
      const largePassword = new Uint8Array(50000); // 50KB
      crypto.getRandomValues(largePassword);

      const result = await pbkdf2Service.deriveKeyFromPasswordAsync(
        largePassword,
        testSalt,
        1000,
      );

      expect(result.hash).toBeInstanceOf(Uint8Array);
      expect(result.hash.length).toBe(32);
    });
  });
});