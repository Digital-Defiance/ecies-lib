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
export * from './builders/index.js';
export * from './core/index.js';
export * from './lib/index.js';

// i18n v2
export {
  EciesComponentId,
  EciesI18nEngineKey,
  getEciesI18nEngine,
  getEciesTranslation,
  resetEciesI18nEngine,
  safeEciesTranslation,
} from './i18n-setup';

// Re-export existing types and enums (unchanged)
export { EciesStringKey } from './enumerations/ecies-string-key';
export { MemberType } from './enumerations/member-type';
export { Pbkdf2ProfileEnum } from './enumerations/pbkdf2-profile';

// Re-export value objects (unchanged)
export { EmailString } from './email-string';
export { SecureBuffer } from './secure-buffer';
export { SecureString } from './secure-string';

// Re-export constants (unchanged)
export { Constants, ConstantsRegistry } from './constants';
export type { IConstants } from './interfaces';
// Also export specific interfaces, types, and enums that are needed
export { ECIES, OBJECT_ID_LENGTH, UINT32_MAX, UINT64_SIZE } from './constants';
export { EciesCipherSuiteEnum } from './enumerations/ecies-cipher-suite';
export {
  EciesEncryptionTypeEnum,
  EciesEncryptionTypeMap,
  encryptionTypeEnumToType,
  encryptionTypeToString,
  ensureEciesEncryptionTypeEnum,
  type EciesEncryptionType,
} from './enumerations/ecies-encryption-type';
export { ECIESErrorTypeEnum } from './enumerations/ecies-error-type';
export { EciesVersionEnum } from './enumerations/ecies-version';
export { InvalidEmailErrorType } from './enumerations/invalid-email-type';
export { LengthEncodingType } from './enumerations/length-encoding-type';
export { MemberErrorType } from './enumerations/member-error-type';
export { Pbkdf2ErrorType } from './enumerations/pbkdf2-error-type';
export { ECIESError } from './errors/ecies';
export type {
  IECIESConfig,
  IECIESConstants,
  IMemberStorageData,
  IPBkdf2Consts,
  IPbkdf2Config,
} from './interfaces';
export type { HexString } from './types';
export {
  getLengthEncodingTypeForLength,
  getLengthEncodingTypeFromValue,
  getLengthForLengthType,
} from './utils';

// ID Provider system
export { BaseIdProvider } from './interfaces/id-provider';
export type { IIdProvider } from './interfaces/id-provider';
export * from './lib/id-providers';
export { ObjectIdProvider } from './lib/id-providers/objectid-provider';

// Invariant validation system
export { BaseInvariant } from './interfaces/invariant';
export type { IInvariant } from './interfaces/invariant';
export { InvariantValidator } from './lib/invariant-validator';
export * from './lib/invariants';

// Configuration helpers
export {
  clearRuntimeConfigurations,
  createRuntimeConfiguration,
  getRuntimeConfiguration,
  registerRuntimeConfiguration,
  unregisterRuntimeConfiguration,
} from './constants';
export {
  calculateConfigChecksum,
  captureCreationStack,
} from './interfaces/configuration-provenance';
export type { IConfigurationProvenance } from './interfaces/configuration-provenance';

// Note: Existing services will be re-exported once migrated to v2
// For now, import from main index.ts for backward compatibility

export * from './constants';
export * from './email-string';
export * from './enumerations';
export * from './errors';
export * from './i18n-setup';
export * from './interfaces';
export * from './interfaces/encrypted-chunk';
export { ENCRYPTION_STATE_VERSION } from './interfaces/encryption-state';
export type { IEncryptionState } from './interfaces/encryption-state';
export * from './interfaces/stream-config';
export * from './interfaces/stream-header';
export * from './interfaces/stream-progress';
export * from './member';
export { Member } from './member';
export * from './pbkdf2-profiles';
export * from './phone-number';
export * from './secure-buffer';
export * from './secure-string';
export * from './services';
export { ChunkProcessor } from './services/chunk-processor';
export { EciesCryptoCore } from './services/ecies/crypto-core';
export { ECIESService } from './services/ecies/service';
export { EncryptionStream } from './services/encryption-stream';
export type {
  IDecryptStreamOptions,
  IEncryptStreamOptions,
} from './services/encryption-stream';
export { PasswordLoginService } from './services/password-login';
export { Pbkdf2Service } from './services/pbkdf2';
export { ProgressTracker } from './services/progress-tracker';
export { ResumableEncryption } from './services/resumable-encryption';
export type { IResumableOptions } from './services/resumable-encryption';
export * from './types';
export * from './utils';
export { hexToUint8Array, uint8ArrayToHex } from './utils';
