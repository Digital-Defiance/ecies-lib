import { GuidBrandType } from '../enumerations/guid-brand-type';
import { GuidErrorType } from '../enumerations/guid-error-type';
import { RawGuidUint8Array } from '../types';
import { buildReasonMap, HandleableErrorOptions, I18nEngine, Language, TypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';

/**
 * Error class for handling GUID-related errors.
 */
export class GuidError extends TypedHandleableError<typeof GuidErrorType, EciesStringKey> {
  public readonly brand?: GuidBrandType;
  public readonly length?: number;
  public readonly guid?: Uint8Array;
  
  constructor(
    type: GuidErrorType,
    engine: I18nEngine<EciesStringKey, Language, any, any>,
    brand?: GuidBrandType,
    length?: number,
    guid?: RawGuidUint8Array | Uint8Array,
    options?: HandleableErrorOptions,
    language?: Language,
  ) {
    super(type, buildReasonMap<typeof GuidErrorType, EciesStringKey>(GuidErrorType, ['Error', 'GuidError'], new Set([GuidErrorType.InvalidWithGuid, GuidErrorType.UnknownBrand, GuidErrorType.UnknownLength])), engine, language, {
      GUID: guid ? Array.from(guid).map(b => b.toString(16).padStart(2, '0')).join(' ') : '',
      BRAND: String(brand) ?? '',
      LENGTH: String(length) ?? '',
    }, options);
    this.brand = brand;
    this.length = length;
    this.guid = guid;
  }
}
