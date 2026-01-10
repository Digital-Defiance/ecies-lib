import { Constants } from '../../constants';
import {
  EciesEncryptionType,
  EciesEncryptionTypeEnum,
} from '../../enumerations/ecies-encryption-type';
import { EciesStringKey } from '../../enumerations/ecies-string-key';
import { EciesComponentId, getEciesI18nEngine } from '../../i18n-setup';
import { IMember } from '../../interfaces';
import type { PlatformID } from '../../interfaces';
import { IConstants } from '../../interfaces/constants';
import { IECIESConfig } from '../../interfaces/ecies-config';
import { IECIESConstants } from '../../interfaces/ecies-consts';
import { IIdProvider } from '../../interfaces/id-provider';
import { SecureString } from '../../secure-string';
import { SignatureString, SignatureUint8Array } from '../../types';
import { VotingService } from '../voting.service';
import { EciesCryptoCore } from './crypto-core';
import {
  IMultiEncryptedMessage,
  IMultiEncryptedParsedHeader,
  IMultiRecipient,
  ISimpleKeyPair,
  IWalletSeed,
} from './interfaces';
import { EciesMultiRecipient } from './multi-recipient';
import { EciesSignature } from './signature';
import { EciesSingleRecipient } from './single-recipient';

/**
 * Browser-compatible ECIES service that mirrors the server-side functionality
 * Uses Web Crypto API and @scure/@noble libraries for browser compatibility
 *
 * ## Enhanced Type Safety (v3.8+)
 *
 * The service now provides stronger type guarantees and validation:
 * - Generic TID parameter ensures type consistency between service and members
 * - Construction-time validation verifies idProvider compatibility
 * - Strongly typed `idProvider` getter returns `IIdProvider<TID>`
 * - Comprehensive validation of all idProvider methods
 *
 * @template TID - The ID type used by the configured idProvider (e.g., ObjectId, Uint8Array)
 *
 * @example
 * ```typescript
 * // ObjectId-based service with type safety
 * const service = new ECIESService<ObjectId>();
 * const member = Member.newMember(service, ...);
 * // member.id is typed as ObjectId
 *
 * // GUID-based service
 * const guidConfig = createRuntimeConfiguration({ idProvider: new GuidV4Provider() });
 * const guidService = new ECIESService<Uint8Array>(guidConfig);
 * // guidService.idProvider is typed as IIdProvider<Uint8Array>
 * ```
 */
export class ECIESService<TID extends PlatformID = Uint8Array> {
  protected readonly _config: IECIESConfig;
  protected readonly _constants: IConstants;
  protected readonly cryptoCore: EciesCryptoCore;
  protected readonly signature: EciesSignature;
  protected readonly singleRecipient: EciesSingleRecipient;
  protected readonly multiRecipient: EciesMultiRecipient<TID>;
  protected readonly eciesConsts: IECIESConstants;
  protected readonly votingService: VotingService;

  // Cache validation results to avoid redundant validation
  private static validatedProviders = new WeakSet<IIdProvider<unknown>>();

  constructor(
    config?: Partial<IECIESConfig> | IConstants,
    eciesParams: IECIESConstants = Constants.ECIES,
  ) {
    this.eciesConsts = eciesParams;

    // Type guard to check if config is IConstants
    const isFullConfig = this.isIConstants(config);

    // Store full IConstants or use default Constants
    if (isFullConfig) {
      this._constants = config;
    } else {
      this._constants = Constants;
    }

    // Extract ECIES config from IConstants or use config directly
    const eciesConfig: Partial<IECIESConfig> = isFullConfig
      ? {
          curveName: config.ECIES.CURVE_NAME,
          primaryKeyDerivationPath: config.ECIES.PRIMARY_KEY_DERIVATION_PATH,
          mnemonicStrength: config.ECIES.MNEMONIC_STRENGTH,
          symmetricAlgorithm: config.ECIES.SYMMETRIC_ALGORITHM_CONFIGURATION,
          symmetricKeyBits: config.ECIES.SYMMETRIC.KEY_BITS,
          symmetricKeyMode: config.ECIES.SYMMETRIC.MODE,
        }
      : (config as Partial<IECIESConfig> | undefined) || {};

    this._config = {
      curveName: this.eciesConsts.CURVE_NAME,
      primaryKeyDerivationPath: this.eciesConsts.PRIMARY_KEY_DERIVATION_PATH,
      mnemonicStrength: this.eciesConsts.MNEMONIC_STRENGTH,
      symmetricAlgorithm: this.eciesConsts.SYMMETRIC_ALGORITHM_CONFIGURATION,
      symmetricKeyBits: this.eciesConsts.SYMMETRIC.KEY_BITS,
      symmetricKeyMode: this.eciesConsts.SYMMETRIC.MODE,
      ...eciesConfig,
    };

    // Initialize components
    this.cryptoCore = new EciesCryptoCore(this._config, this.eciesConsts);
    this.signature = new EciesSignature(this.cryptoCore);
    this.singleRecipient = new EciesSingleRecipient(
      this._config,
      this.eciesConsts,
    );
    this.multiRecipient = new EciesMultiRecipient(
      this._config,
      this.eciesConsts,
    );
    this.votingService = VotingService.getInstance();

    // Validate idProvider configuration consistency
    this.validateIdProviderConfiguration();
  }

