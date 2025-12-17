import { createPluralString, PluralString } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations';

export const frenchTranslations: Record<EciesStringKey, string | PluralString> =
  {
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
    [EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate]:
      'Type de chiffrement invalide : {encryptionType}',
    [EciesStringKey.Error_ECIESError_InvalidIVLength]: 'Longueur d’IV invalide',
    [EciesStringKey.Error_ECIESError_InvalidAuthTagLength]:
      'Longueur de balise d’authentification invalide',
    [EciesStringKey.Error_ECIESError_InvalidHeaderLength]:
      'Longueur d’en-tête invalide',
    [EciesStringKey.Error_ECIESError_InvalidDataLength]:
      'Longueur de données invalide',
    [EciesStringKey.Error_ECIESError_InvalidPrivateKey]: 'Clé privée invalide',
    [EciesStringKey.Error_ECIESError_InvalidIV]:
      "Vecteur d'initialisation (IV) invalide",
    [EciesStringKey.Error_ECIESError_InvalidAuthTag]:
      "Balise d'authentification invalide",
    [EciesStringKey.Error_ECIESError_InvalidSharedSecret]:
      'Secret partagé invalide',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyNotOnCurve]:
      'Clé publique invalide : pas sur la courbe',
    [EciesStringKey.Error_ECIESError_InvalidAESKeyLength]:
      'Longueur de clé AES invalide : doit être 16, 24 ou 32 octets',
    [EciesStringKey.Error_ECIESError_CannotEncryptEmptyData]:
      'Impossible de chiffrer des données vides',
    [EciesStringKey.Error_ECIESError_CannotDecryptEmptyData]:
      'Impossible de déchiffrer des données vides',
    [EciesStringKey.Error_ECIESError_EncryptedSizeExceedsExpected]:
      'La taille chiffrée dépasse le maximum attendu',
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
    [EciesStringKey.Error_ECIESError_MissingEphemeralPublicKey]:
      'Clé publique éphémère manquante',
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
    [EciesStringKey.Error_ECIESError_FailedToDecryptKey]:
      'Échec du déchiffrement de la clé',
    [EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate]:
      'Trop de destinataires : {recipientsCount}',
    [EciesStringKey.Error_ECIESError_MessageTooLarge]:
      'Message trop volumineux',
    [EciesStringKey.Error_ECIESError_MessageTooLargeTemplate]:
      'Message trop volumineux : {length}',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption]:
      'Une balise d’authentification est requise pour le chiffrement ECIES.',
    [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption]:
      'Une balise d’authentification est requise pour le chiffrement ECIES à plusieurs destinataires.',
    [EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch]:
      'Incohérence de longueur de données déchiffrées',
    [EciesStringKey.Error_ECIESError_RecipientCountMismatch]:
      'Incohérence du nombre de destinataires',
    [EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader]:
      'Données trop courtes pour l’en-tête à plusieurs destinataires',
    [EciesStringKey.Error_ECIESError_FailedToDecryptChallengeTemplate]:
      'Échec du déchiffrement du défi : {error}',
    [EciesStringKey.Error_ECIESError_InvalidChallengeSignature]:
      'Signature de défi invalide',
    [EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey]:
      'Échec de la dérivation de la clé privée',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate]:
      'Format ou longueur de clé publique invalide : {keyLength}',
    [EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey]:
      'Clé publique reçue nulle ou indéfinie',
    [EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate]:
      'La longueur du message dépasse la taille maximale autorisée : {messageLength}',
    [EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode]:
      'Le type de chiffrement multiple n’est pas pris en charge en mode à un seul destinataire.',
    [EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate]:
      'Incohérence de type de chiffrement : attendu {encryptionType}, obtenu {actualEncryptionType}',
    [EciesStringKey.Error_ECIESError_DataTooShortTemplate]:
      'Données trop courtes : requises {requiredSize}, obtenues {dataLength}.',
    [EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate]:
      'Incohérence de longueur de données : attendu {expectedDataLength}, obtenu {receivedDataLength}.',
    [EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents]:
      'Les données combinées sont trop courtes pour contenir les composants requis.',
    [EciesStringKey.Error_ECIESError_InvalidChecksumConstants]:
      'Constantes de somme de contrôle invalides',
    [EciesStringKey.Error_ECIESError_CannotOverwriteDefaultConfiguration]:
      'Impossible d’écraser la configuration par défaut.',
    [EciesStringKey.Error_ECIESError_RecipientIdSizeTooLargeTemplate]:
      "La taille de l'identifiant du destinataire {size} dépasse le maximum de 255 octets",

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
    [EciesStringKey.Error_InvalidEmailError_Missing]: 'Adresse e-mail requise.',
    [EciesStringKey.Error_InvalidEmailError_Whitespace]:
      "L'adresse e-mail contient des espaces en début ou fin.",
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      'Échec du chiffrement : aucune balise d’authentification générée',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      'Échec du stockage des données de connexion par mot de passe',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      'La connexion par mot de passe n’est pas configurée',

    [EciesStringKey.Error_PhoneNumber_InvalidTemplate]:
      'Numéro de téléphone invalide : {phoneNumber}',

    // Multi-recipient and Streaming Error Types
    [EciesStringKey.Error_MultiRecipient_InvalidRecipientCountTemplate]:
      'Nombre de destinataires invalide : {count}',
    [EciesStringKey.Error_MultiRecipient_SymmetricKeyMust32Bytes]:
      'La clé symétrique doit faire 32 octets',
    [EciesStringKey.Error_MultiRecipient_InvalidChunkIndexTemplate]:
      'Index de bloc invalide : {index}',
    [EciesStringKey.Error_MultiRecipient_DataSizeExceedsMaximumTemplate]:
      'La taille des données dépasse le maximum : {size}',
    [EciesStringKey.Error_MultiRecipient_DuplicateRecipientId]:
      'ID de destinataire en double détecté',
    [EciesStringKey.Error_MultiRecipient_RecipientIdMust32Bytes]:
      "L'ID du destinataire doit faire 32 octets",
    [EciesStringKey.Error_MultiRecipient_RecipientHeadersSizeOverflow]:
      'Débordement de la taille des en-têtes de destinataires',
    [EciesStringKey.Error_MultiRecipient_ChunkSizeOverflow]:
      'Débordement de la taille du bloc : trop de destinataires ou données trop volumineuses',
    [EciesStringKey.Error_MultiRecipient_ChunkTooSmall]: 'Bloc trop petit',
    [EciesStringKey.Error_MultiRecipient_InvalidChunkMagic]:
      'Nombre magique de bloc multi-destinataires invalide',
    [EciesStringKey.Error_MultiRecipient_UnsupportedVersionTemplate]:
      'Version non prise en charge : {version}',
    [EciesStringKey.Error_MultiRecipient_ChunkTooSmallForEncryptedSize]:
      'Bloc trop petit pour la taille chiffrée déclarée',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedRecipientId]:
      "Bloc tronqué : pas assez de données pour l'ID du destinataire",
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedKeySize]:
      'Bloc tronqué : pas assez de données pour la taille de la clé',
    [EciesStringKey.Error_MultiRecipient_InvalidKeySizeTemplate]:
      'Taille de clé invalide : {size}',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedEncryptedKey]:
      'Bloc tronqué : pas assez de données pour la clé chiffrée',
    [EciesStringKey.Error_MultiRecipient_RecipientNotFoundInChunk]:
      'Destinataire introuvable dans le bloc',
    [EciesStringKey.Error_Stream_DataTooShortForHeader]:
      "Données trop courtes pour l'en-tête de flux",
    [EciesStringKey.Error_Stream_InvalidMagicBytes]:
      'Octets magiques de flux invalides',
    [EciesStringKey.Error_Stream_UnsupportedVersion]:
      'Version de flux non prise en charge',
    [EciesStringKey.Error_Stream_InvalidPublicKeyLength]:
      'Clé publique invalide : doit faire 33 (compressée) ou 65 (non compressée) octets',
    [EciesStringKey.Error_Stream_BufferOverflowTemplate]:
      'Débordement de tampon : le bloc source dépasse {max} octets',
    [EciesStringKey.Error_Stream_EncryptionCancelled]: 'Chiffrement annulé',
    [EciesStringKey.Error_Stream_AtLeastOneRecipientRequired]:
      'Au moins un destinataire requis',
    [EciesStringKey.Error_Stream_MaxRecipientsExceeded]:
      'Maximum de 65535 destinataires pris en charge',
    [EciesStringKey.Error_Stream_InvalidRecipientPublicKeyLength]:
      'Clé publique du destinataire invalide : doit faire 33 (compressée) ou 65 (non compressée) octets',
    [EciesStringKey.Error_Stream_InvalidRecipientIdLength]:
      'ID de destinataire non valide : doit faire 32 octets',
    [EciesStringKey.Error_Stream_InvalidRecipientIdLengthTemplate]:
      'ID de destinataire non valide : doit faire {expected} octets',
    [EciesStringKey.Error_Stream_InvalidRecipientIdMust32Bytes]:
      'ID de destinataire non valide : doit faire 32 octets',
    [EciesStringKey.Error_Stream_InvalidPrivateKeyMust32Bytes]:
      'Clé privée invalide : doit faire 32 octets',
    [EciesStringKey.Error_Stream_ChunkSequenceErrorTemplate]:
      'Erreur de séquence de bloc : attendu {expected}, obtenu {actual}',
    [EciesStringKey.Error_Stream_DecryptionCancelled]: 'Déchiffrement annulé',
    [EciesStringKey.Error_Chunk_DataTooShortForHeader]:
      "Données trop courtes pour l'en-tête du bloc",
    [EciesStringKey.Error_Chunk_InvalidMagicBytes]:
      'Octets magiques du bloc invalides',
    [EciesStringKey.Error_Chunk_UnsupportedVersion]:
      'Version du bloc non prise en charge',
    [EciesStringKey.Error_Chunk_EncryptedSizeMismatchTemplate]:
      'Taille chiffrée incompatible : attendu {expectedSize}, obtenu {actualSize}',
    [EciesStringKey.Error_Chunk_ChecksumMismatch]:
      'Somme de contrôle du bloc incompatible',
    [EciesStringKey.Error_Chunk_DecryptedSizeMismatch]:
      'Taille déchiffrée incompatible',
    [EciesStringKey.Error_Progress_ChunkBytesCannotBeNegative]:
      'Les octets du bloc ne peuvent pas être négatifs',
    [EciesStringKey.Error_Resumable_AutoSaveIntervalMustBePositive]:
      "L'intervalle de sauvegarde automatique doit être positif",
    [EciesStringKey.Error_Resumable_PublicKeyMismatch]:
      "Clé publique incompatible avec l'état sauvegardé",
    [EciesStringKey.Error_Resumable_ChunkSizeMismatch]:
      "Taille du bloc incompatible avec l'état sauvegardé",
    [EciesStringKey.Error_Resumable_IncludeChecksumsMismatch]:
      "Inclusion des sommes de contrôle incompatible avec l'état sauvegardé",
    [EciesStringKey.Error_Resumable_NoStateToSave]: 'Aucun état à sauvegarder',
    [EciesStringKey.Error_Resumable_UnsupportedStateVersionTemplate]:
      "Version d'état non prise en charge : {version}",
    [EciesStringKey.Error_Resumable_InvalidChunkIndex]:
      'Index de bloc invalide',
    [EciesStringKey.Error_Resumable_StateTooOld]:
      'État trop ancien (>24 heures)',
    [EciesStringKey.Error_Resumable_InvalidPublicKeyInState]:
      "Clé publique invalide dans l'état",
    [EciesStringKey.Error_Resumable_StateIntegrityCheckFailed]:
      "Échec de la vérification de l'intégrité de l'état : HMAC incompatible",
    [EciesStringKey.Error_Builder_MnemonicGenerationNotImplemented]:
      'Génération de mnémonique pas encore implémentée dans v2',
    [EciesStringKey.Error_Builder_MemberNotMigrated]:
      'Membre pas encore migré vers v2',
    [EciesStringKey.Error_Builder_ECIESServiceNotMigrated]:
      'ECIESService pas encore migré vers v2',
    [EciesStringKey.Error_Service_InvalidDataLength]:
      'Longueur de données invalide',
    [EciesStringKey.Error_Service_InvalidEncryptionType]:
      'Type de chiffrement invalide',
    [EciesStringKey.Error_Service_InvalidEncryptedDataLength]:
      'Longueur de données chiffrées invalide',
    [EciesStringKey.Error_Service_ComputedDecryptedLengthNegative]:
      'La longueur déchiffrée calculée est négative',
    [EciesStringKey.Error_Service_MultiRecipientNotImplemented]:
      'Chiffrement multi-destinataires pas encore implémenté',
    [EciesStringKey.Error_Service_InvalidEncryptionTypeOrRecipientCountTemplate]:
      'Type de chiffrement ou nombre de destinataires invalide : {encryptionType}, {recipientCount}',
    [EciesStringKey.Error_Container_ServiceNotFoundTemplate]:
      'Service {service} introuvable dans le conteneur',
    [EciesStringKey.Error_Utils_InvalidHexString]:
      'Chaîne hexadécimale invalide',
    [EciesStringKey.Error_Utils_HexStringMustHaveEvenLength]:
      'La chaîne hexadécimale doit avoir une longueur paire',
    [EciesStringKey.Error_Utils_HexStringContainsInvalidCharacters]:
      'La chaîne hexadécimale contient des caractères invalides',
    [EciesStringKey.Error_Utils_ValueExceedsSafeIntegerRange]:
      "La valeur dépasse la plage d'entiers sûrs",
    [EciesStringKey.Error_Utils_ValueBelowSafeIntegerRange]:
      "La valeur est inférieure à la plage d'entiers sûrs",
    [EciesStringKey.Error_Builder_ECIESServiceMustBeSetBeforeGeneratingMnemonic]:
      'ECIESService doit être défini avant de générer le mnémonique',
    [EciesStringKey.Error_Builder_ECIESServiceIsRequired]:
      'ECIESService est requis',
    [EciesStringKey.Error_Builder_TypeNameAndEmailAreRequired]:
      "Le type, le nom et l'e-mail sont requis",
    [EciesStringKey.Error_DisposedError_ObjectDisposed]:
      "L'objet a été supprimé",
    [EciesStringKey.Error_GuidError_InvalidGuid]: 'GUID invalide.',
    [EciesStringKey.Error_GuidError_InvalidGuidWithDetailsTemplate]:
      'GUID invalide : {GUID}',
    [EciesStringKey.Error_GuidError_InvalidGuidUnknownBrandTemplate]:
      'Marque GUID inconnue : {BRAND}.',
    [EciesStringKey.Error_GuidError_InvalidGuidUnknownLengthTemplate]:
      'Longueur GUID invalide : {LENGTH}.',
    [EciesStringKey.Error_IdProviderError_InvalidLength]:
      "Longueur d'ID incorrecte : {expected} octets attendus, {actual} reçus dans {context}",
    [EciesStringKey.Error_IdProviderError_InputMustBeString]:
      "L'entrée doit être une chaîne de caractères",
    [EciesStringKey.Error_IdProviderError_InvalidStringLength]:
      'Longueur de chaîne invalide : {expected} caractères attendus, {actual} reçus',
    [EciesStringKey.Error_IdProviderError_InvalidCharacters]:
      'La chaîne contient des caractères invalides',
    [EciesStringKey.Error_IdProviderError_InvalidDeserializedId]:
      "L'ID désérialisé a échoué la validation",
    [EciesStringKey.Error_IdProviderError_InvalidByteLengthParameter]:
      'La longueur en octets doit être un entier entre 1 et 255, reçu {value}',
    [EciesStringKey.Error_IdProviderError_ParseFailed]:
      "Échec de l'analyse de l'ID : {message}",
    [EciesStringKey.Error_IdProviderError_InvalidGuidBuffer]:
      'Tampon GUID invalide: {message}',
    [EciesStringKey.Error_IdProviderError_InvalidUuidFormat]:
      'Format UUID invalide: {input}',

    // Invariant Validation Errors
    [EciesStringKey.Error_Invariant_ValidationFailedTemplate]:
      "La validation de l'invariant a échoué: {message}",
    [EciesStringKey.Error_Invariant_UnknownInvariantTemplate]:
      'Invariant inconnu: {name}',
    [EciesStringKey.Error_Invariant_ConfigurationValidationFailedMultipleTemplate]:
      createPluralString({
        one: 'La validation de la configuration a échoué ({count} invariant):\n\n{failures}',
        other:
          'La validation de la configuration a échoué ({count} invariants):\n\n{failures}',
      }),
    [EciesStringKey.Error_ECIESError_InvalidVersion]: 'Version invalide',
    [EciesStringKey.Error_ECIESError_InvalidVersionTemplate]:
      'Version invalide : {version}',
    [EciesStringKey.Error_ECIESError_InvalidCipherSuite]:
      'Suite de chiffrement invalide',
    [EciesStringKey.Error_ECIESError_InvalidCipherSuiteTemplate]:
      'Suite de chiffrement invalide : {cipherSuite}',
  };
