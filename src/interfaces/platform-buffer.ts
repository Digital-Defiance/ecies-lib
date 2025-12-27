/**
 * Platform-agnostic buffer type
 *
 * This type adapts to the execution environment:
 * - Browser (ecies-lib): Uint8Array
 * - Node.js (node-ecies-lib): Buffer (which extends Uint8Array)
 */
export type PlatformBuffer = Uint8Array | Buffer;
