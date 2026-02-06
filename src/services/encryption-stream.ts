import { Constants } from '../constants';
import { EciesEncryptionTypeEnum } from '../enumerations/ecies-encryption-type';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { getEciesI18nEngine } from '../i18n-setup';
import { PlatformID } from '../interfaces';
import { IConstants } from '../interfaces/constants';
import { IECIESConstants } from '../interfaces/ecies-consts';
import { IEncryptedChunk } from '../interfaces/encrypted-chunk';
import { IMultiRecipientChunk } from '../interfaces/multi-recipient-chunk';
import {
  DEFAULT_STREAM_CONFIG,
  IStreamConfig,
} from '../interfaces/stream-config';
import {
  IStreamHeader,
  STREAM_HEADER_CONSTANTS,
} from '../interfaces/stream-header';
import { IStreamProgress } from '../interfaces/stream-progress';
import { ChunkProcessor } from './chunk-processor';
import { ECIESService } from './ecies/service';
import { MultiRecipientProcessor } from './multi-recipient-processor';
import { ProgressTracker } from './progress-tracker';

/**
 * Options for stream encryption
 */
export interface IEncryptStreamOptions {
  chunkSize?: number;
  signal?: AbortSignal;
  includeChecksums?: boolean;
  onProgress?: (progress: IStreamProgress) => void;
}

export interface IMultiRecipientStreamOptions extends IEncryptStreamOptions {
  recipients: Array<{ id: Uint8Array; publicKey: Uint8Array }>;
}

/**
 * Options for stream decryption
 */
export interface IDecryptStreamOptions {
  signal?: AbortSignal;
  onProgress?: (progress: IStreamProgress) => void;
}

/**
 * Streaming encryption/decryption service
 */
export class EncryptionStream<TID extends PlatformID = Uint8Array> {
  private readonly processor: ChunkProcessor<TID>;
  private readonly multiRecipientProcessor: MultiRecipientProcessor<TID>;

  constructor(
    private readonly _ecies: ECIESService<TID>,
    private readonly config: IStreamConfig = DEFAULT_STREAM_CONFIG,
    private readonly _eciesConsts: IECIESConstants = Constants.ECIES,
    private readonly constants: IConstants = Constants,
  ) {
    this.processor = new ChunkProcessor<TID>(_ecies, _eciesConsts);
    this.multiRecipientProcessor = new MultiRecipientProcessor<TID>(
      constants,
      constants.ECIES_CONFIG,
      _ecies,
      undefined,
      _eciesConsts,
    );
  }

  /**
   * Build stream header
   */
  buildStreamHeader(header: IStreamHeader): Uint8Array {
    const buffer = new Uint8Array(STREAM_HEADER_CONSTANTS.HEADER_SIZE);
    const view = new DataView(buffer.buffer);

    view.setUint32(0, header.magic, false);
    view.setUint16(4, header.version, false);
    view.setUint8(6, header.encryptionType);
    view.setUint32(7, header.chunkSize, false);
    view.setUint32(11, header.totalChunks, false);
    view.setBigUint64(15, BigInt(header.totalBytes), false);
    view.setBigUint64(23, BigInt(header.timestamp), false);
    // Bytes 31-127: reserved (zeros)

    return buffer;
  }

