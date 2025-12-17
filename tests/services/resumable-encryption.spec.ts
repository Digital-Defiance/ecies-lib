import { IEncryptionState } from '../../src/interfaces/encryption-state';
import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { ResumableEncryption } from '../../src/services/resumable-encryption';
import { StreamTestUtils } from '../support/stream-test-utils';

describe('ResumableEncryption', () => {
  let ecies: ECIESService;
  let stream: EncryptionStream;
  let publicKey: Uint8Array;
  let _privateKey: Uint8Array;

  beforeEach(() => {
    ecies = new ECIESService();
    stream = new EncryptionStream(ecies);
    const mnemonic = ecies.generateNewMnemonic();
    const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  });

  it('should encrypt without state', async () => {
    const resumable = new ResumableEncryption(stream);
    const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const chunks = [];
    for await (const chunk of resumable.encrypt(source, publicKey)) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBe(2);
  });

  it('should save state after encryption', async () => {
    const resumable = new ResumableEncryption(stream);
    const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    for await (const _chunk of resumable.encrypt(source, publicKey)) {
      // Process
    }

    const state = resumable.saveState();
    expect(state.chunkIndex).toBe(2);
    expect(state.bytesProcessed).toBe(2 * 1024 * 1024);
  });

  it('should auto-save state at intervals', async () => {
    const resumable = new ResumableEncryption(stream);
    const data = StreamTestUtils.generateRandomData(5 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const savedStates: IEncryptionState[] = [];
    for await (const _chunk of resumable.encrypt(source, publicKey, {
      autoSaveInterval: 2,
      onStateSaved: (state) => {
        savedStates.push({ ...state });
      },
    })) {
      // Process
    }

    expect(savedStates.length).toBe(2);
    expect(savedStates[0].chunkIndex).toBe(2);
    expect(savedStates[1].chunkIndex).toBe(4);
  });

  it('should throw when saving without state', () => {
    const resumable = new ResumableEncryption(stream);
    expect(() => resumable.saveState()).toThrow('No state to save');
  });

  it('should validate state version', () => {
    const invalidState: IEncryptionState = {
      version: 999,
      chunkIndex: 0,
      bytesProcessed: 0,
      publicKey: '',
      encryptionType: 0,
      chunkSize: 1024 * 1024,
      includeChecksums: false,
      timestamp: Date.now(),
    };

    expect(() => new ResumableEncryption(stream, invalidState)).toThrow(
      'Unsupported state version',
    );
  });

  it('should validate chunk index', () => {
    const invalidState: IEncryptionState = {
      version: 1,
      chunkIndex: -1,
      bytesProcessed: 0,
      publicKey: '',
      encryptionType: 0,
      chunkSize: 1024 * 1024,
      includeChecksums: false,
      timestamp: Date.now(),
    };

    expect(() => new ResumableEncryption(stream, invalidState)).toThrow(
      'Invalid chunk index',
    );
  });
});
