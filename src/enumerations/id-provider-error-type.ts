/**
 * Enumeration of ID provider error types.
 * These errors occur during ID generation, validation, serialization, or deserialization.
 */
export enum IdProviderErrorType {
  /**
   * ID buffer length does not match expected byte length.
   */
  InvalidLength = 'InvalidLength',

  /**
   * Input is not a string when string is required.
   */
  InputMustBeString = 'InputMustBeString',

  /**
   * String length is incorrect for deserialization.
   */
  InvalidStringLength = 'InvalidStringLength',

  /**
   * String contains invalid characters for the format.
   */
  InvalidCharacters = 'InvalidCharacters',

  /**
   * Deserialized ID failed validation.
   */
  InvalidDeserializedId = 'InvalidDeserializedId',

  /**
   * Invalid byte length parameter (CustomIdProvider).
   */
  InvalidByteLengthParameter = 'InvalidByteLengthParameter',

  /**
   * Failed to parse or convert ID format.
   */
  ParseFailed = 'ParseFailed',

  /**
   * GUID buffer is invalid.
   */
  InvalidGuidBuffer = 'InvalidGuidBuffer',

  /**
   * Invalid UUID format.
   */
  InvalidUuidFormat = 'InvalidUuidFormat',
}
