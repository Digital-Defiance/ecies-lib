import { IStreamProgress } from '../../src/interfaces/stream-progress';

/**
 * Utilities for testing streaming encryption
 */
export class StreamTestUtils {
  /**
   * Generate random binary data
   */
  static generateRandomData(size: number): Uint8Array {
    const result = new Uint8Array(size);
    const chunkSize = 65536; // crypto.getRandomValues limit
    for (let offset = 0; offset < size; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, size);
      crypto.getRandomValues(result.subarray(offset, end));
    }
    return result;
  }

  /**
   * Generate text data of specified size
   */
  static generateTextData(size: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \n';
    let result = '';
    for (let i = 0; i < size; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create async iterable from data
   */
  static async *createAsyncIterable(
    data: Uint8Array,
    chunkSize: number,
  ): AsyncIterable<Uint8Array> {
    for (let offset = 0; offset < data.length; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, data.length);
      yield data.slice(offset, end);
    }
  }

  /**
   * Collect all chunks from async iterable
   */
  static async collectChunks(
    iterable: AsyncIterable<Uint8Array>,
  ): Promise<Uint8Array[]> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of iterable) {
      chunks.push(chunk);
    }
    return chunks;
  }

  /**
   * Concatenate chunks into single array
   */
  static concatenateChunks(chunks: Uint8Array[]): Uint8Array {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  /**
   * Create mock progress callback
   */
  static createProgressMock(): jest.Mock<void, [IStreamProgress]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return jest.fn();
  }

  /**
   * Measure memory usage of async function
   */
  static async measureMemory(fn: () => Promise<void>): Promise<number> {
    if (global.gc) {
      global.gc();
    }
    const before = process.memoryUsage().heapUsed;
    await fn();
    if (global.gc) {
      global.gc();
    }
    const after = process.memoryUsage().heapUsed;
    return after - before;
  }

  /**
   * Force garbage collection (requires --expose-gc flag)
   */
  static forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Calculate throughput in bytes per second
   */
  static calculateThroughput(bytes: number, milliseconds: number): number {
    return (bytes / milliseconds) * 1000;
  }

  /**
   * Measure latency of async function
   */
  static async measureLatency(fn: () => Promise<void>): Promise<number> {
    const start = Date.now();
    await fn();
    return Date.now() - start;
  }

  /**
   * Compare two Uint8Arrays for equality
   */
  static arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Collect stream into single Uint8Array
   */
  static async collectStream(
    iterable: AsyncIterable<{ data: Uint8Array } | Uint8Array>,
  ): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    for await (const item of iterable) {
      // Handle both { data: Uint8Array } and Uint8Array
      const chunk = 'data' in item ? item.data : item;
      chunks.push(chunk);
    }
    return this.concatenateChunks(chunks);
  }

  /**
   * Collect encrypted chunks (keeping them separate for decryption)
   */
  static async collectEncryptedChunks(
    iterable: AsyncIterable<{ data: Uint8Array }>,
  ): Promise<Uint8Array[]> {
    const chunks: Uint8Array[] = [];
    for await (const item of iterable) {
      chunks.push(item.data);
    }
    return chunks;
  }

  /**
   * Create async iterable from array of chunks
   */
  static async *createAsyncIterableFromChunks(
    chunks: Uint8Array[],
  ): AsyncIterable<Uint8Array> {
    for (const chunk of chunks) {
      yield chunk;
    }
  }
}
