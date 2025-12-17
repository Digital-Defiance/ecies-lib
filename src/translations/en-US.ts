import { createPluralString, PluralString } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations';

export const englishTranslations: Record<
  EciesStringKey,
  string | PluralString
> = {
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
  [EciesStringKey.Error_ECIESError_InvalidEncryptionTypeTemplate]:
    'Invalid encryption type: {encryptionType}',
  [EciesStringKey.Error_ECIESError_InvalidIVLength]: 'Invalid IV length',
  [EciesStringKey.Error_ECIESError_InvalidAuthTagLength]:
    'Invalid auth tag length',
  [EciesStringKey.Error_ECIESError_InvalidHeaderLength]:
    'Invalid header length',
  [EciesStringKey.Error_ECIESError_InvalidDataLength]: 'Invalid data length',
  [EciesStringKey.Error_ECIESError_InvalidPrivateKey]: 'Invalid private key',
  [EciesStringKey.Error_ECIESError_InvalidIV]:
    'Invalid initialization vector (IV)',
  [EciesStringKey.Error_ECIESError_InvalidAuthTag]:
    'Invalid authentication tag',
  [EciesStringKey.Error_ECIESError_InvalidSharedSecret]:
    'Invalid shared secret',
  [EciesStringKey.Error_ECIESError_InvalidPublicKeyNotOnCurve]:
    'Invalid public key: not on curve',
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
  [EciesStringKey.Error_ECIESError_MissingEphemeralPublicKey]:
    'Missing ephemeral public key',
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
  [EciesStringKey.Error_ECIESError_TooManyRecipientsTemplate]:
    'Too many recipients: {recipientsCount}',
  [EciesStringKey.Error_ECIESError_MessageTooLarge]: 'Message too large',
  [EciesStringKey.Error_ECIESError_MessageTooLargeTemplate]:
    'Message too large: {length}',
  [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForECIESEncryption]:
    'Authentication tag is required for ECIES encryption',
  [EciesStringKey.Error_ECIESError_AuthenticationTagIsRequiredForMultiRecipientECIESEncryption]:
    'Authentication tag is required for multi-recipient ECIES encryption',
  [EciesStringKey.Error_ECIESError_DecryptedDataLengthMismatch]:
    'Decrypted data length mismatch',
  [EciesStringKey.Error_ECIESError_RecipientCountMismatch]:
    'Recipient count mismatch',
  [EciesStringKey.Error_ECIESError_DataTooShortForMultiRecipientHeader]:
    'Data too short for multi-recipient header',
  [EciesStringKey.Error_ECIESError_FailedToDecryptChallengeTemplate]:
    'Failed to decrypt challenge: {error}',
  [EciesStringKey.Error_ECIESError_InvalidChallengeSignature]:
    'Invalid challenge signature',
  [EciesStringKey.Error_ECIESError_FailedToDervivePrivateKey]:
    'Failed to derive private key',
  [EciesStringKey.Error_ECIESError_InvalidPublicKeyFormatOrLengthTemplate]:
    'Invalid public key format or length: {keyLength}',
  [EciesStringKey.Error_ECIESError_ReceivedNullOrUndefinedPublicKey]:
    'Received null or undefined public key',
  [EciesStringKey.Error_ECIESError_MessageLengthExceedsMaximumAllowedSizeTemplate]:
    'Message length exceeds maximum allowed size: {messageLength}',
  [EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode]:
    'Multiple encryption type not supported in single recipient mode',
  [EciesStringKey.Error_ECIESError_EncryptionTypeMismatchTemplate]:
    'Encryption type mismatch: expected {encryptionType}, got {actualEncryptionType}',
  [EciesStringKey.Error_ECIESError_DataTooShortTemplate]:
    'Data too short: required {requiredSize}, got {dataLength}',
  [EciesStringKey.Error_ECIESError_DataLengthMismatchTemplate]:
    'Data length mismatch: expected {expectedDataLength}, got {receivedDataLength}',
  [EciesStringKey.Error_ECIESError_CombinedDataTooShortForComponents]:
    'Combined data is too short to contain required components',
  [EciesStringKey.Error_ECIESError_InvalidChecksumConstants]:
    'Invalid checksum constants',
  [EciesStringKey.Error_ECIESError_CannotOverwriteDefaultConfiguration]:
    'Cannot overwrite the default configuration',
  [EciesStringKey.Error_ECIESError_InvalidAESKeyLength]:
    'Invalid AES key length: must be 16, 24, or 32 bytes',
  [EciesStringKey.Error_ECIESError_CannotEncryptEmptyData]:
    'Cannot encrypt empty data',
  [EciesStringKey.Error_ECIESError_CannotDecryptEmptyData]:
    'Cannot decrypt empty data',
  [EciesStringKey.Error_ECIESError_EncryptedSizeExceedsExpected]:
    'Encrypted size exceeds expected maximum',

  // Member Error Types - buildReasonMap(MemberErrorType, 'Error', 'MemberError')
  [EciesStringKey.Error_MemberError_MissingMemberName]:
    'Member name is required',
  [EciesStringKey.Error_MemberError_InvalidMemberNameWhitespace]:
    'Member name contains trailing or leading whitespace.',
  [EciesStringKey.Error_MemberError_InvalidEmail]: 'Invalid email.',
  [EciesStringKey.Error_MemberError_InvalidMemberName]: 'Invalid member name.',
  [EciesStringKey.Error_MemberError_InvalidMemberStatus]:
    'Invalid member status.',
  [EciesStringKey.Error_MemberError_MissingEmail]: 'Missing email.',
  [EciesStringKey.Error_MemberError_InvalidEmailWhitespace]:
    'Email contains trailing or leading whitespace.',
  [EciesStringKey.Error_MemberError_MissingPrivateKey]: 'Missing private key.',
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
  [EciesStringKey.Error_MemberError_InvalidMemberData]: 'Invalid member data.',
  [EciesStringKey.Error_MemberError_FailedToConvertMemberData]:
    'Failed to convert member data.',
  [EciesStringKey.Error_MemberError_MissingEncryptionData]:
    'Missing encryption data.',
  [EciesStringKey.Error_MemberError_EncryptionDataTooLarge]:
    'Encryption data too large.',
  [EciesStringKey.Error_MemberError_InvalidEncryptionData]:
    'Invalid encryption data.',

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
  [EciesStringKey.Error_InvalidEmailError_Missing]:
    'Email address is required.',
  [EciesStringKey.Error_InvalidEmailError_Whitespace]:
    'Email address contains leading or trailing whitespace.',
  [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
    'Encryption failed: no authentication tag generated',
  [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
    'Failed to store password login data',
  [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
    'Password login is not set up',
  [EciesStringKey.Error_PhoneNumber_InvalidTemplate]:
    'Invalid phone number: {phoneNumber}',

  // Multi-recipient and Streaming Error Types
  [EciesStringKey.Error_MultiRecipient_InvalidRecipientCountTemplate]:
    'Invalid recipient count: {count}',
  [EciesStringKey.Error_MultiRecipient_SymmetricKeyMust32Bytes]:
    'Symmetric key must be 32 bytes',
  [EciesStringKey.Error_MultiRecipient_InvalidChunkIndexTemplate]:
    'Invalid chunk index: {index}',
  [EciesStringKey.Error_MultiRecipient_DataSizeExceedsMaximumTemplate]:
    'Data size exceeds maximum: {size}',
  [EciesStringKey.Error_MultiRecipient_DuplicateRecipientId]:
    'Duplicate recipient ID detected',
  [EciesStringKey.Error_MultiRecipient_RecipientIdMust32Bytes]:
    'Recipient ID must be 32 bytes',
  [EciesStringKey.Error_MultiRecipient_RecipientHeadersSizeOverflow]:
    'Recipient headers size overflow',
  [EciesStringKey.Error_MultiRecipient_ChunkSizeOverflow]:
    'Chunk size overflow: too many recipients or data too large',
  [EciesStringKey.Error_MultiRecipient_ChunkTooSmall]: 'Chunk too small',
  [EciesStringKey.Error_MultiRecipient_InvalidChunkMagic]:
    'Invalid multi-recipient chunk magic',
  [EciesStringKey.Error_MultiRecipient_UnsupportedVersionTemplate]:
    'Unsupported version: {version}',
  [EciesStringKey.Error_MultiRecipient_ChunkTooSmallForEncryptedSize]:
    'Chunk too small for declared encrypted size',
  [EciesStringKey.Error_MultiRecipient_ChunkTruncatedRecipientId]:
    'Chunk truncated: not enough data for recipient ID',
  [EciesStringKey.Error_MultiRecipient_ChunkTruncatedKeySize]:
    'Chunk truncated: not enough data for key size',
  [EciesStringKey.Error_MultiRecipient_InvalidKeySizeTemplate]:
    'Invalid key size: {size}',
  [EciesStringKey.Error_MultiRecipient_ChunkTruncatedEncryptedKey]:
    'Chunk truncated: not enough data for encrypted key',
  [EciesStringKey.Error_MultiRecipient_RecipientNotFoundInChunk]:
    'Recipient not found in chunk',
  [EciesStringKey.Error_Stream_DataTooShortForHeader]:
    'Data too short for stream header',
  [EciesStringKey.Error_Stream_InvalidMagicBytes]: 'Invalid stream magic bytes',
  [EciesStringKey.Error_Stream_UnsupportedVersion]:
    'Unsupported stream version',
  [EciesStringKey.Error_Stream_InvalidPublicKeyLength]:
    'Invalid public key: must be 33 (compressed) or 65 (uncompressed) bytes',
  [EciesStringKey.Error_Stream_BufferOverflowTemplate]:
    'Buffer overflow: source chunk exceeds {max} bytes',
  [EciesStringKey.Error_Stream_EncryptionCancelled]: 'Encryption cancelled',
  [EciesStringKey.Error_Stream_AtLeastOneRecipientRequired]:
    'At least one recipient required',
  [EciesStringKey.Error_Stream_MaxRecipientsExceeded]:
    'Maximum 65535 recipients supported',
  [EciesStringKey.Error_Stream_InvalidRecipientPublicKeyLength]:
    'Invalid recipient public key: must be 33 (compressed) or 65 (uncompressed) bytes',
  [EciesStringKey.Error_Stream_InvalidRecipientIdLength]:
    'Invalid recipient ID: must be 32 bytes',
  [EciesStringKey.Error_Stream_InvalidRecipientIdLengthTemplate]:
    'Invalid recipient ID: must be {expected} bytes',
  [EciesStringKey.Error_Stream_InvalidRecipientIdMust32Bytes]:
    'Invalid recipient ID: must be 32 bytes',
  [EciesStringKey.Error_Stream_InvalidPrivateKeyMust32Bytes]:
    'Invalid private key: must be 32 bytes',
  [EciesStringKey.Error_Stream_ChunkSequenceErrorTemplate]:
    'Chunk sequence error: expected {expected}, got {actual}',
  [EciesStringKey.Error_Stream_DecryptionCancelled]: 'Decryption cancelled',
  [EciesStringKey.Error_Chunk_DataTooShortForHeader]:
    'Data too short for chunk header',
  [EciesStringKey.Error_Chunk_InvalidMagicBytes]: 'Invalid chunk magic bytes',
  [EciesStringKey.Error_Chunk_UnsupportedVersion]: 'Unsupported chunk version',
  [EciesStringKey.Error_Chunk_EncryptedSizeMismatchTemplate]:
    'Encrypted size mismatch: expected {expectedSize}, got {actualSize}',
  [EciesStringKey.Error_Chunk_ChecksumMismatch]: 'Chunk checksum mismatch',
  [EciesStringKey.Error_Chunk_DecryptedSizeMismatch]: 'Decrypted size mismatch',
  [EciesStringKey.Error_Progress_ChunkBytesCannotBeNegative]:
    'Chunk bytes cannot be negative',
  [EciesStringKey.Error_Resumable_AutoSaveIntervalMustBePositive]:
    'Auto-save interval must be positive',
  [EciesStringKey.Error_Resumable_PublicKeyMismatch]:
    'Public key mismatch with saved state',
  [EciesStringKey.Error_Resumable_ChunkSizeMismatch]:
    'Chunk size mismatch with saved state',
  [EciesStringKey.Error_Resumable_IncludeChecksumsMismatch]:
    'Include checksums mismatch with saved state',
  [EciesStringKey.Error_Resumable_NoStateToSave]: 'No state to save',
  [EciesStringKey.Error_Resumable_UnsupportedStateVersionTemplate]:
    'Unsupported state version: {version}',
  [EciesStringKey.Error_Resumable_InvalidChunkIndex]: 'Invalid chunk index',
  [EciesStringKey.Error_Resumable_StateTooOld]: 'State too old (>24 hours)',
  [EciesStringKey.Error_Resumable_InvalidPublicKeyInState]:
    'Invalid public key in state',
  [EciesStringKey.Error_Resumable_StateIntegrityCheckFailed]:
    'State integrity check failed: HMAC mismatch',
  [EciesStringKey.Error_Builder_MnemonicGenerationNotImplemented]:
    'Mnemonic generation not yet implemented in v2',
  [EciesStringKey.Error_Builder_MemberNotMigrated]:
    'Member not yet migrated to v2',
  [EciesStringKey.Error_Builder_ECIESServiceNotMigrated]:
    'ECIESService not yet migrated to v2',
  [EciesStringKey.Error_Service_InvalidDataLength]: 'Invalid data length',
  [EciesStringKey.Error_Service_InvalidEncryptionType]:
    'Invalid encryption type',
  [EciesStringKey.Error_Service_InvalidEncryptedDataLength]:
    'Invalid encrypted data length',
  [EciesStringKey.Error_Service_ComputedDecryptedLengthNegative]:
    'Computed decrypted length is negative',
  [EciesStringKey.Error_Service_MultiRecipientNotImplemented]:
    'Multi-recipient encryption not yet implemented',
  [EciesStringKey.Error_Service_InvalidEncryptionTypeOrRecipientCountTemplate]:
    'Invalid encryption type or number of recipients: {encryptionType}, {recipientCount}',
  [EciesStringKey.Error_Container_ServiceNotFoundTemplate]:
    'Service {service} not found in container',
  [EciesStringKey.Error_Utils_InvalidHexString]: 'Invalid hex string',
  [EciesStringKey.Error_Utils_HexStringMustHaveEvenLength]:
    'Hex string must have even length',
  [EciesStringKey.Error_Utils_HexStringContainsInvalidCharacters]:
    'Hex string contains invalid characters',
  [EciesStringKey.Error_Utils_ValueExceedsSafeIntegerRange]:
    'Value exceeds safe integer range',
  [EciesStringKey.Error_Utils_ValueBelowSafeIntegerRange]:
    'Value below safe integer range',
  [EciesStringKey.Error_Builder_ECIESServiceMustBeSetBeforeGeneratingMnemonic]:
    'ECIESService must be set before generating mnemonic',
  [EciesStringKey.Error_Builder_ECIESServiceIsRequired]:
    'ECIESService is required',
  [EciesStringKey.Error_Builder_TypeNameAndEmailAreRequired]:
    'Type, name, and email are required',
  [EciesStringKey.Error_DisposedError_ObjectDisposed]:
    'Object has been disposed',
  [EciesStringKey.Error_GuidError_InvalidGuid]: 'Invalid GUID.',
  [EciesStringKey.Error_GuidError_InvalidGuidWithDetailsTemplate]:
    'Invalid GUID: {GUID}',
  [EciesStringKey.Error_GuidError_InvalidGuidUnknownBrandTemplate]:
    'Unknown GUID brand: {BRAND}.',
  [EciesStringKey.Error_GuidError_InvalidGuidUnknownLengthTemplate]:
    'Invalid GUID length: {LENGTH}.',
  [EciesStringKey.Error_IdProviderError_InvalidLength]:
    'ID length mismatch: expected {expected} bytes, got {actual} bytes in {context}',
  [EciesStringKey.Error_IdProviderError_InputMustBeString]:
    'Input must be a string',
  [EciesStringKey.Error_IdProviderError_InvalidStringLength]:
    'Invalid string length: expected {expected} characters, got {actual}',
  [EciesStringKey.Error_IdProviderError_InvalidCharacters]:
    'String contains invalid characters',
  [EciesStringKey.Error_IdProviderError_InvalidDeserializedId]:
    'Deserialized ID failed validation',
  [EciesStringKey.Error_IdProviderError_InvalidByteLengthParameter]:
    'Byte length must be an integer between 1 and 255, got {value}',
  [EciesStringKey.Error_IdProviderError_ParseFailed]:
    'Failed to parse ID: {message}',
  [EciesStringKey.Error_IdProviderError_InvalidGuidBuffer]:
    'Invalid GUID buffer: {message}',
  [EciesStringKey.Error_IdProviderError_InvalidUuidFormat]:
    'Invalid UUID format: {input}',

  // Invariant Validation Errors
  [EciesStringKey.Error_Invariant_ValidationFailedTemplate]:
    'Invariant validation failed: {message}',
  [EciesStringKey.Error_Invariant_UnknownInvariantTemplate]:
    'Unknown invariant: {name}',
  [EciesStringKey.Error_Invariant_ConfigurationValidationFailedMultipleTemplate]:
    createPluralString({
      one: 'Configuration validation failed ({count} invariant):\n\n{failures}',
      other:
        'Configuration validation failed ({count} invariants):\n\n{failures}',
    }),
  [EciesStringKey.Error_ECIESError_RecipientIdSizeTooLargeTemplate]:
    'Recipient ID size {size} exceeds maximum of 255 bytes',
  [EciesStringKey.Error_ECIESError_InvalidVersion]: 'Invalid ECIES version',
  [EciesStringKey.Error_ECIESError_InvalidVersionTemplate]:
    'Invalid ECIES version: {version}',
  [EciesStringKey.Error_ECIESError_InvalidCipherSuite]:
    'Invalid ECIES cipher suite',
  [EciesStringKey.Error_ECIESError_InvalidCipherSuiteTemplate]:
    'Invalid ECIES cipher suite: {cipherSuite}',
};
