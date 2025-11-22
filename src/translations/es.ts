import { EciesStringKey } from '../enumerations';
import { createPluralString, PluralString } from '@digitaldefiance/i18n-lib';

export const spanishTranslations: Record<EciesStringKey, string | PluralString> = {
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
    [EciesStringKey.Error_ECIESError_InvalidPrivateKey]: 'Clave privada no válida',
    [EciesStringKey.Error_ECIESError_InvalidIV]: 'Vector de inicialización (IV) no válido',
    [EciesStringKey.Error_ECIESError_InvalidAuthTag]: 'Etiqueta de autenticación no válida',
    [EciesStringKey.Error_ECIESError_InvalidSharedSecret]: 'Secreto compartido no válido',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyNotOnCurve]: 'Clave pública no válida: no está en la curva',
    [EciesStringKey.Error_ECIESError_InvalidAESKeyLength]: 'Longitud de clave AES no válida: debe ser 16, 24 o 32 bytes',
    [EciesStringKey.Error_ECIESError_CannotEncryptEmptyData]: 'No se pueden cifrar datos vacíos',
    [EciesStringKey.Error_ECIESError_CannotDecryptEmptyData]: 'No se pueden descifrar datos vacíos',
    [EciesStringKey.Error_ECIESError_EncryptedSizeExceedsExpected]: 'El tamaño cifrado excede el máximo esperado',
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
    [EciesStringKey.Error_ECIESError_MessageTooLarge]: 'Mensaje demasiado grande',
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
    [EciesStringKey.Error_ECIESError_InvalidChecksumConstants]: 'Constantes de suma de control no válidas',
    [EciesStringKey.Error_ECIESError_CannotOverwriteDefaultConfiguration]: 'No se puede sobrescribir la configuración predeterminada.',
    [EciesStringKey.Error_ECIESError_RecipientIdSizeTooLargeTemplate]: 'Recipient ID size {size} exceeds maximum of 255 bytes',
    [EciesStringKey.Error_ECIESError_InvalidVersion]: 'Versión ECIES inválida',
    [EciesStringKey.Error_ECIESError_InvalidVersionTemplate]: 'Versión ECIES inválida: {version}',
    [EciesStringKey.Error_ECIESError_InvalidCipherSuite]: 'Suite de cifrado ECIES inválida',
    [EciesStringKey.Error_ECIESError_InvalidCipherSuiteTemplate]: 'Suite de cifrado ECIES inválida: {cipherSuite}',

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
    [EciesStringKey.Error_InvalidEmailError_Missing]:
      'Se requiere dirección de correo electrónico.',
    [EciesStringKey.Error_InvalidEmailError_Whitespace]:
      'La dirección de correo electrónico contiene espacios al inicio o al final.',
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      'Error de cifrado: no se generó ninguna etiqueta de autenticación',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      'Error al almacenar los datos de inicio de sesión de contraseña',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      'El inicio de sesión con contraseña no está configurado',
    [EciesStringKey.Error_PhoneNumber_InvalidTemplate]: 'Número de teléfono no válido: {phoneNumber}',

    // Multi-recipient and Streaming Error Types
    [EciesStringKey.Error_MultiRecipient_InvalidRecipientCountTemplate]: 'Número de destinatarios no válido: {count}',
    [EciesStringKey.Error_MultiRecipient_SymmetricKeyMust32Bytes]: 'La clave simétrica debe ser de 32 bytes',
    [EciesStringKey.Error_MultiRecipient_InvalidChunkIndexTemplate]: 'Índice de bloque no válido: {index}',
    [EciesStringKey.Error_MultiRecipient_DataSizeExceedsMaximumTemplate]: 'El tamaño de los datos excede el máximo: {size}',
    [EciesStringKey.Error_MultiRecipient_DuplicateRecipientId]: 'ID de destinatario duplicado detectado',
    [EciesStringKey.Error_MultiRecipient_RecipientIdMust32Bytes]: 'El ID del destinatario debe ser de 32 bytes',
    [EciesStringKey.Error_MultiRecipient_RecipientHeadersSizeOverflow]: 'Desbordamiento del tamaño de los encabezados de destinatarios',
    [EciesStringKey.Error_MultiRecipient_ChunkSizeOverflow]: 'Desbordamiento del tamaño del bloque: demasiados destinatarios o datos demasiado grandes',
    [EciesStringKey.Error_MultiRecipient_ChunkTooSmall]: 'Bloque demasiado pequeño',
    [EciesStringKey.Error_MultiRecipient_InvalidChunkMagic]: 'Número mágico de bloque multi-destinatario no válido',
    [EciesStringKey.Error_MultiRecipient_UnsupportedVersionTemplate]: 'Versión no compatible: {version}',
    [EciesStringKey.Error_MultiRecipient_ChunkTooSmallForEncryptedSize]: 'Bloque demasiado pequeño para el tamaño cifrado declarado',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedRecipientId]: 'Bloque truncado: no hay suficientes datos para el ID del destinatario',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedKeySize]: 'Bloque truncado: no hay suficientes datos para el tamaño de la clave',
    [EciesStringKey.Error_MultiRecipient_InvalidKeySizeTemplate]: 'Tamaño de clave no válido: {size}',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedEncryptedKey]: 'Bloque truncado: no hay suficientes datos para la clave cifrada',
    [EciesStringKey.Error_MultiRecipient_RecipientNotFoundInChunk]: 'Destinatario no encontrado en el bloque',
    [EciesStringKey.Error_Stream_DataTooShortForHeader]: 'Datos demasiado cortos para el encabezado de flujo',
    [EciesStringKey.Error_Stream_InvalidMagicBytes]: 'Bytes mágicos de flujo no válidos',
    [EciesStringKey.Error_Stream_UnsupportedVersion]: 'Versión de flujo no compatible',
    [EciesStringKey.Error_Stream_InvalidPublicKeyLength]: 'Clave pública no válida: debe ser de 33 (comprimida) o 65 (sin comprimir) bytes',
    [EciesStringKey.Error_Stream_BufferOverflowTemplate]: 'Desbordamiento de búfer: el bloque de origen excede {max} bytes',
    [EciesStringKey.Error_Stream_EncryptionCancelled]: 'Cifrado cancelado',
    [EciesStringKey.Error_Stream_AtLeastOneRecipientRequired]: 'Se requiere al menos un destinatario',
    [EciesStringKey.Error_Stream_MaxRecipientsExceeded]: 'Máximo de 65535 destinatarios admitidos',
    [EciesStringKey.Error_Stream_InvalidRecipientPublicKeyLength]: 'Clave pública del destinatario no válida: debe ser de 33 (comprimida) o 65 (sin comprimir) bytes',
    [EciesStringKey.Error_Stream_InvalidRecipientIdLength]: 'ID de destinatario no válido: debe tener 32 bytes',
    [EciesStringKey.Error_Stream_InvalidRecipientIdLengthTemplate]: 'ID de destinatario no válido: debe tener {expected} bytes',
    [EciesStringKey.Error_Stream_InvalidRecipientIdMust32Bytes]: 'ID de destinatario no válido: debe tener 32 bytes',
    [EciesStringKey.Error_Stream_InvalidPrivateKeyMust32Bytes]: 'Clave privada no válida: debe ser de 32 bytes',
    [EciesStringKey.Error_Stream_ChunkSequenceErrorTemplate]: 'Error de secuencia de bloque: se esperaba {expected}, se obtuvo {actual}',
    [EciesStringKey.Error_Stream_DecryptionCancelled]: 'Descifrado cancelado',
    [EciesStringKey.Error_Chunk_DataTooShortForHeader]: 'Datos demasiado cortos para el encabezado del fragmento',
    [EciesStringKey.Error_Chunk_InvalidMagicBytes]: 'Bytes mágicos del fragmento no válidos',
    [EciesStringKey.Error_Chunk_UnsupportedVersion]: 'Versión del fragmento no compatible',
    [EciesStringKey.Error_Chunk_EncryptedSizeMismatchTemplate]: 'Tamaño cifrado no coincide: esperado {expectedSize}, obtenido {actualSize}',
    [EciesStringKey.Error_Chunk_ChecksumMismatch]: 'Suma de verificación del fragmento no coincide',
    [EciesStringKey.Error_Chunk_DecryptedSizeMismatch]: 'Tamaño descifrado no coincide',
    [EciesStringKey.Error_Progress_ChunkBytesCannotBeNegative]: 'Los bytes del fragmento no pueden ser negativos',
    [EciesStringKey.Error_Resumable_AutoSaveIntervalMustBePositive]: 'El intervalo de guardado automático debe ser positivo',
    [EciesStringKey.Error_Resumable_PublicKeyMismatch]: 'Clave pública no coincide con el estado guardado',
    [EciesStringKey.Error_Resumable_ChunkSizeMismatch]: 'Tamaño del fragmento no coincide con el estado guardado',
    [EciesStringKey.Error_Resumable_IncludeChecksumsMismatch]: 'Inclusión de sumas de verificación no coincide con el estado guardado',
    [EciesStringKey.Error_Resumable_NoStateToSave]: 'No hay estado para guardar',
    [EciesStringKey.Error_Resumable_UnsupportedStateVersionTemplate]: 'Versión de estado no compatible: {version}',
    [EciesStringKey.Error_Resumable_InvalidChunkIndex]: 'Índice de fragmento no válido',
    [EciesStringKey.Error_Resumable_StateTooOld]: 'Estado demasiado antiguo (>24 horas)',
    [EciesStringKey.Error_Resumable_InvalidPublicKeyInState]: 'Clave pública no válida en el estado',
    [EciesStringKey.Error_Resumable_StateIntegrityCheckFailed]: 'Error en la verificación de integridad del estado: HMAC no coincide',
    [EciesStringKey.Error_Builder_MnemonicGenerationNotImplemented]: 'Generación de mnemónico aún no implementada en v2',
    [EciesStringKey.Error_Builder_MemberNotMigrated]: 'Miembro aún no migrado a v2',
    [EciesStringKey.Error_Builder_ECIESServiceNotMigrated]: 'ECIESService aún no migrado a v2',
    [EciesStringKey.Error_Service_InvalidDataLength]: 'Longitud de datos no válida',
    [EciesStringKey.Error_Service_InvalidEncryptionType]: 'Tipo de cifrado no válido',
    [EciesStringKey.Error_Service_InvalidEncryptedDataLength]: 'Longitud de datos cifrados no válida',
    [EciesStringKey.Error_Service_ComputedDecryptedLengthNegative]: 'La longitud descifrada calculada es negativa',
    [EciesStringKey.Error_Service_MultiRecipientNotImplemented]: 'Cifrado multi-destinatario aún no implementado',
    [EciesStringKey.Error_Service_InvalidEncryptionTypeOrRecipientCountTemplate]: 'Tipo de cifrado o número de destinatarios no válido: {encryptionType}, {recipientCount}',
    [EciesStringKey.Error_Container_ServiceNotFoundTemplate]: 'Servicio {service} no encontrado en el contenedor',
    [EciesStringKey.Error_Utils_InvalidHexString]: 'Cadena hexadecimal no válida',
    [EciesStringKey.Error_Utils_HexStringMustHaveEvenLength]: 'La cadena hexadecimal debe tener longitud par',
    [EciesStringKey.Error_Utils_HexStringContainsInvalidCharacters]: 'La cadena hexadecimal contiene caracteres no válidos',
    [EciesStringKey.Error_Utils_ValueExceedsSafeIntegerRange]: 'El valor excede el rango de enteros seguros',
    [EciesStringKey.Error_Utils_ValueBelowSafeIntegerRange]: 'El valor está por debajo del rango de enteros seguros',
    [EciesStringKey.Error_Builder_ECIESServiceMustBeSetBeforeGeneratingMnemonic]: 'ECIESService debe configurarse antes de generar el mnemónico',
    [EciesStringKey.Error_Builder_ECIESServiceIsRequired]: 'ECIESService es obligatorio',
    [EciesStringKey.Error_Builder_TypeNameAndEmailAreRequired]: 'El tipo, nombre y correo electrónico son obligatorios',
    [EciesStringKey.Error_DisposedError_ObjectDisposed]: 'El objeto ha sido eliminado',
    [EciesStringKey.Error_GuidError_InvalidGuid]: 'GUID invalido.',
    [EciesStringKey.Error_GuidError_InvalidGuidWithDetailsTemplate]: 'GUID invalido: {GUID}',
    [EciesStringKey.Error_GuidError_InvalidGuidUnknownBrandTemplate]: 'Marca de GUID desconocida: {BRAND}.',
    [EciesStringKey.Error_GuidError_InvalidGuidUnknownLengthTemplate]: 'Longitud de GUID inválida: {LENGTH}.',
    [EciesStringKey.Error_IdProviderError_InvalidLength]: 'Longitud de ID incorrecta: se esperaban {expected} bytes, se recibieron {actual} en {context}',
    [EciesStringKey.Error_IdProviderError_InputMustBeString]: 'La entrada debe ser una cadena',
    [EciesStringKey.Error_IdProviderError_InvalidStringLength]: 'Longitud de cadena no válida: se esperaban {expected} caracteres, se recibieron {actual}',
    [EciesStringKey.Error_IdProviderError_InvalidCharacters]: 'La cadena contiene caracteres no válidos',
    [EciesStringKey.Error_IdProviderError_InvalidDeserializedId]: 'El ID deserializado falló la validación',
    [EciesStringKey.Error_IdProviderError_InvalidByteLengthParameter]: 'La longitud en bytes debe ser un entero entre 1 y 255, se recibió {value}',
    [EciesStringKey.Error_IdProviderError_ParseFailed]: 'Error al analizar ID: {message}',
    [EciesStringKey.Error_IdProviderError_InvalidGuidBuffer]: 'Búfer GUID inválido: {message}',
    [EciesStringKey.Error_IdProviderError_InvalidUuidFormat]: 'Formato UUID inválido: {input}',

    // Invariant Validation Errors
    [EciesStringKey.Error_Invariant_ValidationFailedTemplate]: 'Validación de invariante falló: {message}',
    [EciesStringKey.Error_Invariant_UnknownInvariantTemplate]: 'Invariante desconocido: {name}',
    [EciesStringKey.Error_Invariant_ConfigurationValidationFailedMultipleTemplate]: createPluralString({
      one: 'Validación de configuración falló ({count} invariante):\n\n{failures}',
      other: 'Validación de configuración falló ({count} invariantes):\n\n{failures}'
    }),
  };