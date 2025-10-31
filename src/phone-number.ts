import { EciesStringKey } from './enumerations';
import { EciesComponentId, getEciesI18nEngine } from './i18n-setup';
import { PhoneNumberRegex } from './regexes';

export class PhoneNumber {
  private readonly _number: string;
  constructor(number: string) {
    // make sure the phone number fits the regex
    if (!PhoneNumberRegex.test(number)) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_PhoneNumber_InvalidTemplate, { phoneNumber: number }));
    }
    this._number = number;
  }
  public get number(): string {
    return this._number;
  }
}
