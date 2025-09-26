import { HandleableError } from '../../src/errors/handleable';
import { HandleableErrorOptions } from '../../src/interfaces/handleable-error-options';

describe('HandleableError', () => {
  it('should create error with message only', () => {
    const message = 'Test error';
    const error = new HandleableError(message);
    
    expect(error.message).toBe(message);
    expect(error.name).toBe('HandleableError');
    expect(error.statusCode).toBe(500);
    expect(error.handled).toBe(false);
    expect(error.cause).toBeUndefined();
    expect(error.sourceData).toBeUndefined();
  });

  it('should create error with all options', () => {
    const message = 'Test error';
    const cause = new Error('Cause error');
    const options: HandleableErrorOptions = {
      cause,
      statusCode: 400,
      handled: true,
      sourceData: { key: 'value' }
    };
    
    const error = new HandleableError(message, options);
    
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(400);
    expect(error.handled).toBe(true);
    expect(error.cause).toBe(cause);
    expect(error.sourceData).toEqual({ key: 'value' });
  });

  it('should allow setting handled property', () => {
    const error = new HandleableError('Test');
    expect(error.handled).toBe(false);
    
    error.handled = true;
    expect(error.handled).toBe(true);
  });

  it('should append cause stack to error stack', () => {
    const cause = new Error('Cause error');
    const error = new HandleableError('Test error', { cause });
    
    expect(error.stack).toContain('Test error');
    expect(error.stack).toContain('Caused by:');
    expect(error.stack).toContain('Cause error');
  });

  it('should serialize to JSON correctly', () => {
    const cause = new Error('Cause error');
    const error = new HandleableError('Test error', {
      cause,
      statusCode: 400,
      handled: true,
      sourceData: { key: 'value' }
    });
    
    const json = error.toJSON();
    
    expect(json.name).toBe('HandleableError');
    expect(json.message).toBe('Test error');
    expect(json.statusCode).toBe(400);
    expect(json.handled).toBe(true);
    expect(json.sourceData).toEqual({ key: 'value' });
    expect(json.cause).toBe('Cause error');
    expect(json.stack).toBeDefined();
  });

  it('should serialize nested HandleableError cause correctly', () => {
    const nestedCause = new HandleableError('Nested error', { statusCode: 404 });
    const error = new HandleableError('Main error', { cause: nestedCause });
    
    const json = error.toJSON();
    
    expect(json.cause).toEqual(nestedCause.toJSON());
  });

  it('should not include sourceData in JSON when undefined', () => {
    const error = new HandleableError('Test error');
    const json = error.toJSON();
    
    expect(json).not.toHaveProperty('sourceData');
  });

  it('should maintain proper prototype chain', () => {
    const error = new HandleableError('Test');
    expect(error instanceof HandleableError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});