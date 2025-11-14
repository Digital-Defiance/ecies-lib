import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { StreamTestUtils } from '../support/stream-test-utils';

describe('Cancellation', () => {
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

  it('should cancel encryption mid-stream', async () => {
    const data = StreamTestUtils.generateRandomData(10 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const controller = new AbortController();
    let chunksProcessed = 0;

    try {
      for await (const chunk of stream.encryptStream(source, publicKey, {
        signal: controller.signal,
      })) {
        chunksProcessed++;
        if (chunksProcessed === 3) {
          controller.abort();
        }
      }
      fail('Should have thrown AbortError');
    } catch (error: any) {
      expect(error.name).toBe('AbortError');
      expect(chunksProcessed).toBe(3);
    }
  });

  it('should cancel decryption mid-stream', async () => {
    const data = StreamTestUtils.generateRandomData(10 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const encryptedChunks: Uint8Array[] = [];
    for await (const chunk of stream.encryptStream(source, publicKey)) {
      encryptedChunks.push(chunk.data);
    }

    const controller = new AbortController();
    let chunksProcessed = 0;

    try {
      for await (const chunk of stream.decryptStream(
        (async function* () {
          for (const encrypted of encryptedChunks) {
            yield encrypted;
          }
        })(),
        privateKey,
        { signal: controller.signal }
      )) {
        chunksProcessed++;
        if (chunksProcessed === 3) {
          controller.abort();
        }
      }
      fail('Should have thrown AbortError');
    } catch (error: any) {
      expect(error.name).toBe('AbortError');
      expect(chunksProcessed).toBe(3);
    }
  });

  it('should throw AbortError on cancel', async () => {
    const data = StreamTestUtils.generateRandomData(5 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const controller = new AbortController();
    controller.abort();

    try {
      for await (const chunk of stream.encryptStream(source, publicKey, {
        signal: controller.signal,
      })) {
        fail('Should not process any chunks');
      }
      fail('Should have thrown AbortError');
    } catch (error: any) {
      expect(error.name).toBe('AbortError');
      expect(error.message).toContain('cancel');
    }
  });

  it('should handle cancellation before first chunk', async () => {
    const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const controller = new AbortController();
    controller.abort();

    let chunksProcessed = 0;

    try {
      for await (const chunk of stream.encryptStream(source, publicKey, {
        signal: controller.signal,
      })) {
        chunksProcessed++;
      }
      fail('Should have thrown AbortError');
    } catch (error: any) {
      expect(error.name).toBe('AbortError');
      expect(chunksProcessed).toBe(0);
    }
  });
});
