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
export { SecureString } from './secure-string';
export { SecureBuffer } from './secure-buffer';

// Re-export constants (unchanged)
export { Constants, ConstantsRegistry } from './constants';
export type { IConstants } from './interfaces';
// Also export specific interfaces, types, and enums that are needed
export type {
  IECIESConstants,
  IECIESConfig,
  IPbkdf2Config,
  IPBkdf2Consts,
  IMemberStorageData,
} from './interfaces';
export type { HexString } from './types';
export { LengthEncodingType } from './enumerations/length-encoding-type';
export { MemberErrorType } from './enumerations/member-error-type';
export { InvalidEmailErrorType } from './enumerations/invalid-email-type';
export { 
  EciesEncryptionTypeEnum, 
  type EciesEncryptionType, 
  EciesEncryptionTypeMap,
  encryptionTypeEnumToType,
  encryptionTypeToString,
  ensureEciesEncryptionTypeEnum,
} from './enumerations/ecies-encryption-type';
export { EciesVersionEnum } from './enumerations/ecies-version';
export { EciesCipherSuiteEnum } from './enumerations/ecies-cipher-suite';
export { ECIESErrorTypeEnum } from './enumerations/ecies-error-type';
export { ECIESError } from './errors/ecies';
export { Pbkdf2ErrorType } from './enumerations/pbkdf2-error-type';
export { ECIES, UINT32_MAX, UINT64_SIZE, OBJECT_ID_LENGTH } from './constants';
export { 
  getLengthEncodingTypeForLength, 
  getLengthEncodingTypeFromValue, 
  getLengthForLengthType,
} from './utils';

// ID Provider system
export * from './lib/id-providers';
export type { IIdProvider } from './interfaces/id-provider';
export { BaseIdProvider } from './interfaces/id-provider';
export { ObjectIdProvider } from './lib/id-providers/objectid-provider';

// Invariant validation system
export { InvariantValidator } from './lib/invariant-validator';
export type { IInvariant } from './interfaces/invariant';
export { BaseInvariant } from './interfaces/invariant';
export * from './lib/invariants';

// Configuration helpers
export {
  createRuntimeConfiguration,
  registerRuntimeConfiguration,
  unregisterRuntimeConfiguration,
  clearRuntimeConfigurations,
  getRuntimeConfiguration,
} from './constants';
export type { IConfigurationProvenance } from './interfaces/configuration-provenance';
export { calculateConfigChecksum, captureCreationStack } from './interfaces/configuration-provenance';

// Note: Existing services will be re-exported once migrated to v2
// For now, import from main index.ts for backward compatibility

export * from './constants';
export * from './email-string';
export * from './enumerations';
export * from './errors';
export * from './i18n-setup';
export * from './interfaces';
export * from './interfaces/stream-config';
export * from './interfaces/encrypted-chunk';
export * from './interfaces/stream-progress';
export * from './interfaces/stream-header';
export * from './member';
export * from './pbkdf2-profiles';
export * from './phone-number';
export * from './secure-buffer';
export * from './secure-string';
export * from './services';
export { ChunkProcessor } from './services/chunk-processor';
export { EncryptionStream } from './services/encryption-stream';
export { ProgressTracker } from './services/progress-tracker';
export { ResumableEncryption } from './services/resumable-encryption';
export type {
  IEncryptStreamOptions,
  IDecryptStreamOptions,
} from './services/encryption-stream';
export type { IResumableOptions } from './services/resumable-encryption';
export type { IEncryptionState } from './interfaces/encryption-state';
export { ENCRYPTION_STATE_VERSION } from './interfaces/encryption-state';
export * from './types';
export * from './utils';
