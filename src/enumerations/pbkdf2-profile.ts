/**
 * PBKDF2 profile enumeration.
 * Defines preset configurations for PBKDF2 key derivation with different security/performance tradeoffs.
 */
export enum Pbkdf2ProfileEnum {
  /** Profile optimized for browser-based password hashing */
  BROWSER_PASSWORD = 'BROWSER_PASSWORD',
  /** High security profile with maximum iterations */
  HIGH_SECURITY = 'HIGH_SECURITY',
  /** Fast profile for testing purposes only - DO NOT use in production */
  TEST_FAST = 'TEST_FAST',
}
