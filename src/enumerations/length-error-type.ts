/**
 * Length error type enumeration.
 * Defines error conditions related to length encoding and validation.
 */
export enum LengthErrorType {
  /** The length value is too short for the operation */
  LengthIsTooShort = 'LengthIsTooShort',
  /** The length value exceeds the maximum supported value */
  LengthIsTooLong = 'LengthIsTooLong',
  /** The length encoding type is invalid or not recognized */
  LengthIsInvalidType = 'LengthIsInvalidType',
}
