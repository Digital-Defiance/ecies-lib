import { ObjectId } from 'bson';
import { EmailString, MemberType, SecureBuffer } from '../src';
import { MockFrontendMember } from '../src/test-mocks/mock-frontend-member';

describe('MockFrontendMember', () => {
  describe('constructor and basic properties', () => {
    it('should create a mock member with default values', () => {
      const member = new MockFrontendMember();

      expect(member.id).toBeInstanceOf(ObjectId);
      expect(Object.values(MemberType)).toContain(member.type);
      expect(member.name).toBeTruthy();
      expect(member.email).toBeInstanceOf(EmailString);
      expect(member.publicKey).toBeInstanceOf(Uint8Array);
      expect(member.creatorId).toBeInstanceOf(ObjectId);
      expect(member.dateCreated).toBeInstanceOf(Date);
      expect(member.dateUpdated).toBeInstanceOf(Date);
    });

    it('should create a mock member with custom values', () => {
      const customId = new ObjectId();
      const customEmail = new EmailString('test@example.com');
      const customName = 'Test User';

      const member = new MockFrontendMember({
        id: customId,
        type: MemberType.Admin,
        name: customName,
        email: customEmail,
      });

      expect(member.id).toBe(customId);
      expect(member.type).toBe(MemberType.Admin);
      expect(member.name).toBe(customName);
      expect(member.email).toBe(customEmail);
    });

    it('should have dateUpdated after or equal to dateCreated', () => {
      const member = new MockFrontendMember();
      expect(member.dateUpdated.getTime()).toBeGreaterThanOrEqual(
        member.dateCreated.getTime(),
      );
    });
  });

  describe('static factory methods', () => {
    it('should create a member using create()', () => {
      const member = MockFrontendMember.create();
      expect(member).toBeInstanceOf(MockFrontendMember);
    });

    it('should create a member with overrides using create()', () => {
      const customName = 'Custom Name';
      const member = MockFrontendMember.create({ name: customName });
      expect(member.name).toBe(customName);
    });

    it('should create multiple members using createMultiple()', () => {
      const count = 5;
      const members = MockFrontendMember.createMultiple(count);

      expect(members).toHaveLength(count);
      members.forEach((member) => {
        expect(member).toBeInstanceOf(MockFrontendMember);
      });
    });

    it('should create unique members with createMultiple()', () => {
      const members = MockFrontendMember.createMultiple(3);
      const ids = members.map((m) => m.id.toString());
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('should create member with private key using createWithPrivateKey()', () => {
      const member = MockFrontendMember.createWithPrivateKey();
      expect(member.hasPrivateKey).toBe(true);
      expect(member.privateKey).toBeInstanceOf(SecureBuffer);
    });

    it('should create member without private key using createWithoutPrivateKey()', () => {
      const member = MockFrontendMember.createWithoutPrivateKey();
      expect(member.hasPrivateKey).toBe(false);
      expect(member.privateKey).toBeUndefined();
    });
  });

  describe('toJson()', () => {
    it('should serialize to valid JSON', () => {
      const member = MockFrontendMember.create();
      const json = member.toJson();

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all required fields in JSON', () => {
      const member = MockFrontendMember.create();
      const parsed = JSON.parse(member.toJson());

      expect(parsed).toHaveProperty('id');
      expect(parsed).toHaveProperty('type');
      expect(parsed).toHaveProperty('name');
      expect(parsed).toHaveProperty('email');
      expect(parsed).toHaveProperty('publicKey');
      expect(parsed).toHaveProperty('creatorId');
      expect(parsed).toHaveProperty('dateCreated');
      expect(parsed).toHaveProperty('dateUpdated');
    });

    it('should not include private key in JSON', () => {
      const member = MockFrontendMember.createWithPrivateKey();
      const parsed = JSON.parse(member.toJson());

      expect(parsed).not.toHaveProperty('privateKey');
    });
  });

  describe('hasPrivateKey flag', () => {
    it('should respect hasPrivateKey override', () => {
      const member = new MockFrontendMember({ hasPrivateKey: false });
      expect(member.hasPrivateKey).toBe(false);
    });

    it('should default hasPrivateKey to true when privateKey provided', () => {
      const privateKey = new SecureBuffer(new Uint8Array(32));
      const member = new MockFrontendMember({ privateKey });
      expect(member.hasPrivateKey).toBe(true);
    });
  });
});
