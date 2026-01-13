/**
 * ECIES error type enumeration.
 * Defines all possible error conditions that can occur during ECIES encryption/decryption operations.
 */
export enum ECIESErrorTypeEnum {
  /** The encrypted key size for multiple recipients is invalid */
  InvalidECIESMultipleEncryptedKeySize = 'InvalidECIESMultipleEncryptedKeySize',
  /** The public key length is invalid */
  InvalidECIESPublicKeyLength = 'InvalidECIESPublicKeyLength',
  /** The recipient count size for multiple recipients is invalid */
  InvalidECIESMultipleRecipientCountSize = 'InvalidECIESMultipleRecipientCountSize',
  /** The data length size for multiple recipients is invalid */
  InvalidECIESMultipleDataLengthSize = 'InvalidECIESMultipleDataLengthSize',
  /** The recipient ID size for multiple recipients is invalid */
  InvalidECIESMultipleRecipientIdSize = 'InvalidECIESMultipleRecipientIdSize',
  /** CRC checksum validation failed */
  CRCError = 'CRCError',
  /** The encryption type is not recognized */
  InvalidEncryptionType = 'InvalidEncryptionType',
  /** The initialization vector length is invalid */
  InvalidIVLength = 'InvalidIVLength',
  /** The authentication tag length is invalid */
  InvalidAuthTagLength = 'InvalidAuthTagLength',
  /** The message header length is invalid */
  InvalidHeaderLength = 'InvalidHeaderLength',
  /** The data length is invalid */
  InvalidDataLength = 'InvalidDataLength',
  /** The encrypted data length is invalid */
  InvalidEncryptedDataLength = 'InvalidEncryptedDataLength',
  /** The message CRC is invalid */
  InvalidMessageCrc = 'InvalidMessageCrc',
  /** The mnemonic phrase is invalid */
  InvalidMnemonic = 'InvalidMnemonic',
  /** The requested operation is invalid */
  InvalidOperation = 'InvalidOperation',
  /** The message length does not match expected value */
  MessageLengthMismatch = 'MessageLengthMismatch',
  /** The encrypted key length is invalid */
  InvalidEncryptedKeyLength = 'InvalidEncryptedKeyLength',
  /** The ephemeral public key is invalid */
  InvalidEphemeralPublicKey = 'InvalidEphemeralPublicKey',
  /** The specified recipient was not found in the encrypted message */
  RecipientNotFound = 'RecipientNotFound',
  /** The signature verification failed */
  InvalidSignature = 'InvalidSignature',
  /** The sender's public key is invalid */
  InvalidSenderPublicKey = 'InvalidSenderPublicKey',
  /** Too many recipients specified for multi-recipient encryption */
  TooManyRecipients = 'TooManyRecipients',
  /** Private key is required but not loaded */
  PrivateKeyNotLoaded = 'PrivateKeyNotLoaded',
  /** The number of recipient keys does not match expected count */
  RecipientKeyCountMismatch = 'RecipientKeyCountMismatch',
  /** The recipient count is invalid */
  InvalidRecipientCount = 'InvalidRecipientCount',
  /** The file size exceeds the maximum allowed */
  FileSizeTooLarge = 'FileSizeTooLarge',
  /** Decryption failed (MAC/Padding errors) */
  DecryptionFailed = 'DecryptionFailed',
  /** The recipient public key is invalid */
  InvalidRecipientPublicKey = 'InvalidRecipientPublicKey',
  /** ECDH secret computation failed */
  SecretComputationFailed = 'SecretComputationFailed',
  /** Authentication tag is required for key encryption */
  AuthenticationTagIsRequiredForKeyEncryption = 'AuthenticationTagIsRequiredForKeyEncryption',
  /** Failed to decrypt the encryption key */
  FailedToDecryptKey = 'FailedToDecryptKey',
  /** The message is too large to encrypt */
  MessageTooLarge = 'MessageTooLarge',
  /** Authentication tag is required for multi-recipient ECIES encryption */
  AuthenticationTagIsRequiredForMultiRecipientECIESEncryption = 'AuthenticationTagIsRequiredForMultiRecipientECIESEncryption',
  /** Cannot encrypt empty data */
  CannotEncryptEmptyData = 'CannotEncryptEmptyData',
  /** Cannot decrypt empty data */
  CannotDecryptEmptyData = 'CannotDecryptEmptyData',
  /** Encrypted size exceeds expected value */
  EncryptedSizeExceedsExpected = 'EncryptedSizeExceedsExpected',
  /** Decrypted data length does not match expected value */
  DecryptedDataLengthMismatch = 'DecryptedDataLengthMismatch',
  /** Recipient count does not match expected value */
  RecipientCountMismatch = 'RecipientCountMismatch',
  /** Data is too short to contain a valid multi-recipient header */
  DataTooShortForMultiRecipientHeader = 'DataTooShortForMultiRecipientHeader',
  /** The protocol version is not supported */
  InvalidVersion = 'InvalidVersion',
  /** The cipher suite is not supported */
  InvalidCipherSuite = 'InvalidCipherSuite',
}
