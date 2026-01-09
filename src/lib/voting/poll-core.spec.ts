/**
 * Poll Core Tests
 * Tests Poll class functionality
 */
import { generateRandomKeysSync as generateKeyPair } from 'paillier-bigint';
import { EmailString } from '../../email-string';
import { MemberType } from '../../enumerations/member-type';
import type { IMember } from '../../interfaces';
import { IIdProvider } from '../../interfaces/id-provider';
import { SecureBuffer } from '../../secure-buffer';
import { VotingMethod } from './enumerations/voting-method';
import type { EncryptedVote } from './interfaces/encrypted-vote';
import { Poll } from './poll-core';

// Mock Member for testing
class MockMember implements IMember {
  public readonly type = MemberType.User;
  public readonly name = 'Mock User';
  public readonly email = new EmailString('mock@example.com');
  public readonly creatorId: Uint8Array;
  public readonly dateCreated = new Date();
  public readonly dateUpdated = new Date();
  public readonly privateKey: SecureBuffer | undefined = undefined;
  public readonly hasPrivateKey = false;
  public readonly hasVotingPrivateKey = true;

  constructor(
    public readonly id: Uint8Array,
    public readonly publicKey: Uint8Array,
    public readonly votingPublicKey: any,
    public readonly votingPrivateKey: any,
  ) {
    this.creatorId = id; // Use same ID as creator for simplicity
  }

  get idBytes(): Uint8Array {
    return this.id;
  }

  get wallet(): any {
    return undefined; // Mock wallet
  }

  get walletOptional(): any {
    return undefined;
  }

  // Add idProvider for voting system compatibility
  get idProvider(): IIdProvider<Uint8Array> {
    // Return a mock ObjectIdProvider for testing
    return {
      byteLength: 12,
      generate: () => new Uint8Array(12),
      toBytes: (id: Uint8Array) => id,
      fromBytes: (bytes: Uint8Array) => bytes,
      serialize: (id: Uint8Array) =>
        Array.from(id)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      deserialize: (str: string) =>
        new Uint8Array(
          str.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) || [],
        ),
      validate: (id: Uint8Array) => id.length === 12,
    };
  }

  sign(data: Uint8Array): Uint8Array {
    // Generate unique signature based on data
    const sig = new Uint8Array(64);
    for (let i = 0; i < Math.min(data.length, 64); i++) {
      sig[i] = data[i];
    }
    return sig;
  }

  signData(data: Uint8Array): Uint8Array {
    return this.sign(data); // Mock signature
  }

  verify(signature: Uint8Array, data: Uint8Array): boolean {
    // Verify signature matches data
    for (let i = 0; i < Math.min(data.length, 64); i++) {
      if (signature[i] !== data[i]) return false;
    }
    return true;
  }

  verifySignature(
    data: Uint8Array,
    signature: Uint8Array,
    _publicKey: Uint8Array,
  ): boolean {
    return this.verify(signature, data); // Mock verification
  }

  // Key management methods (mock implementations)
  unloadPrivateKey(): void {}
  unloadWallet(): void {}
  unloadWalletAndPrivateKey(): void {}
  loadWallet(_mnemonic: any, _eciesParams?: any): void {}
  loadPrivateKey(_privateKey: SecureBuffer): void {}

  // Voting key management methods
  loadVotingKeys(_votingPublicKey: any, _votingPrivateKey?: any): void {}
  async deriveVotingKeys(_options?: Record<string, unknown>): Promise<void> {}
  unloadVotingPrivateKey(): void {}

  // Encryption/Decryption methods (mock implementations)
  async *encryptDataStream(
    _source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    _options?: any,
  ): AsyncGenerator<any, void, unknown> {
    // Mock implementation
    yield { data: new Uint8Array(0), nonce: new Uint8Array(0) };
  }

  async *decryptDataStream(
    _source: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>,
    _options?: any,
  ): AsyncGenerator<Uint8Array, void, unknown> {
    // Mock implementation
    yield new Uint8Array(0);
  }

  async encryptData(
    _data: string | Uint8Array,
    _recipientPublicKey?: Uint8Array,
  ): Promise<Uint8Array> {
    return new Uint8Array(0); // Mock encrypted data
  }

  async decryptData(_encryptedData: Uint8Array): Promise<Uint8Array> {
    return new Uint8Array(0); // Mock decrypted data
  }

  // Serialization methods
  toJson(): string {
    return JSON.stringify({
      id: Array.from(this.id),
      type: this.type,
      name: this.name,
      email: this.email.toString(),
    });
  }

  dispose(): void {
    // Mock cleanup
  }
}

