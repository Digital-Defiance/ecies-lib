import { ObjectId } from "bson";
import type { GuidV4 } from "../lib";

export type PlatformID = Uint8Array | GuidV4 | ObjectId | string;