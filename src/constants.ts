import { ObjectId } from 'bson';
import { MNEMONIC_REGEX, PASSWORD_REGEX } from './regexes';
import { IConstants } from './interfaces/constants';

export const UINT8_SIZE: number = 1 as const;
export const UINT16_SIZE: number = 2 as const;
export const UINT16_MAX: number = 65535 as const;
export const UINT32_SIZE: number = 4 as const;
export const UINT32_MAX: number = 4294967295 as const;
export const UINT64_SIZE: number = 8 as const;
export const UINT64_MAX: bigint = 18446744073709551615n as const;
/**
 * Standard size of a UUID v4 in bytes.
 */
export const GUID_SIZE: number = 16 as const;

const objectIdLength = new ObjectId().toHexString().length / 2;

export const Constants: IConstants = Object.freeze({
  /**
   * The length of a raw object ID (not the hex string representation)
   */
  OBJECT_ID_LENGTH: objectIdLength,

  UINT8_SIZE: UINT8_SIZE,
  UINT16_SIZE: UINT16_SIZE,
  UINT16_MAX: UINT16_MAX,
  UINT32_SIZE: UINT32_SIZE,
  UINT32_MAX: UINT32_MAX,
  UINT64_SIZE: UINT64_SIZE,
  UINT64_MAX: UINT64_MAX,
  HEX_RADIX: 16 as const,
  GUID_SIZE: GUID_SIZE,
  PasswordRegex: PASSWORD_REGEX,
  MnemonicRegex: MNEMONIC_REGEX,
} as const);

if (objectIdLength !== 12) {
  console.warn(
    'ObjectID length may have changed, breaking encryption',
    objectIdLength,
  );
}
