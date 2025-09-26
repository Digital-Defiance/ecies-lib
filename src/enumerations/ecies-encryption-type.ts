import { getEciesI18nEngine } from '../i18n-setup';
import { ECIESError } from '../errors/ecies';
import { ECIESErrorTypeEnum } from './ecies-error-type';

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
  [EciesEncryptionTypeEnum.Simple]: 'simple',
  [EciesEncryptionTypeEnum.Single]: 'single',
  [EciesEncryptionTypeEnum.Multiple]: 'multiple',
};

export const EciesEncryptionTypeEnumStringMap: Record<
  EciesEncryptionTypeEnum,
  string
> = {
  [EciesEncryptionTypeEnum.Simple]: 'simple',
  [EciesEncryptionTypeEnum.Single]: 'single',
  [EciesEncryptionTypeEnum.Multiple]: 'multiple',
};

export function encryptionTypeToString(
  type: EciesEncryptionType | EciesEncryptionTypeEnum,
): string {
  // if enum
  let resultType: EciesEncryptionType;
  if (typeof type === 'number') {
    resultType = EciesEncryptionTypeEnumTypeMap[type];
    if (resultType === undefined) {
      throw new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType, getEciesI18nEngine());
    }
  } else {
    resultType = type;
  }
  const result = EciesEncryptionTypeStringMap[resultType];
  if (result === undefined) {
    throw new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType, getEciesI18nEngine());
  }
  return result;
}

export function encryptionTypeEnumToType(
  type: EciesEncryptionTypeEnum,
): EciesEncryptionType {
  const result = EciesEncryptionTypeEnumTypeMap[type];
  if (result === undefined) {
    throw new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType, getEciesI18nEngine());
  }
  return result;
}

export function validateEciesEncryptionTypeEnum(
  type: EciesEncryptionTypeEnum,
): boolean {
  return Object.values(EciesEncryptionTypeEnum).includes(type);
}

export function ensureEciesEncryptionTypeEnum(
  type: EciesEncryptionTypeEnum,
): EciesEncryptionTypeEnum {
  if (!validateEciesEncryptionTypeEnum(type)) {
    throw new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType, getEciesI18nEngine());
  }
  return type;
}
