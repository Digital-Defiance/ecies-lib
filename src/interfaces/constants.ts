export interface IConstants {
  UINT8_SIZE: number;
  UINT16_SIZE: number;
  UINT16_MAX: number;
  UINT32_SIZE: number;
  UINT32_MAX: number;
  UINT64_SIZE: number;
  UINT64_MAX: bigint;
  HEX_RADIX: number;
  GUID_SIZE: number;

  PasswordRegex: RegExp;
  MnemonicRegex: RegExp;

  /**
   * The length of a raw object ID (not the hex string representation)
   */
  OBJECT_ID_LENGTH: number;
}
