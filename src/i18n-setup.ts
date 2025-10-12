import {
  ComponentDefinition,
  ComponentRegistration,
  CoreLanguage,
  createCoreI18nEngine,
  DefaultLanguage,
  PluginI18nEngine,
} from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from './enumerations/ecies-string-key';

export const EciesI18nEngineKey = 'DigitalDefiance.Ecies.I18nEngine' as const;
export const EciesComponentId = 'ecies' as const;

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

  // Create engine with core components
  const engine = createCoreI18nEngine(instanceKey);

  // Define the ECIES component registration with specified languages only
  const eciesComponentStrings = {
    [CoreLanguage.EnglishUS]: englishTranslations,
    [CoreLanguage.EnglishUK]: englishTranslations, // UK uses same strings as US
    [CoreLanguage.French]: frenchTranslations,
    [CoreLanguage.MandarinChinese]: mandarinChineseTranslations,
    [CoreLanguage.Spanish]: spanishTranslations,
    [CoreLanguage.Ukrainian]: ukrainianTranslations,
  };

  const eciesRegistration: ComponentRegistration<EciesStringKey, CoreLanguage> =
    {
      component: EciesComponent,
      strings: eciesComponentStrings,
    };

  // Register the ECIES component
  const validationResult = engine.registerComponent(eciesRegistration);

  if (!validationResult.isValid) {
    // Define the languages we actually support using enum values - filter out German and Japanese warnings
    const supportedLanguages = [
      CoreLanguage.EnglishUS,
      CoreLanguage.EnglishUK,
      CoreLanguage.French,
      CoreLanguage.MandarinChinese,
      CoreLanguage.Spanish,
      CoreLanguage.Ukrainian,
    ];

    // Only warn about missing translations for languages we actually support
    const relevantMissingKeys = validationResult.missingKeys.filter((key) =>
      supportedLanguages.includes(key.languageId as CoreLanguage),
    );

    if (relevantMissingKeys.length > 0) {
      console.warn(
        'ECIES component registration has missing translations for supported languages:',
        relevantMissingKeys,
      );
    }
  }

  return engine;
}

let _eciesI18nEngine: PluginI18nEngine<CoreLanguage> | null = null;
export function getEciesI18nEngine(): PluginI18nEngine<CoreLanguage> {
  if (!_eciesI18nEngine) {
    _eciesI18nEngine = initEciesI18nEngine();
  }
  return _eciesI18nEngine;
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
  language?: CoreLanguage,
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
  language?: CoreLanguage,
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
  language?: CoreLanguage,
): string {
  return getEciesI18nEngine().translate(
    EciesComponentId,
    key,
    variables,
    language,
  );
}

// Create enum-based language mapping
const DefaultLanguageToCoreLanguageMap = new Map<string, CoreLanguage>([
  // Map DefaultLanguage enum values to CoreLanguage
  [DefaultLanguage.EnglishUS, CoreLanguage.EnglishUS],
  [DefaultLanguage.EnglishUK, CoreLanguage.EnglishUK],
  [DefaultLanguage.French, CoreLanguage.French],
  [DefaultLanguage.MandarinChinese, CoreLanguage.MandarinChinese],
  [DefaultLanguage.Spanish, CoreLanguage.Spanish],
  [DefaultLanguage.Ukrainian, CoreLanguage.Ukrainian],

  // Also map CoreLanguage values to themselves for direct compatibility
  [CoreLanguage.EnglishUS, CoreLanguage.EnglishUS],
  [CoreLanguage.EnglishUK, CoreLanguage.EnglishUK],
  [CoreLanguage.French, CoreLanguage.French],
  [CoreLanguage.MandarinChinese, CoreLanguage.MandarinChinese],
  [CoreLanguage.Spanish, CoreLanguage.Spanish],
  [CoreLanguage.Ukrainian, CoreLanguage.Ukrainian],
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
      // Map any legacy language parameter to CoreLanguage using enum-based mapping
      let coreLanguage: CoreLanguage = CoreLanguage.EnglishUS; // Default fallback

      if (language) {
        const langStr = String(language);
        // Try direct enum mapping first
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
