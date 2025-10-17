import { HandleableErrorOptions } from '../interfaces/handleable-error-options';

export class HandleableError extends Error {
  public readonly cause?: Error;
  public readonly statusCode: number;
  public readonly sourceData?: unknown;
  private _handled: boolean;

  constructor(message: string, options?: HandleableErrorOptions) {
    super(message, { cause: options?.cause });
    this.cause = options?.cause;
    this.name = this.constructor.name;
    this.statusCode = options?.statusCode ?? 500;
    this._handled = options?.handled ?? false;
    this.sourceData = options?.sourceData;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    if (this.cause instanceof Error && this.cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${this.cause.stack}`;
    }
  }

  public get handled(): boolean {
    return this._handled;
  }

  public set handled(value: boolean) {
    this._handled = value;
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      handled: this.handled,
      stack: this.stack,
      cause:
        this.cause instanceof HandleableError
          ? this.cause.toJSON()
          : this.cause instanceof Error
            ? this.cause.message
            : undefined,
      ...(this.sourceData ? { sourceData: this.sourceData } : {}),
    };
  }
}
