import type { ObjectId } from 'bson';
import {
  createRuntimeConfiguration,
  getRuntimeConfiguration,
  type ConfigurationKey,
} from './constants';
import type { IConstants } from './interfaces/constants';
import type { IIdProvider } from './interfaces/id-provider';
import type { DeepPartial } from './types/deep-partial';
import { GuidV4 } from './types/guid-versions';

/**
 * Typed configuration wrapper that preserves ID provider type information.
 * This provides strong typing for idProvider operations without making the entire
 * constants system generic.
 */
export class TypedConfiguration<TID> {
  private readonly _constants: IConstants;
  private readonly _idProvider: IIdProvider<TID>;

  constructor(constants: IConstants) {
    this._constants = constants;
    this._idProvider = constants.idProvider as IIdProvider<TID>;
  }

  /**
   * Get the strongly-typed ID provider.
   * This returns IIdProvider<TID> with full type safety.
   */
  get idProvider(): IIdProvider<TID> {
    return this._idProvider;
  }

  /**
   * Get the underlying constants (for compatibility with existing code).
   */
  get constants(): IConstants {
    return this._constants;
  }

  /**
   * Generate a new ID with strong typing.
   */
  generateId(): TID {
    const bytes = this._idProvider.generate();
    return this._idProvider.fromBytes(bytes);
  }

  /**
   * Validate an ID with strong typing.
   */
  validateId(id: TID): boolean {
    const bytes = this._idProvider.toBytes(id);
    return this._idProvider.validate(bytes);
  }

  /**
   * Serialize an ID to string with strong typing.
   */
  serializeId(id: TID): string {
    return this._idProvider.idToString(id);
  }

  /**
   * Deserialize a string to ID with strong typing.
   */
  deserializeId(str: string): TID {
    return this._idProvider.idFromString(str);
  }
}

/**
 * Configuration factory functions that infer and preserve ID provider types.
 */

/**
 * Create a typed configuration with ObjectId provider.
 * This is the default configuration with strong ObjectId typing.
 */
export function createObjectIdConfiguration(
  overrides?: DeepPartial<IConstants>,
): TypedConfiguration<ObjectId> {
  const constants = createRuntimeConfiguration(overrides);
  return new TypedConfiguration<ObjectId>(constants);
}

/**
 * Create a typed configuration with GuidV4 provider.
 */
export function createGuidV4Configuration(
  overrides?: DeepPartial<IConstants>,
): TypedConfiguration<GuidV4> {
  const constants = createRuntimeConfiguration(overrides);
  return new TypedConfiguration<GuidV4>(constants);
}

/**
 * Create a typed configuration with Uint8Array provider (generic bytes).
 */
export function createUint8ArrayConfiguration(
  overrides?: DeepPartial<IConstants>,
): TypedConfiguration<Uint8Array> {
  const constants = createRuntimeConfiguration(overrides);
  return new TypedConfiguration<Uint8Array>(constants);
}

/**
 * Create a typed configuration with UUID string provider.
 */
export function createUuidConfiguration(
  overrides?: DeepPartial<IConstants>,
): TypedConfiguration<string> {
  const constants = createRuntimeConfiguration(overrides);
  return new TypedConfiguration<string>(constants);
}

/**
 * Get a strongly-typed ID provider from the default configuration.
 * This is the direct equivalent of `getRuntimeConfiguration().idProvider` with strong typing.
 *
 * @example
 * ```typescript
 * // BEFORE: Weak typing
 * const Constants = getRuntimeConfiguration();
 * const id = Constants.idProvider.generate(); // Returns Uint8Array, no strong typing
 *
 * // AFTER: Strong typing
 * const idProvider = getTypedIdProvider<ObjectId>();
 * const id = idProvider.generateTyped(); // Returns ObjectId - strongly typed!
 * ```
 */
export function getTypedIdProvider<TID>(
  key?: ConfigurationKey,
): IIdProvider<TID> {
  const constants = getRuntimeConfiguration(key);
  if (!constants || !constants.idProvider) {
    throw new Error(
      'Runtime configuration not initialized. Ensure @digitaldefiance/ecies-lib is properly imported before calling getTypedIdProvider().',
    );
  }
  return constants.idProvider as IIdProvider<TID>;
}

/**
 * Enhanced ID provider wrapper that adds strongly-typed convenience methods
 * while preserving all original functionality.
 */
export class TypedIdProviderWrapper<TID> implements IIdProvider<TID> {
  private readonly _provider: IIdProvider<TID>;

  constructor(provider: IIdProvider<TID>) {
    this._provider = provider;
  }

  // Delegate all original methods
  get byteLength(): number {
    return this._provider.byteLength;
  }
  get name(): string {
    return this._provider.name;
  }