  /**
   * Parse stream header
   */
  parseStreamHeader(data: Uint8Array): IStreamHeader {
    const engine = getEciesI18nEngine();
    if (data.length < STREAM_HEADER_CONSTANTS.HEADER_SIZE) {
      throw new Error(
        engine.translateStringKey(
          EciesStringKey.Error_Stream_DataTooShortForHeader,
        ),
      );
    }

    const view = new DataView(data.buffer, data.byteOffset);

    const magic = view.getUint32(0, false);
    if (magic !== STREAM_HEADER_CONSTANTS.MAGIC) {
      throw new Error(
        engine.translateStringKey(
          EciesStringKey.Error_Stream_InvalidMagicBytes,
        ),
      );
    }

    const version = view.getUint16(4, false);
    if (version !== STREAM_HEADER_CONSTANTS.VERSION) {
      throw new Error(
        engine.translateStringKey(
          EciesStringKey.Error_Stream_UnsupportedVersion,
        ),
      );
    }

    return {
      magic,
      version,
      encryptionType: view.getUint8(6) as EciesEncryptionTypeEnum,
      chunkSize: view.getUint32(7, false),
      totalChunks: view.getUint32(11, false),
      totalBytes: Number(view.getBigUint64(15, false)),
      timestamp: Number(view.getBigUint64(23, false)),
    };
  }

  /**
   * Encrypt data stream
   */
  async *encryptStream(
    source: AsyncIterable<Uint8Array>,
    publicKey: Uint8Array,
    options: IEncryptStreamOptions = {},
  ): AsyncGenerator<IEncryptedChunk, void, unknown> {
    const engine = getEciesI18nEngine();
    // Validate public key (65 bytes uncompressed with 0x04 prefix)
    if (!publicKey || (publicKey.length !== 65 && publicKey.length !== 33)) {
      throw new Error(
        engine.translateStringKey(
          EciesStringKey.Error_Stream_InvalidPublicKeyLength,
        ),
      );
    }

    const chunkSize = options.chunkSize ?? this.config.chunkSize;
    const includeChecksums =
      options.includeChecksums ?? this.config.includeChecksums;
    const signal = options.signal;
    const onProgress = options.onProgress;

    let buffer = new Uint8Array(0);
    let chunkIndex = 0;
    let lastYieldedChunk: IEncryptedChunk | null = null;
    let tracker: ProgressTracker | undefined;
    let _totalBytesRead = 0;
    const maxSingleChunk = 100 * 1024 * 1024; // 100MB max per source chunk

    for await (const data of source) {
      // Check for cancellation
      if (signal?.aborted) {
        throw new DOMException(
          engine.translateStringKey(
            EciesStringKey.Error_Stream_EncryptionCancelled,
          ),
          'AbortError',
        );
      }

      // Prevent buffer exhaustion from single large source chunk
      if (data.length > maxSingleChunk) {
        throw new Error(
          engine.translateStringKey(
            EciesStringKey.Error_Stream_BufferOverflowTemplate,
            { max: maxSingleChunk },
          ),
        );
      }

      // Append to buffer
      const newBuffer = new Uint8Array(buffer.length + data.length);
      newBuffer.set(buffer);
      newBuffer.set(data, buffer.length);
      buffer = newBuffer;
      _totalBytesRead += data.length;

      // Initialize tracker on first data
      if (!tracker && onProgress) {
        tracker = new ProgressTracker();
      }

      // Process complete chunks
      while (buffer.length >= chunkSize) {
        if (signal?.aborted) {
          throw new DOMException('Encryption cancelled', 'AbortError');
        }

        const chunkData = buffer.slice(0, chunkSize);
        buffer = buffer.slice(chunkSize);

        const encryptedChunk = await this.processor.encryptChunk(
          chunkData,
          publicKey,
          chunkIndex++,
          false,
          includeChecksums,
        );

        lastYieldedChunk = encryptedChunk;
        yield encryptedChunk;

        // Report progress
        if (tracker && onProgress) {
          onProgress(tracker.update(chunkSize));
        }
      }
    }

    // Process remaining data as last chunk
    if (buffer.length > 0) {
      if (signal?.aborted) {
        throw new DOMException('Encryption cancelled', 'AbortError');
      }

      const encryptedChunk = await this.processor.encryptChunk(
        buffer,
        publicKey,
        chunkIndex,
        true,
        includeChecksums,
      );

      yield encryptedChunk;

      // Report final progress
      if (tracker && onProgress) {
        onProgress(tracker.update(buffer.length));
      }
    } else if (chunkIndex === 0) {
      // Empty stream - yield nothing
      return;
    } else if (lastYieldedChunk) {
      // Mark the last yielded chunk as last
      lastYieldedChunk.isLast = true;
    }
  }

