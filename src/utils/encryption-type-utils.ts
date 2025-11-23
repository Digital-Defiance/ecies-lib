import {
  EciesEncryptionType,
  EciesEncryptionTypeEnum,
  EciesEncryptionTypeEnumTypeMap,
  EciesEncryptionTypeStringMap,
} from '../enumerations/ecies-encryption-type';
import { ECIESErrorTypeEnum } from '../enumerations/ecies-error-type';
import { ECIESError } from '../errors/ecies';

/**
 * Converts an encryption type (string or enum) to its string representation
 * @param type The encryption type to convert
 * @returns The string representation of the encryption type
 * @throws ECIESError if the type is invalid
 */
export function encryptionTypeToString(
  type: EciesEncryptionType | EciesEncryptionTypeEnum,
): string {
  // if enum
  let resultType: EciesEncryptionType;
  if (typeof type === 'number') {
    resultType = EciesEncryptionTypeEnumTypeMap[type];
    if (resultType === undefined) {
      throw new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType);
    }
  } else {
    resultType = type;
  }
  const result = EciesEncryptionTypeStringMap[resultType];
  if (result === undefined) {
    throw new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType);
  }
  return result;
}

/**
 * Converts an encryption type enum to its type representation
 * @param type The encryption type enum to convert
 * @returns The type representation of the encryption type
 * @throws ECIESError if the type is invalid
 */
export function encryptionTypeEnumToType(
  type: EciesEncryptionTypeEnum,
): EciesEncryptionType {
  const result = EciesEncryptionTypeEnumTypeMap[type];
  if (result === undefined) {
    throw new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType);
  }
  return result;
}

/**
 * Validates that a value is a valid EciesEncryptionTypeEnum
 * @param type The value to validate
 * @returns true if the value is a valid EciesEncryptionTypeEnum, false otherwise
 */
export function validateEciesEncryptionTypeEnum(
  type: EciesEncryptionTypeEnum,
): boolean {
  return Object.values(EciesEncryptionTypeEnum).includes(type);
}

/**
 * Ensures that a value is a valid EciesEncryptionTypeEnum
 * @param type The value to validate
 * @returns The validated EciesEncryptionTypeEnum
 * @throws ECIESError if the type is invalid
 */
export function ensureEciesEncryptionTypeEnum(
  type: EciesEncryptionTypeEnum,
): EciesEncryptionTypeEnum {
  if (!validateEciesEncryptionTypeEnum(type)) {
    throw new ECIESError(ECIESErrorTypeEnum.InvalidEncryptionType);
  }
  return type;
}
