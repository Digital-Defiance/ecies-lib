/**
 * Enumeration of disposed object error types.
 * These errors occur when attempting to use an object that has been disposed.
 */
export enum DisposedErrorType {
  /**
   * Generic disposed object error.
   * Occurs when an operation is attempted on a disposed object.
   */
  ObjectDisposed = 'ObjectDisposed',
}
