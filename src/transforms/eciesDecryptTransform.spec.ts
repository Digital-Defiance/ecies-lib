import { SecureString } from '../secure-string';
import { ECIESService } from '../services/ecies';
import { EciesDecryptTransform } from './eciesDecryptTransform';

describe('EciesDecryptTransform Unit Tests', () => {
  const blockSize = 1024;
  let eciesService: ECIESService;
  let mnemonic: SecureString;
  let keypair: { privateKey: Uint8Array; publicKey: Uint8Array };

  beforeEach(() => {
    eciesService = new ECIESService();
    mnemonic = eciesService.generateNewMnemonic();
    keypair = eciesService.mnemonicToSimpleKeyPair(mnemonic);
  });

  const processStream = async (
    transform: EciesDecryptTransform,
    chunks: Uint8Array[],
  ): Promise<Uint8Array[]> => {
    const stream = new TransformStream(transform);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    const results: Uint8Array[] = [];
    let readError: Error | undefined;
    const readPromise = (async () => {
      try {
        let result;
        while (!(result = await reader.read()).done) {
          results.push(result.value);
        }
      } catch (err) {
        readError = err as Error;
      }
    })();

    for (const chunk of chunks) {
      await writer.write(chunk);
    }
    await writer.close();
    await readPromise;

    if (readError) {
      throw readError;
    }

    return results;
  };

  it('should be instantiated with correct parameters', () => {
    const transform = new EciesDecryptTransform(
      eciesService,
      keypair.privateKey,
      blockSize,
    );
    expect(transform).toBeDefined();
  });

  it('should handle empty input', async () => {
    const transform = new EciesDecryptTransform(
      eciesService,
      keypair.privateKey,
      blockSize,
    );
    const chunks = await processStream(transform, []);
    expect(chunks.length).toBe(0);
  });

  it('should decrypt input data', async () => {
    const inputData = crypto.getRandomValues(new Uint8Array(100));
    const encryptedData = await eciesService.encryptBasic(
      keypair.publicKey,
      inputData,
    );

    const transform = new EciesDecryptTransform(
      eciesService,
      keypair.privateKey,
      blockSize,
    );
    const chunks = await processStream(transform, [encryptedData]);

    expect(chunks.length).toBe(1);
    const decryptedData = chunks[0];
    expect(decryptedData).toEqual(inputData);
  });

  it('should handle streaming input', async () => {
    const inputData1 = crypto.getRandomValues(new Uint8Array(500));
    const inputData2 = crypto.getRandomValues(new Uint8Array(500));
    const encryptedBlock1 = await eciesService.encryptBasic(
      keypair.publicKey,
      inputData1,
    );
    const encryptedBlock2 = await eciesService.encryptBasic(
      keypair.publicKey,
      inputData2,
    );

    const encryptedBlockSize = encryptedBlock1.length;
    const transform = new EciesDecryptTransform(
      eciesService,
      keypair.privateKey,
      encryptedBlockSize,
    );

    const chunks = await processStream(transform, [
      encryptedBlock1,
      encryptedBlock2,
    ]);

    const decryptedData = new Uint8Array([
      ...chunks.flatMap((c) => Array.from(c)),
    ]);
    const expectedData = new Uint8Array([
      ...Array.from(inputData1),
      ...Array.from(inputData2),
    ]);
    expect(decryptedData).toEqual(expectedData);
  });

  it('should throw error with invalid private key', async () => {
    const invalidPrivateKey = crypto.getRandomValues(new Uint8Array(32));
    const inputData = crypto.getRandomValues(new Uint8Array(100));
    const encryptedData = await eciesService.encryptBasic(
      keypair.publicKey,
      inputData,
    );

    const transform = new EciesDecryptTransform(
      eciesService,
      invalidPrivateKey,
      encryptedData.length,
    );

    await expect(processStream(transform, [encryptedData])).rejects.toThrow();
  });

  it('should throw error with corrupted encrypted data', async () => {
    const transform = new EciesDecryptTransform(
      eciesService,
      keypair.privateKey,
      blockSize,
    );
    const corruptedData = crypto.getRandomValues(new Uint8Array(200));

    await expect(processStream(transform, [corruptedData])).rejects.toThrow();
  });
});
