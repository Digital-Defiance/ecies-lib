import { Constants } from '../constants';
import { EciesStringKey } from '../enumerations';
import { EciesComponentId, getEciesI18nEngine } from '../i18n-setup';
import { IECIESConstants } from '../interfaces/ecies-consts';

export abstract class AESGCMService {
  public static readonly ALGORITHM_NAME = 'AES-GCM';
  /**
   * Encrypt data using AES-GCM
   * @param data Data to encrypt
   * @param key Key to use for encryption (must be 16, 24 or 32 bytes for AES)
   * @returns Encrypted data
   */
  public static async encrypt(
    data: Uint8Array,
    key: Uint8Array,
    authTag: boolean = false,
    eciesParams: IECIESConstants = Constants.ECIES,
    aad?: Uint8Array,
  ): Promise<{ encrypted: Uint8Array; iv: Uint8Array; tag?: Uint8Array }> {
    // Validate key length (AES supports 16, 24, or 32 bytes)
    if (!key || (key.length !== 16 && key.length !== 24 && key.length !== 32)) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidAESKeyLength,
        ),
      );
    }

    // Validate data exists (empty data is allowed for AES-GCM)
    if (!data) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_CannotEncryptEmptyData,
        ),
      );
    }
    if (data.length > eciesParams.MAX_RAW_DATA_SIZE) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate,
          { messageLength: data.length },
        ),
      );
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(key),
      { name: AESGCMService.ALGORITHM_NAME },
      false,
      ['encrypt'],
    );

    const eciesConsts = eciesParams;
    const iv = crypto.getRandomValues(new Uint8Array(eciesConsts.IV_SIZE));
    const encryptedResult = await crypto.subtle.encrypt(
      {
        name: AESGCMService.ALGORITHM_NAME,
        iv,
        additionalData: aad as BufferSource | undefined,
        ...(authTag && { tagLength: eciesConsts.AUTH_TAG_SIZE * 8 }),
      },
      cryptoKey,
      new Uint8Array(data),
    );

    const encryptedArray = new Uint8Array(encryptedResult);
    if (!authTag) {
      return { encrypted: encryptedArray, iv };
    }
    const authTagLengthBytes = eciesConsts.AUTH_TAG_SIZE;
    const encryptedBytes = encryptedArray.slice(0, -authTagLengthBytes); // Remove auth tag
    const authTagBytes = encryptedArray.slice(-authTagLengthBytes); // Last 16 bytes are auth tag

    return { encrypted: encryptedBytes, iv, tag: authTagBytes };
  }

  /**
   * Combine encrypted data and auth tag into a single Uint8Array
   * @param encryptedData The encrypted data
   * @param authTag The authentication tag
   * @returns The combined Uint8Array
   */
  public static combineEncryptedDataAndTag(
    encryptedData: Uint8Array,
    authTag: Uint8Array,
  ): Uint8Array {
    const combined = new Uint8Array(encryptedData.length + authTag.length);
    combined.set(encryptedData);
    combined.set(authTag, encryptedData.length);
    return combined;
  }

  /**
   * Combine IV and encrypted data (with optional auth tag) into a single Uint8Array
   * @param iv The initialization vector
   * @param encryptedDataWithTag The encrypted data with auth tag already appended (if applicable)
   * @returns The combined Uint8Array
   */
  public static combineIvAndEncryptedData(
    iv: Uint8Array,
    encryptedDataWithTag: Uint8Array,
  ): Uint8Array {
    const combined = new Uint8Array(iv.length + encryptedDataWithTag.length);
    combined.set(iv);
    combined.set(encryptedDataWithTag, iv.length);
    return combined;
  }

  /**
   * Combine IV, encrypted data and auth tag into a single Uint8Array
   * @param iv The initialization vector
   * @param encryptedData The encrypted data
   * @param authTag The authentication tag
   * @returns The combined Uint8Array
   */
  public static combineIvTagAndEncryptedData(
    iv: Uint8Array,
    encryptedData: Uint8Array,
    authTag: Uint8Array,
  ): Uint8Array {
    const encryptedWithTag = AESGCMService.combineEncryptedDataAndTag(
      encryptedData,
      authTag,
    );
    return AESGCMService.combineIvAndEncryptedData(iv, encryptedWithTag);
  }

  /**
   * Split combined encrypted data back into its components
   * @param combinedData The combined data containing IV, encrypted data, and optionally auth tag
   * @param hasAuthTag Whether the combined data includes an authentication tag
   * @returns Object containing the split components
   */
  public static splitEncryptedData(
    combinedData: Uint8Array,
    hasAuthTag: boolean = true,
    eciesParams: IECIESConstants = Constants.ECIES,
  ): { iv: Uint8Array; encryptedDataWithTag: Uint8Array } {
    const eciesConsts = eciesParams;
    const ivLength = eciesConsts.IV_SIZE;
    const tagLength = hasAuthTag ? eciesConsts.AUTH_TAG_SIZE : 0;

    if (combinedData.length < ivLength + tagLength) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents,
        ),
      );
    }

    const iv = combinedData.slice(0, ivLength);
    const encryptedDataWithTag = combinedData.slice(ivLength);

    return { iv, encryptedDataWithTag };
  }

  /**
   * Decrypt data using AES-GCM
   * @param iv The initialization vector
   * @param encryptedData Data to decrypt (with auth tag appended if authTag is true)
   * @param key Key to use for decryption (must be 16, 24 or 32 bytes for AES)
   * @param authTag Whether the encrypted data includes an authentication tag
   * @returns Decrypted data
   */
  public static async decrypt(
    iv: Uint8Array,
    encryptedData: Uint8Array,
    key: Uint8Array,
    authTag: boolean = false,
    eciesParams: IECIESConstants = Constants.ECIES,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    const eciesConsts = eciesParams;

    // Validate key length
    if (!key || (key.length !== 16 && key.length !== 24 && key.length !== 32)) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidAESKeyLength,
        ),
      );
    }

    // Validate IV
    if (!iv || iv.length !== eciesConsts.IV_SIZE) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_InvalidIV,
        ),
      );
    }

    // Validate encrypted data exists (empty encrypted data is allowed)
    if (!encryptedData) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_CannotDecryptEmptyData,
        ),
      );
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(key),
      { name: AESGCMService.ALGORITHM_NAME },
      false,
      ['decrypt'],
    );

    if (!authTag) {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: AESGCMService.ALGORITHM_NAME,
          iv: new Uint8Array(iv),
          additionalData: aad as BufferSource | undefined,
        },
        cryptoKey,
        new Uint8Array(encryptedData),
      );

      return new Uint8Array(decrypted);
    }

    // Decrypt with auth tag (already appended to encryptedData)
    const decryptedResult = await crypto.subtle.decrypt(
      {
        name: AESGCMService.ALGORITHM_NAME,
        iv: new Uint8Array(iv),
        tagLength: eciesConsts.AUTH_TAG_SIZE * 8,
        additionalData: aad as BufferSource | undefined,
      },
      cryptoKey,
      new Uint8Array(encryptedData),
    );

    return new Uint8Array(decryptedResult);
  }
}
