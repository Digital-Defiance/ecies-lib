import {
  buildReasonMap,
  TranslatableGenericError,
  TypedHandleableError,
} from '@digitaldefiance/i18n-lib';
import { Wallet } from '@ethereumjs/wallet';
import { Constants } from '../constants';
import { EciesStringKey, PasswordLoginErrorTypeEnum } from '../enumerations';
import { EciesEncryptionTypeEnum } from '../enumerations/ecies-encryption-type';
import { Pbkdf2ProfileEnum } from '../enumerations/pbkdf2-profile';
import { EciesComponentId } from '../i18n-setup';
import { IECIESConstants } from '../interfaces/ecies-consts';
import { SecureString } from '../secure-string';
import { hexToUint8Array, uint8ArrayToHex } from '../utils';
import { AESGCMService } from './aes-gcm';
import { ECIESService } from './ecies/service';
import { Pbkdf2Service } from './pbkdf2';

/**
 * Service for password-based login using PBKDF2 key derivation.
 * Encrypts private keys and mnemonics with password-derived keys.
 */
export class PasswordLoginService {
  protected readonly aesGcmService: AESGCMService;
  protected readonly eciesService: ECIESService;
  protected readonly pbkdf2Service: Pbkdf2Service;
  protected readonly eciesConsts: IECIESConstants;
  /** Storage key for encrypted private key */
  public static readonly privateKeyStorageKey = 'encryptedPrivateKey';
  /** Storage key for password salt */
  public static readonly saltStorageKey = 'passwordLoginSalt';
  /** Storage key for encrypted mnemonic */
  public static readonly encryptedMnemonicStorageKey = 'encryptedMnemonic';
  /** Storage key for PBKDF2 profile */
  public static readonly profileStorageKey = 'pbkdf2Profile';

  /**
   * Create a new password login service.
   * @param aesGcmService AES-GCM service for encryption
   * @param eciesService ECIES service for key operations
   * @param pbkdf2Service PBKDF2 service for key derivation
   * @param eciesParams ECIES constants
   */
  constructor(
    aesGcmService: AESGCMService,
    eciesService: ECIESService,
    pbkdf2Service: Pbkdf2Service,
    eciesParams: IECIESConstants = Constants.ECIES,
  ) {
    this.aesGcmService = aesGcmService;
    this.eciesService = eciesService;
    this.pbkdf2Service = pbkdf2Service;
    this.eciesConsts = eciesParams;
  }

  /**
   * Create a password login bundle with encrypted private key and mnemonic.
   * @param mnemonic The user's mnemonic phrase
   * @param password The user's password
   * @param profile The PBKDF2 profile to use
   * @returns Bundle containing salt, encrypted data, and wallet
   */
  public async createPasswordLoginBundle(
    mnemonic: SecureString,
    password: SecureString,
    profile: Pbkdf2ProfileEnum = Pbkdf2ProfileEnum.BROWSER_PASSWORD,
  ): Promise<{
    salt: Uint8Array;
    encryptedPrivateKey: Uint8Array;
    encryptedMnemonic: Uint8Array;
    wallet: Wallet;
  }> {
    const { wallet } = this.eciesService.walletAndSeedFromMnemonic(mnemonic);

    const derivedKey =
      await this.pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
        password.valueAsUint8Array,
        profile,
      );

    // Encrypt private key with derived key
    const privateKeyBytes = wallet.getPrivateKey();
    const { encrypted, iv, tag } = await this.aesGcmService.encrypt(
      privateKeyBytes,
      derivedKey.hash,
      true,
    );
    if (!tag) {
      throw new TranslatableGenericError(
        EciesComponentId,
        EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag,
      );
    }
    const encryptedPrivateKey = this.aesGcmService.combineIvTagAndEncryptedData(
      iv,
      encrypted,
      tag,
    );

    // now use the public key to encrypt the mnemonic and store it
    const encryptedMnemonic = await this.eciesService.encrypt(
      EciesEncryptionTypeEnum.Simple,
      wallet.getPublicKey(),
      mnemonic.valueAsUint8Array,
    );