  /**
   * Validates that the idProvider configuration is consistent and will work correctly
   * with the expected TID type. This catches configuration errors early.
   * Uses caching to avoid redundant validation of the same idProvider instance.
   */
  private validateIdProviderConfiguration(): void {
    const idProvider = this._constants.idProvider;
    const memberIdLength = this._constants.MEMBER_ID_LENGTH;

    // Ensure idProvider exists
    if (!idProvider) {
      throw new Error(
        'ID provider is required but not configured in service constants',
      );
    }

    // Check if this idProvider has already been validated
    if (
      ECIESService.validatedProviders.has(idProvider as IIdProvider<unknown>)
    ) {
      // Still need to check byte length compatibility for this specific service
      if (idProvider.byteLength !== memberIdLength) {
        const message =
          `ID provider byte length (${idProvider.byteLength}) does not match MEMBER_ID_LENGTH (${memberIdLength}). This will cause runtime errors in Member creation. ` +
          `Consider updating your configuration to use an idProvider with ${memberIdLength}-byte IDs, or update MEMBER_ID_LENGTH to ${idProvider.byteLength}.`;
        throw new Error(message);
      }
      return; // Skip expensive validation
    }

    // Ensure idProvider byteLength matches MEMBER_ID_LENGTH
    if (idProvider.byteLength !== memberIdLength) {
      const message =
        `ID provider byte length (${idProvider.byteLength}) does not match MEMBER_ID_LENGTH (${memberIdLength}). This will cause runtime errors in Member creation. ` +
        `Consider updating your configuration to use an idProvider with ${memberIdLength}-byte IDs, or update MEMBER_ID_LENGTH to ${idProvider.byteLength}.`;
      throw new Error(message);
    }

    // Validate that idProvider has required methods
    const requiredMethods = [
      'generate',
      'serialize',
      'deserialize',
      'validate',
      'toBytes',
      'fromBytes',
    ];
    for (const method of requiredMethods) {
      if (
        typeof (idProvider as unknown as Record<string, unknown>)[method] !==
        'function'
      ) {
        throw new Error(`ID provider is missing required method: ${method}`);
      }
    }

    // Enhanced validation: Test that idProvider can generate and process IDs correctly
    try {
      const testId = idProvider.generate();
      if (testId.length !== idProvider.byteLength) {
        throw new Error(
          `Generated ID length (${testId.length}) does not match declared byteLength (${idProvider.byteLength})`,
        );
      }

      // Test validation method
      if (!idProvider.validate(testId)) {
        throw new Error('Generated ID failed validation check');
      }

      // Test round-trip serialization
      const serialized = idProvider.serialize(testId);
      if (typeof serialized !== 'string') {
        throw new Error('Serialization must return a string');
      }

      const deserialized = idProvider.deserialize(serialized);
      if (deserialized.length !== testId.length) {
        throw new Error(
          `Serialization round-trip failed: expected ${testId.length} bytes, got ${deserialized.length} bytes`,
        );
      }

      // Test byte conversion methods with proper type conversion
      // First convert the raw bytes to the native ID type
      const nativeId = idProvider.fromBytes(testId);
      const idAsBytes = idProvider.toBytes(nativeId);
      if (idAsBytes.length !== idProvider.byteLength) {
        throw new Error(
          `toBytes() returned incorrect length: expected ${idProvider.byteLength}, got ${idAsBytes.length}`,
        );
      }

      // Test round-trip conversion
      const idFromBytes = idProvider.fromBytes(idAsBytes);
      const backToBytes = idProvider.toBytes(idFromBytes);
      if (backToBytes.length !== idAsBytes.length) {
        throw new Error('Byte conversion round-trip failed');
      }

      // Enhanced: Test type consistency for TID
      // Verify that the native ID type can be used as TID
      const typedId = nativeId as TID;
      const reConvertedBytes = idProvider.toBytes(typedId);
      if (reConvertedBytes.length !== idProvider.byteLength) {
        throw new Error(
          `TID type conversion failed: expected ${idProvider.byteLength} bytes, got ${reConvertedBytes.length}`,
        );
      }

      // Mark this idProvider as validated to avoid redundant checks
      ECIESService.validatedProviders.add(idProvider as IIdProvider<unknown>);
    } catch (error) {
      const message =
        `ID provider validation failed: ${error instanceof Error ? error.message : String(error)}. ` +
        `Ensure your idProvider implementation correctly handles generate(), serialize(), deserialize(), validate(), toBytes(), and fromBytes() methods, ` +
        `and that the TID type parameter matches the idProvider's native type.`;
      throw new Error(message);
    }
  }

