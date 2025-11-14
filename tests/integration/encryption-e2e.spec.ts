import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { StreamTestUtils } from '../support/stream-test-utils';

describe('EncryptionStream E2E', () => {
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

  it('should encrypt and decrypt 1MB file', async () => {
    const data = StreamTestUtils.generateRandomData(1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const encryptedChunks: Uint8Array[] = [];
    for await (const chunk of stream.encryptStream(source, publicKey)) {
      encryptedChunks.push(chunk.data);
    }

    const decryptedChunks = await StreamTestUtils.collectChunks(
      stream.decryptStream(
        (async function* () {
          for (const chunk of encryptedChunks) {
            yield chunk;
          }
        })(),
        privateKey
      )
    );

    const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
    expect(StreamTestUtils.arraysEqual(decrypted, data)).toBe(true);
  });

  it('should encrypt and decrypt 10MB file', async () => {
    const data = StreamTestUtils.generateRandomData(10 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const encryptedChunks: Uint8Array[] = [];
    for await (const chunk of stream.encryptStream(source, publicKey)) {
      encryptedChunks.push(chunk.data);
    }

    const decryptedChunks = await StreamTestUtils.collectChunks(
      stream.decryptStream(
        (async function* () {
          for (const chunk of encryptedChunks) {
            yield chunk;
          }
        })(),
        privateKey
      )
    );

    const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
    expect(StreamTestUtils.arraysEqual(decrypted, data)).toBe(true);
  });

  it('should handle empty file', async () => {
    const data = new Uint8Array(0);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const encryptedChunks: Uint8Array[] = [];
    for await (const chunk of stream.encryptStream(source, publicKey)) {
      encryptedChunks.push(chunk.data);
    }

    const decryptedChunks = await StreamTestUtils.collectChunks(
      stream.decryptStream(
        (async function* () {
          for (const chunk of encryptedChunks) {
            yield chunk;
          }
        })(),
        privateKey
      )
    );

    expect(decryptedChunks.length).toBe(0);
  });

  it('should handle single-byte file', async () => {
    const data = new Uint8Array([42]);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const encryptedChunks: Uint8Array[] = [];
    for await (const chunk of stream.encryptStream(source, publicKey)) {
      encryptedChunks.push(chunk.data);
    }

    const decryptedChunks = await StreamTestUtils.collectChunks(
      stream.decryptStream(
        (async function* () {
          for (const chunk of encryptedChunks) {
            yield chunk;
          }
        })(),
        privateKey
      )
    );

    const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
    expect(StreamTestUtils.arraysEqual(decrypted, data)).toBe(true);
  });

  it('should preserve binary data integrity', async () => {
    const data = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      data[i] = i;
    }
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const encryptedChunks: Uint8Array[] = [];
    for await (const chunk of stream.encryptStream(source, publicKey)) {
      encryptedChunks.push(chunk.data);
    }

    const decryptedChunks = await StreamTestUtils.collectChunks(
      stream.decryptStream(
        (async function* () {
          for (const chunk of encryptedChunks) {
            yield chunk;
          }
        })(),
        privateKey
      )
    );

    const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
    expect(StreamTestUtils.arraysEqual(decrypted, data)).toBe(true);
  });

  it('should work with text data', async () => {
    const text = 'Hello, World! 🌍 This is a test with Unicode: 你好世界';
    const data = new TextEncoder().encode(text);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const encryptedChunks: Uint8Array[] = [];
    for await (const chunk of stream.encryptStream(source, publicKey)) {
      encryptedChunks.push(chunk.data);
    }

    const decryptedChunks = await StreamTestUtils.collectChunks(
      stream.decryptStream(
        (async function* () {
          for (const chunk of encryptedChunks) {
            yield chunk;
          }
        })(),
        privateKey
      )
    );

    const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
    const decryptedText = new TextDecoder().decode(decrypted);
    expect(decryptedText).toBe(text);
  });

  it('should work with random data', async () => {
    const data = StreamTestUtils.generateRandomData(5 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const encryptedChunks: Uint8Array[] = [];
    for await (const chunk of stream.encryptStream(source, publicKey)) {
      encryptedChunks.push(chunk.data);
    }

    const decryptedChunks = await StreamTestUtils.collectChunks(
      stream.decryptStream(
        (async function* () {
          for (const chunk of encryptedChunks) {
            yield chunk;
          }
        })(),
        privateKey
      )
    );

    const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
    expect(StreamTestUtils.arraysEqual(decrypted, data)).toBe(true);
  });

  it('should handle multiple chunks correctly', async () => {
    const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    let chunkCount = 0;
    const encryptedChunks: Uint8Array[] = [];
    for await (const chunk of stream.encryptStream(source, publicKey)) {
      chunkCount++;
      encryptedChunks.push(chunk.data);
    }

    expect(chunkCount).toBe(3);

    const decryptedChunks = await StreamTestUtils.collectChunks(
      stream.decryptStream(
        (async function* () {
          for (const chunk of encryptedChunks) {
            yield chunk;
          }
        })(),
        privateKey
      )
    );

    const decrypted = StreamTestUtils.concatenateChunks(decryptedChunks);
    expect(StreamTestUtils.arraysEqual(decrypted, data)).toBe(true);
  });
});
