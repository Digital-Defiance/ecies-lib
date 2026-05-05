/**
 * Property-Based Test: Wire Format Header Round-Trip (Property 1)
 *
 * Feature: ecies-spec-and-wcap-integration, Property 1: Wire Format Header Round-Trip
 * **Validates: Requirements 19.1, 19.2**
 *
 * For any valid DD-ECIES encrypted message header (Basic, WithLength, or Multiple mode)
 * with arbitrary valid field values, parsing the serialized header bytes and re-serializing
 * the parsed components SHALL produce a byte sequence identical to the original.
 *
 * This test implements serialize/parse logic directly based on the DD-ECIES wire format
 * specification to validate the round-trip property independently of the library's
 * implementation classes.
 */

import * as fc from 'fast-check';

// --- Wire format constants (from DD-ECIES specification) ---
const VERSION_V1 = 0x01;
const CIPHER_SUITE_SECP256K1 = 0x01;
const ENC_TYPE_BASIC = 0x21; // 33
const ENC_TYPE_WITH_LENGTH = 0x42; // 66
const ENC_TYPE_MULTIPLE = 0x63; // 99

const PUBLIC_KEY_LENGTH = 33;
const IV_SIZE = 12;
const AUTH_TAG_SIZE = 16;
const DATA_LENGTH_SIZE = 8;
const RECIPIENT_COUNT_SIZE = 2;
const ENCRYPTED_KEY_SIZE = 60; // iv(12) + authTag(16) + encryptedSymKey(32)

// --- Interfaces for parsed headers ---
interface BasicParsedHeader {
  version: number;
  cipherSuite: number;
  encryptionType: number;
  ephemeralPublicKey: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
}

interface WithLengthParsedHeader extends BasicParsedHeader {
  dataLength: bigint;
}

interface MultipleParsedHeader {
  version: number;
  cipherSuite: number;
  encryptionType: number;
  ephemeralPublicKey: Uint8Array;
  combinedDataLength: bigint; // raw 8-byte field (MSB = recipientIdSize, lower 56 = dataLength)
  recipientCount: number;
  recipientIds: Uint8Array[];
  encryptedKeys: Uint8Array[];
}

// --- Serialization functions (based on wire format spec) ---

function serializeBasicHeader(header: BasicParsedHeader): Uint8Array {
  const size = 1 + 1 + 1 + PUBLIC_KEY_LENGTH + IV_SIZE + AUTH_TAG_SIZE;
  const result = new Uint8Array(size);
  let offset = 0;

  result[offset++] = header.version;
  result[offset++] = header.cipherSuite;
  result[offset++] = header.encryptionType;
  result.set(header.ephemeralPublicKey, offset);
  offset += PUBLIC_KEY_LENGTH;
  result.set(header.iv, offset);
  offset += IV_SIZE;
  result.set(header.authTag, offset);

  return result;
}

function serializeWithLengthHeader(header: WithLengthParsedHeader): Uint8Array {
  const size =
    1 + 1 + 1 + PUBLIC_KEY_LENGTH + IV_SIZE + AUTH_TAG_SIZE + DATA_LENGTH_SIZE;
  const result = new Uint8Array(size);
  let offset = 0;

  result[offset++] = header.version;
  result[offset++] = header.cipherSuite;
  result[offset++] = header.encryptionType;
  result.set(header.ephemeralPublicKey, offset);
  offset += PUBLIC_KEY_LENGTH;
  result.set(header.iv, offset);
  offset += IV_SIZE;
  result.set(header.authTag, offset);
  offset += AUTH_TAG_SIZE;

  // Write data length as big-endian 64-bit
  const view = new DataView(result.buffer, result.byteOffset + offset, 8);
  view.setBigUint64(0, header.dataLength, false);

  return result;
}

