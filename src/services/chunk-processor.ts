import { sha256 } from '@noble/hashes/sha2.js';
import { Constants } from '../constants';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId, getEciesI18nEngine } from '../i18n-setup';
import { IECIESConstants } from '../interfaces/ecies-consts';
import {
  CHUNK_CONSTANTS,
  IChunkHeader,
  IEncryptedChunk,
} from '../interfaces/encrypted-chunk';
import { ECIESService } from './ecies/service';

/**
 * Processes chunks for streaming encryption/decryption
 */
export class ChunkProcessor {
  constructor(
    private readonly ecies: ECIESService,
    private readonly _eciesConsts: IECIESConstants = Constants.ECIES,
  ) {}

  /**
   * Build chunk header
   */
  buildChunkHeader(header: IChunkHeader): Uint8Array {
    const buffer = new Uint8Array(CHUNK_CONSTANTS.HEADER_SIZE);
    const view = new DataView(buffer.buffer);

    view.setUint32(0, header.magic, false);
    view.setUint16(4, header.version, false);
    view.setUint32(6, header.index, false);
    view.setUint32(10, header.originalSize, false);
    view.setUint32(14, header.encryptedSize, false);
    view.setUint16(18, header.flags, false);
    // Bytes 20-31: reserved (zeros)

    return buffer;
  }

  /**
   * Parse chunk header
   */
  parseChunkHeader(data: Uint8Array): IChunkHeader {
    const engine = getEciesI18nEngine();
    if (data.length < CHUNK_CONSTANTS.HEADER_SIZE) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Chunk_DataTooShortForHeader,
        ),
      );
    }

    const view = new DataView(data.buffer, data.byteOffset);

    const magic = view.getUint32(0, false);
    if (magic !== CHUNK_CONSTANTS.MAGIC) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Chunk_InvalidMagicBytes,
        ),
      );
    }

    const version = view.getUint16(4, false);
    if (version !== CHUNK_CONSTANTS.VERSION) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Chunk_UnsupportedVersion,
        ),
      );
    }

    return {
      magic,
      version,
      index: view.getUint32(6, false),
      originalSize: view.getUint32(10, false),
      encryptedSize: view.getUint32(14, false),
      flags: view.getUint16(18, false),
    };
  }

  /**
   * Encrypt a single chunk
   */
  async encryptChunk(
    data: Uint8Array,
    publicKey: Uint8Array,
    index: number,
    isLast: boolean,
    includeChecksum: boolean,
  ): Promise<IEncryptedChunk> {
    // Encrypt data
    const encrypted = await this.ecies.encryptSimpleOrSingle(
      false,
      publicKey,
      data,
    );

    // Calculate checksum if requested
    const checksum = includeChecksum ? sha256(data) : undefined;

    // Build header
    let flags = 0;
    if (isLast) flags |= CHUNK_CONSTANTS.FLAG_IS_LAST;
    if (includeChecksum) flags |= CHUNK_CONSTANTS.FLAG_HAS_CHECKSUM;

    const header = this.buildChunkHeader({
      magic: CHUNK_CONSTANTS.MAGIC,
      version: CHUNK_CONSTANTS.VERSION,
      index,
      originalSize: data.length,
      encryptedSize: encrypted.length,
      flags,
    });

    // Combine: header + encrypted + optional checksum
    const parts = [header, encrypted];
    if (checksum) {
      parts.push(checksum);
    }

    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }

    return {
      index,
      data: result,
      isLast,
      metadata: {
        originalSize: data.length,
        encryptedSize: encrypted.length,
        timestamp: Date.now(),
        checksum,
      },
    };
  }

  /**
   * Decrypt a single chunk
   */
  async decryptChunk(
    chunkData: Uint8Array,
    privateKey: Uint8Array,
  ): Promise<{ data: Uint8Array; header: IChunkHeader }> {
    // Parse header
    const header = this.parseChunkHeader(chunkData);

    // Extract encrypted data
    const hasChecksum =
      (header.flags & CHUNK_CONSTANTS.FLAG_HAS_CHECKSUM) !== 0;
    const encryptedStart = CHUNK_CONSTANTS.HEADER_SIZE;
    const encryptedEnd = hasChecksum
      ? chunkData.length - CHUNK_CONSTANTS.CHECKSUM_SIZE
      : chunkData.length;

    const encrypted = chunkData.slice(encryptedStart, encryptedEnd);

    // Validate encrypted size matches header
    if (encrypted.length !== header.encryptedSize) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Chunk_EncryptedSizeMismatchTemplate,
          { expectedSize: header.encryptedSize, actualSize: encrypted.length },
        ),
      );
    }

    // Decrypt
    const decrypted = await this.ecies.decryptSimpleOrSingleWithHeader(
      false,
      privateKey,
      encrypted,
    );

    // Verify checksum if present
    if (hasChecksum) {
      const storedChecksum = chunkData.slice(-CHUNK_CONSTANTS.CHECKSUM_SIZE);
      const computedChecksum = sha256(decrypted);

      // Constant-time comparison to prevent timing attacks
      let diff = 0;
      for (let i = 0; i < CHUNK_CONSTANTS.CHECKSUM_SIZE; i++) {
        diff |= storedChecksum[i] ^ computedChecksum[i];
      }
      if (diff !== 0) {
        const engine = getEciesI18nEngine();
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_Chunk_ChecksumMismatch,
          ),
        );
      }
    }

    // Verify size
    if (decrypted.length !== header.originalSize) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Chunk_DecryptedSizeMismatch,
        ),
      );
    }

    return { data: decrypted, header };
  }
}
