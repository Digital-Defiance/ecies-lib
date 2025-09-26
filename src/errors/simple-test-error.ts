export class SimpleTestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SimpleTestError';
  }
}