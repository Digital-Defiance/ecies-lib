export class XorMultipleTransform implements Transformer<
  Uint8Array,
  Uint8Array
> {
  private sources: ReadableStream<Uint8Array>[];
  private readers: ReadableStreamDefaultReader<Uint8Array>[];
  private buffers: Uint8Array[];
  private streamEnded: boolean[];

  constructor(sources: ReadableStream<Uint8Array>[]) {
    this.sources = sources;
    this.readers = sources.map((s) => s.getReader());
    this.buffers = new Array<Uint8Array>(sources.length).fill(
      null as unknown as Uint8Array,
    );
    this.streamEnded = new Array<boolean>(sources.length).fill(false);
  }

  async transform(
    _chunk: Uint8Array,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    await this.processData(controller);
  }

  async flush(controller: TransformStreamDefaultController<Uint8Array>) {
    await this.processData(controller);
  }

  private async processData(
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    for (let i = 0; i < this.readers.length; i++) {
      if (!this.buffers[i] && !this.streamEnded[i]) {
        const { value, done } = await this.readers[i].read();
        if (done) {
          this.streamEnded[i] = true;
        } else {
          this.buffers[i] = value;
        }
      }
    }

    if (
      this.buffers.every(
        (buffer, index) => buffer !== null || this.streamEnded[index],
      )
    ) {
      const minLength = Math.min(
        ...this.buffers.map((buffer, index) =>
          this.streamEnded[index] ? Infinity : (buffer?.length ?? Infinity),
        ),
      );

      if (minLength === 0 || minLength === Infinity) return;

      const xorResult = new Uint8Array(minLength);
      for (let i = 0; i < minLength; i++) {
        xorResult[i] = this.buffers.reduce(
          (acc, buffer, index) =>
            this.streamEnded[index] ? acc : acc ^ buffer[i],
          0,
        );
      }

      controller.enqueue(xorResult);

      this.buffers = this.buffers.map((buffer, index) =>
        this.streamEnded[index] ? buffer : buffer.subarray(minLength),
      );
    }
  }
}