    return {
      salt: derivedKey.salt,
      encryptedPrivateKey: encryptedPrivateKey,
      encryptedMnemonic: encryptedMnemonic,
      wallet,
    };
  }

  /**
   * Set up password login and store encrypted data in localStorage.
   * @param mnemonic The user's mnemonic phrase
   * @param password The user's password
   * @param profile The PBKDF2 profile to use
   * @returns The user's wallet
   * @throws TypedHandleableError if storage fails
   */
  public async setupPasswordLoginLocalStorageBundle(
    mnemonic: SecureString,
    password: SecureString,
    profile: Pbkdf2ProfileEnum = Pbkdf2ProfileEnum.BROWSER_PASSWORD,
  ): Promise<Wallet> {
    const { salt, encryptedPrivateKey, encryptedMnemonic, wallet } =
      await this.createPasswordLoginBundle(mnemonic, password, profile);

    // store the salt and encrypted private key in local storage
    try {
      localStorage.setItem(
        PasswordLoginService.saltStorageKey,
        uint8ArrayToHex(salt),
      );
      localStorage.setItem(
        PasswordLoginService.privateKeyStorageKey,
        uint8ArrayToHex(encryptedPrivateKey),
      );
      localStorage.setItem(
        PasswordLoginService.encryptedMnemonicStorageKey,
        uint8ArrayToHex(encryptedMnemonic),
      );
      localStorage.setItem(PasswordLoginService.profileStorageKey, profile);
    } catch (error) {
      throw new TypedHandleableError<
        typeof PasswordLoginErrorTypeEnum,
        EciesStringKey
      >(
        EciesComponentId,
        PasswordLoginErrorTypeEnum.FailedToStoreLoginData,
        buildReasonMap<typeof PasswordLoginErrorTypeEnum, EciesStringKey>(
          PasswordLoginErrorTypeEnum,
          ['Error', 'PasswordLoginError'],
        ),
        new Error(),
        { cause: error instanceof Error ? error : undefined },
      );
    }
    return wallet;
  }

  /**
   * Recover wallet and mnemonic from encrypted password bundle.
   * @param salt The password salt
   * @param encryptedPrivateKey The encrypted private key
   * @param encryptedMnemonic The encrypted mnemonic
   * @param password The user's password
   * @param profile The PBKDF2 profile used
   * @returns The user's wallet and mnemonic
   * @throws TypedHandleableError if data is missing or decryption fails
   */
  public async getWalletAndMnemonicFromEncryptedPasswordBundle(
    salt: Uint8Array,
    encryptedPrivateKey: Uint8Array,
    encryptedMnemonic: Uint8Array,
    password: SecureString,
    profile: Pbkdf2ProfileEnum = Pbkdf2ProfileEnum.BROWSER_PASSWORD,
  ): Promise<{ wallet: Wallet; mnemonic: SecureString }> {
    if (!salt || !encryptedPrivateKey || !encryptedMnemonic) {
      throw new TypedHandleableError<
        typeof PasswordLoginErrorTypeEnum,
        EciesStringKey
      >(
        EciesComponentId,
        PasswordLoginErrorTypeEnum.PasswordLoginNotSetUp,
        buildReasonMap<typeof PasswordLoginErrorTypeEnum, EciesStringKey>(
          PasswordLoginErrorTypeEnum,
          ['Error', 'PasswordLoginError'],
        ),
        new Error(),
      );
    }

    const derivedKey =
      await this.pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
        password.valueAsUint8Array,
        profile,
        salt,
      );

    // Decrypt private key with derived key
    const { iv, encryptedDataWithTag } = this.aesGcmService.splitEncryptedData(
      encryptedPrivateKey,
      true,
      this.eciesConsts,
    );
    const privateKeyBytes = await this.aesGcmService.decrypt(
      iv,
      encryptedDataWithTag,
      derivedKey.hash,
      true,
      this.eciesConsts,
    );

    const wallet = Wallet.fromPrivateKey(privateKeyBytes);

    // now decrypt the mnemonic
    const decryptedMnemonic =
      await this.eciesService.decryptSimpleOrSingleWithHeader(
        true,
        wallet.getPrivateKey(),
        encryptedMnemonic,
      );

    return { wallet, mnemonic: new SecureString(decryptedMnemonic) };
  }

  /**
   * Recover wallet and mnemonic from localStorage.
   * @param password The user's password
   * @returns The user's wallet and mnemonic
   * @throws TypedHandleableError if password login is not set up
   */
  public async getWalletAndMnemonicFromLocalStorageBundle(
    password: SecureString,
  ): Promise<{ wallet: Wallet; mnemonic: SecureString }> {
    const saltHex = localStorage.getItem(PasswordLoginService.saltStorageKey);
    const encryptedPrivateKeyHex = localStorage.getItem(
      PasswordLoginService.privateKeyStorageKey,
    );
    const encryptedMnemonicHex = localStorage.getItem(
      PasswordLoginService.encryptedMnemonicStorageKey,
    );
    const profileStr = localStorage.getItem(
      PasswordLoginService.profileStorageKey,
    );

    if (
      !saltHex ||
      !encryptedPrivateKeyHex ||
      !encryptedMnemonicHex ||
      saltHex === '' ||
      encryptedPrivateKeyHex === '' ||
      encryptedMnemonicHex === ''
    ) {
      throw new TypedHandleableError<
        typeof PasswordLoginErrorTypeEnum,
        EciesStringKey
      >(
        EciesComponentId,
        PasswordLoginErrorTypeEnum.PasswordLoginNotSetUp,
        buildReasonMap<typeof PasswordLoginErrorTypeEnum, EciesStringKey>(
          PasswordLoginErrorTypeEnum,
          ['Error', 'PasswordLoginError'],
        ),
        new Error(),
      );
    }

    const salt = hexToUint8Array(saltHex);
    const encryptedPrivateKey = hexToUint8Array(encryptedPrivateKeyHex);
    const encryptedMnemonic = hexToUint8Array(encryptedMnemonicHex);
    const profile =
      (profileStr as Pbkdf2ProfileEnum) || Pbkdf2ProfileEnum.BROWSER_PASSWORD;

    return await this.getWalletAndMnemonicFromEncryptedPasswordBundle(
      salt,
      encryptedPrivateKey,
      encryptedMnemonic,
      password,
      profile,
    );
  }

  /**
   * Check if password login is set up in localStorage.
   * @returns True if all required data is present
   */
  public static isPasswordLoginSetup(): boolean {
    const saltHex = localStorage.getItem(PasswordLoginService.saltStorageKey);
    const encryptedPrivateKeyHex = localStorage.getItem(
      PasswordLoginService.privateKeyStorageKey,
    );
    const encryptedMnemonicHex = localStorage.getItem(
      PasswordLoginService.encryptedMnemonicStorageKey,
    );

    return !!(
      saltHex &&
      encryptedPrivateKeyHex &&
      encryptedMnemonicHex &&
      saltHex !== '' &&
      encryptedPrivateKeyHex !== '' &&
      encryptedMnemonicHex !== ''
    );
  }
}
