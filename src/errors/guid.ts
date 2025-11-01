import { GuidBrandType } from '../enumerations/guid-brand-type';
import { GuidErrorType } from '../enumerations/guid-error-type';
import { RawGuidUint8Array } from '../types';
import { buildReasonMap, HandleableErrorOptions, CoreLanguageCode, PluginI18nEngine, PluginTypedHandleableError } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId } from '../i18n-setup';

/**
 * Error class for handling GUID-related errors.
 */
export class GuidError<TLanguage extends CoreLanguageCode = CoreLanguageCode> extends PluginTypedHandleableError<typeof GuidErrorType, EciesStringKey, TLanguage> {
  public readonly brand?: GuidBrandType;
  public readonly length?: number;
  public readonly guid?: Uint8Array;
  
  constructor(
    type: GuidErrorType,
    engine: PluginI18nEngine<TLanguage>,
    brand?: GuidBrandType,
    length?: number,
    guid?: RawGuidUint8Array | Uint8Array,
    options?: HandleableErrorOptions,
    language?: TLanguage,
  ) {
    super(engine, EciesComponentId, type, buildReasonMap<typeof GuidErrorType, EciesStringKey>(GuidErrorType, ['Error', 'GuidError'], new Set([GuidErrorType.InvalidWithGuid, GuidErrorType.UnknownBrand, GuidErrorType.UnknownLength])), new Error(), options, language, {
      GUID: guid ? Array.from(guid).map(b => b.toString(16).padStart(2, '0')).join(' ') : '',
      BRAND: String(brand) ?? '',
      LENGTH: String(length) ?? '',
    });
    this.brand = brand;
    this.length = length;
    this.guid = guid;
  }
}
