import { sha3_512 } from 'js-sha3';

/**
 * Transform stream for calculating SHA3-512 checksums.
 * Passes data through while computing a checksum, invoking a callback when complete.
 */
export class ChecksumTransform implements Transformer<Uint8Array, Uint8Array> {
  private sha3 = sha3_512.create();
  private checksumCallback?: (checksum: Uint8Array) => void;

  /**
   * Creates a new checksum transform.
   * @param onChecksum Optional callback invoked with the final checksum
   */
  constructor(onChecksum?: (checksum: Uint8Array) => void) {
    this.checksumCallback = onChecksum;
  }

  /**
   * Processes a chunk of data, updating the checksum and passing data through.
   * @param chunk The data chunk to process
   * @param controller The transform stream controller
   */
  transform(
    chunk: Uint8Array,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    this.sha3.update(chunk);
    controller.enqueue(chunk);
  }

  /**
   * Finalizes the checksum and invokes the callback.
   * @param _controller The transform stream controller
   */
  flush(_controller?: TransformStreamDefaultController<Uint8Array>) {
    const checksum = Uint8Array.from(this.sha3.digest());
    if (this.checksumCallback) {
      this.checksumCallback(checksum);
    }
  }
}