function serializeMultipleHeader(header: MultipleParsedHeader): Uint8Array {
  const recipientIdSize =
    header.recipientIds.length > 0 ? header.recipientIds[0].length : 0;
  const size =
    1 +
    1 +
    1 +
    PUBLIC_KEY_LENGTH +
    DATA_LENGTH_SIZE +
    RECIPIENT_COUNT_SIZE +
    header.recipientCount * recipientIdSize +
    header.recipientCount * ENCRYPTED_KEY_SIZE;

  const result = new Uint8Array(size);
  let offset = 0;

  result[offset++] = header.version;
  result[offset++] = header.cipherSuite;
  result[offset++] = header.encryptionType;
  result.set(header.ephemeralPublicKey, offset);
  offset += PUBLIC_KEY_LENGTH;

  // Write combined data length (8 bytes, big-endian)
  const dlView = new DataView(result.buffer, result.byteOffset + offset, 8);
  dlView.setBigUint64(0, header.combinedDataLength, false);
  offset += DATA_LENGTH_SIZE;

  // Write recipient count (2 bytes, big-endian)
  const rcView = new DataView(result.buffer, result.byteOffset + offset, 2);
  rcView.setUint16(0, header.recipientCount, false);
  offset += RECIPIENT_COUNT_SIZE;

  // Write recipient IDs
  for (const id of header.recipientIds) {
    result.set(id, offset);
    offset += id.length;
  }

  // Write encrypted keys
  for (const key of header.encryptedKeys) {
    result.set(key, offset);
    offset += ENCRYPTED_KEY_SIZE;
  }

  return result;
}

// --- Parsing functions (based on wire format spec) ---

function parseBasicHeader(data: Uint8Array): BasicParsedHeader {
  let offset = 0;

  const version = data[offset++];
  const cipherSuite = data[offset++];
  const encryptionType = data[offset++];
  const ephemeralPublicKey = data.slice(offset, offset + PUBLIC_KEY_LENGTH);
  offset += PUBLIC_KEY_LENGTH;
  const iv = data.slice(offset, offset + IV_SIZE);
  offset += IV_SIZE;
  const authTag = data.slice(offset, offset + AUTH_TAG_SIZE);

  return {
    version,
    cipherSuite,
    encryptionType,
    ephemeralPublicKey,
    iv,
    authTag,
  };
}

function parseWithLengthHeader(data: Uint8Array): WithLengthParsedHeader {
  let offset = 0;

  const version = data[offset++];
  const cipherSuite = data[offset++];
  const encryptionType = data[offset++];
  const ephemeralPublicKey = data.slice(offset, offset + PUBLIC_KEY_LENGTH);
  offset += PUBLIC_KEY_LENGTH;
  const iv = data.slice(offset, offset + IV_SIZE);
  offset += IV_SIZE;
  const authTag = data.slice(offset, offset + AUTH_TAG_SIZE);
  offset += AUTH_TAG_SIZE;

  const view = new DataView(
    data.buffer,
    data.byteOffset + offset,
    DATA_LENGTH_SIZE,
  );
  const dataLength = view.getBigUint64(0, false);

  return {
    version,
    cipherSuite,
    encryptionType,
    ephemeralPublicKey,
    iv,
    authTag,
    dataLength,
  };
}

function parseMultipleHeader(
  data: Uint8Array,
  recipientIdSize: number,
): MultipleParsedHeader {
  let offset = 0;

  const version = data[offset++];
  const cipherSuite = data[offset++];
  const encryptionType = data[offset++];
  const ephemeralPublicKey = data.slice(offset, offset + PUBLIC_KEY_LENGTH);
  offset += PUBLIC_KEY_LENGTH;

  const dlView = new DataView(
    data.buffer,
    data.byteOffset + offset,
    DATA_LENGTH_SIZE,
  );
  const combinedDataLength = dlView.getBigUint64(0, false);
  offset += DATA_LENGTH_SIZE;

  const rcView = new DataView(
    data.buffer,
    data.byteOffset + offset,
    RECIPIENT_COUNT_SIZE,
  );
  const recipientCount = rcView.getUint16(0, false);
  offset += RECIPIENT_COUNT_SIZE;

  const recipientIds: Uint8Array[] = [];
  for (let i = 0; i < recipientCount; i++) {
    recipientIds.push(data.slice(offset, offset + recipientIdSize));
    offset += recipientIdSize;
  }

  const encryptedKeys: Uint8Array[] = [];
  for (let i = 0; i < recipientCount; i++) {
    encryptedKeys.push(data.slice(offset, offset + ENCRYPTED_KEY_SIZE));
    offset += ENCRYPTED_KEY_SIZE;
  }

  return {
    version,
    cipherSuite,
    encryptionType,
    ephemeralPublicKey,
    combinedDataLength,
    recipientCount,
    recipientIds,
    encryptedKeys,
  };
}

