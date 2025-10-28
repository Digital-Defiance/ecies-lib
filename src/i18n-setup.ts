import {
  ComponentDefinition,
  ComponentRegistration,
  PluginI18nEngine,
  LanguageRegistry,
  createLanguageDefinition,
} from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from './enumerations/ecies-string-key';

export const EciesI18nEngineKey = 'DigitalDefiance.Ecies.I18nEngine' as const;
export const EciesComponentId = 'ecies' as const;

// ECIES supported language codes
export const EciesLanguageCodes = {
  EN_US: 'en-US',
  EN_GB: 'en-GB',
  FR: 'fr',
  ES: 'es',
  DE: 'de',
  ZH_CN: 'zh-CN',
  JA: 'ja',
  UK: 'uk',
} as const;

export type EciesSupportedLanguageCode = typeof EciesLanguageCodes[keyof typeof EciesLanguageCodes];

export function initEciesI18nEngine() {
  // Create unique instance key for test environments
  const instanceKey =
    process.env.NODE_ENV === 'test'
      ? `${EciesI18nEngineKey}-${Date.now()}-${Math.random()}`
      : EciesI18nEngineKey;

  // Create the ECIES component definition
  const EciesComponent: ComponentDefinition<EciesStringKey> = {
    id: EciesComponentId,
    name: 'ECIES Library Strings',
    stringKeys: Object.values(EciesStringKey),
  };

  // Build complete translations for all string keys
  const englishTranslations: Record<EciesStringKey, string> = {
    // ECIES Error Types - buildReasonMap(ECIESErrorTypeEnum, 'Error', 'ECIESError')
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleEncryptedKeySize]:
      'Invalid ECIES multiple encrypted key size',
    [EciesStringKey.Error_ECIESError_InvalidECIESPublicKeyLength]:
      'Invalid ECIES public key length',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientCountSize]:
      'Invalid ECIES multiple recipient count size',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleDataLengthSize]:
      'Invalid ECIES multiple data length size',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientIdSize]:
      'Invalid ECIES multiple recipient ID size',
    [EciesStringKey.Error_ECIESError_CRCError]: 'CRC error',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionType]:
      'Invalid encryption type',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate]: 'Invalid encryption type: {encryptionType}',
    [EciesStringKey.Error_ECIESError_InvalidIVLength]: 'Invalid IV length',
    [EciesStringKey.Error_ECIESError_InvalidAuthTagLength]:
      'Invalid auth tag length',
    [EciesStringKey.Error_ECIESError_InvalidHeaderLength]:
      'Invalid header length',
    [EciesStringKey.Error_ECIESError_InvalidDataLength]: 'Invalid data length',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedDataLength]:
      'Invalid encrypted data length',
    [EciesStringKey.Error_ECIESError_InvalidMessageCrc]: 'Invalid message CRC',
    [EciesStringKey.Error_ECIESError_InvalidMnemonic]: 'Invalid mnemonic',
    [EciesStringKey.Error_ECIESError_InvalidOperation]: 'Invalid operation',
    [EciesStringKey.Error_ECIESError_MessageLengthMismatch]:
      'Message length mismatch',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLength]:
      'Invalid encrypted key length',
    [EciesStringKey.Error_ECIESError_InvalidEphemeralPublicKey]:
      'Invalid ephemeral public key',
    [EciesStringKey.Error_ECIESError_RecipientNotFound]:
      'Recipient not found in recipient IDs',
    [EciesStringKey.Error_ECIESError_InvalidSignature]: 'Invalid signature',
    [EciesStringKey.Error_ECIESError_InvalidSenderPublicKey]:
      'Invalid sender public key',
    [EciesStringKey.Error_ECIESError_TooManyRecipients]:
      'Too many recipients: exceeds maximum allowed',
    [EciesStringKey.Error_ECIESError_PrivateKeyNotLoaded]:
      'Private key not loaded',
    [EciesStringKey.Error_ECIESError_RecipientKeyCountMismatch]:
      'Recipient count does not match key count',
    [EciesStringKey.Error_ECIESError_InvalidRecipientCount]:
      'Invalid recipient count',
    [EciesStringKey.Error_ECIESError_FileSizeTooLarge]: 'File size too large',
    [EciesStringKey.Error_ECIESError_DecryptionFailed]:
      'Decryption operation failed',
    [EciesStringKey.Error_ECIESError_InvalidRecipientPublicKey]:
      'Invalid recipient public key provided for encryption',
    [EciesStringKey.Error_ECIESError_SecretComputationFailed]:
      'Failed to compute shared secret during ECIES operation',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForKeyEncryption]:
      'Authentication tag is required for key encryption',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate]:
      'Invalid encrypted key length: expected {keySize}, got {encryptedKeyLength}',
    [EciesStringKey.Error_ECIESError_FailedToDecryptKey]: 'Failed to decrypt key',
    [EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate]: 'Too many recipients: {recipientsCount}',
    [EciesStringKey.Error_ECIESError_MessageTooLargeTemplate]: 'Message too large: {length}',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption]: 'Authentication tag is required for ECIES encryption',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption]: 'Authentication tag is required for multi-recipient ECIES encryption',
    [EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch]: 'Decrypted data length mismatch',
    [EciesStringKey.Error_ECIESError_RecipientCountMismatch]: 'Recipient count mismatch',
    [EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader]: 'Data too short for multi-recipient header',
    [EciesStringKey.Error_ECIESError_FailedToDecryptChallengeTemplate]: 'Failed to decrypt challenge: {error}',
    [EciesStringKey.Error_ECIESError_InvalidChallengeSignature]: 'Invalid challenge signature',
    [EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey]: 'Failed to derive private key',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate]: 'Invalid public key format or length: {keyLength}',
    [EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey]: 'Received null or undefined public key',
    [EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate]: 'Message length exceeds maximum allowed size: {messageLength}',
    [EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode]: 'Multiple encryption type not supported in single recipient mode',
    [EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate]: 'Encryption type mismatch: expected {encryptionType}, got {actualEncryptionType}',
    [EciesStringKey.Error_ECIESError_DataTooShortTemplate]: 'Data too short: required {requiredSize}, got {dataLength}',
    [EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate]: 'Data length mismatch: expected {expectedDataLength}, got {receivedDataLength}',
    [EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents]: 'Combined data is too short to contain required components',

    // Member Error Types - buildReasonMap(MemberErrorType, 'Error', 'MemberError')
    [EciesStringKey.Error_MemberError_MissingMemberName]:
      'Member name is required',
    [EciesStringKey.Error_MemberError_InvalidMemberNameWhitespace]:
      'Member name contains trailing or leading whitespace.',
    [EciesStringKey.Error_MemberError_InvalidEmail]: 'Invalid email.',
    [EciesStringKey.Error_MemberError_InvalidMemberName]:
      'Invalid member name.',
    [EciesStringKey.Error_MemberError_InvalidMemberStatus]:
      'Invalid member status.',
    [EciesStringKey.Error_MemberError_MissingEmail]: 'Missing email.',
    [EciesStringKey.Error_MemberError_InvalidEmailWhitespace]:
      'Email contains trailing or leading whitespace.',
    [EciesStringKey.Error_MemberError_MissingPrivateKey]:
      'Missing private key.',
    [EciesStringKey.Error_MemberError_NoWallet]: 'No wallet loaded.',
    [EciesStringKey.Error_MemberError_WalletAlreadyLoaded]:
      'Wallet already loaded.',
    [EciesStringKey.Error_MemberError_InvalidMnemonic]:
      'Invalid wallet mnemonic.',
    [EciesStringKey.Error_MemberError_IncorrectOrInvalidPrivateKey]:
      'Incorrect or invalid private key for public key',
    [EciesStringKey.Error_MemberError_MemberNotFound]: 'Member not found.',
    [EciesStringKey.Error_MemberError_MemberAlreadyExists]:
      'Member already exists.',
    [EciesStringKey.Error_MemberError_FailedToHydrateMember]:
      'Failed to hydrate member.',
    [EciesStringKey.Error_MemberError_InvalidMemberData]:
      'Invalid member data.',
    [EciesStringKey.Error_MemberError_FailedToConvertMemberData]:
      'Failed to convert member data.',
    [EciesStringKey.Error_MemberError_MissingEncryptionData]:
      'Missing encryption data.',
    [EciesStringKey.Error_MemberError_EncryptionDataTooLarge]:
      'Encryption data too large.',
    [EciesStringKey.Error_MemberError_InvalidEncryptionData]:
      'Invalid encryption data.',

    // GUID Error Types - buildReasonMap(GuidErrorType, 'Error', 'GuidError')
    [EciesStringKey.Error_GuidError_Invalid]: 'Invalid GUID format',
    [EciesStringKey.Error_GuidError_InvalidWithGuidTemplate]:
      'Invalid GUID: {GUID}',
    [EciesStringKey.Error_GuidError_UnknownBrandTemplate]:
      'Unknown GUID brand: {BRAND}.',
    [EciesStringKey.Error_GuidError_UnknownLengthTemplate]:
      'Invalid GUID length: {LENGTH}.',

    // Length Error Types - buildReasonMap(LengthErrorType, 'Error', 'LengthError')
    [EciesStringKey.Error_LengthError_LengthIsTooShort]: 'Length is too short.',
    [EciesStringKey.Error_LengthError_LengthIsTooLong]: 'Length is too long.',
    [EciesStringKey.Error_LengthError_LengthIsInvalidType]:
      'Length is of an invalid type.',

    // PBKDF2 Error Types - buildReasonMap(Pbkdf2ErrorType, 'Error', 'Pbkdf2Error')
    [EciesStringKey.Error_Pbkdf2Error_InvalidProfile]:
      'Invalid PBKDF2 profile specified',
    [EciesStringKey.Error_Pbkdf2Error_InvalidSaltLength]:
      'Salt length does not match expected length',
    [EciesStringKey.Error_Pbkdf2Error_InvalidHashLength]:
      'Hash length does not match expected length',

    // Secure Storage Error Types - buildReasonMap(SecureStorageErrorType, 'Error', 'SecureStorageError')
    [EciesStringKey.Error_SecureStorageError_DecryptedValueLengthMismatch]:
      'Decrypted value length does not match expected length',
    [EciesStringKey.Error_SecureStorageError_DecryptedValueChecksumMismatch]:
      'Decrypted value checksum does not match',
    [EciesStringKey.Error_SecureStorageError_ValueIsNull]:
      'Secure storage value is null',
    [EciesStringKey.Error_InvalidEmailError_Invalid]: 'Invalid email address.',
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      'Encryption failed: no authentication tag generated',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      'Failed to store password login data',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      'Password login is not set up',
  };

  const frenchTranslations: Record<EciesStringKey, string> = {
    // ECIES Error Types - buildReasonMap(ECIESErrorTypeEnum, 'Error', 'ECIESError')
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleEncryptedKeySize]:
      'Taille invalide de clé ECIES multiple chiffrée',
    [EciesStringKey.Error_ECIESError_InvalidECIESPublicKeyLength]:
      'Longueur de clé publique ECIES invalide',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientCountSize]:
      'Taille invalide du nombre de destinataires ECIES multiples',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleDataLengthSize]:
      'Taille invalide de la longueur des données ECIES multiples',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientIdSize]:
      'Taille invalide de l’identifiant de destinataire ECIES multiple',
    [EciesStringKey.Error_ECIESError_CRCError]: 'Erreur CRC',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionType]:
      'Type de chiffrement invalide',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate]: 'Type de chiffrement invalide : {encryptionType}',
    [EciesStringKey.Error_ECIESError_InvalidIVLength]: 'Longueur d’IV invalide',
    [EciesStringKey.Error_ECIESError_InvalidAuthTagLength]:
      'Longueur de balise d’authentification invalide',
    [EciesStringKey.Error_ECIESError_InvalidHeaderLength]:
      'Longueur d’en-tête invalide',
    [EciesStringKey.Error_ECIESError_InvalidDataLength]:
      'Longueur de données invalide',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedDataLength]:
      'Longueur de données chiffrées invalide',
    [EciesStringKey.Error_ECIESError_InvalidMessageCrc]:
      'CRC de message invalide',
    [EciesStringKey.Error_ECIESError_InvalidMnemonic]: 'Mnémonique invalide',
    [EciesStringKey.Error_ECIESError_InvalidOperation]: 'Opération invalide',
    [EciesStringKey.Error_ECIESError_MessageLengthMismatch]:
      'Incohérence de longueur de message',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLength]:
      'Longueur de clé chiffrée invalide',
    [EciesStringKey.Error_ECIESError_InvalidEphemeralPublicKey]:
      'Clé publique éphémère invalide',
    [EciesStringKey.Error_ECIESError_RecipientNotFound]:
      'Destinataire introuvable dans les identifiants',
    [EciesStringKey.Error_ECIESError_InvalidSignature]: 'Signature invalide',
    [EciesStringKey.Error_ECIESError_InvalidSenderPublicKey]:
      'Clé publique de l’expéditeur invalide',
    [EciesStringKey.Error_ECIESError_TooManyRecipients]:
      'Trop de destinataires : dépasse le maximum autorisé',
    [EciesStringKey.Error_ECIESError_PrivateKeyNotLoaded]:
      'Clé privée non chargée',
    [EciesStringKey.Error_ECIESError_RecipientKeyCountMismatch]:
      'Le nombre de destinataires ne correspond pas au nombre de clés',
    [EciesStringKey.Error_ECIESError_InvalidRecipientCount]:
      'Nombre de destinataires invalide',
    [EciesStringKey.Error_ECIESError_FileSizeTooLarge]:
      'Taille de fichier trop grande',
    [EciesStringKey.Error_ECIESError_DecryptionFailed]:
      "Échec de l'opération de déchiffrement",
    [EciesStringKey.Error_ECIESError_InvalidRecipientPublicKey]:
      'Clé publique de destinataire invalide fournie pour le chiffrement',
    [EciesStringKey.Error_ECIESError_SecretComputationFailed]:
      'Échec du calcul du secret partagé lors de l’opération ECIES',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForKeyEncryption]:
      'Une balise d’authentification est requise pour le chiffrement de clé',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate]:
      'Longueur de clé chiffrée invalide : attendu {keySize}, obtenu {encryptedKeyLength}',
    [EciesStringKey.Error_ECIESError_FailedToDecryptKey]: 'Échec du déchiffrement de la clé',
    [EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate]: 'Trop de destinataires : {recipientsCount}',
    [EciesStringKey.Error_ECIESError_MessageTooLargeTemplate]: 'Message trop volumineux : {length}',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption]: 'Une balise d’authentification est requise pour le chiffrement ECIES.',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption]: 'Une balise d’authentification est requise pour le chiffrement ECIES à plusieurs destinataires.',
    [EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch]: 'Incohérence de longueur de données déchiffrées',
    [EciesStringKey.Error_ECIESError_RecipientCountMismatch]: 'Incohérence du nombre de destinataires',
    [EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader]: 'Données trop courtes pour l’en-tête à plusieurs destinataires',
    [EciesStringKey.Error_ECIESError_FailedToDecryptChallengeTemplate]: 'Échec du déchiffrement du défi : {error}',
    [EciesStringKey.Error_ECIESError_InvalidChallengeSignature]: 'Signature de défi invalide',
    [EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey]: 'Échec de la dérivation de la clé privée',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate]: 'Format ou longueur de clé publique invalide : {keyLength}',
    [EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey]: 'Clé publique reçue nulle ou indéfinie',
    [EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate]: 'La longueur du message dépasse la taille maximale autorisée : {messageLength}',
    [EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode]: 'Le type de chiffrement multiple n’est pas pris en charge en mode à un seul destinataire.',
    [EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate]: 'Incohérence de type de chiffrement : attendu {encryptionType}, obtenu {actualEncryptionType}',
    [EciesStringKey.Error_ECIESError_DataTooShortTemplate]: 'Données trop courtes : requises {requiredSize}, obtenues {dataLength}.',
    [EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate]: 'Incohérence de longueur de données : attendu {expectedDataLength}, obtenu {receivedDataLength}.',
    [EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents]: 'Les données combinées sont trop courtes pour contenir les composants requis.',

    // Member Error Types - buildReasonMap(MemberErrorType, 'Error', 'MemberError')
    [EciesStringKey.Error_MemberError_MissingMemberName]:
      'Nom du membre manquant.',
    [EciesStringKey.Error_MemberError_InvalidMemberNameWhitespace]:
      'Le nom du membre contient des espaces en début ou fin.',
    [EciesStringKey.Error_MemberError_InvalidEmail]: 'E-mail invalide.',
    [EciesStringKey.Error_MemberError_InvalidMemberName]:
      'Nom de membre invalide.',
    [EciesStringKey.Error_MemberError_InvalidMemberStatus]:
      'Statut du membre invalide.',
    [EciesStringKey.Error_MemberError_MissingEmail]: 'E-mail manquant.',
    [EciesStringKey.Error_MemberError_InvalidEmailWhitespace]:
      'L’e-mail contient des espaces en début ou fin.',
    [EciesStringKey.Error_MemberError_MissingPrivateKey]:
      'Clé privée manquante.',
    [EciesStringKey.Error_MemberError_NoWallet]: 'Aucun portefeuille chargé.',
    [EciesStringKey.Error_MemberError_WalletAlreadyLoaded]:
      'Portefeuille déjà chargé.',
    [EciesStringKey.Error_MemberError_InvalidMnemonic]:
      'Mnémonique du portefeuille invalide.',
    [EciesStringKey.Error_MemberError_IncorrectOrInvalidPrivateKey]:
      'Clé privée incorrecte ou invalide pour la clé publique',
    [EciesStringKey.Error_MemberError_MemberNotFound]: 'Membre introuvable.',
    [EciesStringKey.Error_MemberError_MemberAlreadyExists]:
      'Le membre existe déjà.',
    [EciesStringKey.Error_MemberError_FailedToHydrateMember]:
      'Échec de l’hydratation du membre.',
    [EciesStringKey.Error_MemberError_InvalidMemberData]:
      'Données du membre invalides.',
    [EciesStringKey.Error_MemberError_FailedToConvertMemberData]:
      'Échec de la conversion des données du membre.',
    [EciesStringKey.Error_MemberError_MissingEncryptionData]:
      'Données de chiffrement manquantes.',
    [EciesStringKey.Error_MemberError_EncryptionDataTooLarge]:
      'Données de chiffrement trop volumineuses.',
    [EciesStringKey.Error_MemberError_InvalidEncryptionData]:
      'Données de chiffrement invalides.',

    // GUID Error Types - buildReasonMap(GuidErrorType, 'Error', 'GuidError')
    [EciesStringKey.Error_GuidError_Invalid]: 'GUID invalide.',
    [EciesStringKey.Error_GuidError_InvalidWithGuidTemplate]:
      'GUID invalide : {GUID}',
    [EciesStringKey.Error_GuidError_UnknownBrandTemplate]:
      'Marque de GUID inconnue : {BRAND}.',
    [EciesStringKey.Error_GuidError_UnknownLengthTemplate]:
      'Longueur de GUID invalide : {LENGTH}.',

    // Length Error Types - buildReasonMap(LengthErrorType, 'Error', 'LengthError')
    [EciesStringKey.Error_LengthError_LengthIsTooShort]:
      'La longueur est trop courte.',
    [EciesStringKey.Error_LengthError_LengthIsTooLong]:
      'La longueur est trop longue.',
    [EciesStringKey.Error_LengthError_LengthIsInvalidType]:
      'La longueur est d’un type invalide.',

    // PBKDF2 Error Types - buildReasonMap(Pbkdf2ErrorType, 'Error', 'Pbkdf2Error')
    [EciesStringKey.Error_Pbkdf2Error_InvalidProfile]:
      'Profil PBKDF2 invalide spécifié',
    [EciesStringKey.Error_Pbkdf2Error_InvalidSaltLength]:
      'La longueur du sel ne correspond pas à celle attendue',
    [EciesStringKey.Error_Pbkdf2Error_InvalidHashLength]:
      'La longueur du hachage ne correspond pas à celle attendue',

    // Secure Storage Error Types - buildReasonMap(SecureStorageErrorType, 'Error', 'SecureStorageError')
    [EciesStringKey.Error_SecureStorageError_DecryptedValueLengthMismatch]:
      'La longueur de la valeur déchiffrée ne correspond pas à celle attendue',
    [EciesStringKey.Error_SecureStorageError_DecryptedValueChecksumMismatch]:
      'La somme de contrôle de la valeur déchiffrée ne correspond pas',
    [EciesStringKey.Error_SecureStorageError_ValueIsNull]:
      'La valeur du stockage sécurisé est nulle',
    [EciesStringKey.Error_InvalidEmailError_Invalid]:
      'Adresse e-mail invalide.',
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      'Échec du chiffrement : aucune balise d’authentification générée',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      'Échec du stockage des données de connexion par mot de passe',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      'La connexion par mot de passe n’est pas configurée',
  };
  const mandarinChineseTranslations: Record<EciesStringKey, string> = {
    // ECIES Error Types - buildReasonMap(ECIESErrorTypeEnum, 'Error', 'ECIESError')
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleEncryptedKeySize]:
      'ECIES 多重加密密钥大小无效',
    [EciesStringKey.Error_ECIESError_InvalidECIESPublicKeyLength]:
      'ECIES 公钥长度无效',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientCountSize]:
      'ECIES 多重收件人计数字段长度无效',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleDataLengthSize]:
      'ECIES 多重数据长度字段无效',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientIdSize]:
      'ECIES 多重收件人 ID 大小无效',
    [EciesStringKey.Error_ECIESError_CRCError]: 'CRC 错误',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionType]: '加密类型无效',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate]: '无效的加密类型：{encryptionType}',
    [EciesStringKey.Error_ECIESError_InvalidIVLength]: 'IV 长度无效',
    [EciesStringKey.Error_ECIESError_InvalidAuthTagLength]: '认证标签长度无效',
    [EciesStringKey.Error_ECIESError_InvalidHeaderLength]: '头部长度无效',
    [EciesStringKey.Error_ECIESError_InvalidDataLength]: '数据长度无效',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedDataLength]:
      '加密数据长度无效',
    [EciesStringKey.Error_ECIESError_InvalidMessageCrc]: '消息 CRC 无效',
    [EciesStringKey.Error_ECIESError_InvalidMnemonic]: '助记词无效',
    [EciesStringKey.Error_ECIESError_InvalidOperation]: '操作无效',
    [EciesStringKey.Error_ECIESError_MessageLengthMismatch]: '消息长度不匹配',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLength]:
      '加密密钥长度无效',
    [EciesStringKey.Error_ECIESError_InvalidEphemeralPublicKey]: '临时公钥无效',
    [EciesStringKey.Error_ECIESError_RecipientNotFound]:
      '在收件人 ID 中未找到收件人',
    [EciesStringKey.Error_ECIESError_InvalidSignature]: '签名无效',
    [EciesStringKey.Error_ECIESError_InvalidSenderPublicKey]: '发送者公钥无效',
    [EciesStringKey.Error_ECIESError_TooManyRecipients]:
      '收件人过多：超出最大允许数量',
    [EciesStringKey.Error_ECIESError_PrivateKeyNotLoaded]: '未加载私钥',
    [EciesStringKey.Error_ECIESError_RecipientKeyCountMismatch]:
      '收件人数与密钥数不匹配',
    [EciesStringKey.Error_ECIESError_InvalidRecipientCount]: '收件人数无效',
    [EciesStringKey.Error_ECIESError_FileSizeTooLarge]: '文件大小过大',
    [EciesStringKey.Error_ECIESError_DecryptionFailed]:
      'ECIES 解密失败（MAC 校验或填充错误）',
    [EciesStringKey.Error_ECIESError_InvalidRecipientPublicKey]:
      '用于加密的收件人公钥无效',
    [EciesStringKey.Error_ECIESError_SecretComputationFailed]:
      '在 ECIES 操作期间计算共享密钥失败',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForKeyEncryption]:
      '密钥加密需要身份验证标签',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate]:
      '无效的加密密钥长度：预期 {keySize}，实际 {encryptedKeyLength}。',
    [EciesStringKey.Error_ECIESError_FailedToDecryptKey]: '解密密钥失败',
    [EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate]: '收件人过多：{recipientsCount}',
    [EciesStringKey.Error_ECIESError_MessageTooLargeTemplate]: '消息过大：{length}',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption]: 'ECIES 加密需要身份验证标签',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption]: '多重收件人 ECIES 加密需要身份验证标签',
    [EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch]: '解密数据长度不匹配',
    [EciesStringKey.Error_ECIESError_RecipientCountMismatch]: '收件人数不匹配',
    [EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader]: '多重收件人头部数据过短',
    [EciesStringKey.Error_ECIESError_FailedToDecryptChallengeTemplate]: '解密挑战失败：{error}',
    [EciesStringKey.Error_ECIESError_InvalidChallengeSignature]: '无效的挑战签名',
    [EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey]: '派生私钥失败',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate]: '无效的公钥格式或长度：{keyLength}',
    [EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey]: '接收到的公钥为 null 或未定义',
    [EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate]: '消息长度超过最大允许大小：{messageLength}',
    [EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode]: '不支持在单一收件人模式下使用多重加密类型',
    [EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate]: '加密类型不匹配：预期 {encryptionType}，实际 {actualEncryptionType}。',
    [EciesStringKey.Error_ECIESError_DataTooShortTemplate]: '数据过短：需要 {requiredSize}，实际 {dataLength}。',
    [EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate]: '数据长度不匹配：预期 {expectedDataLength}，实际 {receivedDataLength}。',
    [EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents]: '组合数据过短，无法包含所需组件',

    // Member Error Types - buildReasonMap(MemberErrorType, 'Error', 'MemberError')
    [EciesStringKey.Error_MemberError_MissingMemberName]: '缺少成员名称。',
    [EciesStringKey.Error_MemberError_InvalidMemberNameWhitespace]:
      '成员名称包含首尾空白字符。',
    [EciesStringKey.Error_MemberError_InvalidEmail]: '电子邮件无效。',
    [EciesStringKey.Error_MemberError_InvalidMemberName]: '成员名称无效。',
    [EciesStringKey.Error_MemberError_InvalidMemberStatus]: '成员状态无效。',
    [EciesStringKey.Error_MemberError_MissingEmail]: '缺少电子邮件。',
    [EciesStringKey.Error_MemberError_InvalidEmailWhitespace]:
      '电子邮件包含首尾空白字符。',
    [EciesStringKey.Error_MemberError_MissingPrivateKey]: '缺少私钥。',
    [EciesStringKey.Error_MemberError_NoWallet]: '未加载钱包。',
    [EciesStringKey.Error_MemberError_WalletAlreadyLoaded]: '钱包已加载。',
    [EciesStringKey.Error_MemberError_InvalidMnemonic]: '钱包助记词无效。',
    [EciesStringKey.Error_MemberError_IncorrectOrInvalidPrivateKey]:
      '用于该公钥的私钥不正确或无效',
    [EciesStringKey.Error_MemberError_MemberNotFound]: '未找到成员。',
    [EciesStringKey.Error_MemberError_MemberAlreadyExists]: '成员已存在。',
    [EciesStringKey.Error_MemberError_FailedToHydrateMember]: '成员加载失败。',
    [EciesStringKey.Error_MemberError_InvalidMemberData]: '成员数据无效。',
    [EciesStringKey.Error_MemberError_FailedToConvertMemberData]:
      '成员数据转换失败。',
    [EciesStringKey.Error_MemberError_MissingEncryptionData]: '缺少加密数据。',
    [EciesStringKey.Error_MemberError_EncryptionDataTooLarge]: '加密数据过大。',
    [EciesStringKey.Error_MemberError_InvalidEncryptionData]: '加密数据无效。',

    // GUID Error Types - buildReasonMap(GuidErrorType, 'Error', 'GuidError')
    [EciesStringKey.Error_GuidError_Invalid]: 'GUID 无效。',
    [EciesStringKey.Error_GuidError_InvalidWithGuidTemplate]:
      'GUID 无效：{GUID}',
    [EciesStringKey.Error_GuidError_UnknownBrandTemplate]:
      '未知的 GUID 品牌：{BRAND}。',
    [EciesStringKey.Error_GuidError_UnknownLengthTemplate]:
      'GUID 长度无效：{LENGTH}。',

    // Length Error Types - buildReasonMap(LengthErrorType, 'Error', 'LengthError')
    [EciesStringKey.Error_LengthError_LengthIsTooShort]: '长度过短。',
    [EciesStringKey.Error_LengthError_LengthIsTooLong]: '长度过长。',
    [EciesStringKey.Error_LengthError_LengthIsInvalidType]: '长度类型无效。',

    // PBKDF2 Error Types - buildReasonMap(Pbkdf2ErrorType, 'Error', 'Pbkdf2Error')
    [EciesStringKey.Error_Pbkdf2Error_InvalidProfile]: '指定的PBKDF2配置文件无效',
    [EciesStringKey.Error_Pbkdf2Error_InvalidSaltLength]: '盐值长度与预期不符',
    [EciesStringKey.Error_Pbkdf2Error_InvalidHashLength]: '哈希长度与预期不符',

    // Secure Storage Error Types - buildReasonMap(SecureStorageErrorType, 'Error', 'SecureStorageError')
    [EciesStringKey.Error_SecureStorageError_DecryptedValueLengthMismatch]:
      '解密后的值长度与预期不符',
    [EciesStringKey.Error_SecureStorageError_DecryptedValueChecksumMismatch]:
      '解密后的值校验和不匹配',
    [EciesStringKey.Error_SecureStorageError_ValueIsNull]: '安全存储的值为空',
    [EciesStringKey.Error_InvalidEmailError_Invalid]: '电子邮件地址无效。',
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      '加密失败：未生成认证标签',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      '存储密码登录数据失败',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      '密码登录未设置',
  };
  const spanishTranslations: Record<EciesStringKey, string> = {
    // ECIES Error Types - buildReasonMap(ECIESErrorTypeEnum, 'Error', 'ECIESError')
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleEncryptedKeySize]:
      'Tamaño de clave cifrada múltiple de ECIES no válido',
    [EciesStringKey.Error_ECIESError_InvalidECIESPublicKeyLength]:
      'Longitud de clave pública de ECIES no válida',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientCountSize]:
      'Tamaño del contador de destinatarios múltiples de ECIES no válido',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleDataLengthSize]:
      'Tamaño de la longitud de datos múltiples de ECIES no válido',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientIdSize]:
      'Tamaño de ID de destinatario múltiple de ECIES no válido',
    [EciesStringKey.Error_ECIESError_CRCError]: 'Error CRC',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionType]:
      'Tipo de cifrado no válido',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate]: 'Tipo de cifrado no válido: {encryptionType}',
    [EciesStringKey.Error_ECIESError_InvalidIVLength]:
      'Longitud de IV no válida',
    [EciesStringKey.Error_ECIESError_InvalidAuthTagLength]:
      'Longitud de etiqueta de autenticación no válida',
    [EciesStringKey.Error_ECIESError_InvalidHeaderLength]:
      'Longitud de encabezado no válida',
    [EciesStringKey.Error_ECIESError_InvalidDataLength]:
      'Longitud de datos no válida',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedDataLength]:
      'Longitud de datos cifrados no válida',
    [EciesStringKey.Error_ECIESError_InvalidMessageCrc]:
      'CRC de mensaje no válido',
    [EciesStringKey.Error_ECIESError_InvalidMnemonic]: 'Mnemónico no válido',
    [EciesStringKey.Error_ECIESError_InvalidOperation]: 'Operación no válida',
    [EciesStringKey.Error_ECIESError_MessageLengthMismatch]:
      'Desajuste en la longitud del mensaje',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLength]:
      'Longitud de clave cifrada no válida',
    [EciesStringKey.Error_ECIESError_InvalidEphemeralPublicKey]:
      'Clave pública efímera no válida',
    [EciesStringKey.Error_ECIESError_RecipientNotFound]:
      'Destinatario no encontrado en los identificadores de destinatarios',
    [EciesStringKey.Error_ECIESError_InvalidSignature]: 'Firma no válida',
    [EciesStringKey.Error_ECIESError_InvalidSenderPublicKey]:
      'Clave pública del remitente no válida',
    [EciesStringKey.Error_ECIESError_TooManyRecipients]:
      'Demasiados destinatarios: excede el máximo permitido',
    [EciesStringKey.Error_ECIESError_PrivateKeyNotLoaded]:
      'Clave privada no cargada',
    [EciesStringKey.Error_ECIESError_RecipientKeyCountMismatch]:
      'El número de destinatarios no coincide con el número de claves',
    [EciesStringKey.Error_ECIESError_InvalidRecipientCount]:
      'Número de destinatarios no válido',
    [EciesStringKey.Error_ECIESError_FileSizeTooLarge]:
      'Tamaño de archivo demasiado grande',
    [EciesStringKey.Error_ECIESError_DecryptionFailed]:
      'Falló la operación de descifrado',
    [EciesStringKey.Error_ECIESError_InvalidRecipientPublicKey]:
      'Clave pública del destinatario no válida proporcionada para el cifrado',
    [EciesStringKey.Error_ECIESError_SecretComputationFailed]:
      'Error al calcular el secreto compartido durante la operación ECIES',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForKeyEncryption]:
      'Se requiere una etiqueta de autenticación para el cifrado de claves',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate]:
      'Longitud de clave cifrada no válida: se esperaba {keySize}, se obtuvo {encryptedKeyLength}.',
    [EciesStringKey.Error_ECIESError_FailedToDecryptKey]: 'Error al descifrar la clave',
    [EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate]: 'Demasiados destinatarios: {recipientsCount}',
    [EciesStringKey.Error_ECIESError_MessageTooLargeTemplate]: 'Mensaje demasiado grande: {length}',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption]: 'Se requiere una etiqueta de autenticación para el cifrado ECIES.',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption]: 'Se requiere una etiqueta de autenticación para el cifrado ECIES a múltiples destinatarios.',
    [EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch]: 'Incoherencia de longitud de datos descifrados',
    [EciesStringKey.Error_ECIESError_RecipientCountMismatch]: 'Incoherencia del número de destinatarios',
    [EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader]: 'Datos demasiado cortos para el encabezado de múltiples destinatarios',
    [EciesStringKey.Error_ECIESError_FailedToDecryptChallengeTemplate]: 'Error al descifrar el desafío: {error}',
    [EciesStringKey.Error_ECIESError_InvalidChallengeSignature]: 'Firma de desafío no válida',
    [EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey]: 'Error al derivar la clave privada',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate]: 'Formato o longitud de clave pública no válidos: {keyLength}',
    [EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey]: 'Se recibió una clave pública nula o indefinida',
    [EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate]: 'La longitud del mensaje excede el tamaño máximo permitido: {messageLength}',
    [EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode]: 'No se admite el tipo de cifrado múltiple en el modo de un solo destinatario.',
    [EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate]: 'Incoherencia de tipo de cifrado: se esperaba {encryptionType}, se obtuvo {actualEncryptionType}.',
    [EciesStringKey.Error_ECIESError_DataTooShortTemplate]: 'Datos demasiado cortos: se requiere {requiredSize}, se obtuvo {dataLength}.',
    [EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate]: 'Incoherencia de longitud de datos: se esperaba {expectedDataLength}, se obtuvo {receivedDataLength}.',
    [EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents]: 'Los datos combinados son demasiado cortos para contener los componentes requeridos.',

    // Member Error Types - buildReasonMap(MemberErrorType, 'Error', 'MemberError')
    [EciesStringKey.Error_MemberError_MissingMemberName]:
      'Se requiere el nombre del miembro',
    [EciesStringKey.Error_MemberError_InvalidMemberNameWhitespace]:
      'El nombre del miembro contiene espacios al inicio o al final.',
    [EciesStringKey.Error_MemberError_InvalidEmail]:
      'Correo electrónico no válido.',
    [EciesStringKey.Error_MemberError_InvalidMemberName]:
      'Nombre de miembro no válido.',
    [EciesStringKey.Error_MemberError_InvalidMemberStatus]:
      'Estado del miembro no válido.',
    [EciesStringKey.Error_MemberError_MissingEmail]:
      'Falta el correo electrónico.',
    [EciesStringKey.Error_MemberError_InvalidEmailWhitespace]:
      'El correo electrónico contiene espacios al inicio o al final.',
    [EciesStringKey.Error_MemberError_MissingPrivateKey]:
      'Falta la clave privada.',
    [EciesStringKey.Error_MemberError_NoWallet]: 'No se cargó ningún monedero.',
    [EciesStringKey.Error_MemberError_WalletAlreadyLoaded]:
      'El monedero ya está cargado.',
    [EciesStringKey.Error_MemberError_InvalidMnemonic]:
      'Mnemónico del monedero no válido.',
    [EciesStringKey.Error_MemberError_IncorrectOrInvalidPrivateKey]:
      'Clave privada incorrecta o no válida para la clave pública',
    [EciesStringKey.Error_MemberError_MemberNotFound]: 'Miembro no encontrado.',
    [EciesStringKey.Error_MemberError_MemberAlreadyExists]:
      'El miembro ya existe.',
    [EciesStringKey.Error_MemberError_FailedToHydrateMember]:
      'Error al hidratar al miembro.',
    [EciesStringKey.Error_MemberError_InvalidMemberData]:
      'Datos del miembro no válidos.',
    [EciesStringKey.Error_MemberError_FailedToConvertMemberData]:
      'Error al convertir los datos del miembro.',
    [EciesStringKey.Error_MemberError_MissingEncryptionData]:
      'Faltan datos de cifrado.',
    [EciesStringKey.Error_MemberError_EncryptionDataTooLarge]:
      'Datos de cifrado demasiado grandes.',
    [EciesStringKey.Error_MemberError_InvalidEncryptionData]:
      'Datos de cifrado no válidos.',

    // GUID Error Types - buildReasonMap(GuidErrorType, 'Error', 'GuidError')
    [EciesStringKey.Error_GuidError_Invalid]: 'GUID no válido.',
    [EciesStringKey.Error_GuidError_InvalidWithGuidTemplate]:
      'GUID no válido: {GUID}',
    [EciesStringKey.Error_GuidError_UnknownBrandTemplate]:
      'Marca de GUID desconocida: {BRAND}.',
    [EciesStringKey.Error_GuidError_UnknownLengthTemplate]:
      'Longitud de GUID no válida: {LENGTH}.',

    // Length Error Types - buildReasonMap(LengthErrorType, 'Error', 'LengthError')
    [EciesStringKey.Error_LengthError_LengthIsTooShort]:
      'La longitud es demasiado corta.',
    [EciesStringKey.Error_LengthError_LengthIsTooLong]:
      'La longitud es demasiado larga.',
    [EciesStringKey.Error_LengthError_LengthIsInvalidType]:
      'La longitud es de un tipo no válido.',

    // PBKDF2 Error Types - buildReasonMap(Pbkdf2ErrorType, 'Error', 'Pbkdf2Error')
    [EciesStringKey.Error_Pbkdf2Error_InvalidProfile]:
      'Perfil PBKDF2 inválido especificado',
    [EciesStringKey.Error_Pbkdf2Error_InvalidSaltLength]:
      'La longitud de la sal no coincide con la esperada',
    [EciesStringKey.Error_Pbkdf2Error_InvalidHashLength]:
      'La longitud del hash no coincide con la esperada',

    // Secure Storage Error Types - buildReasonMap(SecureStorageErrorType, 'Error', 'SecureStorageError')
    [EciesStringKey.Error_SecureStorageError_DecryptedValueLengthMismatch]:
      'La longitud del valor descifrado no coincide con la esperada',
    [EciesStringKey.Error_SecureStorageError_DecryptedValueChecksumMismatch]:
      'La suma de verificación del valor descifrado no coincide',
    [EciesStringKey.Error_SecureStorageError_ValueIsNull]:
      'El valor del almacenamiento seguro es nulo',
    [EciesStringKey.Error_InvalidEmailError_Invalid]:
      'Dirección de correo electrónico no válida.',
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      'Error de cifrado: no se generó ninguna etiqueta de autenticación',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      'Error al almacenar los datos de inicio de sesión de contraseña',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      'El inicio de sesión con contraseña no está configurado',
  };
  const ukrainianTranslations: Record<EciesStringKey, string> = {
    // ECIES Error Types - buildReasonMap(ECIESErrorTypeEnum, 'Error', 'ECIESError')
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleEncryptedKeySize]:
      'Недійсний розмір множинного зашифрованого ключа ECIES',
    [EciesStringKey.Error_ECIESError_InvalidECIESPublicKeyLength]:
      'Недійсна довжина відкритого ключа ECIES',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientCountSize]:
      'Недійсний розмір поля кількості множинних одержувачів ECIES',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleDataLengthSize]:
      'Недійсний розмір поля довжини множинних даних ECIES',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientIdSize]:
      'Недійсний розмір ідентифікатора множинного одержувача ECIES',
    [EciesStringKey.Error_ECIESError_CRCError]: 'Помилка CRC',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionType]:
      'Недійсний тип шифрування',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate]: 'Недійсний тип шифрування: {encryptionType}',
    [EciesStringKey.Error_ECIESError_InvalidIVLength]: 'Недійсна довжина IV',
    [EciesStringKey.Error_ECIESError_InvalidAuthTagLength]:
      'Недійсна довжина тега автентифікації',
    [EciesStringKey.Error_ECIESError_InvalidHeaderLength]:
      'Недійсна довжина заголовка',
    [EciesStringKey.Error_ECIESError_InvalidDataLength]:
      'Недійсна довжина даних',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedDataLength]:
      'Недійсна довжина зашифрованих даних',
    [EciesStringKey.Error_ECIESError_InvalidMessageCrc]:
      'Недійсний CRC повідомлення',
    [EciesStringKey.Error_ECIESError_InvalidMnemonic]: 'Недійсний мнемонік',
    [EciesStringKey.Error_ECIESError_InvalidOperation]: 'Недійсна операція',
    [EciesStringKey.Error_ECIESError_MessageLengthMismatch]:
      'Невідповідність довжини повідомлення',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLength]:
      'Недійсна довжина зашифрованого ключа',
    [EciesStringKey.Error_ECIESError_InvalidEphemeralPublicKey]:
      'Недійсний ефемерний відкритий ключ',
    [EciesStringKey.Error_ECIESError_RecipientNotFound]:
      'Одержувача не знайдено серед ідентифікаторів одержувачів',
    [EciesStringKey.Error_ECIESError_InvalidSignature]: 'Недійсний підпис',
    [EciesStringKey.Error_ECIESError_InvalidSenderPublicKey]:
      'Недійсний відкритий ключ відправника',
    [EciesStringKey.Error_ECIESError_TooManyRecipients]:
      'Занадто багато одержувачів: перевищено допустиму кількість',
    [EciesStringKey.Error_ECIESError_PrivateKeyNotLoaded]:
      'Приватний ключ не завантажено',
    [EciesStringKey.Error_ECIESError_RecipientKeyCountMismatch]:
      'Кількість одержувачів не збігається з кількістю ключів',
    [EciesStringKey.Error_ECIESError_InvalidRecipientCount]:
      'Недійсна кількість одержувачів',
    [EciesStringKey.Error_ECIESError_FileSizeTooLarge]:
      'Розмір файлу занадто великий',
    [EciesStringKey.Error_ECIESError_DecryptionFailed]:
      'Не вдалося розшифрувати ECIES (перевірка MAC або помилка заповнення)',
    [EciesStringKey.Error_ECIESError_InvalidRecipientPublicKey]:
      'Надано недійсний відкритий ключ одержувача для шифрування',
    [EciesStringKey.Error_ECIESError_SecretComputationFailed]:
      'Не вдалося обчислити спільний секрет під час операції ECIES',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForKeyEncryption]:
      'Для шифрування ключа потрібен тег автентифікації',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate]:
      'Недійсна довжина зашифрованого ключа: очікувалося {keySize}, отримано {encryptedKeyLength}.',
    [EciesStringKey.Error_ECIESError_FailedToDecryptKey]: 'Не вдалося розшифрувати ключ',
    [EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate]: 'Занадто багато одержувачів: {recipientsCount}',
    [EciesStringKey.Error_ECIESError_MessageTooLargeTemplate]: 'Повідомлення занадто велике: {length}',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption]: 'Тег автентифікації потрібен для шифрування ECIES',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption]: 'Тег автентифікації потрібен для шифрування ECIES з кількома одержувачами',
    [EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch]: 'Невідповідність довжини розшифрованих даних',
    [EciesStringKey.Error_ECIESError_RecipientCountMismatch]: 'Невідповідність кількості одержувачів',
    [EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader]: 'Дані занадто короткі для заголовка з кількома одержувачами',
    [EciesStringKey.Error_ECIESError_FailedToDecryptChallengeTemplate]: 'Не вдалося розшифрувати виклик: {error}',
    [EciesStringKey.Error_ECIESError_InvalidChallengeSignature]: 'Недійсна підписка на виклик',
    [EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey]: 'Не вдалося вивести приватний ключ',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate]: 'Недійсний формат або довжина відкритого ключа: {keyLength}',
    [EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey]: 'Отримано null або undefined відкритий ключ',
    [EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate]: 'Довжина повідомлення перевищує максимально допустимий розмір: {messageLength}',
    [EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode]: 'Типи кількісного шифрування не підтримуються в режимі одного одержувача',
    [EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate]: 'Невідповідність типу шифрування: очікувалося {encryptionType}, отримано {actualEncryptionType}',
    [EciesStringKey.Error_ECIESError_DataTooShortTemplate]: 'Дані занадто короткі: потрібно {requiredSize}, отримано {dataLength}',
    [EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate]: 'Невідповідність довжини даних: очікувалося {expectedDataLength}, отримано {receivedDataLength}.',
    [EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents]: 'Обʼєднані дані занадто короткі, щоб містити необхідні компоненти',

    // Member Error Types - buildReasonMap(MemberErrorType, 'Error', 'MemberError')
    [EciesStringKey.Error_MemberError_MissingMemberName]:
      'Відсутнє імʼя учасника.',
    [EciesStringKey.Error_MemberError_InvalidMemberNameWhitespace]:
      'Імʼя учасника містить пробіли на початку або в кінці.',
    [EciesStringKey.Error_MemberError_InvalidEmail]:
      'Недійсна електронна адреса.',
    [EciesStringKey.Error_MemberError_InvalidMemberName]:
      'Недійсне імʼя учасника.',
    [EciesStringKey.Error_MemberError_InvalidMemberStatus]:
      'Недійсний статус учасника.',
    [EciesStringKey.Error_MemberError_MissingEmail]:
      'Відсутня електронна адреса.',
    [EciesStringKey.Error_MemberError_InvalidEmailWhitespace]:
      'Електронна адреса містить пробіли на початку або в кінці.',
    [EciesStringKey.Error_MemberError_MissingPrivateKey]:
      'Відсутній приватний ключ.',
    [EciesStringKey.Error_MemberError_NoWallet]: 'Гаманець не завантажено.',
    [EciesStringKey.Error_MemberError_WalletAlreadyLoaded]:
      'Гаманець уже завантажено.',
    [EciesStringKey.Error_MemberError_InvalidMnemonic]:
      'Недійсний мнемонік гаманця.',
    [EciesStringKey.Error_MemberError_IncorrectOrInvalidPrivateKey]:
      'Неправильний або недійсний приватний ключ для цього відкритого ключа',
    [EciesStringKey.Error_MemberError_MemberNotFound]: 'Учасника не знайдено.',
    [EciesStringKey.Error_MemberError_MemberAlreadyExists]:
      'Учасник уже існує.',
    [EciesStringKey.Error_MemberError_FailedToHydrateMember]:
      'Не вдалося ініціалізувати учасника.',
    [EciesStringKey.Error_MemberError_InvalidMemberData]:
      'Недійсні дані учасника.',
    [EciesStringKey.Error_MemberError_FailedToConvertMemberData]:
      'Не вдалося перетворити дані учасника.',
    [EciesStringKey.Error_MemberError_MissingEncryptionData]:
      'Відсутні дані шифрування.',
    [EciesStringKey.Error_MemberError_EncryptionDataTooLarge]:
      'Дані шифрування занадто великі.',
    [EciesStringKey.Error_MemberError_InvalidEncryptionData]:
      'Недійсні дані шифрування.',

    // GUID Error Types - buildReasonMap(GuidErrorType, 'Error', 'GuidError')
    [EciesStringKey.Error_GuidError_Invalid]: 'Недійсний GUID.',
    [EciesStringKey.Error_GuidError_InvalidWithGuidTemplate]:
      'Недійсний GUID: {GUID}',
    [EciesStringKey.Error_GuidError_UnknownBrandTemplate]:
      'Невідомий бренд GUID: {BRAND}.',
    [EciesStringKey.Error_GuidError_UnknownLengthTemplate]:
      'Недійсна довжина GUID: {LENGTH}.',

    // Length Error Types - buildReasonMap(LengthErrorType, 'Error', 'LengthError')
    [EciesStringKey.Error_LengthError_LengthIsTooShort]:
      'Довжина надто коротка.',
    [EciesStringKey.Error_LengthError_LengthIsTooLong]: 'Довжина надто довга.',
    [EciesStringKey.Error_LengthError_LengthIsInvalidType]:
      'Довжина має недійсний тип.',

    // PBKDF2 Error Types - buildReasonMap(Pbkdf2ErrorType, 'Error', 'Pbkdf2Error')
    [EciesStringKey.Error_Pbkdf2Error_InvalidProfile]:
      'Вказано недійсний профіль PBKDF2',
    [EciesStringKey.Error_Pbkdf2Error_InvalidSaltLength]:
      'Довжина солі не відповідає очікуваній',
    [EciesStringKey.Error_Pbkdf2Error_InvalidHashLength]:
      'Довжина гешу не відповідає очікуваній',

    // Secure Storage Error Types - buildReasonMap(SecureStorageErrorType, 'Error', 'SecureStorageError')
    [EciesStringKey.Error_SecureStorageError_DecryptedValueLengthMismatch]:
      'Довжина розшифрованого значення не відповідає очікуваній',
    [EciesStringKey.Error_SecureStorageError_DecryptedValueChecksumMismatch]:
      'Контрольна сума розшифрованого значення не збігається',
    [EciesStringKey.Error_SecureStorageError_ValueIsNull]:
      'Значення у захищеному сховищі дорівнює null',
    [EciesStringKey.Error_InvalidEmailError_Invalid]:
      'Недійсна електронна адреса.',
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      'Не вдалося зашифрувати: не створено тег автентифікації',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      'Не вдалося зберегти дані для входу за допомогою пароля',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      'Вхід за допомогою пароля не налаштовано',
  };

 const germanTranslations: Record<EciesStringKey, string> = {
    // ECIES Error Types - buildReasonMap(ECIESErrorTypeEnum, 'Error', 'ECIESError')
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleEncryptedKeySize]:
      'Ungültige ECIES mehrfache verschlüsselte Schlüssellänge',
    [EciesStringKey.Error_ECIESError_InvalidECIESPublicKeyLength]:
      'Ungültige ECIES öffentliche Schlüssellänge',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientCountSize]:
      'Ungültige ECIES mehrere Empfängeranzahlgröße',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleDataLengthSize]:
      'Ungültige ECIES mehrere Datenlängen',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientIdSize]:
      'Ungültige ECIES mehrere Empfänger-ID-Größe',
    [EciesStringKey.Error_ECIESError_CRCError]: 'CRC-Fehler',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionType]:
      'Ungültiger Verschlüsselungstyp',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate]: 'Ungültiger Verschlüsselungstyp: {encryptionType}',
    [EciesStringKey.Error_ECIESError_InvalidIVLength]: 'Ungültige IV-Länge',
    [EciesStringKey.Error_ECIESError_InvalidAuthTagLength]:
      'Ungültige Auth-Tag-Länge',
    [EciesStringKey.Error_ECIESError_InvalidHeaderLength]:
      'Ungültige Header-Länge',
    [EciesStringKey.Error_ECIESError_InvalidDataLength]: 'Ungültige Datenlänge',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedDataLength]:
      'Ungültige verschlüsselte Datenlänge',
    [EciesStringKey.Error_ECIESError_InvalidMessageCrc]: 'Ungültige Nachrichten-CRC',
    [EciesStringKey.Error_ECIESError_InvalidMnemonic]: 'Ungültige Mnemonik',
    [EciesStringKey.Error_ECIESError_InvalidOperation]: 'Ungültige Operation',
    [EciesStringKey.Error_ECIESError_MessageLengthMismatch]:
      'Längenabweichung der Nachricht',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLength]:
      'Ungültige verschlüsselte Schlüssellänge',
    [EciesStringKey.Error_ECIESError_InvalidEphemeralPublicKey]:
      'Ungültiger ephemerer öffentlicher Schlüssel',
    [EciesStringKey.Error_ECIESError_RecipientNotFound]:
      'Empfänger nicht in den Empfänger-IDs gefunden',
    [EciesStringKey.Error_ECIESError_InvalidSignature]: 'Ungültige Signatur',
    [EciesStringKey.Error_ECIESError_InvalidSenderPublicKey]:
      'Ungültiger Sender-öffentlicher Schlüssel',
    [EciesStringKey.Error_ECIESError_TooManyRecipients]:
      'Zu viele Empfänger: Überschreitung der maximalen Anzahl',
    [EciesStringKey.Error_ECIESError_PrivateKeyNotLoaded]:
      'Privater Schlüssel nicht geladen',
    [EciesStringKey.Error_ECIESError_RecipientKeyCountMismatch]:
      'Anzahl der Empfänger stimmt nicht mit der Anzahl der Schlüssel überein',
    [EciesStringKey.Error_ECIESError_InvalidRecipientCount]:
      'Ungültige Empfängeranzahl',
    [EciesStringKey.Error_ECIESError_FileSizeTooLarge]: 'Dateigröße zu groß',
    [EciesStringKey.Error_ECIESError_DecryptionFailed]:
      'Entschlüsselungsoperation fehlgeschlagen',
    [EciesStringKey.Error_ECIESError_InvalidRecipientPublicKey]:
      'Ungültiger Empfänger-öffentlicher Schlüssel für die Verschlüsselung bereitgestellt',
    [EciesStringKey.Error_ECIESError_SecretComputationFailed]:
      'Fehler bei der Berechnung des gemeinsamen Schlüssels während der ECIES-Operation',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForKeyEncryption]:
      'Authentifizierungstag ist für die Schlüsselverschlüsselung erforderlich',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate]:
      'Ungültige verschlüsselte Schlüssellänge: erwartet {keySize}, erhalten {encryptedKeyLength}',
    [EciesStringKey.Error_ECIESError_FailedToDecryptKey]: 'Fehler beim Entschlüsseln des Schlüssels',
    [EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate]: 'Zu viele Empfänger: {recipientsCount}',
    [EciesStringKey.Error_ECIESError_MessageTooLargeTemplate]: 'Nachricht zu groß: {length}',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption]: 'Authentifizierungstag ist für die ECIES-Verschlüsselung erforderlich',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption]: 'Authentifizierungstag ist für die Multi-Recipient-ECIES-Verschlüsselung erforderlich',
    [EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch]: 'Länge der entschlüsselten Daten stimmt nicht überein',
    [EciesStringKey.Error_ECIESError_RecipientCountMismatch]: 'Anzahl der Empfänger stimmt nicht überein',
    [EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader]: 'Daten zu kurz für den Multi-Recipient-Header',
    [EciesStringKey.Error_ECIESError_FailedToDecryptChallengeTemplate]: 'Fehler beim Entschlüsseln der Herausforderung: {error}',
    [EciesStringKey.Error_ECIESError_InvalidChallengeSignature]: 'Ungültige Herausforderungsunterschrift',
    [EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey]: 'Fehler beim Ableiten des privaten Schlüssels',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate]: 'Ungültiges Format oder Länge des öffentlichen Schlüssels: {keyLength}',
    [EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey]: 'Öffentlicher Schlüssel ist null oder undefiniert',
    [EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate]: 'Nachrichtenlänge überschreitet die maximal zulässige Größe: {messageLength}',
    [EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode]: 'Mehrere Verschlüsselungstypen werden im Einzelempfängermodus nicht unterstützt',
    [EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate]: 'Verschlüsselungstyp stimmt nicht überein: erwartet {encryptionType}, erhalten {actualEncryptionType}',
    [EciesStringKey.Error_ECIESError_DataTooShortTemplate]: 'Daten zu kurz: erforderlich {requiredSize}, erhalten {dataLength}',
    [EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate]: 'Datenlängenübereinstimmung: erwartet {expectedDataLength}, erhalten {receivedDataLength}',
    [EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents]: 'Kombinierte Daten sind zu kurz, um die erforderlichen Komponenten zu enthalten',

    // Member Error Types - buildReasonMap(MemberErrorType, 'Error', 'MemberError')
    [EciesStringKey.Error_MemberError_MissingMemberName]:
      'Mitgliedsname ist erforderlich',
    [EciesStringKey.Error_MemberError_InvalidMemberNameWhitespace]:
      'Mitgliedsname enthält führende oder nachfolgende Leerzeichen.',
    [EciesStringKey.Error_MemberError_InvalidEmail]: 'Ungültige E-Mail.',
    [EciesStringKey.Error_MemberError_InvalidMemberName]:
      'Ungültiger Mitgliedsname.',
    [EciesStringKey.Error_MemberError_InvalidMemberStatus]:
      'Ungültiger Mitgliedsstatus.',
    [EciesStringKey.Error_MemberError_MissingEmail]: 'Fehlende E-Mail.',
    [EciesStringKey.Error_MemberError_InvalidEmailWhitespace]:
      'E-Mail enthält führende oder nachfolgende Leerzeichen.',
    [EciesStringKey.Error_MemberError_MissingPrivateKey]:
      'Fehlender privater Schlüssel.',
    [EciesStringKey.Error_MemberError_NoWallet]: 'Keine Wallet geladen.',
    [EciesStringKey.Error_MemberError_WalletAlreadyLoaded]:
      'Wallet bereits geladen.',
    [EciesStringKey.Error_MemberError_InvalidMnemonic]:
      'Ungültige Wallet-Mnemonik.',
    [EciesStringKey.Error_MemberError_IncorrectOrInvalidPrivateKey]:
      'Falscher oder ungültiger privater Schlüssel für öffentlichen Schlüssel',
    [EciesStringKey.Error_MemberError_MemberNotFound]: 'Mitglied nicht gefunden.',
    [EciesStringKey.Error_MemberError_MemberAlreadyExists]:
      'Mitglied existiert bereits.',
    [EciesStringKey.Error_MemberError_FailedToHydrateMember]:
      'Fehler beim Hydratisieren des Mitglieds.',
    [EciesStringKey.Error_MemberError_InvalidMemberData]:
      'Ungültige Mitgliedsdaten.',
    [EciesStringKey.Error_MemberError_FailedToConvertMemberData]:
      'Fehler beim Konvertieren der Mitgliedsdaten.',
    [EciesStringKey.Error_MemberError_MissingEncryptionData]:
      'Fehlende Verschlüsselungsdaten.',
    [EciesStringKey.Error_MemberError_EncryptionDataTooLarge]:
      'Verschlüsselungsdaten zu groß.',
    [EciesStringKey.Error_MemberError_InvalidEncryptionData]:
      'Ungültige Verschlüsselungsdaten.',

    // GUID Error Types - buildReasonMap(GuidErrorType, 'Error', 'GuidError')
    [EciesStringKey.Error_GuidError_Invalid]: 'Ungültiges GUID-Format',
    [EciesStringKey.Error_GuidError_InvalidWithGuidTemplate]:
      'Ungültige GUID: {GUID}',
    [EciesStringKey.Error_GuidError_UnknownBrandTemplate]:
      'Unbekannte GUID-Marke: {BRAND}.',
    [EciesStringKey.Error_GuidError_UnknownLengthTemplate]:
      'Ungültige GUID-Länge: {LENGTH}.',

    // Length Error Types - buildReasonMap(LengthErrorType, 'Error', 'LengthError')
    [EciesStringKey.Error_LengthError_LengthIsTooShort]: 'Länge ist zu kurz.',
    [EciesStringKey.Error_LengthError_LengthIsTooLong]: 'Länge ist zu lang.',
    [EciesStringKey.Error_LengthError_LengthIsInvalidType]:
      'Länge hat einen ungültigen Typ.',

    // PBKDF2 Error Types - buildReasonMap(Pbkdf2ErrorType, 'Error', 'Pbkdf2Error')
    [EciesStringKey.Error_Pbkdf2Error_InvalidProfile]:
      'Ungültiges PBKDF2-Profil angegeben',
    [EciesStringKey.Error_Pbkdf2Error_InvalidSaltLength]:
      'Salt-Länge entspricht nicht der erwarteten Länge',
    [EciesStringKey.Error_Pbkdf2Error_InvalidHashLength]:
      'Hash-Länge entspricht nicht der erwarteten Länge',

    // Secure Storage Error Types - buildReasonMap(SecureStorageErrorType, 'Error', 'SecureStorageError')
    [EciesStringKey.Error_SecureStorageError_DecryptedValueLengthMismatch]:
      'Länge des entschlüsselten Werts entspricht nicht der erwarteten Länge',
    [EciesStringKey.Error_SecureStorageError_DecryptedValueChecksumMismatch]:
      'Prüfsumme des entschlüsselten Werts stimmt nicht überein',
    [EciesStringKey.Error_SecureStorageError_ValueIsNull]:
      'Sicherer Speicherwert ist null',
    [EciesStringKey.Error_InvalidEmailError_Invalid]: 'Ungültige E-Mail-Adresse.',
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      'Verschlüsselung fehlgeschlagen: kein Authentifizierungstag generiert',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      'Fehler beim Speichern der Passwort-Anmeldedaten',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      'Passwort-Anmeldung ist nicht eingerichtet',
  };

  const japaneseTranslations: Record<EciesStringKey, string> = {
    // ECIES Error Types - buildReasonMap(ECIESErrorTypeEnum, 'Error', 'ECIESError')
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleEncryptedKeySize]:
      '無効なECIES複数暗号化キーサイズ',
    [EciesStringKey.Error_ECIESError_InvalidECIESPublicKeyLength]:
      '無効なECIES公開鍵長さ',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientCountSize]:
      '無効なECIES複数受信者カウントサイズ',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleDataLengthSize]:
      '無効なECIES複数データ長さサイズ',
    [EciesStringKey.Error_ECIESError_InvalidECIESMultipleRecipientIdSize]:
      '無効なECIES複数受信者IDサイズ',
    [EciesStringKey.Error_ECIESError_CRCError]: 'CRCエラー',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionType]:
      '無効な暗号化タイプ',
    [EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate]: '無効な暗号化タイプ: {encryptionType}',
    [EciesStringKey.Error_ECIESError_InvalidIVLength]: '無効なIV長さ',
    [EciesStringKey.Error_ECIESError_InvalidAuthTagLength]:
      '無効な認証タグ長さ',
    [EciesStringKey.Error_ECIESError_InvalidHeaderLength]:
      '無効なヘッダー長さ',
    [EciesStringKey.Error_ECIESError_InvalidDataLength]: '無効なデータ長さ',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedDataLength]:
      '無効な暗号化データ長さ',
    [EciesStringKey.Error_ECIESError_InvalidMessageCrc]: '無効なメッセージCRC',
    [EciesStringKey.Error_ECIESError_InvalidMnemonic]: '無効なニーモニック',
    [EciesStringKey.Error_ECIESError_InvalidOperation]: '無効な操作',
    [EciesStringKey.Error_ECIESError_MessageLengthMismatch]:
      'メッセージ長さが一致しません',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLength]:
      '無効な暗号化キー長さ',
    [EciesStringKey.Error_ECIESError_InvalidEphemeralPublicKey]:
      '無効な一時公開鍵',
    [EciesStringKey.Error_ECIESError_RecipientNotFound]:
      '受信者IDに受信者が見つかりません',
    [EciesStringKey.Error_ECIESError_InvalidSignature]: '無効な署名',
    [EciesStringKey.Error_ECIESError_InvalidSenderPublicKey]:
      '無効な送信者公開鍵',
    [EciesStringKey.Error_ECIESError_TooManyRecipients]:
      '受信者が多すぎます: 最大許可数を超えています',
    [EciesStringKey.Error_ECIESError_PrivateKeyNotLoaded]:
      '秘密鍵が読み込まれていません',
    [EciesStringKey.Error_ECIESError_RecipientKeyCountMismatch]:
      '受信者数がキー数と一致しません',
    [EciesStringKey.Error_ECIESError_InvalidRecipientCount]:
      '無効な受信者数',
    [EciesStringKey.Error_ECIESError_FileSizeTooLarge]: 'ファイルサイズが大きすぎます',
    [EciesStringKey.Error_ECIESError_DecryptionFailed]:
      '復号化操作に失敗しました',
    [EciesStringKey.Error_ECIESError_InvalidRecipientPublicKey]:
      '無効な受信者公開鍵が暗号化に提供されました',
    [EciesStringKey.Error_ECIESError_SecretComputationFailed]:
      'ECIES操作中に共有秘密の計算に失敗しました',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForKeyEncryption]:
      '鍵暗号化には認証タグが必要です',
    [EciesStringKey.Error_ECIESError_InvalidEncryptedKeyLengthTemplate]:
      '無効な暗号化キー長さ: 期待される {keySize}, 実際の {encryptedKeyLength}',
    [EciesStringKey.Error_ECIESError_FailedToDecryptKey]: '鍵の復号化に失敗しました',
    [EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate]: '受信者が多すぎます: {recipientsCount}',
    [EciesStringKey.Error_ECIESError_MessageTooLargeTemplate]: 'メッセージが大きすぎます: {length}',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption]: 'ECIES暗号化には認証タグが必要です',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption]: 'マルチ受信者ECIES暗号化には認証タグが必要です',
    [EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch]: '復号化データの長さが一致しません',
    [EciesStringKey.Error_ECIESError_RecipientCountMismatch]: '受信者数が一致しません',
    [EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader]: 'マルチ受信者ヘッダー用のデータが短すぎます',
    [EciesStringKey.Error_ECIESError_FailedToDecryptChallengeTemplate]: 'チャレンジの復号化に失敗しました: {error}',
    [EciesStringKey.Error_ECIESError_InvalidChallengeSignature]: '無効なチャレンジ署名',
    [EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey]: '秘密鍵の導出に失敗しました',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate]: '無効な公開鍵の形式または長さ: {keyLength}',
    [EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey]: 'nullまたは未定義の公開鍵を受信しました',
    [EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate]: 'メッセージの長さが許可されている最大サイズを超えています: {messageLength}',
    [EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode]: '単一受信者モードでは複数の暗号化タイプはサポートされていません',
    [EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate]: '暗号化タイプが一致しません: 期待される {encryptionType}, 実際の {actualEncryptionType}',
    [EciesStringKey.Error_ECIESError_DataTooShortTemplate]: 'データが短すぎます: 必要な {requiredSize}, 実際の {dataLength}',
    [EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate]: 'データの長さが一致しません: 期待される {expectedDataLength}, 実際の {receivedDataLength}',
    [EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents]: '結合データが必要なコンポーネントを含むには短すぎます',

    // Member Error Types - buildReasonMap(MemberErrorType, 'Error', 'MemberError')
    [EciesStringKey.Error_MemberError_MissingMemberName]:
      'メンバー名は必須です。',
    [EciesStringKey.Error_MemberError_InvalidMemberNameWhitespace]:
      'メンバー名に前後の空白が含まれています。',
    [EciesStringKey.Error_MemberError_InvalidEmail]: '無効なメールアドレスです。',
    [EciesStringKey.Error_MemberError_InvalidMemberName]:
      '無効なメンバー名です。',
    [EciesStringKey.Error_MemberError_InvalidMemberStatus]:
      '無効なメンバーステータスです。',
    [EciesStringKey.Error_MemberError_MissingEmail]: 'メールアドレスがありません。',
    [EciesStringKey.Error_MemberError_InvalidEmailWhitespace]:
      'メールアドレスに前後の空白が含まれています。',
    [EciesStringKey.Error_MemberError_MissingPrivateKey]:
      '秘密鍵がありません。',
    [EciesStringKey.Error_MemberError_NoWallet]: 'ウォレットが読み込まれていません。',
    [EciesStringKey.Error_MemberError_WalletAlreadyLoaded]:
      'ウォレットはすでに読み込まれています。',
    [EciesStringKey.Error_MemberError_InvalidMnemonic]:
      '無効なウォレットのニーモニックです。',
    [EciesStringKey.Error_MemberError_IncorrectOrInvalidPrivateKey]:
      '公開鍵に対する秘密鍵が不正確または無効です。',
    [EciesStringKey.Error_MemberError_MemberNotFound]: 'メンバーが見つかりません。',
    [EciesStringKey.Error_MemberError_MemberAlreadyExists]:
      'メンバーはすでに存在します。',
    [EciesStringKey.Error_MemberError_FailedToHydrateMember]:
      'メンバーの水分補給に失敗しました。',
    [EciesStringKey.Error_MemberError_InvalidMemberData]:
      '無効なメンバーデータです。',
    [EciesStringKey.Error_MemberError_FailedToConvertMemberData]:
      'メンバーデータの変換に失敗しました。',
    [EciesStringKey.Error_MemberError_MissingEncryptionData]:
      '暗号化データがありません。',
    [EciesStringKey.Error_MemberError_EncryptionDataTooLarge]:
      '暗号化データが大きすぎます。',
    [EciesStringKey.Error_MemberError_InvalidEncryptionData]:
      '無効な暗号化データです。',

    // GUID Error Types - buildReasonMap(GuidErrorType, 'Error', 'GuidError')
    [EciesStringKey.Error_GuidError_Invalid]: '無効なGUID形式です。',
    [EciesStringKey.Error_GuidError_InvalidWithGuidTemplate]:
      '無効なGUID: {GUID}',
    [EciesStringKey.Error_GuidError_UnknownBrandTemplate]:
      '不明なGUIDブランド: {BRAND}.',
    [EciesStringKey.Error_GuidError_UnknownLengthTemplate]:
      '無効なGUID長: {LENGTH}.',

    // Length Error Types - buildReasonMap(LengthErrorType, 'Error', 'LengthError')
    [EciesStringKey.Error_LengthError_LengthIsTooShort]: '長さが短すぎます。',
    [EciesStringKey.Error_LengthError_LengthIsTooLong]: '長さが長すぎます。',
    [EciesStringKey.Error_LengthError_LengthIsInvalidType]:
      '長さが無効な型です。',

    // PBKDF2 Error Types - buildReasonMap(Pbkdf2ErrorType, 'Error', 'Pbkdf2Error')
    [EciesStringKey.Error_Pbkdf2Error_InvalidProfile]:
      '無効なPBKDF2プロファイルが指定されました。',
    [EciesStringKey.Error_Pbkdf2Error_InvalidSaltLength]:
      'ソルトの長さが期待される長さと一致しません',
    [EciesStringKey.Error_Pbkdf2Error_InvalidHashLength]:
      'ハッシュの長さが期待される長さと一致しません',

    // Secure Storage Error Types - buildReasonMap(SecureStorageErrorType, 'Error', 'SecureStorageError')
    [EciesStringKey.Error_SecureStorageError_DecryptedValueLengthMismatch]:
      '復号化された値の長さが期待される長さと一致しません',
    [EciesStringKey.Error_SecureStorageError_DecryptedValueChecksumMismatch]:
      '復号化された値のチェックサムが一致しません',
    [EciesStringKey.Error_SecureStorageError_ValueIsNull]:
      'セキュアストレージの値がnullです',
    [EciesStringKey.Error_InvalidEmailError_Invalid]: '無効なメールアドレスです。',
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      '暗号化に失敗しました: 認証タグが生成されませんでした',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      'パスワードログインデータの保存に失敗しました',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      'パスワードログインが設定されていません',
  };

  // Define languages for ECIES
  const eciesLanguages = [
    createLanguageDefinition('en-US', 'English (US)', EciesLanguageCodes.EN_US, true),
    createLanguageDefinition('en-GB', 'English (UK)', EciesLanguageCodes.EN_GB),
    createLanguageDefinition('fr', 'French', EciesLanguageCodes.FR),
    createLanguageDefinition('es', 'Spanish', EciesLanguageCodes.ES),
    createLanguageDefinition('de', 'Deutsch', EciesLanguageCodes.DE),
    createLanguageDefinition('zh-CN', 'Chinese (Simplified)', EciesLanguageCodes.ZH_CN),
    createLanguageDefinition('ja', '日本語', EciesLanguageCodes.JA),
    createLanguageDefinition('uk', 'Ukrainian', EciesLanguageCodes.UK),
  ];

  // Create engine with ECIES languages
  const engine = new PluginI18nEngine<EciesSupportedLanguageCode>(eciesLanguages, {
    defaultLanguage: EciesLanguageCodes.EN_US,
    fallbackLanguage: EciesLanguageCodes.EN_US,
  });

  // Define the ECIES component registration with specified languages only
  const eciesComponentStrings = {
    [EciesLanguageCodes.EN_US]: englishTranslations,
    [EciesLanguageCodes.EN_GB]: englishTranslations, // UK uses same strings as US
    [EciesLanguageCodes.FR]: frenchTranslations,
    [EciesLanguageCodes.ES]: spanishTranslations,
    [EciesLanguageCodes.DE]: germanTranslations,
    [EciesLanguageCodes.ZH_CN]: mandarinChineseTranslations,
    [EciesLanguageCodes.JA]: japaneseTranslations,
    [EciesLanguageCodes.UK]: ukrainianTranslations,
  };

  const eciesRegistration: ComponentRegistration<EciesStringKey, EciesSupportedLanguageCode> =
    {
      component: EciesComponent,
      strings: eciesComponentStrings,
    };

  // Register the ECIES component
  const validationResult = engine.registerComponent(eciesRegistration);

  if (!validationResult.isValid && validationResult.missingKeys.length > 0) {
    console.warn(
      'ECIES component registration has missing translations:',
      validationResult.missingKeys,
    );
  }

  return engine;
}

