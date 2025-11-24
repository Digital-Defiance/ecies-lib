import type { IConstants } from './constants';

/**
 * An invariant is a relationship between configuration values that must always hold true.
 * Unlike simple property validation, invariants check consistency across multiple related values.
 *
 * Example: MEMBER_ID_LENGTH must equal idProvider.byteLength
 *
 * Invariants help catch configuration errors that simple property validation would miss,
 * such as the 12 vs 32 byte discrepancy we encountered.
 */
export interface IInvariant {
  /**
   * Unique name for this invariant (used in error messages)
   */
  readonly name: string;

  /**
   * Human-readable description of what this invariant validates
   */
  readonly description: string;

  /**
   * Check if the invariant holds for the given configuration
   * @returns true if invariant is satisfied, false otherwise
   */
  check(config: IConstants): boolean;

  /**
   * Generate a detailed error message explaining why the invariant failed
   * @param config The configuration that failed validation
   * @returns Error message with actual vs expected values
   */
  errorMessage(config: IConstants): string;
}

/**
 * Base class for invariants with common utilities
 */
export abstract class BaseInvariant implements IInvariant {
  constructor(
    public readonly name: string,
    public readonly description: string,
  ) {}

  abstract check(config: IConstants): boolean;
  abstract errorMessage(config: IConstants): string;

  /**
   * Helper to format error messages consistently
   */
  protected formatError(
    property1: string,
    value1: unknown,
    property2: string,
    value2: unknown,
  ): string {
    return `Invariant '${this.name}' failed: ${property1} (${value1}) must equal ${property2} (${value2})`;
  }
}
