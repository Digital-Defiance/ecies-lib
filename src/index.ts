/**
 * ECIES Library v2.0 - Modern Architecture
 * 
 * New exports for v2 architecture with:
 * - Unified error handling
 * - Service container
 * - Fluent builders
 * - Result pattern
 * - i18n 2.0 integration
 */

// Core v2 exports
export * from './core';
export * from './builders';
export * from './lib';

// i18n v2
export {
  getEciesI18nEngine,
  createEciesI18nEngine,
  resetEciesI18nEngine,
  getEciesTranslation,
  safeEciesTranslation,
  EciesI18nEngineKey,
  EciesComponentId,
} from './i18n-setup';

// Re-export existing types and enums (unchanged)
export { EciesStringKey } from './enumerations/ecies-string-key';
export { MemberType } from './enumerations/member-type';
export { Pbkdf2ProfileEnum } from './enumerations/pbkdf2-profile';

// Re-export value objects (unchanged)
export { EmailString } from './email-string';
export { GuidV4 } from './guid';
export { SecureString } from './secure-string';
export { SecureBuffer } from './secure-buffer';

// Re-export constants (unchanged)
export { Constants, ConstantsRegistry } from './constants';
export type { IConstants } from './interfaces';

// Note: Existing services will be re-exported once migrated to v2
// For now, import from main index.ts for backward compatibility

export * from './constants';
export * from './email-string';
export * from './enumerations';
export * from './errors';
export * from './guid';
export * from './i18n-setup';
export * from './interfaces';
export * from './member';
export * from './pbkdf2-profiles';
export * from './phone-number';
export * from './secure-buffer';
export * from './secure-string';
export * from './services';
export * from './types';
export * from './utils';
