/**
 * Standardized error interface for Digital Defiance libraries
 * Ensures consistent error handling across the ecosystem
 */
export interface LibraryError extends Error {
  /** The library that generated this error */
  readonly library: string;
  /** Unique error code for programmatic handling */
  readonly errorCode: string;
  /** HTTP-style status code */
  readonly statusCode: number;
}

/**
 * Interface for resources that can be disposed
 * Ensures consistent memory management across libraries
 */
export interface DisposableResource {
  /** Dispose of the resource and clean up memory */
  dispose(): void;
  /** Whether the resource has been disposed */
  readonly isDisposed: boolean;
}