/**
 * Platform-agnostic buffer type (base)
 *
 * This is the base buffer type for browser environments.
 * Node.js environments should use the extended PlatformBuffer from node-ecies-lib
 * which adds Buffer support.
 */
export type PlatformBuffer = Uint8Array;
