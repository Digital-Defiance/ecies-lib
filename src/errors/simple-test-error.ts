/**
 * Simple test error class for testing error handling.
 */
export class SimpleTestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SimpleTestError';
  }
}
