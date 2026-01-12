import { sha3_512 } from 'js-sha3';

export class ChecksumTransform implements Transformer<Uint8Array, Uint8Array> {
  private sha3 = sha3_512.create();
  private checksumCallback?: (checksum: Uint8Array) => void;

  constructor(onChecksum?: (checksum: Uint8Array) => void) {
    this.checksumCallback = onChecksum;
  }

  transform(
    chunk: Uint8Array,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    this.sha3.update(chunk);
    controller.enqueue(chunk);
  }

  flush(_controller?: TransformStreamDefaultController<Uint8Array>) {
    const checksum = Uint8Array.from(this.sha3.digest());
    if (this.checksumCallback) {
      this.checksumCallback(checksum);
    }
  }
}
