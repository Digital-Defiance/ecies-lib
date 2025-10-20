import { HandleableError } from '../../src/errors/handleable';
import { HandleableErrorOptions } from '../../src/interfaces/handleable-error-options';
import { IHandleable } from '../../src/interfaces/handleable';

class CustomHandleable implements IHandleable {
  constructor(public value: string) {}
  toJSON() {
    return { custom: this.value };
  }
}

describe('HandleableError', () => {
  it('should create error with source error', () => {
    const source = new Error('Test error');
    const error = new HandleableError(source);
    
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('HandleableError');
    expect(error.statusCode).toBe(500);
    expect(error.handled).toBe(false);
    expect(error.cause).toBe(source);
    expect(error.sourceData).toBeUndefined();
  });

  it('should create error with all options', () => {
    const source = new Error('Test error');
    const options: HandleableErrorOptions = {
      statusCode: 400,
      handled: true,
      sourceData: { key: 'value' }
    };
    
    const error = new HandleableError(source, options);
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.handled).toBe(true);
    expect(error.cause).toBe(source);
    expect(error.sourceData).toEqual({ key: 'value' });
  });

  it('should allow setting handled property', () => {
    const error = new HandleableError(new Error('Test'));
    expect(error.handled).toBe(false);
    
    error.handled = true;
    expect(error.handled).toBe(true);
  });

  it('should serialize to JSON correctly', () => {
    const cause = new Error('Cause error');
    const error = new HandleableError(cause, {
      statusCode: 400,
      handled: true,
      sourceData: { key: 'value' }
    });
    
    const json = error.toJSON();
    
    expect(json.name).toBe('HandleableError');
    expect(json.message).toBe('Cause error');
    expect(json.statusCode).toBe(400);
    expect(json.handled).toBe(true);
    expect(json.sourceData).toEqual({ key: 'value' });
    expect(json.cause).toBe('Cause error');
    expect(json.stack).toBeDefined();
  });

  it('should serialize nested HandleableError recursively', () => {
    const innerError = new HandleableError(new Error('Inner'), { statusCode: 404 });
    const outerError = new HandleableError(innerError, { statusCode: 500 });
    
    const json = outerError.toJSON();
    
    expect(json.cause).toEqual(innerError.toJSON());
    expect((json.cause as any).statusCode).toBe(404);
    expect((json.cause as any).message).toBe('Inner');
  });

  it('should recursively serialize nested objects in sourceData', () => {
    const error = new HandleableError(new Error('Test'), {
      sourceData: {
        user: { id: 123, name: 'Test' },
        items: [{ id: 1 }, { id: 2 }]
      }
    });
    
    const json = error.toJSON();
    
    expect(json.sourceData).toEqual({
      user: { id: 123, name: 'Test' },
      items: [{ id: 1 }, { id: 2 }]
    });
  });

  it('should call toJSON on custom objects in sourceData', () => {
    const customData = new CustomHandleable('test-value');
    const error = new HandleableError(new Error('Test'), {
      sourceData: customData
    });
    
    const json = error.toJSON();
    
    expect(json.sourceData).toEqual({ custom: 'test-value' });
  });

  it('should recursively serialize arrays with custom objects', () => {
    const error = new HandleableError(new Error('Test'), {
      sourceData: {
        items: [new CustomHandleable('a'), new CustomHandleable('b')]
      }
    });
    
    const json = error.toJSON();
    
    expect(json.sourceData).toEqual({
      items: [{ custom: 'a' }, { custom: 'b' }]
    });
  });

  it('should handle deeply nested structures', () => {
    const error = new HandleableError(new Error('Test'), {
      sourceData: {
        level1: {
          level2: {
            level3: new CustomHandleable('deep')
          }
        }
      }
    });
    
    const json = error.toJSON();
    
    expect(json.sourceData).toEqual({
      level1: {
        level2: {
          level3: { custom: 'deep' }
        }
      }
    });
  });

  it('should serialize regular Error as message', () => {
    const regularError = new Error('Regular error');
    const error = new HandleableError(regularError);
    
    const json = error.toJSON();
    
    expect(json.cause).toBe('Regular error');
  });

  it('should not include sourceData in JSON when undefined', () => {
    const error = new HandleableError(new Error('Test'));
    const json = error.toJSON();
    
    expect(json).not.toHaveProperty('sourceData');
  });

  it('should maintain proper prototype chain', () => {
    const error = new HandleableError(new Error('Test'));
    expect(error instanceof HandleableError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should implement IHandleable interface', () => {
    const error = new HandleableError(new Error('Test'));
    expect(typeof error.toJSON).toBe('function');
    expect(error.toJSON()).toHaveProperty('name');
    expect(error.toJSON()).toHaveProperty('message');
  });
});