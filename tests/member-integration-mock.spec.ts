import { ObjectId } from 'bson';
import { MemberType } from '../src';
import { IFrontendMemberOperational } from '../src/interfaces';
import { MockFrontendMember } from '../src/test-mocks/mock-frontend-member';

describe('MockFrontendMember integration scenarios', () => {
  describe('multiple members interacting', () => {
    it('should create multiple unique members', () => {
      const members = MockFrontendMember.createMultiple(10);

      const ids = new Set(members.map((m) => m.id.toString()));
      expect(ids.size).toBe(10);
    });

    it('should allow members to sign and verify each other', () => {
      const alice = MockFrontendMember.create({ name: 'Alice' });
      const bob = MockFrontendMember.create({ name: 'Bob' });

      const message = new Uint8Array([1, 2, 3]);
      const aliceSignature = alice.sign(message);
      const bobSignature = bob.sign(message);

      expect(alice.verify(aliceSignature, message)).toBe(true);
      expect(bob.verify(bobSignature, message)).toBe(true);
      expect(alice.verify(bobSignature, message)).toBe(true); // Mock always returns true
    });

    it('should handle encryption between members', async () => {
      const sender = MockFrontendMember.createWithPrivateKey();
      const receiver = MockFrontendMember.createWithPrivateKey();

      const plaintext = 'Secret message';
      const encrypted = await sender.encryptData(plaintext);
      const decrypted = await receiver.decryptData(encrypted);

      expect(decrypted).toBeInstanceOf(Uint8Array);
    });
  });

  describe('member collections', () => {
    it('should work in arrays', () => {
      const members = [
        MockFrontendMember.create(),
        MockFrontendMember.create(),
        MockFrontendMember.create(),
      ];

      const names = members.map((_m) => _m.name);
      expect(names).toHaveLength(3);
    });

    it('should work in Map with ObjectId keys', () => {
      const memberMap = new Map<string, MockFrontendMember>();

      const member1 = MockFrontendMember.create();
      const member2 = MockFrontendMember.create();

      memberMap.set(member1.id.toString(), member1);
      memberMap.set(member2.id.toString(), member2);

      expect(memberMap.size).toBe(2);
      expect(memberMap.get(member1.id.toString())).toBe(member1);
    });

    it('should work in Set', () => {
      const memberSet = new Set<MockFrontendMember>();

      const members = MockFrontendMember.createMultiple(5);
      members.forEach((m) => memberSet.add(m));

      expect(memberSet.size).toBe(5);
    });

    it('should filter by type', () => {
      const members = [
        MockFrontendMember.create({ type: MemberType.Admin }),
        MockFrontendMember.create({ type: MemberType.User }),
        MockFrontendMember.create({ type: MemberType.Admin }),
      ];

      const admins = members.filter((m) => m.type === MemberType.Admin);
      expect(admins).toHaveLength(2);
    });
  });

  describe('member as function parameters', () => {
    it('should work as function parameter', () => {
      const getMemberInfo = (member: IFrontendMemberOperational<ObjectId>) => ({
        id: member.id.toString(),
        name: member.name,
        email: member.email.toString(),
      });

      const member = MockFrontendMember.create();
      const info = getMemberInfo(member);

      expect(info.id).toBe(member.id.toString());
      expect(info.name).toBe(member.name);
    });

    it('should work with async functions', async () => {
      const processMembers = async (
        members: IFrontendMemberOperational<ObjectId>[],
      ) => {
        const results = await Promise.all(
          members.map((m) => m.encryptData('test')),
        );
        return results;
      };

      const members = MockFrontendMember.createMultiple(3);
      const encrypted = await processMembers(members);

      expect(encrypted).toHaveLength(3);
      encrypted.forEach((e) => expect(e).toBeInstanceOf(Uint8Array));
    });

    it('should work with higher-order functions', () => {
      const createMemberProcessor =
        (prefix: string) => (member: IFrontendMemberOperational<ObjectId>) =>
          `${prefix}: ${member.name}`;

      const processor = createMemberProcessor('Member');
      const member = MockFrontendMember.create({ name: 'Test' });

      expect(processor(member)).toBe('Member: Test');
    });
  });

  describe('member in data structures', () => {
    it('should work in nested structures', () => {
      interface Team {
        name: string;
        members: IFrontendMemberOperational<ObjectId>[];
        leader: IFrontendMemberOperational<ObjectId>;
      }

      const team: Team = {
        name: 'Alpha Team',
        members: MockFrontendMember.createMultiple(5),
        leader: MockFrontendMember.create({ type: MemberType.Admin }),
      };

      expect(team.members).toHaveLength(5);
      expect(team.leader.type).toBe(MemberType.Admin);
    });

    it('should work with Record type', () => {
      const membersByRole: Record<
        string,
        IFrontendMemberOperational<ObjectId>[]
      > = {
        admins: MockFrontendMember.createMultiple(2).map((_m) => {
          return MockFrontendMember.create({ type: MemberType.Admin });
        }),
        users: MockFrontendMember.createMultiple(5).map((_m) => {
          return MockFrontendMember.create({ type: MemberType.User });
        }),
      };

      expect(membersByRole.admins).toHaveLength(2);
      expect(membersByRole.users).toHaveLength(5);
    });

    it('should work with tuple types', () => {
      type MemberPair = [
        IFrontendMemberOperational<ObjectId>,
        IFrontendMemberOperational<ObjectId>,
      ];

      const pair: MemberPair = [
        MockFrontendMember.create(),
        MockFrontendMember.create(),
      ];

      expect(pair).toHaveLength(2);
      expect(pair[0]).toBeInstanceOf(MockFrontendMember);
      expect(pair[1]).toBeInstanceOf(MockFrontendMember);
    });
  });

  describe('realistic scenarios', () => {
    it('should simulate a message exchange', async () => {
      const alice = MockFrontendMember.create({ name: 'Alice' });
      const bob = MockFrontendMember.create({ name: 'Bob' });

      const message = 'Hello Bob!';
      const encrypted = await alice.encryptData(message);
      const decrypted = await bob.decryptData(encrypted);
      const decryptedText = new TextDecoder().decode(decrypted);

      expect(decryptedText).toBeTruthy();
    });

    it('should simulate a group with multiple members', () => {
      interface Group {
        id: string;
        name: string;
        owner: IFrontendMemberOperational<ObjectId>;
        members: IFrontendMemberOperational<ObjectId>[];
        createdAt: Date;
      }

      const group: Group = {
        id: new ObjectId().toString(),
        name: 'Test Group',
        owner: MockFrontendMember.create({ type: MemberType.Admin }),
        members: MockFrontendMember.createMultiple(10),
        createdAt: new Date(),
      };

      expect(group.members).toHaveLength(10);
      expect(group.owner.type).toBe(MemberType.Admin);
    });

    it('should simulate member lookup and operations', async () => {
      const members = MockFrontendMember.createMultiple(20);
      const memberMap = new Map(members.map((m) => [m.id.toString(), m]));

      const randomId = members[5].id.toString();
      const foundMember = memberMap.get(randomId);

      expect(foundMember).toBeDefined();
      if (foundMember) {
        const data = await foundMember.encryptData('test');
        expect(data).toBeInstanceOf(Uint8Array);
      }
    });
  });
});
