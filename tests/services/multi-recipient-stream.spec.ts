import { ECIESService } from '../../src/services/ecies/service';
import { EncryptionStream } from '../../src/services/encryption-stream';
import { StreamTestUtils } from '../support/stream-test-utils';
import { Constants } from '../../src/constants';

describe('Multi-Recipient Streaming (Phase 4)', () => {
  let ecies: ECIESService;
  let stream: EncryptionStream;

  beforeEach(() => {
    ecies = new ECIESService();
    stream = new EncryptionStream(ecies);
  });

  it('should encrypt for single recipient', async () => {
    const mnemonic = ecies.generateNewMnemonic();
    const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
    
    const id = Constants.idProvider.generate();
    const recipients = [
      { id, publicKey: keyPair.publicKey },
    ];

    const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const chunks = [];
    for await (const chunk of stream.encryptStreamMultiple(source, recipients)) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBe(2);
  });

  it('should encrypt for multiple recipients', async () => {
    const recipients = [];
    for (let i = 0; i < 3; i++) {
      const mnemonic = ecies.generateNewMnemonic();
      const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
      const id = Constants.idProvider.generate();
      recipients.push({
        id,
        publicKey: keyPair.publicKey,
      });
    }

    const data = StreamTestUtils.generateRandomData(2 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    const chunks = [];
    for await (const chunk of stream.encryptStreamMultiple(source, recipients)) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBe(2);
  });

  it('should reject empty recipients', async () => {
    const data = StreamTestUtils.generateRandomData(1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    await expect(async () => {
      for await (const chunk of stream.encryptStreamMultiple(source, [])) {
        // Should throw
      }
    }).rejects.toThrow('At least one recipient required');
  });

  it('should reject too many recipients', async () => {
    const recipients: { id: Uint8Array; publicKey: Uint8Array }[] = [];
    for (let i = 0; i < 65536; i++) {
      const id = Constants.idProvider.generate();
      recipients.push({
        id,
        publicKey: new Uint8Array(33),
      });
    }

    const data = StreamTestUtils.generateRandomData(1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    await expect(async () => {
      for await (const chunk of stream.encryptStreamMultiple(source, recipients)) {
        // Should throw
      }
    }).rejects.toThrow('Maximum 65535 recipients');
  });

  it('should support progress callbacks', async () => {
    const mnemonic = ecies.generateNewMnemonic();
    const keyPair = ecies.mnemonicToSimpleKeyPair(mnemonic);
    
    const id = Constants.idProvider.generate();
    const recipients = [
      { id, publicKey: keyPair.publicKey },
    ];

    const data = StreamTestUtils.generateRandomData(3 * 1024 * 1024);
    const source = StreamTestUtils.createAsyncIterable(data, 1024 * 1024);

    let progressCount = 0;
    for await (const chunk of stream.encryptStreamMultiple(source, recipients, {
      onProgress: () => {
        progressCount++;
      },
    })) {
      // Process
    }

    expect(progressCount).toBe(3);
  });
});
