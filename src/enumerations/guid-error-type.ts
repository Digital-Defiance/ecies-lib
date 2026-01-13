/**
 * GUID error type enumeration.
 * Defines error conditions related to GUID validation and operations.
 */
export enum GuidErrorType {
  /** The GUID format is invalid */
  InvalidGuid = 'InvalidGuid',
  /** The GUID is invalid with additional details */
  InvalidGuidWithDetails = 'InvalidGuidWithDetails',
  /** The GUID brand/type is unknown */
  InvalidGuidUnknownBrand = 'InvalidGuidUnknownBrand',
  /** The GUID length is invalid */
  InvalidGuidUnknownLength = 'InvalidGuidUnknownLength',
}
