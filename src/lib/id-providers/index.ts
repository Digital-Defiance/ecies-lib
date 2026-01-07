/**
 * ID Providers for recipient identification in multi-recipient encryption.
 *
 * The library supports multiple ID formats to accommodate different use cases:
 * - ObjectID: MongoDB/BSON ObjectID (12 bytes)
 * - GUIDv4: RFC 4122 v4 GUID (16 bytes, base64 serialization)
 * - UUID: RFC 4122 v4 UUID (16 bytes, standard format with dashes)
 * - Legacy32Byte: Backward compatible 32-byte IDs (deprecated)
 * - Custom: User-defined byte length and validation
 *
 * @example
 * ```typescript
 * import { ObjectIdProvider, GuidV4Provider } from './lib/id-providers';
 *
 * // Use MongoDB ObjectIDs (12 bytes)
 * const objectIdProvider = new ObjectIdProvider();
 * const id = objectIdProvider.generate();
 *
 * // Use GUIDs (16 bytes)
 * const guidProvider = new GuidV4Provider();
 * const guid = guidProvider.generate();
 * ```
 */

export { CustomIdProvider } from './custom-provider';
export { GuidV4Provider } from './guidv4-provider';
export { ObjectIdProvider } from './objectid-provider';
export { UuidProvider } from './uuid-provider';
export { BaseIdProvider } from '../base-id-provider';
