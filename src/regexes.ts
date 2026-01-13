/**
 * Regular expression for validating passwords.
 * Requires:
 * - At least one letter (A-Z or a-z)
 * - At least one digit (0-9)
 * - At least one special character
 * - Minimum length of 8 characters
 */
export const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;

/**
 * Regular expression for validating BIP39 mnemonic phrases.
 * Supports 12, 15, 18, 21, or 24 word mnemonics.
 */
export const MNEMONIC_REGEX =
  /^(?:\w+\s){11}\w+$|^(?:\w+\s){14}\w+$|^(?:\w+\s){17}\w+$|^(?:\w+\s){20}\w+$|^(?:\w+\s){23}\w+$/i;

/**
 * Regular expression for validating phone numbers.
 * Matches international phone numbers with optional country code.
 * Format: (+XXX )?XXXXXXXXXX where X is a digit
 */
export const PhoneNumberRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
