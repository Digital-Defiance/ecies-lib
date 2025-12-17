import { SimpleTestError } from '../src/errors/simple-test-error';

describe('Simple Test Error', () => {
  it('should create error with string message', () => {
    const error = new SimpleTestError('Test message');
    expect(error.message).toBe('Test message');
    expect(typeof error.message).toBe('string');
  });
});
