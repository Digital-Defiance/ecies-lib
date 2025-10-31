import { PhoneNumber } from '../src/phone-number';

describe('PhoneNumber', () => {
  it('should create a phone number object for a valid 10-digit number', () => {
    const phone = new PhoneNumber('1234567890');
    expect(phone.number).toBe('1234567890');
  });

  it('should create a phone number object with country code', () => {
    const phone = new PhoneNumber('+1 1234567890');
    expect(phone.number).toBe('+1 1234567890');
  });

  it('should create a phone number object with country code and dash', () => {
    const phone = new PhoneNumber('+1-1234567890');
    expect(phone.number).toBe('+1-1234567890');
  });

  it('should throw an error for an invalid phone number', () => {
    expect(() => new PhoneNumber('123')).toThrow();
  });

  it('should throw an error for a phone number with letters', () => {
    expect(() => new PhoneNumber('123456789a')).toThrow();
  });

  it('should throw an error for an empty phone number', () => {
    expect(() => new PhoneNumber('')).toThrow();
  });

  it('should throw an error for a phone number with too many digits', () => {
    expect(() => new PhoneNumber('12345678901')).toThrow();
  });

  it('should throw an error for a phone number with too few digits', () => {
    expect(() => new PhoneNumber('123456789')).toThrow();
  });
});
