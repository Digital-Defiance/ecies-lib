import {
  HandleableErrorOptions,
  TypedHandleableError,
  buildReasonMap,
} from '@digitaldefiance/i18n-lib';
import {
  EciesStringKeyValue,
  EciesComponentId,
} from '../enumerations/ecies-string-key';
import { IdProviderErrorType } from '../enumerations/id-provider-error-type';

/**
 * Error class for ID provider operations.
 * Provides i18n support for errors during ID generation, validation, serialization, and deserialization.
 */
export class IdProviderError extends TypedHandleableError<
  typeof IdProviderErrorType,
  EciesStringKeyValue
> {
  /**
   * Reason map cache to avoid rebuilding on every error instantiation.
   */
  private static readonly REASON_MAP = buildReasonMap<
    typeof IdProviderErrorType,
    EciesStringKeyValue
  >(IdProviderErrorType, ['Error', 'IdProviderError']);

  /**
   * Creates a new IdProviderError instance.
   *
   * @param type - The type of ID provider error that occurred.
   * @param options - Optional error handling options.
   * @param language - Optional language code for error message localization.
   * @param templateParams - Optional parameters for error message templates.
   */
  constructor(
    type: IdProviderErrorType,
    options?: HandleableErrorOptions,
    language?: string,
    templateParams?: Record<string, string | number>,
  ) {
    const source =
      options?.cause instanceof Error ? options.cause : new Error();
    super(
      EciesComponentId,
      type,
      IdProviderError.REASON_MAP,
      source,
      options,
      language,
      templateParams,
    );
    this.name = 'IdProviderError';

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, IdProviderError.prototype);
  }
}