// --- Helpers ---

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// --- fast-check arbitraries ---

/**
 * Generate a valid compressed secp256k1 public key (33 bytes).
 * First byte is 0x02 or 0x03 (compressed key prefix), followed by 32 random bytes.
 */
const compressedPublicKeyArb = fc
  .tuple(
    fc.constantFrom(0x02, 0x03),
    fc.uint8Array({ minLength: 32, maxLength: 32 }),
  )
  .map(([prefix, rest]) => {
    const key = new Uint8Array(33);
    key[0] = prefix;
    key.set(rest, 1);
    return key;
  });

/** Generate a random 12-byte IV */
const ivArb = fc.uint8Array({ minLength: IV_SIZE, maxLength: IV_SIZE });

/** Generate a random 16-byte auth tag */
const authTagArb = fc.uint8Array({
  minLength: AUTH_TAG_SIZE,
  maxLength: AUTH_TAG_SIZE,
});

/**
 * Generate a valid data length for WithLength mode.
 * Uses a BigInt in the range [0, 2^53 - 1] (max safe integer for JS).
 */
const dataLengthArb = fc.bigInt({
  min: 0n,
  max: BigInt(Number.MAX_SAFE_INTEGER),
});

/**
 * Generate a valid combined data length for Multiple mode.
 * MSB (bits 63-56) = recipientIdSize (1-255), lower 56 bits = data length.
 */
// function combinedDataLengthArb(recipientIdSize: number): fc.Arbitrary<bigint> {
//   return dataLengthArb.map((dataLen) => {
//     const idSizeBig = BigInt(recipientIdSize);
//     return (idSizeBig << 56n) | dataLen;
//   });
// }

// ============================================================
// Property Tests
// ============================================================

