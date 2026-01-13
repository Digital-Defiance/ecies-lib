/**
 * String literal type for ECIES encryption types.
 * Represents the three supported encryption modes.
 */
export type EciesEncryptionType = 'simple' | 'single' | 'multiple';

/**
 * Enumeration of ECIES encryption type values.
 * Each type has a unique numeric identifier used in the encrypted message format.
 */
export enum EciesEncryptionTypeEnum {
  /** Simple encryption without data length or CRC */
  Simple = 33,
  /** Single recipient encryption with data length */
  Single = 66,
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
  simple: EciesEncryptionTypeEnum.Simple,
  single: EciesEncryptionTypeEnum.Single,
  multiple: EciesEncryptionTypeEnum.Multiple,
};

/**
 * Maps string encryption types to their string representations.
 */
export const EciesEncryptionTypeStringMap: Record<EciesEncryptionType, string> =
  {
    simple: 'simple',
    single: 'single',
    multiple: 'multiple',
  };

/**
 * Maps enum values to their string type representations.
 */
export const EciesEncryptionTypeEnumTypeMap: Record<
  EciesEncryptionTypeEnum,
  EciesEncryptionType
> = {
  33: 'simple',
  66: 'single',
  99: 'multiple',
};

/**
 * Maps enum values to their string representations.
 */
export const EciesEncryptionTypeEnumStringMap: Record<
  EciesEncryptionTypeEnum,
  string
> = {
  33: 'simple',
  66: 'single',
  99: 'multiple',
};
