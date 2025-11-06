import { ObjectId } from 'bson';
import { SecureString } from '../src/secure-string';
import { IFrontendMemberOperational } from '../src/interfaces';
import { SignatureUint8Array } from '../src/types';
import { MockFrontendMember } from '../src/test-mocks/mock-frontend-member';

describe('IFrontendMemberOperational interface compliance', () => {
  let member: IFrontendMemberOperational<ObjectId>;

  beforeEach(() => {
    member = MockFrontendMember.create();
  });

  describe('interface properties', () => {
    it('should have id property', () => {
      expect(member.id).toBeInstanceOf(ObjectId);
    });

    it('should have type property', () => {
      expect(member.type).toBeDefined();
    });

    it('should have name property', () => {
      expect(typeof member.name).toBe('string');
    });

    it('should have email property', () => {
      expect(member.email).toBeDefined();
    });

    it('should have publicKey property', () => {
      expect(member.publicKey).toBeInstanceOf(Uint8Array);
    });

    it('should have creatorId property', () => {
      expect(member.creatorId).toBeInstanceOf(ObjectId);
    });

    it('should have dateCreated property', () => {
      expect(member.dateCreated).toBeInstanceOf(Date);
    });

    it('should have dateUpdated property', () => {
      expect(member.dateUpdated).toBeInstanceOf(Date);
    });

    it('should have hasPrivateKey property', () => {
      expect(typeof member.hasPrivateKey).toBe('boolean');
    });
  });

  describe('interface methods', () => {
    it('should have unloadPrivateKey method', () => {
      expect(typeof member.unloadPrivateKey).toBe('function');
      expect(() => member.unloadPrivateKey()).not.toThrow();
    });

    it('should have unloadWallet method', () => {
      expect(typeof member.unloadWallet).toBe('function');
      expect(() => member.unloadWallet()).not.toThrow();
    });

    it('should have unloadWalletAndPrivateKey method', () => {
      expect(typeof member.unloadWalletAndPrivateKey).toBe('function');
      expect(() => member.unloadWalletAndPrivateKey()).not.toThrow();
    });

    it('should have loadWallet method', () => {
      expect(typeof member.loadWallet).toBe('function');
      const mnemonic = new SecureString('test mnemonic phrase');
      expect(() => member.loadWallet(mnemonic)).not.toThrow();
    });

    it('should have sign method', () => {
      expect(typeof member.sign).toBe('function');
      const data = new Uint8Array([1, 2, 3]);
      const signature = member.sign(data);
      expect(signature).toBeInstanceOf(Uint8Array);
    });

    it('should have verify method', () => {
      expect(typeof member.verify).toBe('function');
      const data = new Uint8Array([1, 2, 3]);
      const signature = new Uint8Array(64) as SignatureUint8Array;
      const result = member.verify(signature, data);
      expect(typeof result).toBe('boolean');
    });

    it('should have encryptData method', async () => {
      expect(typeof member.encryptData).toBe('function');
      const data = 'test data';
      const encrypted = await member.encryptData(data);
      expect(encrypted).toBeInstanceOf(Uint8Array);
    });

    it('should have decryptData method', async () => {
      expect(typeof member.decryptData).toBe('function');
      const encrypted = new Uint8Array([1, 2, 3]);
      const decrypted = await member.decryptData(encrypted);
      expect(decrypted).toBeInstanceOf(Uint8Array);
    });

    it('should have toJson method', () => {
      expect(typeof member.toJson).toBe('function');
      const json = member.toJson();
      expect(typeof json).toBe('string');
    });

    it('should have dispose method', () => {
      expect(typeof member.dispose).toBe('function');
      expect(() => member.dispose()).not.toThrow();
    });
  });

  describe('polymorphic usage', () => {
    it('should work as IFrontendMemberOperational type', () => {
      const processMembers = (members: IFrontendMemberOperational<ObjectId>[]) => {
        return members.map((m) => m.name);
      };

      const members = MockFrontendMember.createMultiple(3);
      const names = processMembers(members);
      expect(names).toHaveLength(3);
    });

    it('should work in generic functions', () => {
      const getMemberId = <T>(member: IFrontendMemberOperational<T>): T => {
        return member.id;
      };

      const member = MockFrontendMember.create();
      const id = getMemberId(member);
      expect(id).toBeInstanceOf(ObjectId);
    });
  });
});