  /**
   * Encrypt stream for multiple recipients
   * Uses shared symmetric key encrypted for each recipient
   */
  async *encryptStreamMultiple(
    source: AsyncIterable<Uint8Array>,
    recipients: Array<{ id: Uint8Array; publicKey: Uint8Array }>,
    options: IEncryptStreamOptions = {},
  ): AsyncGenerator<IMultiRecipientChunk, void, unknown> {
    const engine = getEciesI18nEngine();
    if (recipients.length === 0) {
      throw new Error(
        engine.translateStringKey(
          EciesStringKey.Error_Stream_AtLeastOneRecipientRequired,
        ),
      );
    }
    if (recipients.length > 65535) {
      throw new Error(
        engine.translateStringKey(
          EciesStringKey.Error_Stream_MaxRecipientsExceeded,
        ),
      );
    }

    // Validate all recipient public keys
    for (const recipient of recipients) {
      if (
        !recipient.publicKey ||
        (recipient.publicKey.length !== 65 && recipient.publicKey.length !== 33)
      ) {
        throw new Error(
          engine.translateStringKey(
            EciesStringKey.Error_Stream_InvalidRecipientPublicKeyLength,
          ),
        );
      }
      if (
        !recipient.id ||
        recipient.id.length !== this.constants.MEMBER_ID_LENGTH
      ) {
        throw new Error(
          engine.translateStringKey(
            EciesStringKey.Error_Stream_InvalidRecipientIdLengthTemplate,
            { expected: this.constants.MEMBER_ID_LENGTH },
          ),
        );
      }
    }

    const chunkSize = options.chunkSize ?? this.config.chunkSize;
    const signal = options.signal;
    const onProgress = options.onProgress;

    // Generate shared symmetric key for this stream
    const symmetricKey = crypto.getRandomValues(new Uint8Array(32));

    let buffer = new Uint8Array(0);
    let chunkIndex = 0;
    let tracker: ProgressTracker | undefined;
    const maxSingleChunk = 100 * 1024 * 1024;

    for await (const data of source) {
      if (signal?.aborted) {
        throw new DOMException('Encryption cancelled', 'AbortError');
      }

      if (data.length > maxSingleChunk) {
        throw new Error(
          `Buffer overflow: source chunk exceeds ${maxSingleChunk} bytes`,
        );
      }

      const newBuffer = new Uint8Array(buffer.length + data.length);
      newBuffer.set(buffer);
      newBuffer.set(data, buffer.length);
      buffer = newBuffer;

      if (!tracker && onProgress) {
        tracker = new ProgressTracker();
      }

      while (buffer.length >= chunkSize) {
        if (signal?.aborted) {
          throw new DOMException('Encryption cancelled', 'AbortError');
        }

        const chunkData = buffer.slice(0, chunkSize);
        buffer = buffer.slice(chunkSize);

        const encryptedChunk = await this.multiRecipientProcessor.encryptChunk(
          chunkData,
          recipients,
          chunkIndex++,
          false,
          symmetricKey,
        );

        yield encryptedChunk;

        if (tracker && onProgress) {
          onProgress(tracker.update(chunkSize));
        }
      }
    }

    // Process remaining data as last chunk
    if (buffer.length > 0) {
      if (signal?.aborted) {
        throw new DOMException('Encryption cancelled', 'AbortError');
      }

      const encryptedChunk = await this.multiRecipientProcessor.encryptChunk(
        buffer,
        recipients,
        chunkIndex,
        true,
        symmetricKey,
      );

      yield encryptedChunk;

      if (tracker && onProgress) {
        onProgress(tracker.update(buffer.length));
      }
    } else if (chunkIndex > 0) {
      // Mark last yielded chunk - need to re-yield with isLast=true
      // This is handled by the processor setting isLast flag
    }
  }

