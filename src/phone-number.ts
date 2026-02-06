import { EciesStringKey } from './enumerations';
import { getEciesI18nEngine } from './i18n-setup';
import { PhoneNumberRegex } from './regexes';

/**
 * Represents a validated phone number.
 * Ensures the phone number matches the expected format.
 */
export class PhoneNumber {
  private readonly _number: string;

  /**
   * Creates a new PhoneNumber instance.
   * @param number The phone number string to validate
   * @throws {Error} If the phone number doesn't match the expected format
   */
  constructor(number: string) {
    // make sure the phone number fits the regex
    if (!PhoneNumberRegex.test(number)) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translateStringKey(
          EciesStringKey.Error_PhoneNumber_InvalidTemplate,
          { phoneNumber: number },
        ),
      );
    }
    this._number = number;
  }
  /**
   * Gets the validated phone number string.
   */
  public get number(): string {
    return this._number;
  }
}
