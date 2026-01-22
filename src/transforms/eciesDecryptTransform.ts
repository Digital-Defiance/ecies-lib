import { ECIESService } from '../services/ecies';

/**
 * Transform stream for ECIES decryption.
 * Buffers and decrypts data in blocks.
 */
export class EciesDecryptTransform implements Transformer<
  Uint8Array,
  Uint8Array
> {
  private readonly blockSize: number;
  private readonly privateKey: Uint8Array;
  private buffer = new Uint8Array(0);
  private readonly eciesService: ECIESService;

  /**
   * Create a new ECIES decrypt transform.
   * @param eciesService The ECIES service instance
   * @param privateKey The private key for decryption
   * @param blockSize The block size for buffering
   */
  constructor(
    eciesService: ECIESService,
    privateKey: Uint8Array,
    blockSize: number,
  ) {
    this.privateKey = privateKey;
    this.blockSize = blockSize;
    this.eciesService = eciesService;
  }

  /**
   * Transform a chunk of data by buffering and decrypting complete blocks.
   * @param chunk The input chunk
   * @param controller The transform stream controller
   */
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

      const decryptedBlock = await this.eciesService.decryptBasicWithHeader(
        this.privateKey,
        encryptedBlock,
      );
      controller.enqueue(decryptedBlock);
    }
  }

  /**
   * Flush any remaining buffered data.
   * @param controller The transform stream controller
   */
  async flush(controller: TransformStreamDefaultController<Uint8Array>) {
    if (this.buffer.length > 0) {
      try {
        const decryptedBlock = await this.eciesService.decryptBasicWithHeader(
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