describe('Poll', () => {
  let authority: MockMember;
  let voters: MockMember[];
  let poll: Poll;
  let keyPair: any;

  beforeAll(() => {
    keyPair = generateKeyPair(512);
  });

  beforeEach(() => {
    authority = new MockMember(
      new Uint8Array([0]),
      new Uint8Array([0]),
      keyPair.publicKey,
      keyPair.privateKey,
    );
    voters = Array.from(
      { length: 5 },
      (_, i) =>
        new MockMember(
          new Uint8Array([i + 1]),
          new Uint8Array([i + 1]),
          keyPair.publicKey,
          keyPair.privateKey,
        ),
    );
    poll = new Poll(
      new Uint8Array([1, 2, 3]),
      ['A', 'B', 'C'],
      VotingMethod.Plurality,
      authority,
      keyPair.publicKey,
    );
  });

  describe('Construction', () => {
    test('should create poll with valid parameters', () => {
      expect(poll.id).toEqual(new Uint8Array([1, 2, 3]));
      expect(poll.choices).toEqual(['A', 'B', 'C']);
      expect(poll.method).toBe(VotingMethod.Plurality);
      expect(poll.isClosed).toBe(false);
      expect(poll.voterCount).toBe(0);
    });

    test('should reject < 2 choices', () => {
      const keyPair = generateKeyPair(512);
      expect(() => {
        new Poll(
          new Uint8Array([1]),
          ['Only One'],
          VotingMethod.Plurality,
          authority,
          keyPair.publicKey,
        );
      }).toThrow('at least 2 choices');
    });

    test('should reject authority without voting keys', () => {
      const badAuthority = new MockMember(
        new Uint8Array([1]),
        new Uint8Array([1]),
        undefined,
        undefined,
      );

      expect(() => {
        new Poll(
          new Uint8Array([1]),
          ['A', 'B'],
          VotingMethod.Plurality,
          badAuthority,
          keyPair.publicKey,
        );
      }).toThrow('voting keys');
    });

    test('should freeze choices array', () => {
      expect(Object.isFrozen(poll.choices)).toBe(true);
    });
  });

  describe('Voting', () => {
    test('should accept valid vote', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      const receipt = poll.vote(voters[0], vote);

      expect(receipt).toBeDefined();
      expect(receipt.voterId).toEqual(voters[0].id);
      expect(receipt.pollId).toEqual(poll.id);
    });

    test('should increment voter count', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      poll.vote(voters[0], vote);
      expect(poll.voterCount).toBe(1);

      poll.vote(voters[1], vote);
      expect(poll.voterCount).toBe(2);
    });

    test('should prevent double voting', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      poll.vote(voters[0], vote);

      expect(() => {
        poll.vote(voters[0], vote);
      }).toThrow('Already voted');
    });

    test('should prevent voting after close', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      poll.close();

      expect(() => {
        poll.vote(voters[0], vote);
      }).toThrow('Poll is closed');
    });

    test('should validate vote structure for plurality', () => {
      const invalidVote: EncryptedVote = {
        encrypted: [1n, 2n, 3n],
      };

      expect(() => {
        poll.vote(voters[0], invalidVote);
      }).toThrow('Choice required');
    });

    test('should validate choice index bounds', () => {
      const invalidVote: EncryptedVote = {
        choiceIndex: 5,
        encrypted: [1n, 2n, 3n],
      };

      expect(() => {
        poll.vote(voters[0], invalidVote);
      }).toThrow('Invalid choice');
    });

    test('should validate negative choice index', () => {
      const invalidVote: EncryptedVote = {
        choiceIndex: -1,
        encrypted: [1n, 2n, 3n],
      };

      expect(() => {
        poll.vote(voters[0], invalidVote);
      }).toThrow('Invalid choice');
    });
  });

  describe('Receipt Generation', () => {
    test('should generate unique receipts', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      const receipt1 = poll.vote(voters[0], vote);
      const receipt2 = poll.vote(voters[1], vote);

      expect(receipt1.signature).not.toEqual(receipt2.signature);
      expect(receipt1.nonce).not.toEqual(receipt2.nonce);
    });

    test('should include timestamp in receipt', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      const before = Date.now();
      const receipt = poll.vote(voters[0], vote);
      const after = Date.now();

      expect(receipt.timestamp).toBeGreaterThanOrEqual(before);
      expect(receipt.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Receipt Verification', () => {
    test('should verify valid receipt', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      const receipt = poll.vote(voters[0], vote);
      const isValid = poll.verifyReceipt(voters[0], receipt);

      expect(isValid).toBe(true);
    });

    test('should reject receipt from non-voter', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      const receipt = poll.vote(voters[0], vote);
      const isValid = poll.verifyReceipt(voters[1], receipt);

      expect(isValid).toBe(false);
    });

    test('should reject modified receipt', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      const receipt = poll.vote(voters[0], vote);
      const modifiedReceipt = {
        ...receipt,
        timestamp: receipt.timestamp + 1000,
      };
      const isValid = poll.verifyReceipt(voters[0], modifiedReceipt);

      expect(isValid).toBe(false);
    });
  });

  describe('Poll Lifecycle', () => {
    test('should start as open', () => {
      expect(poll.isClosed).toBe(false);
      expect(poll.closedAt).toBeUndefined();
    });

    test('should close poll', () => {
      const before = Date.now();
      poll.close();
      const after = Date.now();

      expect(poll.isClosed).toBe(true);
      expect(poll.closedAt).toBeDefined();
      expect(poll.closedAt!).toBeGreaterThanOrEqual(before);
      expect(poll.closedAt!).toBeLessThanOrEqual(after);
    });

    test('should prevent double closing', () => {
      poll.close();

      expect(() => {
        poll.close();
      }).toThrow('Already closed');
    });

    test('should track creation time', () => {
      expect(poll.createdAt).toBeDefined();
      expect(poll.createdAt).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Encrypted Votes Access', () => {
    test('should return encrypted votes', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      poll.vote(voters[0], vote);
      poll.vote(voters[1], vote);

      const encryptedVotes = poll.getEncryptedVotes();

      expect(encryptedVotes.size).toBe(2);
    });

    test('should return readonly map', () => {
      const encryptedVotes = poll.getEncryptedVotes();

      expect(() => {
        (encryptedVotes as any).clear();
      }).toThrow();
    });

    test('should return readonly vote arrays', () => {
      const vote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n, 3n],
      };

      poll.vote(voters[0], vote);
      const encryptedVotes = poll.getEncryptedVotes();
      const voteArray = Array.from(encryptedVotes.values())[0];

      expect(() => {
        (voteArray as any).push(4n);
      }).toThrow();
    });
  });

  describe('Approval Voting Validation', () => {
    test('should validate approval vote structure', () => {
      const approvalPoll = new Poll(
        new Uint8Array([1]),
        ['A', 'B', 'C'],
        VotingMethod.Approval,
        authority,
        authority.votingPublicKey,
      );

      const invalidVote: EncryptedVote = {
        encrypted: [1n, 2n, 3n],
      };

      expect(() => {
        approvalPoll.vote(voters[0], invalidVote);
      }).toThrow('Choices required');
    });

    test('should validate approval choice indices', () => {
      const approvalPoll = new Poll(
        new Uint8Array([1]),
        ['A', 'B', 'C'],
        VotingMethod.Approval,
        authority,
        authority.votingPublicKey,
      );

      const invalidVote: EncryptedVote = {
        choices: [0, 5],
        encrypted: [1n, 2n, 3n],
      };

      expect(() => {
        approvalPoll.vote(voters[0], invalidVote);
      }).toThrow('Invalid choice');
    });
  });

  describe('Weighted Voting Validation', () => {
    test('should validate weight presence', () => {
      const weightedPoll = new Poll(
        new Uint8Array([1]),
        ['A', 'B'],
        VotingMethod.Weighted,
        authority,
        authority.votingPublicKey,
        1000n,
      );

      const invalidVote: EncryptedVote = {
        choiceIndex: 0,
        encrypted: [1n, 2n],
      };

      expect(() => {
        weightedPoll.vote(voters[0], invalidVote);
      }).toThrow('Weight must be positive');
    });

    test('should validate weight bounds', () => {
      const weightedPoll = new Poll(
        new Uint8Array([1]),
        ['A', 'B'],
        VotingMethod.Weighted,
        authority,
        authority.votingPublicKey,
        100n,
      );

      const invalidVote: EncryptedVote = {
        choiceIndex: 0,
        weight: 101n,
        encrypted: [1n, 2n],
      };

      expect(() => {
        weightedPoll.vote(voters[0], invalidVote);
      }).toThrow('Weight exceeds maximum');
    });
  });

  describe('Ranked Voting Validation', () => {
    test('should validate rankings presence', () => {
      const rankedPoll = new Poll(
        new Uint8Array([1]),
        ['A', 'B', 'C'],
        VotingMethod.Borda,
        authority,
        authority.votingPublicKey,
      );

      const invalidVote: EncryptedVote = {
        encrypted: [1n, 2n, 3n],
      };

      expect(() => {
        rankedPoll.vote(voters[0], invalidVote);
      }).toThrow('Rankings required');
    });

    test('should validate ranking indices', () => {
      const rankedPoll = new Poll(
        new Uint8Array([1]),
        ['A', 'B', 'C'],
        VotingMethod.Borda,
        authority,
        authority.votingPublicKey,
      );

      const invalidVote: EncryptedVote = {
        rankings: [0, 5],
        encrypted: [1n, 2n, 3n],
      };

      expect(() => {
        rankedPoll.vote(voters[0], invalidVote);
      }).toThrow('Invalid choice');
    });

    test('should reject duplicate rankings', () => {
      const rankedPoll = new Poll(
        new Uint8Array([1]),
        ['A', 'B', 'C'],
        VotingMethod.Borda,
        authority,
        authority.votingPublicKey,
      );

      const invalidVote: EncryptedVote = {
        rankings: [0, 1, 0],
        encrypted: [1n, 2n, 3n],
      };

      expect(() => {
        rankedPoll.vote(voters[0], invalidVote);
      }).toThrow('Duplicate ranking');
    });
  });
});
