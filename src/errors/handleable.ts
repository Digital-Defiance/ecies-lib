import { HandleableErrorOptions } from '../interfaces/handleable-error-options';
import { IHandleable } from '../interfaces/handleable';

export class HandleableError extends Error implements IHandleable {
  public readonly cause?: Error;
  public readonly statusCode: number;
  public readonly sourceData?: unknown;
  private _handled: boolean;

  constructor(source: Error, options?: HandleableErrorOptions) {
    super(source.message);
    this.name = this.constructor.name;
    this.cause = options?.cause ?? source;
    this.statusCode = options?.statusCode ?? 500;
    this._handled = options?.handled ?? false;
    this.sourceData = options?.sourceData;

    // Capture stack trace - prioritize source stack, then capture new one
    if (source.stack) {
      this.stack = source.stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack;
    }
  }

  public get handled(): boolean {
    return this._handled;
  }

  public set handled(value: boolean) {
    this._handled = value;
  }

  private serializeValue(value: unknown): unknown {
    if (value && typeof value === 'object' && 'toJSON' in value && typeof value.toJSON === 'function') {
      return value.toJSON();
    }
    if (value instanceof Error) {
      return value.message;
    }
    if (Array.isArray(value)) {
      return value.map(item => this.serializeValue(item));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, this.serializeValue(v)])
      );
    }
    return value;
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      handled: this.handled,
      stack: this.stack,
      cause: this.serializeValue(this.cause),
      ...(this.sourceData ? { sourceData: this.serializeValue(this.sourceData) } : {}),
    };
  }
}