  generate(): Uint8Array {
    return this._provider.generate();
  }
  validate(id: Uint8Array): boolean {
    return this._provider.validate(id);
  }
  serialize(id: Uint8Array): string {
    return this._provider.serialize(id);
  }
  deserialize(str: string): Uint8Array {
    return this._provider.deserialize(str);
  }
  toBytes(id: TID): Uint8Array {
    return this._provider.toBytes(id);
  }
  fromBytes(bytes: Uint8Array): TID {
    return this._provider.fromBytes(bytes);
  }
  equals(a: TID, b: TID): boolean {
    return this._provider.equals(a, b);
  }
  clone(id: TID): TID {
    return this._provider.clone(id);
  }
  idToString(id: TID): string {
    return this._provider.idToString(id);
  }
  idFromString(str: string): TID {
    return this._provider.idFromString(str);
  }

  // Add strongly-typed convenience methods
  /**
   * Generate a new ID with strong typing.
   * This is equivalent to generate() + fromBytes() but returns the native type directly.
   */
  generateTyped(): TID {
    const bytes = this.generate();
    return this.fromBytes(bytes);
  }

  /**
   * Validate an ID with strong typing.
   * Accepts the native ID type and validates it.
   */
  validateTyped(id: TID): boolean {
    const bytes = this.toBytes(id);
    return this.validate(bytes);
  }

  /**
   * Serialize an ID to string with strong typing.
   * Accepts the native ID type directly.
   */
  serializeTyped(id: TID): string {
    return this.idToString(id);
  }

  /**
   * Deserialize a string to ID with strong typing.
   * Returns the native ID type directly.
   */
  deserializeTyped(str: string): TID {
    return this.idFromString(str);
  }
}

/**
 * Get a strongly-typed ID provider with enhanced convenience methods.
 * This provides the most ergonomic API for strongly-typed ID operations.
 *
 * @example
 * ```typescript
 * // Direct replacement for Constants.idProvider with strong typing
 * const idProvider = getEnhancedIdProvider<ObjectId>();
 *
 * // All original methods work the same
 * const bytes = idProvider.generate(); // Uint8Array
 * const isValid = idProvider.validate(bytes); // boolean
 *
 * // Plus new strongly-typed methods
 * const objectId = idProvider.generateTyped(); // ObjectId - strongly typed!
 * const valid = idProvider.validateTyped(objectId); // boolean
 * const serialized = idProvider.serializeTyped(objectId); // string
 * const deserialized = idProvider.deserializeTyped(serialized); // ObjectId
 * ```
 */
export function getEnhancedIdProvider<TID>(
  key?: ConfigurationKey,
): TypedIdProviderWrapper<TID> {
  const provider = getTypedIdProvider<TID>(key);
  return new TypedIdProviderWrapper(provider);
}

/**
 * Ensure that the ID provider has the expected name and returns a typed wrapper.
 * This is useful for ensuring that the correct ID provider is being used.
 *
 * @example
 * ```typescript
 * // For ObjectId configurations
 * const config = ensureEnhancedIdProvider<ObjectId>('ObjectId');
 *
 * // For GUID configurations
 * const guidConfig = ensureEnhancedIdProvider<GuidV4>('GuidV4');
 * ```
 * @param name Expected provider name
 * @param key Optional configuration key
 * @returns TypedIdProviderWrapper<TID>
 */
export function ensureEnhancedIdProvider<TID>(
  name: string,
  key?: ConfigurationKey,
): TypedIdProviderWrapper<TID> {
  const provider = getEnhancedIdProvider<TID>(key);
  if (provider.name !== name) {
    throw new Error(
      `Provider name mismatch. Expected ${name}, got ${provider.name}`,
    );
  }
  return provider;
}

/**
 * Get a typed configuration from the registry.
 * The type parameter must match the actual ID provider type.
 *
 * @example
 * ```typescript
 * // For ObjectId configurations
 * const config = getTypedConfiguration<ObjectId>();
 * const id = config.generateId(); // Returns ObjectId
 *
 * // For GUID configurations
 * const guidConfig = getTypedConfiguration<GuidV4>('my-guid-config');
 * const guid = guidConfig.generateId(); // Returns GuidV4
 * ```
 */
export function getTypedConfiguration<TID>(
  key?: ConfigurationKey,
): TypedConfiguration<TID> {
  const constants = getRuntimeConfiguration(key);
  if (!constants || !constants.idProvider) {
    throw new Error(
      'Runtime configuration not initialized. Ensure @digitaldefiance/ecies-lib is properly imported before calling getTypedConfiguration().',
    );
  }
  return new TypedConfiguration<TID>(constants);
}

/**
 * Type-safe configuration builder that infers the ID provider type.
 * This provides the strongest typing by inferring TID from the idProvider.
 */
export function createTypedConfiguration<
  TProvider extends IIdProvider<unknown>,
>(
  config: DeepPartial<IConstants> & { idProvider: TProvider },
): TypedConfiguration<TProvider extends IIdProvider<infer TID> ? TID : never> {
  const constants = createRuntimeConfiguration(config);
  return new TypedConfiguration(constants) as TypedConfiguration<
    TProvider extends IIdProvider<infer TID> ? TID : never
  >;
}
