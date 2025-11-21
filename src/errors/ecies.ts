import { buildReasonMap, HandleableErrorOptions, TypedHandleableError } from '@digitaldefiance/i18n-lib';
import { ECIESErrorTypeEnum } from '../enumerations/ecies-error-type';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

/**
 * Context information captured when an error occurs.
 * This provides debugging information beyond just the error message.
 */
export interface IErrorContext {
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
  timestamp: Date;

  /**
   * Additional metadata specific to the error
   */
  metadata?: Record<string, unknown>;
}

export class ECIESError extends TypedHandleableError<
  typeof ECIESErrorTypeEnum,
  EciesStringKey
> {
  /**
   * Rich context information for debugging
   */
  public readonly context?: IErrorContext;

  constructor(
    type: ECIESErrorTypeEnum,
    options?: HandleableErrorOptions,
    language?: string,
    otherVars?: Record<string, string | number>,
    context?: Partial<IErrorContext>,
  ) {
    const source = options?.cause instanceof Error ? options.cause : new Error();
    super(
      EciesComponentId,
      type,
      buildReasonMap<typeof ECIESErrorTypeEnum, EciesStringKey>(
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
        stackTrace: context.stackTrace ?? new Error().stack ?? 'stack unavailable',
        config: context.config,
        timestamp: context.timestamp ?? new Date(),
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
      cause: this.cause instanceof Error ? {
        name: this.cause.name,
        message: this.cause.message,
      } : undefined,
    };
  }

  /**
   * Get a detailed error report including all context
   */
  getDetailedReport(): string {
    const parts = [
      `${this.name}: ${this.message}`,
      `Type: ${this.type}`,
    ];

    if (this.context) {
      parts.push(`Operation: ${this.context.operation}`);
      parts.push(`Timestamp: ${this.context.timestamp.toISOString()}`);

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
