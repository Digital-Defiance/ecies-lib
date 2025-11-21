import { GuidBrandType } from '../enumerations/guid-brand-type';
import { GuidErrorType } from '../enumerations/guid-error-type';
import { RawGuidBuffer } from '../types';
import { buildReasonMap, TypedError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations';
import { EciesComponentId } from '../i18n-setup';

/**
 * Error class for handling GUID-related errors.
 * Provides detailed error information including the error type, optional brand, length, and GUID value.
 * 
 * @example
 * ```typescript
 * throw new GuidError(GuidErrorType.InvalidGuid);
 * throw new GuidError(GuidErrorType.InvalidGuidUnknownLength, undefined, 17);
 * throw new GuidError(GuidErrorType.InvalidGuidWithDetails, undefined, undefined, buffer);
 * ```
 */
export class GuidError extends TypedError<typeof GuidErrorType, EciesStringKey> {
  /**
   * Reason map cache to avoid rebuilding on every error instantiation.
   * This improves performance in scenarios where many errors are created.
   */
  private static readonly REASON_MAP = buildReasonMap<typeof GuidErrorType, EciesStringKey>(
    GuidErrorType,
    ['Error', 'GuidError'],
    new Set([
      GuidErrorType.InvalidGuidWithDetails,
      GuidErrorType.InvalidGuidUnknownBrand,
      GuidErrorType.InvalidGuidUnknownLength
    ])
  );

  /**
   * Creates a new GuidError instance.
   * 
   * @param type - The type of GUID error that occurred.
   * @param brand - Optional GUID brand type (for brand-related errors).
   * @param length - Optional length value (for length-related errors).
   * @param guid - Optional GUID buffer (for errors involving specific GUID values).
   * @param language - Optional language code for error message localization.
   * 
   * @throws {Error} If guid parameter is provided but is not a Buffer.
   */
  constructor(
    type: GuidErrorType,
    public readonly brand?: GuidBrandType,
    public readonly length?: number,
    public readonly guid?: RawGuidBuffer | Buffer,
    language?: string,
  ) {
    // Build template parameters only for the values that are provided
    const templateParams: Record<string, string> = {};
    
    if (brand !== undefined) {
      templateParams.BRAND = String(brand);
    }
    
    if (length !== undefined) {
      templateParams.LENGTH = String(length);
    }
    
    if (guid !== undefined) {
      // Defensive check to ensure guid is a Buffer
      if (!Buffer.isBuffer(guid)) {
        throw new Error('GuidError: guid parameter must be a Buffer');
      }
      templateParams.GUID = guid.toString('hex');
    }

    super(EciesComponentId, type, GuidError.REASON_MAP, language, templateParams);
    this.name = 'GuidError';
    
    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, GuidError.prototype);
  }

  /**
   * Returns a string representation of the error with all relevant details.
   * @returns A detailed error string.
   */
  public override toString(): string {
    const parts = [`${this.name}: ${this.message}`];
    
    if (this.brand !== undefined) {
      parts.push(`Brand: ${this.brand}`);
    }
    
    if (this.length !== undefined) {
      parts.push(`Length: ${this.length}`);
    }
    
    if (this.guid !== undefined) {
      parts.push(`GUID: ${this.guid.toString('hex')}`);
    }
    
    return parts.join(' | ');
  }
}
