import * as CRC32 from 'crc-32';

/**
 * Service for computing and verifying CRC checksums.
 * Supports CRC8, CRC16-CCITT, and CRC32 algorithms.
 */
export class CrcService {
  /**
   * CRC8 lookup table.
   */
  private static readonly CRC8_TABLE = CrcService.generateCrc8Table();

  /**
   * CRC16-CCITT lookup table.
   */
  private static readonly CRC16_TABLE = CrcService.generateCrc16Table();

  /**
   * Generate CRC8 lookup table.
   * @returns The CRC8 lookup table
   */
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

  /**
   * Generate CRC16-CCITT lookup table.
   * @returns The CRC16 lookup table
   */
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

  /**
   * Compute CRC8 checksum.
   * @param data The data to checksum
   * @returns The CRC8 checksum (1 byte)
   */
  public crc8(data: Uint8Array): Uint8Array {
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
      crc = CrcService.CRC8_TABLE[crc ^ data[i]];
    }
    const result = new Uint8Array(1);
    result[0] = crc;
    return result;
  }

  /**
   * Compute CRC8 checksum asynchronously (supports streams).
   * @param input The data or stream to checksum
   * @returns The CRC8 checksum (1 byte)
   */
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

  /**
   * Verify CRC8 checksum.
   * @param data The data to verify
   * @param expectedCrc The expected CRC8 value
   * @returns True if checksum matches
   */
  public verifyCrc8(
    data: Uint8Array,
    expectedCrc: Uint8Array | number,
  ): boolean {
    const calculated = this.crc8(data);
    return typeof expectedCrc === 'number'
      ? calculated[0] === expectedCrc
      : calculated[0] === expectedCrc[0];
  }

  /**
   * Verify CRC8 checksum asynchronously.
   * @param data The data or stream to verify
   * @param expectedCrc8 The expected CRC8 value
   * @returns True if checksum matches
   */
  public async verifyCrc8Async(
    data: Uint8Array | ReadableStream<Uint8Array>,
    expectedCrc8: Uint8Array,
  ): Promise<boolean> {
    const calculated = await this.crc8Async(data);
    return calculated[0] === expectedCrc8[0];
  }

  /**
   * Compute CRC16-CCITT checksum.
   * @param data The data to checksum
   * @returns The CRC16 checksum (2 bytes)
   */
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

  /**
   * Compute CRC16-CCITT checksum asynchronously (supports streams).
   * @param input The data or stream to checksum
   * @returns The CRC16 checksum (2 bytes)
   */
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

  /**
   * Verify CRC16 checksum.
   * @param data The data to verify
   * @param expectedCrc The expected CRC16 value
   * @returns True if checksum matches
   */
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

  /**
   * Verify CRC16 checksum asynchronously.
   * @param data The data or stream to verify
   * @param expectedCrc16 The expected CRC16 value
   * @returns True if checksum matches
   */
  public async verifyCrc16Async(
    data: Uint8Array | ReadableStream<Uint8Array>,
    expectedCrc16: Uint8Array,
  ): Promise<boolean> {
    const calculated = await this.crc16Async(data);
    return (
      calculated[0] === expectedCrc16[0] && calculated[1] === expectedCrc16[1]
    );
  }

  /**
   * Compute CRC32 checksum.
   * @param data The data to checksum
   * @returns The CRC32 checksum (4 bytes)
   */
  public crc32(data: Uint8Array): Uint8Array {
    const crc = CRC32.buf(data) >>> 0;
    const result = new Uint8Array(4);
    new DataView(result.buffer).setUint32(0, crc, false);
    return result;
  }

  /**
   * Compute CRC32 checksum asynchronously (supports streams).
   * @param input The data or stream to checksum
   * @returns The CRC32 checksum (4 bytes)
   */
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

  /**
   * Verify CRC32 checksum.
   * @param data The data to verify
   * @param expectedCrc The expected CRC32 value
   * @returns True if checksum matches
   */
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

  /**
   * Verify CRC32 checksum asynchronously.
   * @param data The data or stream to verify
   * @param expectedCrc32 The expected CRC32 value
   * @returns True if checksum matches
   */
  public async verifyCrc32Async(
    data: Uint8Array | ReadableStream<Uint8Array>,
    expectedCrc32: Uint8Array,
  ): Promise<boolean> {
    const calculated = await this.crc32Async(data);
    return calculated.every((val, idx) => val === expectedCrc32[idx]);
  }
}
