/**
 * GUID brand type enumeration.
 * Defines the different formats in which a GUID can be represented.
 */
export enum GuidBrandType {
  /** Unknown or unspecified GUID format */
  Unknown = 'Unknown',
  /**
   * Full hex GUID with dashes, 36 characters.
   * Format: 00000000-0000-0000-0000-000000000000
   */
  FullHexGuid = 'FullHexGuid',
  /**
   * Short hex GUID without dashes, 32 characters.
   * Format: 00000000000000000000000000000000
   */
  ShortHexGuid = 'ShortHexGuid',
  /**
   * Base64 encoded GUID, 24 characters.
   * Format: AAAA/AAAAAA==
   */
  Base64Guid = 'Base64Guid',
  /**
   * GUID stored as a BigInt (variable width).
   */
  BigIntGuid = 'BigIntGuid',
  /**
   * Raw GUID stored in a buffer, 16 bytes.
   */
  RawGuidPlatformBuffer = 'RawGuidPlatformBuffer',
}