  /**
   * Robust type guard to check if config is IConstants
   */
  private isIConstants(
    config: Partial<IECIESConfig> | IConstants | undefined,
  ): config is IConstants {
    if (!config || typeof config !== 'object') {
      return false;
    }

    // Check for required IConstants fields using type-safe property access
    const configRecord = config as Record<string, unknown>;

    const hasECIES =
      'ECIES' in configRecord && typeof configRecord['ECIES'] === 'object';

    const idProvider = configRecord['idProvider'];
    const hasIdProvider =
      'idProvider' in configRecord &&
      typeof idProvider === 'object' &&
      idProvider !== null &&
      typeof (idProvider as Record<string, unknown>)['generate'] ===
        'function' &&
      typeof (idProvider as Record<string, unknown>)['byteLength'] === 'number';

    const hasMemberIdLength =
      'MEMBER_ID_LENGTH' in configRecord &&
      typeof configRecord['MEMBER_ID_LENGTH'] === 'number';

    return hasECIES && hasIdProvider && hasMemberIdLength;
  }

  public get core(): EciesCryptoCore {
    return this.cryptoCore;
  }

  public get config(): IECIESConfig {
    return this._config;
  }

  public get constants(): IConstants {
    return this._constants;
  }

  /**
   * Get the ID provider configured for this service with strong typing.
   * The returned provider is guaranteed to work with TID type.
   */
  public get idProvider(): IIdProvider<TID> {
    return this._constants.idProvider as IIdProvider<TID>;
  }

  public get curveName(): string {
    return this._config.curveName;
  }

  public get voting(): VotingService {
    return this.votingService;
  }

  // === Key Management Methods ===

  /**
   * Generate a new mnemonic
   */
  public generateNewMnemonic(): SecureString {
    return this.cryptoCore.generateNewMnemonic();
  }

  /**
   * Generate wallet and seed from mnemonic
   */
  public walletAndSeedFromMnemonic(mnemonic: SecureString): IWalletSeed {
    return this.cryptoCore.walletAndSeedFromMnemonic(mnemonic);
  }

  /**
   * Create simple key pair from seed
   */
  public seedToSimpleKeyPair(seed: Uint8Array): ISimpleKeyPair {
    return this.cryptoCore.seedToSimpleKeyPair(seed);
  }

  /**
   * Create simple key pair from mnemonic
   */
  public mnemonicToSimpleKeyPair(mnemonic: SecureString): ISimpleKeyPair {
    return this.cryptoCore.mnemonicToSimpleKeyPair(mnemonic);
  }

  /**
   * Get public key from private key
   */
  public getPublicKey(privateKey: Uint8Array): Uint8Array {
    return this.cryptoCore.getPublicKey(privateKey);
  }

  // === Core Encryption/Decryption Methods ===

  /**
   * Encrypt for single recipient (simple or single mode)
   */
  public async encryptSimpleOrSingle(
    encryptSimple: boolean,
    receiverPublicKey: Uint8Array,
    message: Uint8Array,
    preamble: Uint8Array = new Uint8Array(0),
  ): Promise<Uint8Array> {
    return this.singleRecipient.encrypt(
      encryptSimple,
      receiverPublicKey,
      message,
      preamble,
    );
  }

