import { EciesStringKey } from '../enumerations';
import { createPluralString, PluralString } from '@digitaldefiance/i18n-lib';

export const germanTranslations: Record<EciesStringKey, string | PluralString> = {
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
    [EciesStringKey.Error_ECIESError_InvalidPrivateKey]: 'Ungültiger privater Schlüssel',
    [EciesStringKey.Error_ECIESError_InvalidIV]: 'Ungültiger Initialisierungsvektor (IV)',
    [EciesStringKey.Error_ECIESError_InvalidAuthTag]: 'Ungültiges Authentifizierungstag',
    [EciesStringKey.Error_ECIESError_InvalidSharedSecret]: 'Ungültiges gemeinsames Geheimnis',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyNotOnCurve]: 'Ungültiger öffentlicher Schlüssel: nicht auf der Kurve',
    [EciesStringKey.Error_ECIESError_InvalidAESKeyLength]: 'Ungültige AES-Schlüssellänge: muss 16, 24 oder 32 Bytes sein',
    [EciesStringKey.Error_ECIESError_CannotEncryptEmptyData]: 'Leere Daten können nicht verschlüsselt werden',
    [EciesStringKey.Error_ECIESError_CannotDecryptEmptyData]: 'Leere Daten können nicht entschlüsselt werden',
    [EciesStringKey.Error_ECIESError_EncryptedSizeExceedsExpected]: 'Verschlüsselte Größe überschreitet das erwartete Maximum',
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
    [EciesStringKey.Error_ECIESError_MissingEphemeralPublicKey]:
      'Fehlender ephemerer öffentlicher Schlüssel',
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
    [EciesStringKey.Error_ECIESError_MessageTooLarge]: 'Nachricht zu groß',
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
    [EciesStringKey.Error_ECIESError_InvalidChecksumConstants]: 'Ungültige Prüfziffernkonstanten',
    [EciesStringKey.Error_ECIESError_CannotOverwriteDefaultConfiguration]: 'Die Standardkonfiguration kann nicht überschrieben werden',
    [EciesStringKey.Error_ECIESError_RecipientIdSizeTooLargeTemplate]: 'Recipient ID size {size} exceeds maximum of 255 bytes',
    [EciesStringKey.Error_ECIESError_InvalidVersion]: 'Ungültige ECIES-Version',
    [EciesStringKey.Error_ECIESError_InvalidVersionTemplate]: 'Ungültige ECIES-Version: {version}',
    [EciesStringKey.Error_ECIESError_InvalidCipherSuite]: 'Ungültige ECIES-Verschlüsselungssuite',
    [EciesStringKey.Error_ECIESError_InvalidCipherSuiteTemplate]: 'Ungültige ECIES-Verschlüsselungssuite: {cipherSuite}',

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
    [EciesStringKey.Error_InvalidEmailError_Missing]: 'E-Mail-Adresse ist erforderlich.',
    [EciesStringKey.Error_InvalidEmailError_Whitespace]: 'E-Mail-Adresse enthält führende oder nachfolgende Leerzeichen.',
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      'Verschlüsselung fehlgeschlagen: kein Authentifizierungstag generiert',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      'Fehler beim Speichern der Passwort-Anmeldedaten',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      'Passwort-Anmeldung ist nicht eingerichtet',
    [EciesStringKey.Error_PhoneNumber_InvalidTemplate]: 'Ungültige Telefonnummer: {phoneNumber}',

    // Multi-recipient and Streaming Error Types
    [EciesStringKey.Error_MultiRecipient_InvalidRecipientCountTemplate]: 'Ungültige Empfängeranzahl: {count}',
    [EciesStringKey.Error_MultiRecipient_SymmetricKeyMust32Bytes]: 'Symmetrischer Schlüssel muss 32 Bytes sein',
    [EciesStringKey.Error_MultiRecipient_InvalidChunkIndexTemplate]: 'Ungültiger Block-Index: {index}',
    [EciesStringKey.Error_MultiRecipient_DataSizeExceedsMaximumTemplate]: 'Datengröße überschreitet Maximum: {size}',
    [EciesStringKey.Error_MultiRecipient_DuplicateRecipientId]: 'Doppelte Empfänger-ID erkannt',
    [EciesStringKey.Error_MultiRecipient_RecipientIdMust32Bytes]: 'Empfänger-ID muss 32 Bytes sein',
    [EciesStringKey.Error_MultiRecipient_RecipientHeadersSizeOverflow]: 'Überlauf der Empfänger-Header-Größe',
    [EciesStringKey.Error_MultiRecipient_ChunkSizeOverflow]: 'Block-Größenüberlauf: zu viele Empfänger oder Daten zu groß',
    [EciesStringKey.Error_MultiRecipient_ChunkTooSmall]: 'Block zu klein',
    [EciesStringKey.Error_MultiRecipient_InvalidChunkMagic]: 'Ungültige Multi-Empfänger-Block-Magicnummer',
    [EciesStringKey.Error_MultiRecipient_UnsupportedVersionTemplate]: 'Nicht unterstützte Version: {version}',
    [EciesStringKey.Error_MultiRecipient_ChunkTooSmallForEncryptedSize]: 'Block zu klein für deklarierte verschlüsselte Größe',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedRecipientId]: 'Block abgeschnitten: nicht genug Daten für Empfänger-ID',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedKeySize]: 'Block abgeschnitten: nicht genug Daten für Schlüsselgröße',
    [EciesStringKey.Error_MultiRecipient_InvalidKeySizeTemplate]: 'Ungültige Schlüsselgröße: {size}',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedEncryptedKey]: 'Block abgeschnitten: nicht genug Daten für verschlüsselten Schlüssel',
    [EciesStringKey.Error_MultiRecipient_RecipientNotFoundInChunk]: 'Empfänger nicht im Block gefunden',
    [EciesStringKey.Error_Stream_DataTooShortForHeader]: 'Daten zu kurz für Stream-Header',
    [EciesStringKey.Error_Stream_InvalidMagicBytes]: 'Ungültige Stream-Magic-Bytes',
    [EciesStringKey.Error_Stream_UnsupportedVersion]: 'Nicht unterstützte Stream-Version',
    [EciesStringKey.Error_Stream_InvalidPublicKeyLength]: 'Ungültiger öffentlicher Schlüssel: muss 33 (komprimiert) oder 65 (unkomprimiert) Bytes sein',
    [EciesStringKey.Error_Stream_BufferOverflowTemplate]: 'Pufferüberlauf: Quellblock überschreitet {max} Bytes',
    [EciesStringKey.Error_Stream_EncryptionCancelled]: 'Verschlüsselung abgebrochen',
    [EciesStringKey.Error_Stream_AtLeastOneRecipientRequired]: 'Mindestens ein Empfänger erforderlich',
    [EciesStringKey.Error_Stream_MaxRecipientsExceeded]: 'Maximal 65535 Empfänger unterstützt',
    [EciesStringKey.Error_Stream_InvalidRecipientPublicKeyLength]: 'Ungültiger öffentlicher Empfängerschlüssel: muss 33 (komprimiert) oder 65 (unkomprimiert) Bytes sein',
    [EciesStringKey.Error_Stream_InvalidRecipientIdLength]: 'Ungültige Empfänger-ID: muss 32 Bytes sein',
    [EciesStringKey.Error_Stream_InvalidRecipientIdLengthTemplate]: 'Ungültige Empfänger-ID: muss {expected} Bytes sein',
    [EciesStringKey.Error_Stream_InvalidRecipientIdMust32Bytes]: 'Ungültige Empfänger-ID: muss 32 Bytes sein',
    [EciesStringKey.Error_Stream_InvalidPrivateKeyMust32Bytes]: 'Ungültiger privater Schlüssel: muss 32 Bytes sein',
    [EciesStringKey.Error_Stream_ChunkSequenceErrorTemplate]: 'Block-Sequenzfehler: erwartet {expected}, erhalten {actual}',
    [EciesStringKey.Error_Stream_DecryptionCancelled]: 'Entschlüsselung abgebrochen',
    [EciesStringKey.Error_Chunk_DataTooShortForHeader]: 'Daten zu kurz für Chunk-Header',
    [EciesStringKey.Error_Chunk_InvalidMagicBytes]: 'Ungültige Chunk-Magic-Bytes',
    [EciesStringKey.Error_Chunk_UnsupportedVersion]: 'Nicht unterstützte Chunk-Version',
    [EciesStringKey.Error_Chunk_EncryptedSizeMismatchTemplate]: 'Verschlüsselte Größe stimmt nicht überein: erwartet {expectedSize}, erhalten {actualSize}',
    [EciesStringKey.Error_Chunk_ChecksumMismatch]: 'Chunk-Prüfsumme stimmt nicht überein',
    [EciesStringKey.Error_Chunk_DecryptedSizeMismatch]: 'Entschlüsselte Größe stimmt nicht überein',
    [EciesStringKey.Error_Progress_ChunkBytesCannotBeNegative]: 'Chunk-Bytes können nicht negativ sein',
    [EciesStringKey.Error_Resumable_AutoSaveIntervalMustBePositive]: 'Automatisches Speicherintervall muss positiv sein',
    [EciesStringKey.Error_Resumable_PublicKeyMismatch]: 'Öffentlicher Schlüssel stimmt nicht mit gespeichertem Zustand überein',
    [EciesStringKey.Error_Resumable_ChunkSizeMismatch]: 'Chunk-Größe stimmt nicht mit gespeichertem Zustand überein',
    [EciesStringKey.Error_Resumable_IncludeChecksumsMismatch]: 'Prüfsummen-Einbeziehung stimmt nicht mit gespeichertem Zustand überein',
    [EciesStringKey.Error_Resumable_NoStateToSave]: 'Kein Zustand zum Speichern',
    [EciesStringKey.Error_Resumable_UnsupportedStateVersionTemplate]: 'Nicht unterstützte Zustandsversion: {version}',
    [EciesStringKey.Error_Resumable_InvalidChunkIndex]: 'Ungültiger Chunk-Index',
    [EciesStringKey.Error_Resumable_StateTooOld]: 'Zustand zu alt (>24 Stunden)',
    [EciesStringKey.Error_Resumable_InvalidPublicKeyInState]: 'Ungültiger öffentlicher Schlüssel im Zustand',
    [EciesStringKey.Error_Resumable_StateIntegrityCheckFailed]: 'Zustandsintegritätsprüfung fehlgeschlagen: HMAC stimmt nicht überein',
    [EciesStringKey.Error_Builder_MnemonicGenerationNotImplemented]: 'Mnemonik-Generierung noch nicht in v2 implementiert',
    [EciesStringKey.Error_Builder_MemberNotMigrated]: 'Mitglied noch nicht zu v2 migriert',
    [EciesStringKey.Error_Builder_ECIESServiceNotMigrated]: 'ECIESService noch nicht zu v2 migriert',
    [EciesStringKey.Error_Service_InvalidDataLength]: 'Ungültige Datenlänge',
    [EciesStringKey.Error_Service_InvalidEncryptionType]: 'Ungültiger Verschlüsselungstyp',
    [EciesStringKey.Error_Service_InvalidEncryptedDataLength]: 'Ungültige verschlüsselte Datenlänge',
    [EciesStringKey.Error_Service_ComputedDecryptedLengthNegative]: 'Berechnete entschlüsselte Länge ist negativ',
    [EciesStringKey.Error_Service_MultiRecipientNotImplemented]: 'Multi-Empfänger-Verschlüsselung noch nicht implementiert',
    [EciesStringKey.Error_Service_InvalidEncryptionTypeOrRecipientCountTemplate]: 'Ungültiger Verschlüsselungstyp oder Empfängeranzahl: {encryptionType}, {recipientCount}',
    [EciesStringKey.Error_Container_ServiceNotFoundTemplate]: 'Service {service} nicht im Container gefunden',
    [EciesStringKey.Error_Utils_InvalidHexString]: 'Ungültige Hex-Zeichenfolge',
    [EciesStringKey.Error_Utils_HexStringMustHaveEvenLength]: 'Hex-Zeichenfolge muss gerade Länge haben',
    [EciesStringKey.Error_Utils_HexStringContainsInvalidCharacters]: 'Hex-Zeichenfolge enthält ungültige Zeichen',
    [EciesStringKey.Error_Utils_ValueExceedsSafeIntegerRange]: 'Wert überschreitet den sicheren Ganzzahlbereich',
    [EciesStringKey.Error_Utils_ValueBelowSafeIntegerRange]: 'Wert liegt unter dem sicheren Ganzzahlbereich',
    [EciesStringKey.Error_Builder_ECIESServiceMustBeSetBeforeGeneratingMnemonic]: 'ECIEService muss vor der Generierung der Mnemonik festgelegt werden',
    [EciesStringKey.Error_Builder_ECIESServiceIsRequired]: 'ECIEService ist erforderlich',
    [EciesStringKey.Error_Builder_TypeNameAndEmailAreRequired]: 'Typ, Name und E-Mail sind erforderlich',
    [EciesStringKey.Error_DisposedError_ObjectDisposed]: 'Objekt wurde freigegeben',
    [EciesStringKey.Error_GuidError_InvalidGuid]: 'Ungültige GUID.',
    [EciesStringKey.Error_GuidError_InvalidGuidWithDetailsTemplate]: 'Ungültige GUID: {GUID}',
    [EciesStringKey.Error_GuidError_InvalidGuidUnknownBrandTemplate]: 'Unbekannte GUID-Marke: {BRAND}.',
    [EciesStringKey.Error_GuidError_InvalidGuidUnknownLengthTemplate]: 'Ungültige GUID-Länge: {LENGTH}.',
    [EciesStringKey.Error_IdProviderError_InvalidLength]: 'ID-Länge stimmt nicht überein: {expected} Bytes erwartet, {actual} in {context} erhalten',
    [EciesStringKey.Error_IdProviderError_InputMustBeString]: 'Eingabe muss eine Zeichenkette sein',
    [EciesStringKey.Error_IdProviderError_InvalidStringLength]: 'Ungültige Zeichenkettenlänge: {expected} Zeichen erwartet, {actual} erhalten',
    [EciesStringKey.Error_IdProviderError_InvalidCharacters]: 'Zeichenkette enthält ungültige Zeichen',
    [EciesStringKey.Error_IdProviderError_InvalidDeserializedId]: 'Deserialisierte ID hat Validierung nicht bestanden',
    [EciesStringKey.Error_IdProviderError_InvalidByteLengthParameter]: 'Byte-Länge muss eine ganze Zahl zwischen 1 und 255 sein, {value} erhalten',
    [EciesStringKey.Error_IdProviderError_ParseFailed]: 'ID konnte nicht geparst werden: {message}',
    [EciesStringKey.Error_IdProviderError_InvalidGuidBuffer]: 'Ungültiger GUID-Puffer: {message}',
    [EciesStringKey.Error_IdProviderError_InvalidUuidFormat]: 'Ungültiges UUID-Format: {input}',

    // Invariant Validation Errors
    [EciesStringKey.Error_Invariant_ValidationFailedTemplate]: 'Invariantenvalidierung fehlgeschlagen: {message}',
    [EciesStringKey.Error_Invariant_UnknownInvariantTemplate]: 'Unbekannte Invariante: {name}',
    [EciesStringKey.Error_Invariant_ConfigurationValidationFailedMultipleTemplate]: createPluralString({
      one: 'Konfigurationsvalidierung fehlgeschlagen ({count} Invariante):\n\n{failures}',
      other: 'Konfigurationsvalidierung fehlgeschlagen ({count} Invarianten):\n\n{failures}'
    }),
  };