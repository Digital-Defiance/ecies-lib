import { Wallet } from '@ethereumjs/wallet';
import { EciesEncryptionTypeEnum } from '../enumerations/ecies-encryption-type';
import { Pbkdf2ProfileEnum } from '../enumerations/pbkdf2-profile';
import { SecureString } from '../secure-string';
import { hexToUint8Array, uint8ArrayToHex } from '../utils';
import { AESGCMService } from './aes-gcm';
import { ECIESService } from './ecies/service';
import { Pbkdf2Service } from './pbkdf2';
import { TranslatableError, TypedHandleableError } from '../errors';
import { EciesStringKey, PasswordLoginErrorTypeEnum } from '../enumerations';
import { buildReasonMap, I18nEngine, Language } from '@digitaldefiance/i18n-lib';
import { IECIESConstants } from '../interfaces/ecies-consts';
import { ECIES } from '../defaults';


export class PasswordLoginService {
  protected readonly eciesService: ECIESService;
  protected readonly pbkdf2Service: Pbkdf2Service;
  protected readonly engine: I18nEngine<EciesStringKey, Language, any, any>;
  protected readonly eciesConsts: IECIESConstants;
  public static readonly privateKeyStorageKey = 'encryptedPrivateKey';
  public static readonly saltStorageKey = 'passwordLoginSalt';
  public static readonly encryptedMnemonicStorageKey = 'encryptedMnemonic';
  public static readonly profileStorageKey = 'pbkdf2Profile';

  constructor(eciesService: ECIESService, pbkdf2Service: Pbkdf2Service, engine: I18nEngine<EciesStringKey, Language, any, any>, eciesParams?: IECIESConstants) {
    this.eciesService = eciesService;
    this.pbkdf2Service = pbkdf2Service;
    this.engine = engine;
    this.eciesConsts = eciesParams ?? ECIES;
  }

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
    const { encrypted, iv, tag } = await AESGCMService.encrypt(
      privateKeyBytes,
      derivedKey.hash,
      true,
    );
    if (!tag) {
      throw new TranslatableError(EciesStringKey.Error_Utils_EncryptionFailedNoAuthTag, this.engine);
    }
    const encryptedPrivateKey = AESGCMService.combineIvTagAndEncryptedData(
      iv,
      encrypted,
      tag,
    );

    // now use the public key to encrypt the mnemonic and store it
    const encryptedMnemonic = await this.eciesService.encrypt(
      EciesEncryptionTypeEnum.Simple,
      [{ publicKey: wallet.getPublicKey() }],
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
   * Set up password login by deriving a key from the password and using it to encrypt
   * @param mnemonic The user's mnemonic
   * @param password The user's password
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
      localStorage.setItem(
        PasswordLoginService.profileStorageKey,
        profile,
      );
    } catch (error) {
      throw new TypedHandleableError<typeof PasswordLoginErrorTypeEnum, EciesStringKey>(PasswordLoginErrorTypeEnum.FailedToStoreLoginData, buildReasonMap<typeof PasswordLoginErrorTypeEnum, EciesStringKey>(PasswordLoginErrorTypeEnum, ['Error', 'PasswordLoginError']), this.engine, undefined, undefined, { cause: error instanceof Error ? error : undefined });
    }
    return wallet;
  }

  public async getWalletAndMnemonicFromEncryptedPasswordBundle(
    salt: Uint8Array,
    encryptedPrivateKey: Uint8Array,
    encryptedMnemonic: Uint8Array,
    password: SecureString,
    profile: Pbkdf2ProfileEnum = Pbkdf2ProfileEnum.BROWSER_PASSWORD,
  ): Promise<{ wallet: Wallet; mnemonic: SecureString }> {
    if (!salt || !encryptedPrivateKey || !encryptedMnemonic) {
     throw new TypedHandleableError<typeof PasswordLoginErrorTypeEnum, EciesStringKey>(PasswordLoginErrorTypeEnum.PasswordLoginNotSetUp, buildReasonMap<typeof PasswordLoginErrorTypeEnum, EciesStringKey>(PasswordLoginErrorTypeEnum, ['Error', 'PasswordLoginError']), this.engine);
    }

    const derivedKey =
      await this.pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
        password.valueAsUint8Array,
        profile,
        salt,
      );

    // Decrypt private key with derived key
    const { iv, encryptedDataWithTag } = AESGCMService.splitEncryptedData(
      encryptedPrivateKey,
      true,
      this.eciesConsts,
    );
    const privateKeyBytes = await AESGCMService.decrypt(
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
   * Recover wallet and mnemonic from password
   * @param password The user's password
   * @returns The user's wallet and mnemonic
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
    const profileStr = localStorage.getItem(PasswordLoginService.profileStorageKey);

    if (
      !saltHex ||
      !encryptedPrivateKeyHex ||
      !encryptedMnemonicHex ||
      saltHex === '' ||
      encryptedPrivateKeyHex === '' ||
      encryptedMnemonicHex === ''
    ) {
      throw new TypedHandleableError<typeof PasswordLoginErrorTypeEnum, EciesStringKey>(PasswordLoginErrorTypeEnum.PasswordLoginNotSetUp, buildReasonMap<typeof PasswordLoginErrorTypeEnum, EciesStringKey>(PasswordLoginErrorTypeEnum, ['Error', 'PasswordLoginError']), this.engine);
    }

    const salt = hexToUint8Array(saltHex);
    const encryptedPrivateKey = hexToUint8Array(encryptedPrivateKeyHex);
    const encryptedMnemonic = hexToUint8Array(encryptedMnemonicHex);
    const profile = (profileStr as Pbkdf2ProfileEnum) || Pbkdf2ProfileEnum.BROWSER_PASSWORD;

    return await this.getWalletAndMnemonicFromEncryptedPasswordBundle(
      salt,
      encryptedPrivateKey,
      encryptedMnemonic,
      password,
      profile,
    );
  }

  /**
   *
   * @returns True if password login is set up (i.e. salt and encrypted private key are in local storage)
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