  /**
   * Parse single encrypted header
   */
  public parseSingleEncryptedHeader(
    encryptionType: EciesEncryptionTypeEnum,
    data: Uint8Array,
    preambleSize: number = 0,
    options?: { dataLength?: number },
  ) {
    const { header } = this.singleRecipient.parseEncryptedMessage(
      encryptionType,
      data,
      preambleSize,
      options,
    );
    return header;
  }

  /**
   * Decrypt with header
   */
  public async decryptSimpleOrSingleWithHeader(
    decryptSimple: boolean,
    privateKey: Uint8Array,
    encryptedData: Uint8Array,
    preambleSize: number = 0,
    options?: { dataLength?: number },
  ): Promise<Uint8Array> {
    return await this.singleRecipient.decryptWithHeader(
      decryptSimple
        ? EciesEncryptionTypeEnum.Simple
        : EciesEncryptionTypeEnum.Single,
      privateKey,
      encryptedData,
      preambleSize,
      options,
    );
  }

  /**
   * Extended decrypt with header
   */
  public async decryptSimpleOrSingleWithHeaderEx(
    encryptionType: EciesEncryptionTypeEnum,
    privateKey: Uint8Array,
    encryptedData: Uint8Array,
    preambleSize: number = 0,
    options?: { dataLength?: number },
  ) {
    return this.singleRecipient.decryptWithHeaderEx(
      encryptionType,
      privateKey,
      encryptedData,
      preambleSize,
      options,
    );
  }

  /**
   * Decrypt with individual components
   */
  public async decryptSingleWithComponents(
    privateKey: Uint8Array,
    ephemeralPublicKey: Uint8Array,
    iv: Uint8Array,
    authTag: Uint8Array,
    encrypted: Uint8Array,
  ): Promise<{ decrypted: Uint8Array; ciphertextLength?: number }> {
    const decrypted = await this.singleRecipient.decryptWithComponents(
      privateKey,
      ephemeralPublicKey,
      iv,
      authTag,
      encrypted,
    );

    return { decrypted, ciphertextLength: encrypted.length };
  }

  // === Signature Methods ===

  /**
   * Sign a message
   */
  public signMessage(
    privateKey: Uint8Array,
    data: Uint8Array,
  ): SignatureUint8Array {
    return this.signature.signMessage(privateKey, data);
  }

  /**
   * Verify a message signature
   */
  public verifyMessage(
    publicKey: Uint8Array,
    data: Uint8Array,
    signature: SignatureUint8Array,
  ): boolean {
    return this.signature.verifyMessage(publicKey, data, signature);
  }

  /**
   * Convert signature string to buffer
   */
  public signatureStringToSignatureUint8Array(
    signatureString: SignatureString,
  ): SignatureUint8Array {
    return this.signature.signatureStringToSignatureUint8Array(signatureString);
  }

  /**
   * Convert signature buffer to string
   */
  public signatureUint8ArrayToSignatureString(
    signatureArray: SignatureUint8Array,
  ): string {
    return this.signature.signatureUint8ArrayToSignatureString(signatureArray);
  }

  // === Utility Methods ===

