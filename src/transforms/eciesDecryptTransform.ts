import { ECIESService } from '../services/ecies';

export class EciesDecryptTransform implements Transformer<
  Uint8Array,
  Uint8Array
> {
  private readonly blockSize: number;
  private readonly privateKey: Uint8Array;
  private buffer = new Uint8Array(0);
  private readonly eciesService: ECIESService;

  constructor(
    eciesService: ECIESService,
    privateKey: Uint8Array,
    blockSize: number,
  ) {
    this.privateKey = privateKey;
    this.blockSize = blockSize;
    this.eciesService = eciesService;
  }

  async transform(
    chunk: Uint8Array,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    if (chunk.length === 0) return;

    const newBuffer = new Uint8Array(this.buffer.length + chunk.length);
    newBuffer.set(this.buffer);
    newBuffer.set(chunk, this.buffer.length);
    this.buffer = newBuffer;

    while (this.buffer.length >= this.blockSize) {
      const encryptedBlock = this.buffer.subarray(0, this.blockSize);
      this.buffer = this.buffer.subarray(this.blockSize);

      const decryptedBlock =
        await this.eciesService.decryptSimpleOrSingleWithHeader(
          true,
          this.privateKey,
          encryptedBlock,
        );
      controller.enqueue(decryptedBlock);
    }
  }

  async flush(controller: TransformStreamDefaultController<Uint8Array>) {
    if (this.buffer.length > 0) {
      try {
        const decryptedBlock =
          await this.eciesService.decryptSimpleOrSingleWithHeader(
            true,
            this.privateKey,
            this.buffer,
          );
        controller.enqueue(decryptedBlock);
      } catch (err) {
        controller.error(err);
        throw err;
      }
    }
  }
}
