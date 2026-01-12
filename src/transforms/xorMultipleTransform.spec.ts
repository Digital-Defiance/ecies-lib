import { Buffer } from '../lib/buffer-compat';
import { XorMultipleTransform } from './xorMultipleTransform';

describe('XorMultipleTransform', () => {
  function bufferFromText(text: string): Uint8Array {
    return new TextEncoder().encode(text);
  }

  function createMockStream(data: string): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(bufferFromText(data));
        controller.close();
      },
    });
  }

  function xorBufferArrays(arrays: Uint8Array[]): Uint8Array {
    const result = Buffer.alloc(arrays[0].length);
    for (let i = 0; i < arrays[0].length; i++) {
      result[i] = arrays.reduce((acc, array) => acc ^ array[i], 0);
    }
    return result;
  }

  test('XORs data from multiple streams correctly', async () => {
    const input1 = createMockStream('Hello');
    const input2 = createMockStream('World');

    const xorTransform = new XorMultipleTransform([input1, input2]);
    const stream = new TransformStream(xorTransform);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.close();

    const chunks: Uint8Array[] = [];
    let result;
    while (!(result = await reader.read()).done) {
      chunks.push(result.value);
    }

    const expectedResult = xorBufferArrays([
      bufferFromText('Hello'),
      bufferFromText('World'),
    ]);
    const finalResult = Buffer.from(chunks[0]);
    expect(Buffer.compare(finalResult, expectedResult)).toBe(0);
  });

  test('Handles streams of different lengths', async () => {
    const input1 = createMockStream('Short');
    const input2 = createMockStream('A bit longer');

    const xorTransform = new XorMultipleTransform([input1, input2]);
    const stream = new TransformStream(xorTransform);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.close();

    const chunks: Uint8Array[] = [];
    let result;
    while (!(result = await reader.read()).done) {
      chunks.push(result.value);
    }

    const expectedResult = xorBufferArrays([
      bufferFromText('Short'),
      bufferFromText('A bit longer'),
    ]);
    const finalResult = Buffer.from(chunks[0]);
    expect(Buffer.compare(finalResult, expectedResult)).toBe(0);
  });
});
