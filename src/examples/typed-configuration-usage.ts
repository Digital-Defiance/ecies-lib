/**
 * Examples showing how to use the typed configuration system for strong ID provider typing.
 * This demonstrates the solution to the original problem where Constants.idProvider.generate()
 * had no strong typing.
 */

import { ObjectId } from 'bson';
import { getRuntimeConfiguration } from '../constants';
import type { GuidV4 } from '../lib/guid';
import { GuidV4Provider } from '../lib/id-providers/guidv4-provider';
import {
  createObjectIdConfiguration,
  createGuidV4Configuration,
  createTypedConfiguration,
  getTypedIdProvider,
  getEnhancedIdProvider,
} from '../typed-configuration';

// ============================================================================
// BEFORE: Weak typing with getRuntimeConfiguration()
// ============================================================================

function beforeExample() {
  // This was the original problem - no strong typing
  const Constants = getRuntimeConfiguration();
  const id = Constants.idProvider.generate(); // Returns Uint8Array, loses type info
  const _nativeId = Constants.idProvider.fromBytes(id); // Returns unknown, no type safety
}

// ============================================================================
// AFTER: Strong typing solutions
// ============================================================================

function afterExample() {
  // Solution 1: Direct replacement for Constants.idProvider
  const enhancedProvider = getEnhancedIdProvider<ObjectId>();

  // Original methods still work exactly the same
  const rawBytes = enhancedProvider.generate(); // Uint8Array (same as before)
  const _isValid = enhancedProvider.validate(rawBytes); // boolean (same as before)

  // But now you also have strongly-typed methods
  const objectId = enhancedProvider.generateTyped(); // ObjectId - strongly typed!
  const _validTyped = enhancedProvider.validateTyped(objectId); // boolean, accepts ObjectId
  const serialized = enhancedProvider.serializeTyped(objectId); // string, accepts ObjectId
  const _deserialized = enhancedProvider.deserializeTyped(serialized); // ObjectId

  // Solution 2: Simple typed provider
  const typedProvider = getTypedIdProvider<ObjectId>();
  const bytes = typedProvider.generate();
  const _typedId = typedProvider.fromBytes(bytes); // Returns ObjectId, not unknown!

  // Solution 3: Configuration approach (for more complex scenarios)
  const config = createObjectIdConfiguration();
  const _configId = config.generateId(); // Returns ObjectId - strongly typed!
}

// ============================================================================
// Real-world usage patterns
// ============================================================================

function realWorldUsage() {
  // Pattern 1: Service initialization with strong typing
  const config = createObjectIdConfiguration();

  // Now you can use config.idProvider with full type safety
  const newId = config.generateId(); // ObjectId
  const _isValid = config.validateId(newId); // boolean
  const _idString = config.serializeId(newId); // string

  // Pattern 2: Custom provider with type inference
  const customProvider = new GuidV4Provider();
  const typedConfig = createTypedConfiguration({
    idProvider: customProvider,
    // Other overrides...
    BcryptRounds: 12,
  });

  const _guidId = typedConfig.generateId(); // GuidV4 - automatically inferred!

  // Pattern 3: Backward compatibility - access underlying constants
  const _underlyingConstants = typedConfig.constants;
  // This still works for existing code that expects IConstants
}

// ============================================================================
// Integration with ECIESService
// ============================================================================

function serviceIntegration() {
  // The ECIESService can now use TypedConfiguration for better typing
  const config = createObjectIdConfiguration();

  // Pass the underlying constants to existing services
  // const service = new ECIESService<ObjectId>(config.constants);

  // Or use the typed config directly for ID operations
  const memberId = config.generateId(); // ObjectId
  const _memberIdString = config.serializeId(memberId); // string
}

// ============================================================================
// Type safety demonstrations
// ============================================================================

function typeSafetyDemo() {
  const objectIdConfig = createObjectIdConfiguration();
  const guidConfig = createGuidV4Configuration({
    idProvider: new GuidV4Provider(),
  });

  const objectId = objectIdConfig.generateId(); // ObjectId
  const guid = guidConfig.generateId(); // GuidV4

  // These operations are now type-safe:
  objectIdConfig.serializeId(objectId); // ✅ Accepts ObjectId
  guidConfig.serializeId(guid); // ✅ Accepts GuidV4

  // These would be compile-time errors:
  // objectIdConfig.serializeId(guid); // ❌ Type error: GuidV4 not assignable to ObjectId
  // guidConfig.serializeId(objectId); // ❌ Type error: ObjectId not assignable to GuidV4
}

export {
  beforeExample,
  afterExample,
  realWorldUsage,
  serviceIntegration,
  typeSafetyDemo,
};
