import { sha3_512 } from 'js-sha3';
import { ChecksumTransform } from './checksumTransform';

describe('ChecksumTransform', () => {
  const testData = new Uint8Array(62);
  const testString =
    'This is a test data buffer to validate checksum consistency.';
  for (let i = 0; i < testString.length; i++) {
    testData[i] = testString.charCodeAt(i);
  }
  const testBuffer = testData;

  const calculateChecksumDirectly = (data: Uint8Array): Uint8Array => {
    return Uint8Array.from(sha3_512.create().update(data).digest());
  };

  const processStream = (
    transform: ChecksumTransform,
    chunks: Uint8Array[],
  ): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      let checksum: Uint8Array | undefined;
      const transformWithCallback = new ChecksumTransform((c) => {
        checksum = c;
      });

      const stream = new TransformStream(transformWithCallback);
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      // Start reading in parallel
      const readPromise = (async () => {
        try {
          while (!(await reader.read()).done) {
            // drain the stream
          }
        } catch (err) {
          reject(err);
        }
      })();

      try {
        for (const chunk of chunks) {
          await writer.write(chunk);
        }
        await writer.close();
        await readPromise;
        resolve(checksum!);
      } catch (err) {
        reject(err);
      }
    });
  };

  it('should produce the same checksum for multiple chunks as for the whole buffer', async () => {
    const chunkSize = 10;
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < testBuffer.length; i += chunkSize) {
      chunks.push(testBuffer.subarray(i, i + chunkSize));
    }

    const expectedChecksum = calculateChecksumDirectly(testBuffer);
    const checksum = await processStream(new ChecksumTransform(), chunks);

    expect(checksum).toEqual(expectedChecksum);
  });

  it('should produce the same checksum for a single large chunk', async () => {
    const expectedChecksum = calculateChecksumDirectly(testBuffer);
    const checksum = await processStream(new ChecksumTransform(), [testBuffer]);

    expect(checksum).toEqual(expectedChecksum);
  });

  it('should handle different chunk sizes consistently', async () => {
    const chunkSizes = [5, 15, 25];
    const expectedChecksum = calculateChecksumDirectly(testBuffer);

    for (const size of chunkSizes) {
      const chunks: Uint8Array[] = [];
      for (let i = 0; i < testBuffer.length; i += size) {
        chunks.push(testBuffer.subarray(i, i + size));
      }

      const checksum = await processStream(new ChecksumTransform(), chunks);
      expect(checksum).toEqual(expectedChecksum);
    }
  });
});
