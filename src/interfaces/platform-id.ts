/**
 * Platform-agnostic ID type.
 * Supports multiple ID formats for cross-platform compatibility:
 * - Uint8Array: Raw binary format
 * - GuidV4: GUID/UUID format
 * - ObjectId: MongoDB ObjectId format
 * - string: String-based IDs
 */

import type { ObjectId } from 'bson';
import type { GuidV4Uint8Array } from '../types/guid-versions';

export type PlatformID = Uint8Array | GuidV4Uint8Array | ObjectId | string;