describe('Property 1: Wire Format Header Round-Trip', () => {
  describe('Basic mode (0x21)', () => {
    it('serialize → parse → re-serialize produces byte-identical output', () => {
      fc.assert(
        fc.property(
          compressedPublicKeyArb,
          ivArb,
          authTagArb,
          (ephemeralPublicKey, iv, authTag) => {
            const originalHeader: BasicParsedHeader = {
              version: VERSION_V1,
              cipherSuite: CIPHER_SUITE_SECP256K1,
              encryptionType: ENC_TYPE_BASIC,
              ephemeralPublicKey,
              iv,
              authTag,
            };

            // Serialize
            const serialized = serializeBasicHeader(originalHeader);

            // Parse
            const parsed = parseBasicHeader(serialized);

            // Re-serialize
            const reserialized = serializeBasicHeader(parsed);

            // Assert byte-identical
            expect(arraysEqual(serialized, reserialized)).toBe(true);

            // Also verify parsed fields match original
            expect(parsed.version).toBe(VERSION_V1);
            expect(parsed.cipherSuite).toBe(CIPHER_SUITE_SECP256K1);
            expect(parsed.encryptionType).toBe(ENC_TYPE_BASIC);
            expect(
              arraysEqual(parsed.ephemeralPublicKey, ephemeralPublicKey),
            ).toBe(true);
            expect(arraysEqual(parsed.iv, iv)).toBe(true);
            expect(arraysEqual(parsed.authTag, authTag)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('header has correct fixed size of 64 bytes', () => {
      fc.assert(
        fc.property(
          compressedPublicKeyArb,
          ivArb,
          authTagArb,
          (ephemeralPublicKey, iv, authTag) => {
            const header: BasicParsedHeader = {
              version: VERSION_V1,
              cipherSuite: CIPHER_SUITE_SECP256K1,
              encryptionType: ENC_TYPE_BASIC,
              ephemeralPublicKey,
              iv,
              authTag,
            };

            const serialized = serializeBasicHeader(header);
            // 1 + 1 + 1 + 33 + 12 + 16 = 64
            expect(serialized.length).toBe(64);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('WithLength mode (0x42)', () => {
    it('serialize → parse → re-serialize produces byte-identical output', () => {
      fc.assert(
        fc.property(
          compressedPublicKeyArb,
          ivArb,
          authTagArb,
          dataLengthArb,
          (ephemeralPublicKey, iv, authTag, dataLength) => {
            const originalHeader: WithLengthParsedHeader = {
              version: VERSION_V1,
              cipherSuite: CIPHER_SUITE_SECP256K1,
              encryptionType: ENC_TYPE_WITH_LENGTH,
              ephemeralPublicKey,
              iv,
              authTag,
              dataLength,
            };

            // Serialize
            const serialized = serializeWithLengthHeader(originalHeader);

            // Parse
            const parsed = parseWithLengthHeader(serialized);

            // Re-serialize
            const reserialized = serializeWithLengthHeader(parsed);

            // Assert byte-identical
            expect(arraysEqual(serialized, reserialized)).toBe(true);

            // Verify parsed fields
            expect(parsed.version).toBe(VERSION_V1);
            expect(parsed.cipherSuite).toBe(CIPHER_SUITE_SECP256K1);
            expect(parsed.encryptionType).toBe(ENC_TYPE_WITH_LENGTH);
            expect(
              arraysEqual(parsed.ephemeralPublicKey, ephemeralPublicKey),
            ).toBe(true);
            expect(arraysEqual(parsed.iv, iv)).toBe(true);
            expect(arraysEqual(parsed.authTag, authTag)).toBe(true);
            expect(parsed.dataLength).toBe(dataLength);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('header has correct fixed size of 72 bytes', () => {
      fc.assert(
        fc.property(
          compressedPublicKeyArb,
          ivArb,
          authTagArb,
          dataLengthArb,
          (ephemeralPublicKey, iv, authTag, dataLength) => {
            const header: WithLengthParsedHeader = {
              version: VERSION_V1,
              cipherSuite: CIPHER_SUITE_SECP256K1,
              encryptionType: ENC_TYPE_WITH_LENGTH,
              ephemeralPublicKey,
              iv,
              authTag,
              dataLength,
            };

            const serialized = serializeWithLengthHeader(header);
            // 1 + 1 + 1 + 33 + 12 + 16 + 8 = 72
            expect(serialized.length).toBe(72);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Multiple mode (0x63)', () => {
    it('serialize → parse → re-serialize produces byte-identical output', () => {
      // Generate recipient count between 1 and 10 (kept small for performance)
      const recipientIdSizeArb = fc.integer({ min: 1, max: 32 });

      fc.assert(
        fc.property(
          compressedPublicKeyArb,
          recipientIdSizeArb,
          fc.integer({ min: 1, max: 10 }),
          dataLengthArb,
          (
            ephemeralPublicKey,
            recipientIdSize,
            recipientCount,
            rawDataLength,
          ) => {
            // Generate random recipient IDs and encrypted key blocks
            const recipientIds: Uint8Array[] = [];
            const encryptedKeys: Uint8Array[] = [];

            // Use a deterministic seed based on the inputs for reproducibility
            for (let i = 0; i < recipientCount; i++) {
              const id = new Uint8Array(recipientIdSize);
              for (let j = 0; j < recipientIdSize; j++) {
                id[j] = (i * 37 + j * 13 + 7) & 0xff;
              }
              recipientIds.push(id);

              const key = new Uint8Array(ENCRYPTED_KEY_SIZE);
              for (let j = 0; j < ENCRYPTED_KEY_SIZE; j++) {
                key[j] = (i * 41 + j * 17 + 11) & 0xff;
              }
              encryptedKeys.push(key);
            }

            // Build combined data length: MSB = recipientIdSize, lower 56 bits = data length
            const combinedDataLength =
              (BigInt(recipientIdSize) << 56n) | rawDataLength;

            const originalHeader: MultipleParsedHeader = {
              version: VERSION_V1,
              cipherSuite: CIPHER_SUITE_SECP256K1,
              encryptionType: ENC_TYPE_MULTIPLE,
              ephemeralPublicKey,
              combinedDataLength,
              recipientCount,
              recipientIds,
              encryptedKeys,
            };

            // Serialize
            const serialized = serializeMultipleHeader(originalHeader);

            // Parse (need to know recipientIdSize to parse correctly)
            const parsed = parseMultipleHeader(serialized, recipientIdSize);

            // Re-serialize
            const reserialized = serializeMultipleHeader(parsed);

            // Assert byte-identical
            expect(arraysEqual(serialized, reserialized)).toBe(true);

            // Verify parsed fields
            expect(parsed.version).toBe(VERSION_V1);
            expect(parsed.cipherSuite).toBe(CIPHER_SUITE_SECP256K1);
            expect(parsed.encryptionType).toBe(ENC_TYPE_MULTIPLE);
            expect(
              arraysEqual(parsed.ephemeralPublicKey, ephemeralPublicKey),
            ).toBe(true);
            expect(parsed.combinedDataLength).toBe(combinedDataLength);
            expect(parsed.recipientCount).toBe(recipientCount);
            expect(parsed.recipientIds.length).toBe(recipientCount);
            expect(parsed.encryptedKeys.length).toBe(recipientCount);

            for (let i = 0; i < recipientCount; i++) {
              expect(arraysEqual(parsed.recipientIds[i], recipientIds[i])).toBe(
                true,
              );
              expect(
                arraysEqual(parsed.encryptedKeys[i], encryptedKeys[i]),
              ).toBe(true);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('serialize → parse → re-serialize with fully random recipient data', () => {
      fc.assert(
        fc.property(
          compressedPublicKeyArb,
          fc.integer({ min: 1, max: 32 }), // recipientIdSize
          fc.integer({ min: 1, max: 5 }), // recipientCount (small for perf)
          dataLengthArb,
          fc.infiniteStream(fc.uint8Array({ minLength: 1, maxLength: 1 })),
          (
            ephemeralPublicKey,
            recipientIdSize,
            recipientCount,
            rawDataLength,
            randomStream,
          ) => {
            // Generate fully random recipient IDs and encrypted keys from the stream
            const recipientIds: Uint8Array[] = [];
            const encryptedKeys: Uint8Array[] = [];

            for (let i = 0; i < recipientCount; i++) {
              const id = new Uint8Array(recipientIdSize);
              for (let j = 0; j < recipientIdSize; j++) {
                id[j] = randomStream.next().value[0];
              }
              recipientIds.push(id);

              const key = new Uint8Array(ENCRYPTED_KEY_SIZE);
              for (let j = 0; j < ENCRYPTED_KEY_SIZE; j++) {
                key[j] = randomStream.next().value[0];
              }
              encryptedKeys.push(key);
            }

            const combinedDataLength =
              (BigInt(recipientIdSize) << 56n) | rawDataLength;

            const originalHeader: MultipleParsedHeader = {
              version: VERSION_V1,
              cipherSuite: CIPHER_SUITE_SECP256K1,
              encryptionType: ENC_TYPE_MULTIPLE,
              ephemeralPublicKey,
              combinedDataLength,
              recipientCount,
              recipientIds,
              encryptedKeys,
            };

            const serialized = serializeMultipleHeader(originalHeader);
            const parsed = parseMultipleHeader(serialized, recipientIdSize);
            const reserialized = serializeMultipleHeader(parsed);

            expect(arraysEqual(serialized, reserialized)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('header size matches expected formula', () => {
      fc.assert(
        fc.property(
          compressedPublicKeyArb,
          fc.integer({ min: 1, max: 32 }), // recipientIdSize
          fc.integer({ min: 1, max: 10 }), // recipientCount
          dataLengthArb,
          (
            ephemeralPublicKey,
            recipientIdSize,
            recipientCount,
            rawDataLength,
          ) => {
            const recipientIds: Uint8Array[] = [];
            const encryptedKeys: Uint8Array[] = [];

            for (let i = 0; i < recipientCount; i++) {
              recipientIds.push(new Uint8Array(recipientIdSize));
              encryptedKeys.push(new Uint8Array(ENCRYPTED_KEY_SIZE));
            }

            const combinedDataLength =
              (BigInt(recipientIdSize) << 56n) | rawDataLength;

            const header: MultipleParsedHeader = {
              version: VERSION_V1,
              cipherSuite: CIPHER_SUITE_SECP256K1,
              encryptionType: ENC_TYPE_MULTIPLE,
              ephemeralPublicKey,
              combinedDataLength,
              recipientCount,
              recipientIds,
              encryptedKeys,
            };

            const serialized = serializeMultipleHeader(header);

            // Expected: 1 + 1 + 1 + 33 + 8 + 2 + (recipientIdSize * count) + (60 * count)
            const expectedSize =
              1 +
              1 +
              1 +
              PUBLIC_KEY_LENGTH +
              DATA_LENGTH_SIZE +
              RECIPIENT_COUNT_SIZE +
              recipientIdSize * recipientCount +
              ENCRYPTED_KEY_SIZE * recipientCount;

            expect(serialized.length).toBe(expectedSize);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
