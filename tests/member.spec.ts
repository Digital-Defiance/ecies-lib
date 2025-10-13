import { Wallet } from '@ethereumjs/wallet';
import { faker } from '@faker-js/faker';
import { Defaults, ECIES } from '../src/defaults';
import { EmailString } from '../src/email-string';
import { InvalidEmailErrorType } from '../src/enumerations/invalid-email-type';
import MemberErrorType from '../src/enumerations/member-error-type';
import MemberType from '../src/enumerations/member-type';
import { InvalidEmailError } from '../src/errors/invalid-email';
import { MemberError } from '../src/errors/member';
import { IECIESConfig } from '../src/interfaces/ecies-config';
import { IMemberWithMnemonic } from '../src/interfaces/member-with-mnemonic';
import { Member } from '../src/member';
import { SecureString } from '../src/secure-string';
import { ECIESService } from '../src/services/ecies/service';
import { uint8ArrayToHex } from '../src/utils';
import { spyContains, withConsoleMocks } from './support/console';

describe('member', () => {
  let alice: IMemberWithMnemonic,
    bob: IMemberWithMnemonic,
    noKeyCharlie: IMemberWithMnemonic;
  let eciesService: ECIESService;

  beforeAll(() => {
    const config: IECIESConfig = {
      curveName: Defaults.ECIES.CURVE_NAME,
      primaryKeyDerivationPath: Defaults.ECIES.PRIMARY_KEY_DERIVATION_PATH,
      mnemonicStrength: Defaults.ECIES.MNEMONIC_STRENGTH,
      symmetricAlgorithm: Defaults.ECIES.SYMMETRIC_ALGORITHM_CONFIGURATION,
      symmetricKeyBits: Defaults.ECIES.SYMMETRIC.KEY_BITS,
      symmetricKeyMode: Defaults.ECIES.SYMMETRIC.MODE,
    };
    eciesService = new ECIESService(config);
    alice = Member.newMember(
      eciesService,
      MemberType.User,
      'Alice Smith',
      new EmailString('alice@example.com'),
    );
    bob = Member.newMember(
      eciesService,
      MemberType.User,
      'Bob Smith',
      new EmailString('bob@example.com'),
    );
    noKeyCharlie = Member.newMember(
      eciesService,
      MemberType.User,
      'Charlie Smith',
      new EmailString('charlie@example.com'),
    );
    noKeyCharlie.member.unloadWalletAndPrivateKey();
  });

  describe('basic member operations', () => {
    it('should sign and verify a message for a member', () => {
      const message = new TextEncoder().encode('hello world');
      const signature = alice.member.sign(message);
      const verified = alice.member.verify(signature, message);
      expect(verified).toBeTruthy();
      expect(
        alice.member.verify(
          signature,
          new TextEncoder().encode('hello worldx'),
        ),
      ).toBeFalsy();
    });

    it('should fail to sign when there is no signing key', () => {
      expect(() =>
        noKeyCharlie.member.sign(
          new TextEncoder().encode(faker.lorem.sentence()),
        ),
      ).toThrowType(MemberError, (error: MemberError) => {
        expect(error.type).toBe(MemberErrorType.MissingPrivateKey);
      });
    });

    it('should unload a private key when called', () => {
      const dwight = Member.newMember(
        eciesService,
        MemberType.User,
        'Dwight Smith',
        new EmailString('dwight@example.com'),
      );
      expect(dwight.member.hasPrivateKey).toBeTruthy();
      dwight.member.unloadWalletAndPrivateKey();
      expect(dwight.member.hasPrivateKey).toBeFalsy();
    });
  });

  describe('member creation validation', () => {
    it('should fail to create a user with no name', () => {
      expect(() =>
        Member.newMember(
          eciesService,
          MemberType.User,
          '',
          new EmailString('alice@example.com'),
        ),
      ).toThrowType(MemberError, (error: MemberError) => {
        expect(error.type).toBe(MemberErrorType.MissingMemberName);
      });
    });

    it('should fail to create a user with whitespace at the start or end of their name', () => {
      expect(() =>
        Member.newMember(
          eciesService,
          MemberType.User,
          'alice ',
          new EmailString('alice@example.com'),
        ),
      ).toThrowType(MemberError, (error: MemberError) => {
        expect(error.type).toBe(MemberErrorType.InvalidMemberNameWhitespace);
      });
      expect(() =>
        Member.newMember(
          eciesService,
          MemberType.User,
          ' alice',
          new EmailString('alice@example.com'),
        ),
      ).toThrowType(MemberError, (error: MemberError) => {
        expect(error.type).toBe(MemberErrorType.InvalidMemberNameWhitespace);
      });
    });

    it('should fail to create a user with no email', async () => {
      await withConsoleMocks({ mute: true }, (spies) => {
        expect(() =>
          Member.newMember(
            eciesService,
            MemberType.User,
            'alice',
            new EmailString(''),
          ),
        ).toThrowType(InvalidEmailError, (error: InvalidEmailError) => {
          expect(error.type).toBe(InvalidEmailErrorType.Missing);
        });

        // Verify the expected warning about missing translation key
        expect(
          spyContains(
            spies.warn,
            'Translation failed for key Error_InvalidEmailError_Missing',
          ),
        ).toBe(true);
      });
    });

    it('should fail to create a user with an email that has whitespace at the start or end', async () => {
      await withConsoleMocks({ mute: true }, (spies) => {
        expect(() =>
          Member.newMember(
            eciesService,
            MemberType.User,
            'alice',
            new EmailString(' alice@example.com'),
          ),
        ).toThrowType(InvalidEmailError, (error: InvalidEmailError) => {
          expect(error.type).toBe(InvalidEmailErrorType.Whitespace);
        });
        expect(() =>
          Member.newMember(
            eciesService,
            MemberType.User,
            'alice',
            new EmailString('alice@example.com '),
          ),
        ).toThrowType(InvalidEmailError, (error: InvalidEmailError) => {
          expect(error.type).toBe(InvalidEmailErrorType.Whitespace);
        });

        // Verify the expected warnings about missing translation keys
        expect(
          spyContains(
            spies.warn,
            'Translation failed for key Error_InvalidEmailError_Whitespace',
          ),
        ).toBe(true);
      });
    });

    it('should fail to create a user with an invalid email', () => {
      expect(() => {
        Member.newMember(
          eciesService,
          MemberType.User,
          'Nope',
          new EmailString('x!foo'),
        );
      }).toThrowType(InvalidEmailError, (error: InvalidEmailError) => {
        expect(error.type).toBe(InvalidEmailErrorType.Invalid);
      });
    });

    it('should check whether a user has a private key', () => {
      expect(bob.member.hasPrivateKey).toEqual(true);
      expect(noKeyCharlie.member.hasPrivateKey).toEqual(false);
    });
  });

  describe('BIP39 mnemonic and wallet functionality', () => {
    let mnemonic: SecureString;
    let wallet: Wallet;
    let member: IMemberWithMnemonic;
    beforeAll(() => {
      member = Member.newMember(
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );
      wallet = member.member.wallet;
      mnemonic = member.mnemonic;
    });
    it('should generate valid BIP39 mnemonic and derive wallet', () => {
      expect(wallet).toBeDefined();
      expect(wallet.getPrivateKey()).toBeDefined();
      expect(wallet.getPublicKey()).toBeDefined();
    });

    it('should consistently derive keys from the same mnemonic', () => {
      const { wallet: wallet2 } =
        eciesService.walletAndSeedFromMnemonic(mnemonic);

      expect(uint8ArrayToHex(wallet.getPrivateKey())).toEqual(
        uint8ArrayToHex(wallet2.getPrivateKey()),
      );
      expect(uint8ArrayToHex(wallet.getPublicKey())).toEqual(
        uint8ArrayToHex(wallet2.getPublicKey()),
      );
    });

    it('should maintain key consistency between wallet and ECDH', () => {
      // Get the public key from the member (which uses ECDH internally)
      const memberPublicKey = member.member.publicKey;

      // The public key should be in uncompressed format with 0x04 prefix
      expect(memberPublicKey[0]).toEqual(ECIES.PUBLIC_KEY_MAGIC);

      // Verify the key length is correct for the curve
      // For secp256k1, public key should be 65 bytes (1 byte prefix + 32 bytes x + 32 bytes y)
      expect(memberPublicKey.length).toEqual(ECIES.PUBLIC_KEY_LENGTH);
    });

    it('should handle wallet unload and reload with mnemonic', () => {
      // Generate a new member
      const newMember = Member.newMember(
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
      );

      // Store the original keys
      const originalPublicKey = newMember.member.publicKey;
      const originalPrivateKey = newMember.member.privateKey;

      // Unload the wallet and private key
      newMember.member.unloadWalletAndPrivateKey();
      expect(newMember.member.hasPrivateKey).toBeFalsy();
      expect(() => newMember.member.wallet).toThrowType(
        MemberError,
        (error: MemberError) => {
          expect(error.type).toBe(MemberErrorType.NoWallet);
        },
      );

      // Generate a new mnemonic (this should fail to load)
      const wrongMnemonic = eciesService.generateNewMnemonic();
      expect(() => newMember.member.loadWallet(wrongMnemonic)).toThrowType(
        MemberError,
        (error: MemberError) => {
          expect(error.type).toBe(MemberErrorType.InvalidMnemonic);
        },
      );

      // The member should still not have a private key
      expect(newMember.member.hasPrivateKey).toBeFalsy();
      expect(() => newMember.member.wallet).toThrowType(
        MemberError,
        (error: MemberError) => {
          expect(error.type).toBe(MemberErrorType.NoWallet);
        },
      );

      // Create a new member with same keys to simulate reloading from storage
      const reloadedMember = new Member(
        eciesService,
        MemberType.User,
        'Test User',
        new EmailString('test@example.com'),
        originalPublicKey,
      );
      // Set the private key using the setter to ensure proper validation
      if (originalPrivateKey) {
        reloadedMember.loadPrivateKey(originalPrivateKey);
      }

      // Verify ECDH keys match
      expect(uint8ArrayToHex(reloadedMember.publicKey)).toEqual(
        uint8ArrayToHex(originalPublicKey),
      );
      expect(
        uint8ArrayToHex(reloadedMember.privateKey?.value ?? new Uint8Array()),
      ).toEqual(uint8ArrayToHex(originalPrivateKey?.value ?? new Uint8Array()));
    });

    it('should create unique keys for different members', () => {
      const member2 = Member.newMember(
        eciesService,
        MemberType.User,
        'User 2',
        new EmailString('user2@example.com'),
      );

      // Public keys should be different
      expect(uint8ArrayToHex(member.member.publicKey)).not.toEqual(
        uint8ArrayToHex(member2.member.publicKey),
      );

      // Private keys should be different
      expect(
        uint8ArrayToHex(member.member.privateKey?.value ?? new Uint8Array()),
      ).not.toEqual(
        uint8ArrayToHex(member2.member.privateKey?.value ?? new Uint8Array()),
      );
    });
  });
  describe('json', () => {
    it('should serialize and deserialize correctly', async () => {
      const memberJson = alice.member.toJson();
      const reloadedMember = Member.fromJson(memberJson, eciesService);
      reloadedMember.loadWallet(alice.mnemonic);
      const encrypted = await eciesService.encryptSimpleOrSingle(
        false,
        alice.member.publicKey,
        new TextEncoder().encode('hello world'),
      );
      if (!reloadedMember.privateKey) {
        throw new Error('Private key not loaded');
      }
      const decrypted = await eciesService.decryptSimpleOrSingleWithHeader(
        false,
        reloadedMember.privateKey.value,
        encrypted,
      );
      expect(new TextDecoder().decode(decrypted)).toEqual('hello world');
    });
  });
});
