import { SecureBuffer, SecureString } from '../src';
import { MockFrontendMember } from '../src/test-mocks/mock-frontend-member';

describe('MockFrontendMember lifecycle methods', () => {
  describe('unloadPrivateKey()', () => {
    it('should be callable', () => {
      const member = MockFrontendMember.createWithPrivateKey();
      expect(() => member.unloadPrivateKey()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      const member = MockFrontendMember.createWithPrivateKey();
      member.unloadPrivateKey();
      expect(() => member.unloadPrivateKey()).not.toThrow();
    });

    it('should work on member without private key', () => {
      const member = MockFrontendMember.createWithoutPrivateKey();
      expect(() => member.unloadPrivateKey()).not.toThrow();
    });
  });

  describe('unloadWallet()', () => {
    it('should be callable', () => {
      const member = MockFrontendMember.create();
      expect(() => member.unloadWallet()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      const member = MockFrontendMember.create();
      member.unloadWallet();
      expect(() => member.unloadWallet()).not.toThrow();
    });
  });

  describe('unloadWalletAndPrivateKey()', () => {
    it('should be callable', () => {
      const member = MockFrontendMember.createWithPrivateKey();
      expect(() => member.unloadWalletAndPrivateKey()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      const member = MockFrontendMember.createWithPrivateKey();
      member.unloadWalletAndPrivateKey();
      expect(() => member.unloadWalletAndPrivateKey()).not.toThrow();
    });

    it('should work on member without keys', () => {
      const member = MockFrontendMember.createWithoutPrivateKey();
      expect(() => member.unloadWalletAndPrivateKey()).not.toThrow();
    });
  });

  describe('loadWallet()', () => {
    it('should accept SecureString mnemonic', () => {
      const member = MockFrontendMember.create();
      const mnemonic = new SecureString(
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      );

      expect(() => member.loadWallet(mnemonic)).not.toThrow();
    });

    it('should be callable after unload', () => {
      const member = MockFrontendMember.create();
      const mnemonic = new SecureString('test mnemonic');

      member.unloadWallet();
      expect(() => member.loadWallet(mnemonic)).not.toThrow();
    });

    it('should handle empty mnemonic', () => {
      const member = MockFrontendMember.create();
      const mnemonic = new SecureString('');

      expect(() => member.loadWallet(mnemonic)).not.toThrow();
    });
  });

  describe('loadPrivateKey()', () => {
    it('should accept SecureBuffer private key', () => {
      const member = MockFrontendMember.create();
      const privateKey = new SecureBuffer(new Uint8Array(32));

      expect(() => member.loadPrivateKey(privateKey)).not.toThrow();
    });

    it('should be callable after unload', () => {
      const member = MockFrontendMember.createWithPrivateKey();
      const privateKey = new SecureBuffer(new Uint8Array(32));

      member.unloadPrivateKey();
      expect(() => member.loadPrivateKey(privateKey)).not.toThrow();
    });

    it('should handle different key sizes', () => {
      const member = MockFrontendMember.create();
      const key16 = new SecureBuffer(new Uint8Array(16));
      const key32 = new SecureBuffer(new Uint8Array(32));
      const key64 = new SecureBuffer(new Uint8Array(64));

      expect(() => member.loadPrivateKey(key16)).not.toThrow();
      expect(() => member.loadPrivateKey(key32)).not.toThrow();
      expect(() => member.loadPrivateKey(key64)).not.toThrow();
    });
  });

  describe('dispose()', () => {
    it('should be callable', () => {
      const member = MockFrontendMember.create();
      expect(() => member.dispose()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      const member = MockFrontendMember.create();
      member.dispose();
      expect(() => member.dispose()).not.toThrow();
    });

    it('should work after other lifecycle methods', () => {
      const member = MockFrontendMember.createWithPrivateKey();
      member.unloadWalletAndPrivateKey();
      expect(() => member.dispose()).not.toThrow();
    });
  });

  describe('lifecycle sequences', () => {
    it('should handle load-unload-load sequence', () => {
      const member = MockFrontendMember.create();
      const mnemonic = new SecureString('test mnemonic');
      const privateKey = new SecureBuffer(new Uint8Array(32));

      member.loadWallet(mnemonic);
      member.loadPrivateKey(privateKey);
      member.unloadWalletAndPrivateKey();
      member.loadWallet(mnemonic);
      member.loadPrivateKey(privateKey);

      expect(() => member.dispose()).not.toThrow();
    });

    it('should handle multiple unloads before dispose', () => {
      const member = MockFrontendMember.createWithPrivateKey();

      member.unloadPrivateKey();
      member.unloadWallet();
      member.unloadWalletAndPrivateKey();
      member.dispose();

      expect(true).toBe(true);
    });

    it('should allow operations after partial unload', async () => {
      const member = MockFrontendMember.createWithPrivateKey();

      member.unloadPrivateKey();

      const data = new Uint8Array([1, 2, 3]);
      expect(() => member.sign(data)).not.toThrow();
      await expect(member.encryptData('test')).resolves.toBeInstanceOf(
        Uint8Array,
      );
    });
  });
});
