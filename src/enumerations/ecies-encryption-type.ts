export type EciesEncryptionType = 'simple' | 'single' | 'multiple';

export enum EciesEncryptionTypeEnum {
  Simple = 33,
  Single = 66,
  Multiple = 99,
}

export const EciesEncryptionTypeMap: Record<
  EciesEncryptionType,
  EciesEncryptionTypeEnum
> = {
  simple: EciesEncryptionTypeEnum.Simple,
  single: EciesEncryptionTypeEnum.Single,
  multiple: EciesEncryptionTypeEnum.Multiple,
};

export const EciesEncryptionTypeStringMap: Record<EciesEncryptionType, string> =
  {
    simple: 'simple',
    single: 'single',
    multiple: 'multiple',
  };

export const EciesEncryptionTypeEnumTypeMap: Record<
  EciesEncryptionTypeEnum,
  EciesEncryptionType
> = {
  33: 'simple',
  66: 'single',
  99: 'multiple',
};

export const EciesEncryptionTypeEnumStringMap: Record<
  EciesEncryptionTypeEnum,
  string
> = {
  33: 'simple',
  66: 'single',
  99: 'multiple',
};