  /**
   * Decrypt multi-recipient stream
   */
  async *decryptStreamMultiple(
    source: AsyncIterable<Uint8Array>,
    recipientId: Uint8Array,
    privateKey: Uint8Array,
    options: IDecryptStreamOptions = {},
  ): AsyncGenerator<Uint8Array, void, unknown> {
    const engine = getEciesI18nEngine();
    if (
      !recipientId ||
      recipientId.length !== this.constants.MEMBER_ID_LENGTH
    ) {
      throw new Error(
        engine.translateStringKey(
          EciesStringKey.Error_Stream_InvalidRecipientIdLengthTemplate,
          { expected: this.constants.MEMBER_ID_LENGTH },
        ),
      );
    }
    if (!privateKey || privateKey.length !== 32) {
      throw new Error(
        engine.translateStringKey(
          EciesStringKey.Error_Stream_InvalidPrivateKeyMust32Bytes,
        ),
      );
    }

    const signal = options.signal;
    const onProgress = options.onProgress;
    let expectedIndex = 0;
    let tracker: ProgressTracker | undefined;

    if (onProgress) {
      tracker = new ProgressTracker();
    }

    for await (const chunkData of source) {
      if (signal?.aborted) {
        throw new DOMException(
          engine.translateStringKey(
            EciesStringKey.Error_Stream_DecryptionCancelled,
          ),
          'AbortError',
        );
      }

      const { data, header } = await this.multiRecipientProcessor.decryptChunk(
        chunkData,
        recipientId,
        privateKey,
      );

      if (header.chunkIndex !== expectedIndex) {
        throw new Error(
          engine.translateStringKey(
            EciesStringKey.Error_Stream_ChunkSequenceErrorTemplate,
            { expected: expectedIndex, actual: header.chunkIndex },
          ),
        );
      }

      expectedIndex++;
      yield data;

      if (tracker && onProgress) {
        onProgress(tracker.update(data.length));
      }

      const isLast = (header.flags & 0x01) !== 0;
      if (isLast) {
        break;
      }
    }
  }

  /**
   * Decrypt data stream
   */
  async *decryptStream(
    source: AsyncIterable<Uint8Array>,
    privateKey: Uint8Array,
    options: IDecryptStreamOptions = {},
  ): AsyncGenerator<Uint8Array, void, unknown> {
    const engine = getEciesI18nEngine();
    // Validate private key
    if (!privateKey || privateKey.length !== 32) {
      throw new Error(
        engine.translateStringKey(
          EciesStringKey.Error_Stream_InvalidPrivateKeyMust32Bytes,
        ),
      );
    }

    const signal = options.signal;
    const onProgress = options.onProgress;
    let expectedIndex = 0;
    let tracker: ProgressTracker | undefined;

    if (onProgress) {
      tracker = new ProgressTracker();
    }

    for await (const chunkData of source) {
      // Check for cancellation
      if (signal?.aborted) {
        throw new DOMException(
          engine.translateStringKey(
            EciesStringKey.Error_Stream_DecryptionCancelled,
          ),
          'AbortError',
        );
      }

      const { data, header } = await this.processor.decryptChunk(
        chunkData,
        privateKey,
      );

      // Validate sequence
      if (header.index !== expectedIndex) {
        throw new Error(
          engine.translateStringKey(
            EciesStringKey.Error_Stream_ChunkSequenceErrorTemplate,
            { expected: expectedIndex, actual: header.index },
          ),
        );
      }

      expectedIndex++;
      yield data;

      // Report progress
      if (tracker && onProgress) {
        onProgress(tracker.update(data.length));
      }

      // Check if this was the last chunk
      const isLast = (header.flags & 0x01) !== 0;
      if (isLast) {
        break;
      }
    }
  }
}
