export class XorTransform implements Transformer<Uint8Array, Uint8Array> {
  private firstChunk = true;
  private xorChunk = new Uint8Array(0);

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

  flush(controller: TransformStreamDefaultController<Uint8Array>) {
    controller.enqueue(this.xorChunk);
  }
}
