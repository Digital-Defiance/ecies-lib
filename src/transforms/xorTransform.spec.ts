import { arraysEqual } from '../utils';
import { XorTransform } from './xorTransform';

describe('XorTransform', () => {
  const xorChunksManually = (chunks: Uint8Array[]): Uint8Array => {
    const xorResult = new Uint8Array(chunks[0].length);
    chunks.forEach((chunk) => {
      for (let i = 0; i < chunk.length; i++) {
        xorResult[i] ^= chunk[i];
      }
    });
    return xorResult;
  };

  const processStream = async (
    transform: XorTransform,
    chunks: Uint8Array[],
  ): Promise<Uint8Array> => {
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

    return results[0];
  };

  it('should apply XOR correctly for multiple chunks', async () => {
    const chunks = [
      new Uint8Array([0x01, 0x02, 0x03]),
      new Uint8Array([0x04, 0x05, 0x06]),
      new Uint8Array([0x07, 0x08, 0x09]),
    ];
    const expectedXorResult = xorChunksManually(chunks);
    const transform = new XorTransform();
    const result = await processStream(transform, chunks);

    expect(arraysEqual(result, expectedXorResult)).toBe(true);
  });

  it('should handle single chunk correctly', async () => {
    const chunk = new Uint8Array([0x01, 0x02, 0x03]);
    const transform = new XorTransform();
    const result = await processStream(transform, [chunk]);

    expect(arraysEqual(result, chunk)).toBe(true);
  });

  it('should handle different chunk sizes consistently', async () => {
    const chunks = [
      new Uint8Array([0x01, 0x02]),
      new Uint8Array([0x04, 0x05, 0x06]),
      new Uint8Array([0x07]),
    ];
    const expectedXorResult = xorChunksManually(chunks);
    const transform = new XorTransform();
    const result = await processStream(transform, chunks);

    expect(
      arraysEqual(
        result.subarray(0, expectedXorResult.length),
        expectedXorResult,
      ),
    ).toBe(true);
  });
});
