/**
 * Invalid email error type enumeration.
 * Defines error conditions related to email validation.
 */
export enum InvalidEmailErrorType {
  /** The email format is invalid */
  Invalid = 'Invalid',
  /** The email is missing or empty */
  Missing = 'Missing',
  /** The email contains leading or trailing whitespace */
  Whitespace = 'Whitespace',
}
