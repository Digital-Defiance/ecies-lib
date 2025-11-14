import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { StreamTestUtils } from '../support/stream-test-utils';
import { IStreamProgress } from '../../src/interfaces/stream-progress';

describe('Progress Callbacks', () => {
  let ecies: ECIESService;
  let stream: EncryptionStream;
  let publicKey: Uint8Array;
  let privateKey: Uint8Array;

  beforeEach(() => {
    ecies = new ECIESService();
    stream = new EncryptionStream(ecies);
    const mnemonic = ecies.generateNewMnemonic();
    const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  });

  it('should fire progress callback on each chunk', async () => {
    const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const progressUpdates: IStreamProgress[] = [];
    const onProgress = (progress: IStreamProgress) => {
      progressUpdates.push({ ...progress });
    };

    await StreamTestUtils.collectChunks(
      stream.encryptStream(source, publicKey, { onProgress })
    );

    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1].chunksProcessed).toBe(3);
  });

  it('should provide accurate progress data', async () => {
    const data = StreamTestUtils.generateRandomData(5 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const progressUpdates: IStreamProgress[] = [];
    const onProgress = (progress: IStreamProgress) => {
      progressUpdates.push({ ...progress });
    };

    await StreamTestUtils.collectChunks(
      stream.encryptStream(source, publicKey, { onProgress })
    );

    expect(progressUpdates.length).toBe(5);
    
    for (let i = 0; i < progressUpdates.length; i++) {
      expect(progressUpdates[i].chunksProcessed).toBe(i + 1);
      expect(progressUpdates[i].bytesProcessed).toBeGreaterThan(0);
    }

    const lastProgress = progressUpdates[progressUpdates.length - 1];
    expect(lastProgress.bytesProcessed).toBe(5 * 1024 * 1024);
  });

  it('should calculate throughput correctly', async () => {
    const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const progressUpdates: IStreamProgress[] = [];
    const onProgress = (progress: IStreamProgress) => {
      progressUpdates.push({ ...progress });
    };

    await StreamTestUtils.collectChunks(
      stream.encryptStream(source, publicKey, { onProgress })
    );

    const lastProgress = progressUpdates[progressUpdates.length - 1];
    expect(lastProgress.throughputBytesPerSec).toBeGreaterThan(0);
    expect(lastProgress.throughputBytesPerSec).toBeLessThan(1000 * 1024 * 1024);
  });

  it('should track progress during decryption', async () => {
    const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const encryptedChunks: Uint8Array[] = [];
    for await (const chunk of stream.encryptStream(source, publicKey)) {
      encryptedChunks.push(chunk.data);
    }

    const progressUpdates: IStreamProgress[] = [];
    const onProgress = (progress: IStreamProgress) => {
      progressUpdates.push({ ...progress });
    };

    const decryptedChunks = await StreamTestUtils.collectChunks(
      stream.decryptStream(
        (async function* () {
          for (const chunk of encryptedChunks) {
            yield chunk;
          }
        })(),
        privateKey,
        { onProgress }
      )
    );

    expect(progressUpdates.length).toBeGreaterThan(0);
    const lastProgress = progressUpdates[progressUpdates.length - 1];
    expect(lastProgress.chunksProcessed).toBe(3);
    expect(lastProgress.bytesProcessed).toBe(3 * 1024 * 1024);
  });
});
