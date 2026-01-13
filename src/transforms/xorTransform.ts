/**
 * Transform stream for XOR operations on data chunks.
 * Accumulates XOR of all chunks and outputs the result on flush.
 */
export class XorTransform implements Transformer<Uint8Array, Uint8Array> {
  private firstChunk = true;
  private xorChunk = new Uint8Array(0);

  /**
   * Processes a chunk by XORing it with the accumulated result.
   * @param chunk The data chunk to XOR
   * @param _controller The transform stream controller
   */
  transform(
    chunk: Uint8Array,
    _controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    if (this.firstChunk) {
      this.xorChunk = new Uint8Array(chunk);
      this.firstChunk = false;
    } else {
      for (let i = 0; i < chunk.length; i++) {
        this.xorChunk[i] ^= chunk[i];
      }
    }
  }

  /**
   * Outputs the final XOR result.
   * @param controller The transform stream controller
   */
  flush(controller: TransformStreamDefaultController<Uint8Array>) {
    controller.enqueue(this.xorChunk);
  }
}
