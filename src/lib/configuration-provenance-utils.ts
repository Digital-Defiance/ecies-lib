import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { IConstants } from '../interfaces/constants';

/**
 * Calculates a checksum for a configuration object.
 * Uses SHA-256 of JSON representation.
 */
export function calculateConfigChecksum(config: IConstants): string {
  // Create a stable JSON representation with BigInt support
  const replacer = (_key: string, value: any) =>
    typeof value === 'bigint' ? value.toString() : value;
  const stable = JSON.stringify(config, replacer);
  const encoder = new TextEncoder();
  const data = encoder.encode(stable);
  return bytesToHex(sha256(data));
}

/**
 * Captures a stack trace for provenance tracking
 */
export function captureCreationStack(): string {
  const stack = new Error().stack;
  if (!stack) return 'stack unavailable';

  // Remove the first two lines (Error message and this function)
  const lines = stack.split('\n').slice(2);
  return lines.join('\n');
}
