import { EciesStringKey } from '../enumerations';

export const japaneseTranslations: Record<EciesStringKey, string> = {
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
    [EciesStringKey.Error_ECIESError_InvalidPrivateKey]: '無効な秘密鍵',
    [EciesStringKey.Error_ECIESError_InvalidIV]: '無効な初期化ベクトル (IV)',
    [EciesStringKey.Error_ECIESError_InvalidAuthTag]: '無効な認証タグ',
    [EciesStringKey.Error_ECIESError_InvalidSharedSecret]: '無効な共有秘密',
    [EciesStringKey.Error_ECIESError_InvalidPublicKeyNotOnCurve]: '無効な公開鍵: 曲線上にありません',
    [EciesStringKey.Error_ECIESError_InvalidAESKeyLength]: '無効なAES鍵の長さ: 16、24、または32バイトである必要があります',
    [EciesStringKey.Error_ECIESError_CannotEncryptEmptyData]: '空のデータを暗号化できません',
    [EciesStringKey.Error_ECIESError_CannotDecryptEmptyData]: '空のデータを復号化できません',
    [EciesStringKey.Error_ECIESError_EncryptedSizeExceedsExpected]: '暗号化サイズが予想される最大値を超えています',
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
    [EciesStringKey.Error_ECIESError_MessageTooLarge]: 'メッセージが大きすぎます',
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
    [EciesStringKey.Error_ECIESError_InvalidChecksumConstants]: '無効なチェックサム定数です',
    [EciesStringKey.Error_ECIESError_CannotOverwriteDefaultConfiguration]: 'デフォルト設定を上書きできません',

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
    [EciesStringKey.Error_InvalidEmailError_Missing]: 'メールアドレスは必須です。',
    [EciesStringKey.Error_InvalidEmailError_Whitespace]: 'メールアドレスに前後の空白が含まれています。',
    [EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag]:
      '暗号化に失敗しました: 認証タグが生成されませんでした',
    [EciesStringKey.Error_PasswordLoginError_FailedToStoreLoginData]:
      'パスワードログインデータの保存に失敗しました',
    [EciesStringKey.Error_PasswordLoginError_PasswordLoginNotSetUp]:
      'パスワードログインが設定されていません',
    [EciesStringKey.Error_PhoneNumber_InvalidTemplate]: '無効な電話番号: {phoneNumber}',

    // Multi-recipient and Streaming Error Types
    [EciesStringKey.Error_MultiRecipient_InvalidRecipientCountTemplate]: '無効な受信者数: {count}',
    [EciesStringKey.Error_MultiRecipient_SymmetricKeyMust32Bytes]: '対称鍵は32バイトである必要があります',
    [EciesStringKey.Error_MultiRecipient_InvalidChunkIndexTemplate]: '無効なチャンクインデックス: {index}',
    [EciesStringKey.Error_MultiRecipient_DataSizeExceedsMaximumTemplate]: 'データサイズが最大値を超えています: {size}',
    [EciesStringKey.Error_MultiRecipient_DuplicateRecipientId]: '重複する受信者IDが検出されました',
    [EciesStringKey.Error_MultiRecipient_RecipientIdMust32Bytes]: '受信者IDは32バイトである必要があります',
    [EciesStringKey.Error_MultiRecipient_RecipientHeadersSizeOverflow]: '受信者ヘッダーサイズのオーバーフロー',
    [EciesStringKey.Error_MultiRecipient_ChunkSizeOverflow]: 'チャンクサイズのオーバーフロー: 受信者が多すぎるかデータが大きすぎます',
    [EciesStringKey.Error_MultiRecipient_ChunkTooSmall]: 'チャンクが小さすぎます',
    [EciesStringKey.Error_MultiRecipient_InvalidChunkMagic]: '無効なマルチ受信者チャンクマジック',
    [EciesStringKey.Error_MultiRecipient_UnsupportedVersionTemplate]: 'サポートされていないバージョン: {version}',
    [EciesStringKey.Error_MultiRecipient_ChunkTooSmallForEncryptedSize]: '宣言された暗号化サイズに対してチャンクが小さすぎます',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedRecipientId]: 'チャンクが切り詰められています: 受信者IDのデータが不足しています',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedKeySize]: 'チャンクが切り詰められています: 鍵サイズのデータが不足しています',
    [EciesStringKey.Error_MultiRecipient_InvalidKeySizeTemplate]: '無効な鍵サイズ: {size}',
    [EciesStringKey.Error_MultiRecipient_ChunkTruncatedEncryptedKey]: 'チャンクが切り詰められています: 暗号化鍵のデータが不足しています',
    [EciesStringKey.Error_MultiRecipient_RecipientNotFoundInChunk]: 'チャンク内に受信者が見つかりません',
    [EciesStringKey.Error_Stream_DataTooShortForHeader]: 'ストリームヘッダーのデータが短すぎます',
    [EciesStringKey.Error_Stream_InvalidMagicBytes]: '無効なストリームマジックバイト',
    [EciesStringKey.Error_Stream_UnsupportedVersion]: 'サポートされていないストリームバージョン',
    [EciesStringKey.Error_Stream_InvalidPublicKeyLength]: '無効な公開鍵: 33（圧縮）または65（非圧縮）バイトである必要があります',
    [EciesStringKey.Error_Stream_BufferOverflowTemplate]: 'バッファオーバーフロー: ソースチャンクが{max}バイトを超えています',
    [EciesStringKey.Error_Stream_EncryptionCancelled]: '暗号化がキャンセルされました',
    [EciesStringKey.Error_Stream_AtLeastOneRecipientRequired]: '少なくとも1人の受信者が必要です',
    [EciesStringKey.Error_Stream_MaxRecipientsExceeded]: '最大65535人の受信者がサポートされています',
    [EciesStringKey.Error_Stream_InvalidRecipientPublicKeyLength]: '無効な受信者公開鍵: 33（圧縮）または65（非圧縮）バイトである必要があります',
    [EciesStringKey.Error_Stream_InvalidRecipientIdLength]: '無効な受信者ID: 32バイトである必要があります',
    [EciesStringKey.Error_Stream_InvalidRecipientIdMust32Bytes]: '無効な受信者ID: 32バイトである必要があります',
    [EciesStringKey.Error_Stream_InvalidPrivateKeyMust32Bytes]: '無効な秘密鍵: 32バイトである必要があります',
    [EciesStringKey.Error_Stream_ChunkSequenceErrorTemplate]: 'チャンクシーケンスエラー: 期待される{expected}、実際の{actual}',
    [EciesStringKey.Error_Stream_DecryptionCancelled]: '復号化がキャンセルされました',
    [EciesStringKey.Error_Chunk_DataTooShortForHeader]: 'チャンクヘッダーにはデータが短すぎます',
    [EciesStringKey.Error_Chunk_InvalidMagicBytes]: '無効なチャンクマジックバイト',
    [EciesStringKey.Error_Chunk_UnsupportedVersion]: 'サポートされていないチャンクバージョン',
    [EciesStringKey.Error_Chunk_EncryptedSizeMismatchTemplate]: '暗号化サイズの不一致：期待値 {expectedSize}、実際 {actualSize}',
    [EciesStringKey.Error_Chunk_ChecksumMismatch]: 'チャンクチェックサムの不一致',
    [EciesStringKey.Error_Chunk_DecryptedSizeMismatch]: '復号化サイズの不一致',
    [EciesStringKey.Error_Progress_ChunkBytesCannotBeNegative]: 'チャンクバイトは負の値にできません',
    [EciesStringKey.Error_Resumable_AutoSaveIntervalMustBePositive]: '自動保存間隔は正の値でなければなりません',
    [EciesStringKey.Error_Resumable_PublicKeyMismatch]: '公開鍵が保存された状態と一致しません',
    [EciesStringKey.Error_Resumable_ChunkSizeMismatch]: 'チャンクサイズが保存された状態と一致しません',
    [EciesStringKey.Error_Resumable_IncludeChecksumsMismatch]: 'チェックサムの含まれるかどうかが保存された状態と一致しません',
    [EciesStringKey.Error_Resumable_NoStateToSave]: '保存する状態がありません',
    [EciesStringKey.Error_Resumable_UnsupportedStateVersionTemplate]: 'サポートされていない状態バージョン: {version}',
    [EciesStringKey.Error_Resumable_InvalidChunkIndex]: '無効なチャンクインデックス',
    [EciesStringKey.Error_Resumable_StateTooOld]: '状態が古すぎます（>24時間）',
    [EciesStringKey.Error_Resumable_InvalidPublicKeyInState]: '状態内の公開鍵が無効です',
    [EciesStringKey.Error_Resumable_StateIntegrityCheckFailed]: '状態整合性チェック失敗: HMACが一致しません',
    [EciesStringKey.Error_Builder_MnemonicGenerationNotImplemented]: 'ニーモニック生成はv2でまだ実装されていません',
    [EciesStringKey.Error_Builder_MemberNotMigrated]: 'メンバーはv2にまだ移行されていません',
    [EciesStringKey.Error_Builder_ECIESServiceNotMigrated]: 'ECIESサービスはv2にまだ移行されていません',
    [EciesStringKey.Error_Service_InvalidDataLength]: '無効なデータ長',
    [EciesStringKey.Error_Service_InvalidEncryptionType]: '無効な暗号化タイプ',
    [EciesStringKey.Error_Service_InvalidEncryptedDataLength]: '無効な暗号化データ長',
    [EciesStringKey.Error_Service_ComputedDecryptedLengthNegative]: '計算された復号化長が負の値です',
    [EciesStringKey.Error_Service_MultiRecipientNotImplemented]: '複数受信者暗号化はまだ実装されていません',
    [EciesStringKey.Error_Service_InvalidEncryptionTypeOrRecipientCountTemplate]: '無効な暗号化タイプまたは受信者数: {encryptionType}, {recipientCount}',
    [EciesStringKey.Error_Container_ServiceNotFoundTemplate]: 'サービス {service} がコンテナに見つかりません',
    [EciesStringKey.Error_Utils_InvalidHexString]: '無効な16進数文字列',
    [EciesStringKey.Error_Utils_HexStringMustHaveEvenLength]: '16進数文字列は偶数長でなければなりません',
    [EciesStringKey.Error_Utils_HexStringContainsInvalidCharacters]: '16進数文字列に無効な文字が含まれています',
    [EciesStringKey.Error_Utils_ValueExceedsSafeIntegerRange]: '値が安全な整数範囲を超えています',
    [EciesStringKey.Error_Utils_ValueBelowSafeIntegerRange]: '値が安全な整数範囲を下回っています',
    [EciesStringKey.Error_Builder_ECIESServiceMustBeSetBeforeGeneratingMnemonic]: 'ニーモニックを生成する前にECIESServiceを設定する必要があります',
    [EciesStringKey.Error_Builder_ECIESServiceIsRequired]: 'ECIESServiceが必要です',
    [EciesStringKey.Error_Builder_TypeNameAndEmailAreRequired]: 'タイプ、名前、メールアドレスが必要です',
    [EciesStringKey.Error_GuidError_InvalidGuid]: '無効なGUID。',
    [EciesStringKey.Error_GuidError_InvalidGuidWithDetailsTemplate]: '無効なGUID：{GUID}',
    [EciesStringKey.Error_GuidError_InvalidGuidUnknownBrandTemplate]: '不明なGUIDブランド：{BRAND}。',
    [EciesStringKey.Error_GuidError_InvalidGuidUnknownLengthTemplate]: '無効なGUID長：{LENGTH}。',
  };