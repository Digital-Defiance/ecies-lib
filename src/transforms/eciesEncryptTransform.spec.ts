import { SecureString } from '../secure-string';
import { ECIESService } from '../services/ecies';
import { EciesEncryptTransform } from './eciesEncryptTransform';

describe('EciesEncryptTransform Unit Tests', () => {
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
    transform: EciesEncryptTransform,
    chunks: Uint8Array[],
  ): Promise<Uint8Array[]> => {
    const stream = new TransformStream(transform);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    (async () => {
      for (const chunk of chunks) {
        await writer.write(chunk);
      }
      await writer.close();
    })();

    const results: Uint8Array[] = [];
    let result;
    while (!(result = await reader.read()).done) {
      results.push(result.value);
    }
    return results;
  };

  it('should be instantiated with correct parameters', () => {
    const transform = new EciesEncryptTransform(
      eciesService,
      blockSize,
      keypair.publicKey,
    );
    expect(transform).toBeDefined();
  });

  it('should handle empty input', async () => {
    const transform = new EciesEncryptTransform(
      eciesService,
      blockSize,
      keypair.publicKey,
    );
    const chunks = await processStream(transform, []);
    expect(chunks.length).toBe(0);
  });

  it('should encrypt input data', async () => {
    const transform = new EciesEncryptTransform(
      eciesService,
      blockSize,
      keypair.publicKey,
    );
    const inputBuffer = crypto.getRandomValues(new Uint8Array(100));
    const chunks = await processStream(transform, [inputBuffer]);

    expect(chunks.length).toBe(1);
    const encryptedData = chunks[0];

    const decryptedData = await eciesService.decryptBasicWithHeader(
      keypair.privateKey,
      encryptedData,
    );
    expect(decryptedData).toEqual(inputBuffer);
  });

  it('should handle streaming input', async () => {
    const transform = new EciesEncryptTransform(
      eciesService,
      blockSize,
      keypair.publicKey,
    );
    const inputBuffer = crypto.getRandomValues(new Uint8Array(1000));

    const inputChunks = [
      inputBuffer.subarray(0, 300),
      inputBuffer.subarray(300, 700),
      inputBuffer.subarray(700),
    ];

    const chunks = await processStream(transform, inputChunks);
    expect(chunks.length).toBeGreaterThan(0);

    const decryptedChunks = await Promise.all(
      chunks.map((encryptedBlock) =>
        eciesService.decryptBasicWithHeader(keypair.privateKey, encryptedBlock),
      ),
    );
    const decryptedData = new Uint8Array([
      ...decryptedChunks.flatMap((c) => Array.from(c)),
    ]);
    expect(decryptedData).toEqual(inputBuffer);
  });

  it('should throw error with invalid public key', () => {
    const invalidKeyBuffer = crypto.getRandomValues(new Uint8Array(32));

    expect(() => {
      new EciesEncryptTransform(eciesService, blockSize, invalidKeyBuffer);
    }).toThrow('Invalid public key length');
  });
});
