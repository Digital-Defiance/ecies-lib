import * as CRC32 from 'crc-32';

export class CrcService {
  /**
   * CRC8 lookup table
   */
  private static readonly CRC8_TABLE = CrcService.generateCrc8Table();

  /**
   * CRC16-CCITT lookup table
   */
  private static readonly CRC16_TABLE = CrcService.generateCrc16Table();

  private static generateCrc8Table(): Uint8Array {
    const table = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let crc = i;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x80 ? (crc << 1) ^ 0x07 : crc << 1;
      }
      table[i] = crc & 0xff;
    }
    return table;
  }

  private static generateCrc16Table(): Uint16Array {
    const table = new Uint16Array(256);
    for (let i = 0; i < 256; i++) {
      let crc = i << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
      table[i] = crc & 0xffff;
    }
    return table;
  }

  public crc8(data: Uint8Array): Uint8Array {
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
      crc = CrcService.CRC8_TABLE[crc ^ data[i]];
    }
    const result = new Uint8Array(1);
    result[0] = crc;
    return result;
  }

  public async crc8Async(
    input: Uint8Array | ReadableStream<Uint8Array>,
  ): Promise<Uint8Array> {
    if (input instanceof Uint8Array) {
      return this.crc8(input);
    }

    const reader = input.getReader();
    let crc = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (let i = 0; i < value.length; i++) {
          crc = CrcService.CRC8_TABLE[crc ^ value[i]];
        }
      }
      const result = new Uint8Array(1);
      result[0] = crc;
      return result;
    } finally {
      reader.releaseLock();
    }
  }

  public verifyCrc8(
    data: Uint8Array,
    expectedCrc: Uint8Array | number,
  ): boolean {
    const calculated = this.crc8(data);
    return typeof expectedCrc === 'number'
      ? calculated[0] === expectedCrc
      : calculated[0] === expectedCrc[0];
  }

  public async verifyCrc8Async(
    data: Uint8Array | ReadableStream<Uint8Array>,
    expectedCrc8: Uint8Array,
  ): Promise<boolean> {
    const calculated = await this.crc8Async(data);
    return calculated[0] === expectedCrc8[0];
  }

  public crc16(data: Uint8Array): Uint8Array {
    let crc = 0xffff;
    for (let i = 0; i < data.length; i++) {
      crc =
        ((crc << 8) ^ CrcService.CRC16_TABLE[((crc >> 8) ^ data[i]) & 0xff]) &
        0xffff;
    }
    const result = new Uint8Array(2);
    new DataView(result.buffer).setUint16(0, crc, false);
    return result;
  }

  public async crc16Async(
    input: Uint8Array | ReadableStream<Uint8Array>,
  ): Promise<Uint8Array> {
    if (input instanceof Uint8Array) {
      return this.crc16(input);
    }

    const reader = input.getReader();
    let crc = 0xffff;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (let i = 0; i < value.length; i++) {
          crc =
            ((crc << 8) ^
              CrcService.CRC16_TABLE[((crc >> 8) ^ value[i]) & 0xff]) &
            0xffff;
        }
      }
      const result = new Uint8Array(2);
      new DataView(result.buffer).setUint16(0, crc, false);
      return result;
    } finally {
      reader.releaseLock();
    }
  }

  public verifyCrc16(
    data: Uint8Array,
    expectedCrc: Uint8Array | number,
  ): boolean {
    const calculated = this.crc16(data);
    if (typeof expectedCrc === 'number') {
      return (
        new DataView(calculated.buffer).getUint16(0, false) === expectedCrc
      );
    }
    return calculated[0] === expectedCrc[0] && calculated[1] === expectedCrc[1];
  }

  public async verifyCrc16Async(
    data: Uint8Array | ReadableStream<Uint8Array>,
    expectedCrc16: Uint8Array,
  ): Promise<boolean> {
    const calculated = await this.crc16Async(data);
    return (
      calculated[0] === expectedCrc16[0] && calculated[1] === expectedCrc16[1]
    );
  }

  public crc32(data: Uint8Array): Uint8Array {
    const crc = CRC32.buf(data) >>> 0;
    const result = new Uint8Array(4);
    new DataView(result.buffer).setUint32(0, crc, false);
    return result;
  }

  public async crc32Async(
    input: Uint8Array | ReadableStream<Uint8Array>,
  ): Promise<Uint8Array> {
    if (input instanceof Uint8Array) {
      return this.crc32(input);
    }

    const reader = input.getReader();
    const chunks: Uint8Array[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const fullBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        fullBuffer.set(chunk, offset);
        offset += chunk.length;
      }
      return this.crc32(fullBuffer);
    } finally {
      reader.releaseLock();
    }
  }

  public verifyCrc32(
    data: Uint8Array,
    expectedCrc: Uint8Array | number,
  ): boolean {
    const calculated = this.crc32(data);
    if (typeof expectedCrc === 'number') {
      const calculatedValue = new DataView(calculated.buffer).getUint32(
        0,
        false,
      );
      return calculatedValue === expectedCrc >>> 0;
    }
    return calculated.every((val, idx) => val === expectedCrc[idx]);
  }

  public async verifyCrc32Async(
    data: Uint8Array | ReadableStream<Uint8Array>,
    expectedCrc32: Uint8Array,
  ): Promise<boolean> {
    const calculated = await this.crc32Async(data);
    return calculated.every((val, idx) => val === expectedCrc32[idx]);
  }
}
