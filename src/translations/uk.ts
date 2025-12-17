import { createPluralString, PluralString } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations';

export const ukrainianTranslations: Record<
  EciesStringKey,
  string | PluralString
> = {
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
  [EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate]:
    'Недійсний тип шифрування: {encryptionType}',
  [EciesStringKey.Error_ECIESError_InvalidIVLength]: 'Недійсна довжина IV',
  [EciesStringKey.Error_ECIESError_InvalidAuthTagLength]:
    'Недійсна довжина тега автентифікації',
  [EciesStringKey.Error_ECIESError_InvalidHeaderLength]:
    'Недійсна довжина заголовка',
  [EciesStringKey.Error_ECIESError_InvalidDataLength]: 'Недійсна довжина даних',
  [EciesStringKey.Error_ECIESError_InvalidPrivateKey]:
    'Недійсний приватний ключ',
  [EciesStringKey.Error_ECIESError_InvalidIV]:
    'Недійсний вектор ініціалізації (IV)',
  [EciesStringKey.Error_ECIESError_InvalidAuthTag]:
    'Недійсний тег автентифікації',
  [EciesStringKey.Error_ECIESError_InvalidSharedSecret]:
    'Недійсний спільний секрет',
  [EciesStringKey.Error_ECIESError_InvalidPublicKeyNotOnCurve]:
    'Недійсний відкритий ключ: не на кривій',
  [EciesStringKey.Error_ECIESError_InvalidAESKeyLength]:
    'Недійсна довжина ключа AES: має бути 16, 24 або 32 байти',
  [EciesStringKey.Error_ECIESError_CannotEncryptEmptyData]:
    'Неможливо зашифрувати порожні дані',
  [EciesStringKey.Error_ECIESError_CannotDecryptEmptyData]:
    'Неможливо розшифрувати порожні дані',
  [EciesStringKey.Error_ECIESError_EncryptedSizeExceedsExpected]:
    'Зашифрований розмір перевищує очікуваний максимум',
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
  [EciesStringKey.Error_ECIESError_MissingEphemeralPublicKey]:
    'Відсутній ефемерний відкритий ключ',
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
  [EciesStringKey.Error_ECIESError_FailedToDecryptKey]:
    'Не вдалося розшифрувати ключ',
  [EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate]:
    'Занадто багато одержувачів: {recipientsCount}',
  [EciesStringKey.Error_ECIESError_MessageTooLarge]:
    'Повідомлення занадто велике',
  [EciesStringKey.Error_ECIESError_MessageTooLargeTemplate]:
    'Повідомлення занадто велике: {length}',
  [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption]:
    'Тег автентифікації потрібен для шифрування ECIES',
  [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption]:
    'Тег автентифікації потрібен для шифрування ECIES з кількома одержувачами',
  [EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch]:
    'Невідповідність довжини розшифрованих даних',
  [EciesStringKey.Error_ECIESError_RecipientCountMismatch]:
    'Невідповідність кількості одержувачів',
  [EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader]:
    'Дані занадто короткі для заголовка з кількома одержувачами',
  [EciesStringKey.Error_ECIESError_FailedToDecryptChallengeTemplate]:
    'Не вдалося розшифрувати виклик: {error}',
  [EciesStringKey.Error_ECIESError_InvalidChallengeSignature]:
    'Недійсна підписка на виклик',
  [EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey]:
    'Не вдалося вивести приватний ключ',
  [EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate]:
    'Недійсний формат або довжина відкритого ключа: {keyLength}',
  [EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey]:
    'Отримано null або undefined відкритий ключ',
  [EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate]:
    'Довжина повідомлення перевищує максимально допустимий розмір: {messageLength}',
  [EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode]:
    'Типи кількісного шифрування не підтримуються в режимі одного одержувача',
  [EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate]:
    'Невідповідність типу шифрування: очікувалося {encryptionType}, отримано {actualEncryptionType}',
  [EciesStringKey.Error_ECIESError_DataTooShortTemplate]:
    'Дані занадто короткі: потрібно {requiredSize}, отримано {dataLength}',
  [EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate]:
    'Невідповідність довжини даних: очікувалося {expectedDataLength}, отримано {receivedDataLength}.',
  [EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents]:
    'Обʼєднані дані занадто короткі, щоб містити необхідні компоненти',
  [EciesStringKey.Error_ECIESError_InvalidChecksumConstants]:
    'Недійсні константи контрольної суми',
  [EciesStringKey.Error_ECIESError_CannotOverwriteDefaultConfiguration]:
    'Неможливо перезаписати конфігурацію за замовчуванням',
  [EciesStringKey.Error_ECIESError_RecipientIdSizeTooLargeTemplate]:
    'Recipient ID size {size} exceeds maximum of 255 bytes',
  [EciesStringKey.Error_ECIESError_InvalidVersion]: 'Недійсна версія ECIES',
  [EciesStringKey.Error_ECIESError_InvalidVersionTemplate]:
    'Недійсна версія ECIES: {version}',
  [EciesStringKey.Error_ECIESError_InvalidCipherSuite]:
    'Недійсний набір шифрів ECIES',
  [EciesStringKey.Error_ECIESError_InvalidCipherSuiteTemplate]:
    'Недійсний набір шифрів ECIES: {cipherSuite}',

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
    'Гаманець вже завантажено.',
  [EciesStringKey.Error_MemberError_InvalidMnemonic]:
    'Недійсний мнемонік гаманця.',
  [EciesStringKey.Error_MemberError_IncorrectOrInvalidPrivateKey]:
    'Неправильний або недійсний приватний ключ для цього відкритого ключа',
  [EciesStringKey.Error_MemberError_MemberNotFound]: 'Учасника не знайдено.',
  [EciesStringKey.Error_MemberError_MemberAlreadyExists]: 'Учасник вже існує.',
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

  // Length Error Types - buildReasonMap(LengthErrorType, 'Error', 'LengthError')
  [EciesStringKey.Error_LengthError_LengthIsTooShort]: 'Довжина надто коротка.',
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
  [EciesStringKey.Error_InvalidEmailError_Missing]:
    'Потрібна електронна адреса.',
  [EciesStringKey.Error_InvalidEmailError_Whitespace]:
    'Електронна адреса містить пробіли на початку або в кінці.',
  [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
    'Не вдалося зашифрувати: не створено тег автентифікації',
  [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
    'Не вдалося зберегти дані для входу за допомогою пароля',
  [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
    'Вхід за допомогою пароля не налаштовано',
  [EciesStringKey.Error_PhoneNumber_InvalidTemplate]:
    'Недійсний номер телефону: {phoneNumber}',

  // Multi-recipient and Streaming Error Types
  [EciesStringKey.Error_MultiRecipient_InvalidRecipientCountTemplate]:
    'Недійсна кількість одержувачів: {count}',
  [EciesStringKey.Error_MultiRecipient_SymmetricKeyMust32Bytes]:
    'Симетричний ключ повинен бути 32 байти',
  [EciesStringKey.Error_MultiRecipient_InvalidChunkIndexTemplate]:
    'Недійсний індекс блоку: {index}',
  [EciesStringKey.Error_MultiRecipient_DataSizeExceedsMaximumTemplate]:
    'Розмір даних перевищує максимум: {size}',
  [EciesStringKey.Error_MultiRecipient_DuplicateRecipientId]:
    'Виявлено дублікат ID одержувача',
  [EciesStringKey.Error_MultiRecipient_RecipientIdMust32Bytes]:
    'ID одержувача повинен бути 32 байти',
  [EciesStringKey.Error_MultiRecipient_RecipientHeadersSizeOverflow]:
    'Переповнення розміру заголовків одержувачів',
  [EciesStringKey.Error_MultiRecipient_ChunkSizeOverflow]:
    'Переповнення розміру блоку: занадто багато одержувачів або дані занадто великі',
  [EciesStringKey.Error_MultiRecipient_ChunkTooSmall]: 'Блок занадто малий',
  [EciesStringKey.Error_MultiRecipient_InvalidChunkMagic]:
    'Недійсне магічне число блоку з кількома одержувачами',
  [EciesStringKey.Error_MultiRecipient_UnsupportedVersionTemplate]:
    'Непідтримувана версія: {version}',
  [EciesStringKey.Error_MultiRecipient_ChunkTooSmallForEncryptedSize]:
    'Блок занадто малий для заявленого зашифрованого розміру',
  [EciesStringKey.Error_MultiRecipient_ChunkTruncatedRecipientId]:
    'Блок обрізано: недостатньо даних для ID одержувача',
  [EciesStringKey.Error_MultiRecipient_ChunkTruncatedKeySize]:
    'Блок обрізано: недостатньо даних для розміру ключа',
  [EciesStringKey.Error_MultiRecipient_InvalidKeySizeTemplate]:
    'Недійсний розмір ключа: {size}',
  [EciesStringKey.Error_MultiRecipient_ChunkTruncatedEncryptedKey]:
    'Блок обрізано: недостатньо даних для зашифрованого ключа',
  [EciesStringKey.Error_MultiRecipient_RecipientNotFoundInChunk]:
    'Одержувача не знайдено в блоці',
  [EciesStringKey.Error_Stream_DataTooShortForHeader]:
    'Дані занадто короткі для заголовка потоку',
  [EciesStringKey.Error_Stream_InvalidMagicBytes]:
    'Недійсні магічні байти потоку',
  [EciesStringKey.Error_Stream_UnsupportedVersion]:
    'Непідтримувана версія потоку',
  [EciesStringKey.Error_Stream_InvalidPublicKeyLength]:
    'Недійсний відкритий ключ: повинен бути 33 (стиснутий) або 65 (нестиснутий) байти',
  [EciesStringKey.Error_Stream_BufferOverflowTemplate]:
    'Переповнення буфера: вихідний блок перевищує {max} байти',
  [EciesStringKey.Error_Stream_EncryptionCancelled]: 'Шифрування скасовано',
  [EciesStringKey.Error_Stream_AtLeastOneRecipientRequired]:
    'Потрібен щонайменше один одержувач',
  [EciesStringKey.Error_Stream_MaxRecipientsExceeded]:
    'Підтримується максимум 65535 одержувачів',
  [EciesStringKey.Error_Stream_InvalidRecipientPublicKeyLength]:
    'Недійсний відкритий ключ одержувача: повинен бути 33 (стиснутий) або 65 (нестиснутий) байти',
  [EciesStringKey.Error_Stream_InvalidRecipientIdLength]:
    'Недійсний ID одержувача: повинен бути 32 байти',
  [EciesStringKey.Error_Stream_InvalidRecipientIdLengthTemplate]:
    'Недійсний ID одержувача: повинен бути {expected} байти',
  [EciesStringKey.Error_Stream_InvalidRecipientIdMust32Bytes]:
    'Недійсний ID одержувача: повинен бути 32 байти',
  [EciesStringKey.Error_Stream_InvalidPrivateKeyMust32Bytes]:
    'Недійсний приватний ключ: повинен бути 32 байти',
  [EciesStringKey.Error_Stream_ChunkSequenceErrorTemplate]:
    'Помилка послідовності блоків: очікувалося {expected}, отримано {actual}',
  [EciesStringKey.Error_Stream_DecryptionCancelled]: 'Розшифрування скасовано',
  [EciesStringKey.Error_Chunk_DataTooShortForHeader]:
    'Дані занадто короткі для заголовка фрагмента',
  [EciesStringKey.Error_Chunk_InvalidMagicBytes]:
    'Недійсні магічні байти фрагмента',
  [EciesStringKey.Error_Chunk_UnsupportedVersion]:
    'Непідтримувана версія фрагмента',
  [EciesStringKey.Error_Chunk_EncryptedSizeMismatchTemplate]:
    'Невідповідність зашифрованого розміру: очікувано {expectedSize}, отримано {actualSize}',
  [EciesStringKey.Error_Chunk_ChecksumMismatch]:
    'Невідповідність контрольної суми фрагмента',
  [EciesStringKey.Error_Chunk_DecryptedSizeMismatch]:
    'Невідповідність розшифрованого розміру',
  [EciesStringKey.Error_Progress_ChunkBytesCannotBeNegative]:
    'Байти фрагмента не можуть бути від’ємними',
  [EciesStringKey.Error_Resumable_AutoSaveIntervalMustBePositive]:
    'Інтервал автозбереження повинен бути додатним',
  [EciesStringKey.Error_Resumable_PublicKeyMismatch]:
    'Публічний ключ не відповідає збереженому стану',
  [EciesStringKey.Error_Resumable_ChunkSizeMismatch]:
    'Розмір фрагмента не відповідає збереженому стану',
  [EciesStringKey.Error_Resumable_IncludeChecksumsMismatch]:
    'Включення контрольних сум не відповідає збереженому стану',
  [EciesStringKey.Error_Resumable_NoStateToSave]: 'Немає стану для збереження',
  [EciesStringKey.Error_Resumable_UnsupportedStateVersionTemplate]:
    'Непідтримувана версія стану: {version}',
  [EciesStringKey.Error_Resumable_InvalidChunkIndex]:
    'Недійсний індекс фрагмента',
  [EciesStringKey.Error_Resumable_StateTooOld]:
    'Стан занадто старий (>24 години)',
  [EciesStringKey.Error_Resumable_InvalidPublicKeyInState]:
    'Недійсний публічний ключ у стані',
  [EciesStringKey.Error_Resumable_StateIntegrityCheckFailed]:
    'Перевірка цілісності стану не вдалася: HMAC не відповідає',
  [EciesStringKey.Error_Builder_MnemonicGenerationNotImplemented]:
    'Генерація мнемоніки ще не реалізована в v2',
  [EciesStringKey.Error_Builder_MemberNotMigrated]:
    'Член ще не перенесено до v2',
  [EciesStringKey.Error_Builder_ECIESServiceNotMigrated]:
    'ECIESService ще не перенесено до v2',
  [EciesStringKey.Error_Service_InvalidDataLength]: 'Недійсна довжина даних',
  [EciesStringKey.Error_Service_InvalidEncryptionType]:
    'Недійсний тип шифрування',
  [EciesStringKey.Error_Service_InvalidEncryptedDataLength]:
    'Недійсна довжина зашифрованих даних',
  [EciesStringKey.Error_Service_ComputedDecryptedLengthNegative]:
    'Обчислена довжина розшифрованих даних є від’ємною',
  [EciesStringKey.Error_Service_MultiRecipientNotImplemented]:
    'Шифрування для кількох одержувачів ще не реалізовано',
  [EciesStringKey.Error_Service_InvalidEncryptionTypeOrRecipientCountTemplate]:
    'Недійсний тип шифрування або кількість одержувачів: {encryptionType}, {recipientCount}',
  [EciesStringKey.Error_Container_ServiceNotFoundTemplate]:
    'Сервіс {service} не знайдено в контейнері',
  [EciesStringKey.Error_Utils_InvalidHexString]:
    'Недійсний шістнадцятковий рядок',
  [EciesStringKey.Error_Utils_HexStringMustHaveEvenLength]:
    'Шістнадцятковий рядок повинен мати парну довжину',
  [EciesStringKey.Error_Utils_HexStringContainsInvalidCharacters]:
    'Шістнадцятковий рядок містить недійсні символи',
  [EciesStringKey.Error_Utils_ValueExceedsSafeIntegerRange]:
    'Значення перевищує безпечний діапазон цілих чисел',
  [EciesStringKey.Error_Utils_ValueBelowSafeIntegerRange]:
    'Значення нижче безпечного діапазону цілих чисел',
  [EciesStringKey.Error_Builder_ECIESServiceMustBeSetBeforeGeneratingMnemonic]:
    'ECIESService повинен бути встановлений перед генерацією мнемоніки',
  [EciesStringKey.Error_Builder_ECIESServiceIsRequired]:
    "ECIESService є обов'язковим",
  [EciesStringKey.Error_Builder_TypeNameAndEmailAreRequired]:
    "Тип, ім'я та електронна пошта є обов'язковими",
  [EciesStringKey.Error_DisposedError_ObjectDisposed]: "Об'єкт було видалено",
  [EciesStringKey.Error_GuidError_InvalidGuid]: 'Недійсний GUID.',
  [EciesStringKey.Error_GuidError_InvalidGuidWithDetailsTemplate]:
    'Недійсний GUID: {GUID}',
  [EciesStringKey.Error_GuidError_InvalidGuidUnknownBrandTemplate]:
    'Невідомий бренд GUID: {BRAND}.',
  [EciesStringKey.Error_GuidError_InvalidGuidUnknownLengthTemplate]:
    'Невірна довжина GUID: {LENGTH}.',
  [EciesStringKey.Error_IdProviderError_InvalidLength]:
    'Невідповідність довжини ID: очікувалося {expected} байт, отримано {actual} у {context}',
  [EciesStringKey.Error_IdProviderError_InputMustBeString]:
    'Вхідні дані мають бути рядком',
  [EciesStringKey.Error_IdProviderError_InvalidStringLength]:
    'Недійсна довжина рядка: очікувалося {expected} символів, отримано {actual}',
  [EciesStringKey.Error_IdProviderError_InvalidCharacters]:
    'Рядок містить недійсні символи',
  [EciesStringKey.Error_IdProviderError_InvalidDeserializedId]:
    'Десеріалізований ID не пройшов перевірку',
  [EciesStringKey.Error_IdProviderError_InvalidByteLengthParameter]:
    'Довжина в байтах має бути цілим числом від 1 до 255, отримано {value}',
  [EciesStringKey.Error_IdProviderError_ParseFailed]:
    'Не вдалося розібрати ID: {message}',
  [EciesStringKey.Error_IdProviderError_InvalidGuidBuffer]:
    'Недійсний буфер GUID: {message}',
  [EciesStringKey.Error_IdProviderError_InvalidUuidFormat]:
    'Недійсний формат UUID: {input}',

  // Invariant Validation Errors
  [EciesStringKey.Error_Invariant_ValidationFailedTemplate]:
    'Перевірка інваріанта не вдалася: {message}',
  [EciesStringKey.Error_Invariant_UnknownInvariantTemplate]:
    'Невідомий інваріант: {name}',
  [EciesStringKey.Error_Invariant_ConfigurationValidationFailedMultipleTemplate]:
    createPluralString({
      one: 'Перевірка конфігурації не вдалася ({count} інваріант):\n\n{failures}',
      few: 'Перевірка конфігурації не вдалася ({count} інваріанти):\n\n{failures}',
      many: 'Перевірка конфігурації не вдалася ({count} інваріантів):\n\n{failures}',
      other:
        'Перевірка конфігурації не вдалася ({count} інваріанта):\n\n{failures}',
    }),
};
