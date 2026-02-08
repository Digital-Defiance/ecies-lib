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

// CRITICAL: Apply crypto polyfill BEFORE any @noble/curves imports
// This ensures crypto.getRandomValues returns pure Uint8Array instances
import './lib/crypto-polyfill';

// Core v2 exports
export * from './builders/index';
export * from './core/index';
export * from './lib/index';

// i18n v2
export {
  createEciesComponentConfig,
  createEciesComponentPackage,
  EciesComponentStrings,
  EciesI18nEngineKey,
  getEciesI18nEngine,
  getEciesTranslation,
  resetEciesI18nEngine,
  safeEciesTranslation,
} from './i18n-setup';

// Note: Most exports are handled by wildcard exports below (export * from './...')
// Only specific exports that need special handling are listed here
export {
  encryptionTypeEnumToType,
  encryptionTypeToString,
  ensureEciesEncryptionTypeEnum,
  validateEciesEncryptionTypeEnum,
} from './utils/encryption-type-utils';

// ID Provider system - exported via wildcard exports below
// Invariant validation system - exported via wildcard exports below
// Configuration helpers - exported via wildcard exports below

// Note: Existing services will be re-exported once migrated to v2
// For now, import from main index.ts for backward compatibility

export * from './constants';
export * from './typed-configuration';
export * from './email-string';
export * from './enumerations';
export * from './errors';
export * from './interfaces';
export * from './interfaces/encrypted-chunk';
export { ENCRYPTION_STATE_VERSION } from './interfaces/encryption-state';
export type { IEncryptionState } from './interfaces/encryption-state';
export * from './interfaces/stream-config';
export * from './interfaces/stream-header';
export * from './interfaces/stream-progress';
export * from './isolated-private';
export * from './isolated-public';
export * from './member';
export * from './pbkdf2-profiles';
export * from './phone-number';
export * from './secure-buffer';
export * from './secure-string';
export * from './services';
export * from './transforms';
export * from './ecies_types';
export * from './types';
export * from './utils';

// Voting system exports (IMember already exported from ./interfaces)
export * from './lib/voting';

// Additional voting service type exports for convenience
export type {
  PrivateKey,
  PublicKey,
  KeyPair as PaillierKeyPair,
} from 'paillier-bigint';
