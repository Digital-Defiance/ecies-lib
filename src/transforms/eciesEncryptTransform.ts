import { ECIESService } from '../services/ecies';

export class EciesEncryptTransform implements Transformer<
  Uint8Array,
  Uint8Array
> {
  private readonly blockSize: number;
  private readonly receiverPublicKey: Uint8Array;
  private buffer = new Uint8Array(0);
  private readonly capacityPerBlock: number;
  private readonly eciesService: ECIESService;

  constructor(
    eciesService: ECIESService,
    blockSize: number,
    receiverPublicKey: Uint8Array,
  ) {
    this.blockSize = blockSize;
    if (receiverPublicKey.length !== 33 && receiverPublicKey.length !== 65) {
      throw new Error(
        `Invalid public key length: expected 33 or 65 bytes, got ${receiverPublicKey.length}`,
      );
    }
    this.receiverPublicKey = receiverPublicKey;
    this.eciesService = eciesService;

    const encryptedLength =
      this.eciesService.computeEncryptedLengthFromDataLength(
        this.blockSize,
        'simple',
      );
    this.capacityPerBlock = this.blockSize - (encryptedLength - this.blockSize);
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

    while (this.buffer.length >= this.capacityPerBlock) {
      const blockData = this.buffer.subarray(0, this.capacityPerBlock);
      this.buffer = this.buffer.subarray(this.capacityPerBlock);

      const encryptedBlock = await this.eciesService.encryptSimpleOrSingle(
        true,
        this.receiverPublicKey,
        blockData,
      );
      controller.enqueue(encryptedBlock);
    }
  }

  async flush(controller: TransformStreamDefaultController<Uint8Array>) {
    if (this.buffer.length > 0) {
      const encryptedBlock = await this.eciesService.encryptSimpleOrSingle(
        true,
        this.receiverPublicKey,
        this.buffer,
      );
      controller.enqueue(encryptedBlock);
    }
  }
}
