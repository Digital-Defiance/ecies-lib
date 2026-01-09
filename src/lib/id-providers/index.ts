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
 * ## ID Provider Architecture
 *
 * The library uses a hierarchical ID provider system with strong type safety:
 *
 * 1. **Global Default**: `Constants.idProvider` provides the system-wide default (ObjectIdProvider)
 * 2. **Service Configuration**: `ECIESService<TID>` can be configured with a custom idProvider
 * 3. **Type Safety**: Service validates that idProvider TID type matches Member TID at construction
 * 4. **Member Usage**: `Member` instances use their service's configured idProvider
 * 5. **Voting System**: Voting components use the Member's idProvider for consistency
 *
 * ### Enhanced Type Safety (v3.8+)
 *
 * The ECIESService now provides stronger type guarantees:
 * - `service.idProvider` returns `IIdProvider<TID>` with correct typing
 * - Construction-time validation ensures idProvider compatibility with TID type
 * - Enhanced validation tests all idProvider methods for correctness
 *
 * ### Configuration Examples
 *
 * ```typescript
 * import { ObjectIdProvider, GuidV4Provider, ECIESService, Member } from './lib';
 * import { ObjectId } from 'bson';
 *
 * // Use default ObjectID provider (12 bytes) with strong typing
 * const defaultService = new ECIESService<ObjectId>();
 * const objectIdMember = Member.newMember(defaultService, ...);
 * // objectIdMember.idBytes.length === 12
 * // defaultService.idProvider is typed as IIdProvider<ObjectId>
 *
 * // Use GUID provider (16 bytes) with type safety
 * const guidConfig = createRuntimeConfiguration({
 *   idProvider: new GuidV4Provider()
 * });
 * const guidService = new ECIESService<Uint8Array>(guidConfig);
 * const guidMember = Member.newMember(guidService, ...);
 * // guidMember.idBytes.length === 16
 * // guidService.idProvider is typed as IIdProvider<Uint8Array>
 *
 * // Voting system uses member's idProvider automatically
 * const poll = PollFactory.create(['Yes', 'No'], VotingMethod.Plurality, guidMember);
 * // poll uses guidMember.idProvider (16-byte GUIDs)
 * ```
 *
 * ### Validation and Error Handling
 *
 * The service performs comprehensive validation at construction time:
 * - Validates all required idProvider methods exist
 * - Tests generate(), serialize(), deserialize() round-trip
 * - Tests toBytes(), fromBytes() with proper type conversion
 * - Ensures TID type compatibility with idProvider native type
 * - Provides detailed error messages for configuration issues
 *
 * ### Cross-Platform Compatibility
 *
 * When working across browser/Node.js platforms:
 * - Both platforms must use the same idProvider configuration
 * - Serialized data includes ID format information for validation
 * - Member.fromJson() warns if ID length doesn't match current configuration
 * - Enhanced validation catches configuration mismatches early
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
 *
 * // Service validates configuration at construction
 * try {
 *   const service = new ECIESService<ObjectId>(guidConfig); // Type mismatch!
 * } catch (error) {
 *   // Enhanced validation catches this early with detailed error message
 * }
 * ```
 */

export { CustomIdProvider } from './custom-provider';
export { GuidV4Provider } from './guidv4-provider';
export { ObjectIdProvider } from './objectid-provider';
export { UuidProvider } from './uuid-provider';
export { BaseIdProvider } from '../base-id-provider';
export { Uint8ArrayIdProvider } from './uint8array-provider';
