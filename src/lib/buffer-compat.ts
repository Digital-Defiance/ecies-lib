/**
 * Browser-compatible Buffer implementation
 * Uses native Node.js Buffer when available, otherwise provides a Uint8Array-based implementation
 * This ensures @noble/curves receives pure Uint8Array instances in browsers
 */

export type BufferEncoding = 'hex' | 'base64' | 'utf8' | 'utf-8';

/**
 * Buffer interface that extends Uint8Array with Buffer-specific methods
 */
export interface BufferLike extends Uint8Array {
  toString(encoding?: BufferEncoding): string;
}

// Extend Uint8Array interface to include toString with encoding
declare global {
  interface Uint8Array {
    toString(encoding?: BufferEncoding): string;
  }
}

/**
 * Convert string to Uint8Array based on encoding
 */
function stringToBytes(str: string, encoding?: BufferEncoding): Uint8Array {
  if (encoding === 'hex') {
    const bytes = new Uint8Array(str.length / 2);
    for (let i = 0; i < str.length; i += 2) {
      bytes[i / 2] = parseInt(str.slice(i, i + 2), 16);
    }
    return bytes;
  } else if (encoding === 'base64') {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Default UTF-8
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to string based on encoding
 */
function bytesToString(bytes: Uint8Array, encoding?: BufferEncoding): string {
  if (encoding === 'hex') {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else if (encoding === 'base64') {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  // Default UTF-8
  return new TextDecoder().decode(bytes);
}

// Check if we're in Node.js (has 'process' object with versions)
// Use a function to prevent Vite from evaluating this at build time
const isNodeEnvironment = ((): boolean => {
  try {
    // Access via globalThis to prevent static analysis during bundling
    const g = globalThis as {
      process?: { versions?: { node?: string } };
      [key: string]: unknown;
    };
    return (
      typeof g.process !== 'undefined' && g.process?.versions?.node != null
    );
  } catch {
    return false;
  }
})();

// Type for the Buffer static interface
interface BufferConstructor {
  from(
    data: Uint8Array | string | number[] | ArrayBufferView,
    encoding?: BufferEncoding,
  ): Uint8Array;
  isBuffer(obj: unknown): obj is Uint8Array;
  alloc(size: number, fill?: number): Uint8Array;
  compare(a: Uint8Array, b: Uint8Array): number;
}

// Browser implementation: provide Buffer-like API that returns pure Uint8Array
const BrowserBuffer: BufferConstructor = {
  /**
   * Create a new Uint8Array from various input types
   */
  from(
    data: Uint8Array | string | number[] | ArrayBufferView,
    encoding?: BufferEncoding,
  ): Uint8Array {
    if (data instanceof Uint8Array) {
      return new Uint8Array(data);
    }

    if (typeof data === 'string') {
      return stringToBytes(data, encoding);
    }

    if (Array.isArray(data)) {
      return new Uint8Array(data);
    }

    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }

    throw new Error('Unsupported data type for Buffer.from');
  },

  /**
   * Check if an object is a Buffer or Uint8Array
   */
  isBuffer(obj: unknown): obj is Uint8Array {
    return obj instanceof Uint8Array;
  },

  /**
   * Allocate a new Uint8Array of specified size
   */
  alloc(size: number, fill?: number): Uint8Array {
    const buf = new Uint8Array(size);
    if (fill !== undefined) {
      buf.fill(fill);
    }
    return buf;
  },

  /**
   * Compare two Uint8Arrays
   */
  compare(a: Uint8Array, b: Uint8Array): number {
    if (a === b) return 0;

    const minLength = Math.min(a.length, b.length);
    for (let i = 0; i < minLength; i++) {
      if (a[i] !== b[i]) {
        return a[i] < b[i] ? -1 : 1;
      }
    }

    return a.length < b.length ? -1 : a.length > b.length ? 1 : 0;
  },
};

// DO NOT modify Uint8Array.prototype in browsers!
// Modifying the prototype breaks strict type checks in libraries like @noble/curves
// which check constructor.name === 'Uint8Array'

// Export the appropriate Buffer implementation
// In Node.js, use native Buffer; in browsers, use BrowserBuffer (pure Uint8Array)
export const Buffer: BufferConstructor = isNodeEnvironment
  ? (globalThis as { Buffer: BufferConstructor }).Buffer
  : BrowserBuffer;

// Export utility functions for direct use when you need encoding conversions
export { stringToBytes, bytesToString };
