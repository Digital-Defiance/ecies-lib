import { TranslatableGenericError } from '@digitaldefiance/i18n-lib';
import { EciesComponentId } from '../i18n-setup';
import { EciesStringKey } from '../enumerations';

/**
 * Error thrown when operations are attempted on disposed objects.
 * Uses TranslatableGenericError for simple i18n support since there's only one error type.
 * 
 * @example
 * ```typescript
 * throw new DisposedError();
 * throw new DisposedError('fr'); // French
 * ```
 */
export class DisposedError extends TranslatableGenericError<EciesStringKey> {
  /**
   * Creates a new DisposedError instance.
   * 
   * @param language - Optional language code for error message localization.
   * @param instanceKey - Optional i18n engine instance key (defaults to ecies engine).
   */
  constructor(language?: string, instanceKey: string = 'ecies') {
    super(
      EciesComponentId,
      EciesStringKey.Error_DisposedError_ObjectDisposed,
      undefined,
      language,
      undefined,
      instanceKey
    );
    this.name = 'DisposedError';
    
    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DisposedError.prototype);
  }
}
