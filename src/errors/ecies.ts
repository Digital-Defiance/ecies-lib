import {
  buildReasonMap,
  HandleableErrorOptions,
  TypedHandleableError,
} from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../enumerations/ecies-error-type';
import {
  EciesStringKeyValue,
  EciesComponentId,
} from '../enumerations/ecies-string-key';

/**
 * Context information captured when an error occurs.
 * This provides debugging information beyond just the error message.
 */
export interface IErrorContext<TDate extends Date | number = Date> {
  /**
   * The operation that was being performed when the error occurred
   * e.g., 'encryptChunk', 'decryptStream', 'validateRecipientId'
   */
  operation: string;

  /**
   * Stack trace from when the error was created
   */
  stackTrace: string;

  /**
   * Relevant configuration values (sanitized to remove sensitive data)
   */
  config?: Partial<{
    idProviderName: string;
    idProviderByteLength: number;
    memberIdLength: number;
    recipientIdSize: number;
    curveName: string;
  }>;

  /**
   * Timestamp when error occurred
   */
  timestamp: TDate;

  /**
   * Optional serializer for the timestamp type.
   * Required when TDate is a non-Unix number (e.g. BrightDate decimal days).
   * Defaults to Date.toISOString() for Date, or new Date(n).toISOString() for number.
   * Example for BrightDate: `(d) => BrightDate.fromValue(d).toISO()`
   */
  timestampSerializer?: (date: TDate) => string;

  /**
   * Additional metadata specific to the error
   */
  metadata?: Record<string, unknown>;
}

export class ECIESError<
  TDate extends Date | number = Date,
> extends TypedHandleableError<typeof ECIESErrorTypeEnum, EciesStringKeyValue> {
  /**
   * Rich context information for debugging
   */
  public readonly context?: IErrorContext<TDate>;

  constructor(
    type: ECIESErrorTypeEnum,
    options?: HandleableErrorOptions,
    language?: string,
    otherVars?: Record<string, string | number>,
    context?: Partial<IErrorContext<TDate>>,
  ) {
    let source: Error;
    if (
      options &&
      typeof options === 'object' &&
      'cause' in options &&
      options.cause instanceof Error
    ) {
      source = options.cause;
    } else {
      source = new Error();
    }
    super(
      EciesComponentId,
      type,
      buildReasonMap<typeof ECIESErrorTypeEnum, EciesStringKeyValue>(
        ECIESErrorTypeEnum,
        ['Error', 'ECIESError'],
      ),
      source,
      options,
      language,
      otherVars,
    );
    this.name = 'ECIESError';

    // Capture context if provided
    if (context) {
      this.context = {
        operation: context.operation ?? 'unknown',
        stackTrace:
          context.stackTrace ?? new Error().stack ?? 'stack unavailable',
        config: context.config,
        timestamp: context.timestamp ?? (new Date() as unknown as TDate),
        timestampSerializer: context.timestampSerializer,
        metadata: context.metadata,
      };
    }
  }

  /**
   * Serialize error to JSON including context
   */
  override toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      context: this.context,
      cause:
        this.cause instanceof Error
          ? {
              name: this.cause.name,
              message: this.cause.message,
            }
          : undefined,
    };
  }

  /**
   * Get a detailed error report including all context
   */
  getDetailedReport(): string {
    const parts = [`${this.name}: ${this.message}`, `Type: ${this.type}`];

    if (this.context) {
      parts.push(`Operation: ${this.context.operation}`);
      const serializeTimestamp =
        this.context.timestampSerializer ??
        ((d: TDate) =>
          d instanceof Date
            ? d.toISOString()
            : new Date(d as number).toISOString());
      parts.push(`Timestamp: ${serializeTimestamp(this.context.timestamp)}`);

      if (this.context.config) {
        parts.push('Configuration:');
        Object.entries(this.context.config).forEach(([key, value]) => {
          parts.push(`  ${key}: ${value}`);
        });
      }

      if (this.context.metadata) {
        parts.push('Metadata:');
        Object.entries(this.context.metadata).forEach(([key, value]) => {
          parts.push(`  ${key}: ${JSON.stringify(value)}`);
        });
      }

      if (this.context.stackTrace) {
        parts.push('\nStack Trace:');
        parts.push(this.context.stackTrace);
      }
    }

    return parts.join('\n');
  }
}
