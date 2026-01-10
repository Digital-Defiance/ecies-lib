import type { ObjectId } from 'bson';
import type { GuidV4 } from '../types/guid-versions';

export type PlatformID = Uint8Array | GuidV4 | ObjectId | string;
