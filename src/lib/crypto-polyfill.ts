/**
 * Ensure crypto.getRandomValues always returns a pure Uint8Array
 * This prevents issues with Buffer polyfills interfering with @noble libraries
 * 
 * CRITICAL: This must run before ANY @noble/curves code is imported
 */

// Mark as having side effects for tree-shaking
export const cryptoPolyfillApplied = true;

// Get all crypto references
const cryptoTargets: Array<{ crypto: Crypto; name: string }> = [];
if (typeof window !== 'undefined' && window.crypto) {
  cryptoTargets.push({ crypto: window.crypto, name: 'window.crypto' });
}
if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
  cryptoTargets.push({ crypto: (globalThis as any).crypto, name: 'globalThis.crypto' });
}

// Patch all crypto references
cryptoTargets.forEach(({ crypto, name }) => {
  if (!crypto.getRandomValues) return;

  const original = crypto.getRandomValues.bind(crypto);
  
  crypto.getRandomValues = function <T extends ArrayBufferView | null>(array: T): T {
    if (!array) return array;
    
    // Call original
    const result = original(array as ArrayBufferView) as T;
    
    // If the array parameter is a Uint8Array that's not pure, replace it
    if (array instanceof Uint8Array) {
      const constructor = array.constructor;
      if (constructor.name !== 'Uint8Array') {
        console.warn(`[crypto-polyfill] Detected non-pure Uint8Array (${constructor.name}), creating pure copy`);
        // Create a pure Uint8Array and copy data
        const pureArray = new Uint8Array(array.length);
        pureArray.set(array);
        // Copy back to original array
        for (let i = 0; i < array.length; i++) {
          array[i] = pureArray[i];
        }
      }
    }
    
    return result;
  };
  
  console.log(`[crypto-polyfill] Patched ${name}.getRandomValues`);
});
