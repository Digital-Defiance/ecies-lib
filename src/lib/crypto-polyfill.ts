/**
 * Ensure crypto.getRandomValues always returns a pure Uint8Array
 * This prevents issues with Buffer polyfills interfering with @noble libraries
 *
 * CRITICAL: This must run before ANY @noble/curves code is imported
 */

// Declare process for TypeScript (may not exist in browser)
declare const process: { versions?: { node?: string } } | undefined;

// Track if polyfill was applied
let polyfillApplied = false;

// Only apply polyfill in non-Node.js environments (browsers, etc.)
if (typeof process === 'undefined' || !process.versions?.node) {
  // Execute immediately as an IIFE
  (function patchCryptoGetRandomValues() {
    // Save reference to the ORIGINAL Uint8Array constructor
    const OriginalUint8Array = Uint8Array;

    // Get all crypto references
    const cryptoTargets: Array<{ crypto: Crypto; name: string }> = [];
    if (typeof window !== 'undefined' && window.crypto) {
      cryptoTargets.push({ crypto: window.crypto, name: 'window.crypto' });
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
      cryptoTargets.push({
        crypto: (globalThis as any).crypto,
        name: 'globalThis.crypto',
      });
    }

    // Patch all crypto references
    cryptoTargets.forEach(({ crypto, name }) => {
      if (!crypto.getRandomValues) return;

      const original = crypto.getRandomValues.bind(crypto);

      crypto.getRandomValues = function <T extends ArrayBufferView | null>(
        array: T,
      ): T {
        if (!array) return array;

        // ALWAYS create a pure Uint8Array if input is Uint8Array
        if (array instanceof OriginalUint8Array) {
          const constructor = array.constructor;
          const isPure = constructor === OriginalUint8Array;

          if (!isPure) {
            console.warn(
              `[crypto-polyfill] Detected non-pure Uint8Array (${constructor.name}), creating pure replacement`,
            );
          }

          // Always use the ORIGINAL Uint8Array for the operation
          const pureArray = new OriginalUint8Array(array.length);
          original(pureArray);

          // Copy back to input array
          for (let i = 0; i < array.length; i++) {
            array[i] = pureArray[i];
          }

          return array as T;
        }

        // For other types, call original directly
        return original(array as ArrayBufferView) as T;
      };

      console.log(
        `[crypto-polyfill] Patched ${name}.getRandomValues - all Uint8Array instances will be pure`,
      );
    });

    polyfillApplied = true;
  })();
}

export const cryptoPolyfillApplied = polyfillApplied;
