import { createHash } from 'crypto';
import type { DeepPartial } from '../types/deep-partial';
import type { IConstants } from './constants';

/**
 * Provenance information for a configuration.
 * Tracks who created it, when, and what modifications were made.
 */
export interface IConfigurationProvenance {
  /**
   * The base configuration key this was derived from
   */
  readonly baseConfigKey: string;

  /**
   * Overrides applied to the base configuration
   */
  readonly overrides: DeepPartial<IConstants>;

  /**
   * When this configuration was created
   */
  readonly timestamp: Date;

  /**
   * Source of the configuration
   * - 'default': The built-in Constants
   * - 'runtime': Created via createRuntimeConfiguration
   * - 'custom': User-provided full configuration
   */
  readonly source: 'default' | 'runtime' | 'custom';

  /**
   * SHA-256 checksum of the final configuration
   * Useful for verifying configuration hasn't been tampered with
   */
  readonly checksum: string;

  /**
   * Optional description or notes about this configuration
   */
  readonly description?: string;

  /**
   * Stack trace showing where the configuration was created
   * Useful for debugging unexpected configurations
   */
  readonly creationStack?: string;
}

/**
 * Calculates a checksum for a configuration object.
 * Uses SHA-256 of JSON representation.
 */
export function calculateConfigChecksum(config: IConstants): string {
  // Create a stable JSON representation with BigInt support
  const replacer = (key: string, value: any) =>
    typeof value === 'bigint' ? value.toString() : value;
  const stable = JSON.stringify(config, replacer);
  return createHash('sha256').update(stable).digest('hex');
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