let _eciesI18nEngine: PluginI18nEngine<EciesSupportedLanguageCode> | null = null;
export function getEciesI18nEngine(): PluginI18nEngine<EciesSupportedLanguageCode> {
  if (!_eciesI18nEngine) {
    _eciesI18nEngine = initEciesI18nEngine();
  }
  return _eciesI18nEngine!;
}

// Test helper to reset instances
export function resetEciesI18nForTests(): void {
  _eciesI18nEngine = null;
}

export const EciesI18nEngine = getEciesI18nEngine();

// Helper function for translating ECIES strings using the new plugin system
export function getEciesTranslation(
  key: EciesStringKey,
  variables?: Record<string, string | number>,
  language?: EciesSupportedLanguageCode,
): string {
  return getEciesI18nEngine().translate(
    EciesComponentId,
    key,
    variables,
    language,
  );
}

// Safe translation with fallback
export function safeEciesTranslation(
  key: EciesStringKey,
  variables?: Record<string, string | number>,
  language?: EciesSupportedLanguageCode,
): string {
  return getEciesI18nEngine().safeTranslate(
    EciesComponentId,
    key,
    variables,
    language,
  );
}

// Direct translation helper function for use throughout the codebase
export function translateEciesString(
  key: EciesStringKey,
  variables?: Record<string, string | number>,
  language?: EciesSupportedLanguageCode,
): string {
  return getEciesI18nEngine().translate(
    EciesComponentId,
    key,
    variables,
    language,
  );
}