  /**
   * Compute encrypted length from data length
   */
  public computeEncryptedLengthFromDataLength(
    dataLength: number,
    encryptionMode: EciesEncryptionType,
    recipientCount?: number,
  ): number {
    if (dataLength < 0) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Service_InvalidDataLength,
        ),
      );
    }

    switch (encryptionMode) {
      case 'simple':
        return dataLength + this.eciesConsts.SIMPLE.FIXED_OVERHEAD_SIZE;
      case 'single':
        return dataLength + this.eciesConsts.SINGLE.FIXED_OVERHEAD_SIZE;
      case 'multiple':
        // Basic calculation for multiple recipients
        return (
          dataLength +
          this.eciesConsts.MULTIPLE.FIXED_OVERHEAD_SIZE +
          (recipientCount ?? 1) * this.eciesConsts.MULTIPLE.ENCRYPTED_KEY_SIZE
        );
      default: {
        const engine = getEciesI18nEngine();
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_Service_InvalidEncryptionType,
          ),
        );
      }
    }
  }

  /**
   * Compute decrypted length from encrypted data length
   */
  public computeDecryptedLengthFromEncryptedDataLength(
    encryptedDataLength: number,
    padding?: number,
  ): number {
    if (encryptedDataLength < 0) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Service_InvalidEncryptedDataLength,
        ),
      );
    }

    const overhead = this.eciesConsts.SINGLE.FIXED_OVERHEAD_SIZE;
    const actualPadding = padding !== undefined ? padding : 0;
    const decryptedLength = encryptedDataLength - overhead - actualPadding;

    if (decryptedLength < 0) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Service_ComputedDecryptedLengthNegative,
        ),
      );
    }

    return decryptedLength;
  }

  /**
   * Generic encrypt method
   */
  public async encrypt(
    encryptionType: EciesEncryptionTypeEnum,
    recipientPublicKey: Uint8Array,
    message: Uint8Array,
    preamble?: Uint8Array,
  ): Promise<Uint8Array> {
    if (encryptionType === EciesEncryptionTypeEnum.Multiple) {
      throw new Error(
        getEciesI18nEngine().translate(
          EciesComponentId,
          EciesStringKey.Error_ECIESError_MultipleEncryptionTypeNotSupportedInSingleRecipientMode,
        ),
      );
    }
    return this.singleRecipient.encrypt(
      encryptionType === EciesEncryptionTypeEnum.Simple,
      recipientPublicKey,
      message,
      preamble,
    );
  }
  /**
   * Encrypt for multiple recipients
   * @param recipients
   * @param message
   * @param preamble
   * @returns
   */
  public async encryptMultiple(
    recipients: Array<IMultiRecipient<TID>>,
    message: Uint8Array,
    preamble?: Uint8Array,
  ): Promise<IMultiEncryptedMessage<TID>> {
    return this.multiRecipient.encryptMultiple(recipients, message, preamble);
  }

  /**
   * Encrypt a symmetric key for a recipient using an ephemeral private key
   */
  public async encryptKey(
    receiverPublicKey: Uint8Array,
    messageSymmetricKey: Uint8Array,
    ephemeralPrivateKey: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    return this.multiRecipient.encryptKey(
      receiverPublicKey,
      messageSymmetricKey,
      ephemeralPrivateKey,
      aad,
    );
  }

  /**
   * Decrypt a symmetric key using an ephemeral public key
   */
  public async decryptKey(
    privateKey: Uint8Array,
    encryptedKey: Uint8Array,
    ephemeralPublicKey: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    return this.multiRecipient.decryptKey(
      privateKey,
      encryptedKey,
      ephemeralPublicKey,
      aad,
    );
  }

  /**
   * Calculate overhead for multiple recipient encryption
   */
  public calculateECIESMultipleRecipientOverhead(
    recipientCount: number,
    includeMessageOverhead: boolean = true,
  ): number {
    // ECIES overhead: ephemeral pubkey (33) + iv (16) + tag (16) + mac (32) = 97
    const ECIES_OVERHEAD = 97;
    // Per recipient: encrypted key (32) + recipient pubkey (33) + signature (64) = 129
    const RECIPIENT_OVERHEAD = 129;

    let overhead = recipientCount * RECIPIENT_OVERHEAD;
    if (includeMessageOverhead) {
      overhead += ECIES_OVERHEAD;
    }
    return overhead;
  }

  /**
   * Parse multi-encrypted header
   */
  public parseMultiEncryptedHeader(
    data: Uint8Array,
  ): IMultiEncryptedParsedHeader<TID> {
    return this.multiRecipient.parseMultiEncryptedHeader(data);
  }

  /**
   * Build multi-recipient header
   */
  public buildECIESMultipleRecipientHeader(
    data: IMultiEncryptedMessage<TID>,
  ): Uint8Array {
    return this.multiRecipient.buildECIESMultipleRecipientHeader(data);
  }

  /**
   * Decrypt multiple ECIE for recipient
   */
  public async decryptMultipleECIEForRecipient(
    encryptedData: IMultiEncryptedMessage<TID>,
    recipient: IMember,
  ): Promise<Uint8Array> {
    return this.multiRecipient.decryptMultipleECIEForRecipient(
      encryptedData,
      recipient,
    );
  }

  /**
   * Convert signature buffer to string (alias for existing method)
   */
  public signatureBufferToSignatureString(
    signatureBuffer: SignatureUint8Array,
  ): SignatureString {
    return this.signatureUint8ArrayToSignatureString(
      signatureBuffer,
    ) as SignatureString;
  }

  /**
   * Convert signature string to buffer (alias for existing method)
   */
  public signatureStringToSignatureBuffer(
    signatureString: string,
  ): SignatureUint8Array {
    return this.signatureStringToSignatureUint8Array(
      signatureString as SignatureString,
    );
  }
}
