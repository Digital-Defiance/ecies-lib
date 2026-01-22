/**
 * String literal type for ECIES encryption types.
 * Represents the three supported encryption modes.
 */
export type EciesEncryptionType = 'basic' | 'withLength' | 'multiple';

/**
 * Enumeration of ECIES encryption type values.
 * Each type has a unique numeric identifier used in the encrypted message format.
 */
export enum EciesEncryptionTypeEnum {
  /** Simple encryption without data length or CRC */
  Basic = 33,
  /** Single recipient encryption with data length */
  WithLength = 66,
  /** Multiple recipient encryption */
  Multiple = 99,
}

/**
 * Maps string encryption types to their enum values.
 */
export const EciesEncryptionTypeMap: Record<
  EciesEncryptionType,
  EciesEncryptionTypeEnum
> = {
  basic: EciesEncryptionTypeEnum.Basic,
  withLength: EciesEncryptionTypeEnum.WithLength,
  multiple: EciesEncryptionTypeEnum.Multiple,
};

/**
 * Maps string encryption types to their string representations.
 */
export const EciesEncryptionTypeStringMap: Record<EciesEncryptionType, string> =
  {
    basic: 'basic',
    withLength: 'withLength',
    multiple: 'multiple',
  };

/**
 * Maps enum values to their string type representations.
 */
export const EciesEncryptionTypeEnumTypeMap: Record<
  EciesEncryptionTypeEnum,
  EciesEncryptionType
> = {
  33: 'basic',
  66: 'withLength',
  99: 'multiple',
};

/**
 * Maps enum values to their string representations.
 */
export const EciesEncryptionTypeEnumStringMap: Record<
  EciesEncryptionTypeEnum,
  string
> = {
  33: 'basic',
  66: 'withLength',
  99: 'multiple',
};