// Create language code mapping
const DefaultLanguageToCoreLanguageMap = new Map<string, EciesSupportedLanguageCode>([
  // Map language codes to themselves
  [EciesLanguageCodes.EN_US, EciesLanguageCodes.EN_US],
  [EciesLanguageCodes.EN_GB, EciesLanguageCodes.EN_GB],
  [EciesLanguageCodes.FR, EciesLanguageCodes.FR],
  [EciesLanguageCodes.ES, EciesLanguageCodes.ES],
  [EciesLanguageCodes.DE, EciesLanguageCodes.DE],
  [EciesLanguageCodes.ZH_CN, EciesLanguageCodes.ZH_CN],
  [EciesLanguageCodes.JA, EciesLanguageCodes.JA],
  [EciesLanguageCodes.UK, EciesLanguageCodes.UK],
]);

// Create a full adapter that perfectly mimics the old I18nEngine interface
export function getCompatibleEciesEngine() {
  const pluginEngine = getEciesI18nEngine();

  const adapter = {
    translate: (
      key: EciesStringKey,
      variables?: Record<string, string | number>,
      language?: any,
    ) => {
      // Map any legacy language parameter to EciesSupportedLanguageCode
      let coreLanguage: EciesSupportedLanguageCode = EciesLanguageCodes.EN_US; // Default fallback

      if (language) {
        const langStr = String(language);
        // Try direct mapping first
        const mappedLanguage = DefaultLanguageToCoreLanguageMap.get(langStr);
        if (mappedLanguage) {
          coreLanguage = mappedLanguage;
        }
        // If no direct mapping found, keep the default
      }

      try {
        let result = pluginEngine.translate(
          EciesComponentId,
          key,
          variables,
          coreLanguage,
        );

        // Manual variable substitution if the plugin system doesn't handle it
        if (variables && result.includes('{')) {
          for (const [varName, varValue] of Object.entries(variables)) {
            const placeholder = `{${varName}}`;
            if (result.includes(placeholder)) {
              result = result.replace(
                new RegExp(`\\{${varName}\\}`, 'g'),
                String(varValue),
              );
            }
          }
        }

        return result;
      } catch (error) {
        console.warn(`Translation failed for key ${key}:`, error);
        return String(key); // Fallback to key name
      }
    },

    // Add other methods that might be needed by the error classes
    safeTranslate: (
      key: EciesStringKey,
      variables?: Record<string, string | number>,
      language?: any,
    ) => {
      try {
        return adapter.translate(key, variables, language);
      } catch (error) {
        return String(key);
      }
    },
  };

  return adapter;
}
