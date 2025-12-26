/**
 * Ensure crypto.getRandomValues always returns a pure Uint8Array
 * This prevents issues with Buffer polyfills interfering with @noble libraries
 */

// Mark as having side effects for tree-shaking
export const cryptoPolyfillApplied = true;

if (
  typeof window !== 'undefined' &&
  window.crypto &&
  window.crypto.getRandomValues
) {
  const originalGetRandomValues = window.crypto.getRandomValues.bind(
    window.crypto,
  );
  window.crypto.getRandomValues = function (array: any): any {
    const result = originalGetRandomValues(array);
    // If the result is a Uint8Array, ensure it's a pure Uint8Array, not a Buffer
    if (
      result &&
      result.constructor.name !== 'Uint8Array' &&
      result instanceof Uint8Array
    ) {
      return new Uint8Array(
        result.buffer,
        result.byteOffset,
        result.byteLength,
      );
    }
    return result;
  };
  console.log('[crypto-polyfill] Applied crypto.getRandomValues wrapper');
}
