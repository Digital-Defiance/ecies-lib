/**
 * Provider-to-GUID conversion utilities.
 *
 * Extracted from GuidUint8Array to break the circular dependency between
 * guid.ts and id-providers. These functions import both modules without
 * creating a cycle since nothing imports back into this file from either side.
 */

import { GuidErrorType } from '../enumerations/guid-error-type';
import { GuidError } from '../errors/guid';
import { BaseIdProvider } from './base-id-provider';
import { GuidUint8Array, VersionedGuidUint8Array } from './guid';
import {
  CustomIdProvider,
  GuidV4Provider,
  ObjectIdProvider,
  UuidProvider,
  Uint8ArrayIdProvider,
} from './id-providers';

// Well-known v5 namespace UUIDs for deterministic derivation.
// These are arbitrary but fixed UUIDs that scope the v5 hash per provider,
// ensuring that the same raw bytes from different providers produce
// different GUIDs.
const NS_OBJECTID = '6ba7b814-9dad-11d1-80b4-00c04fd430c8';
const NS_CUSTOM = '6ba7b815-9dad-11d1-80b4-00c04fd430c8';
const NS_UINT8ARRAY = '6ba7b816-9dad-11d1-80b4-00c04fd430c8';

/**
 * Convert a provider's native ID to a GuidUint8Array.
 *
 * For 16-byte providers (GuidV4Provider, UuidProvider) the bytes are
 * reinterpreted directly as a GUID — they already are one.
 *
 * For non-16-byte providers (ObjectIdProvider, CustomIdProvider,
 * Uint8ArrayIdProvider) a deterministic UUID v5 is derived using a
 * provider-specific namespace, so the same input always yields the same
 * GUID and different providers never collide.
 */
export function fromProviderId<T>(
  id: T,
  provider: BaseIdProvider<T>,
): VersionedGuidUint8Array {
  const bytes = provider.toBytes(id);
  return fromProviderIdBytes(bytes, provider);
}

/**
 * Convert raw ID bytes (from any provider) to a GuidUint8Array.
 *
 * Same strategy as {@link fromProviderId} but starts from the Uint8Array
 * byte representation rather than the provider's native type.
 */
export function fromProviderIdBytes<T>(
  idBytes: Uint8Array,
  provider: BaseIdProvider<T>,
): VersionedGuidUint8Array {
  if (idBytes.length !== provider.byteLength) {
    throw new GuidError(GuidErrorType.InvalidGuid);
  }

  // 16-byte providers: the bytes already represent a valid GUID
  if (provider instanceof GuidV4Provider || provider instanceof UuidProvider) {
    return GuidUint8Array.fromPlatformBuffer(idBytes);
  }

  // Non-16-byte providers: derive a deterministic v5 GUID
  const serialized = provider.serialize(idBytes);
  let namespace: string;

  if (provider instanceof ObjectIdProvider) {
    namespace = NS_OBJECTID;
  } else if (provider instanceof CustomIdProvider) {
    namespace = NS_CUSTOM;
  } else if (provider instanceof Uint8ArrayIdProvider) {
    namespace = NS_UINT8ARRAY;
  } else {
    // Fallback for unknown providers
    namespace = NS_CUSTOM;
  }

  return GuidUint8Array.v5(serialized, namespace);
}
