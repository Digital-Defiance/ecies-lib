import { IEncryptionState, ENCRYPTION_STATE_VERSION } from '../interfaces/encryption-state';
import { IEncryptedChunk } from '../interfaces/encrypted-chunk';
import { EncryptionStream } from './encryption-stream';
import { IEncryptStreamOptions } from './encryption-stream';
import { uint8ArrayToHex, hexToUint8Array } from '../utils';
import { EciesEncryptionTypeEnum } from '../enumerations/ecies-encryption-type';


export interface IResumableOptions extends IEncryptStreamOptions {
  autoSaveInterval?: number;
  onStateSaved?: (state: IEncryptionState) => void | Promise<void>;
}

export class ResumableEncryption {
  private state: IEncryptionState | null = null;

  constructor(
    private readonly stream: EncryptionStream,
    initialState?: IEncryptionState
  ) {
    if (initialState) {
      this.validateState(initialState);
      this.state = initialState;
    }
  }

  async *encrypt(
    source: AsyncIterable<Uint8Array>,
    publicKey: Uint8Array,
    options: IResumableOptions = {}
  ): AsyncGenerator<IEncryptedChunk, void, unknown> {
    const autoSaveInterval = options.autoSaveInterval ?? 10;
    if (autoSaveInterval <= 0) {
      throw new Error('autoSaveInterval must be positive');
    }

    const publicKeyHex = uint8ArrayToHex(publicKey);
    if (this.state) {
      if (this.state.publicKey !== publicKeyHex) {
        throw new Error('Public key mismatch with saved state');
      }
      if (this.state.chunkSize !== (options.chunkSize ?? 1024 * 1024)) {
        throw new Error('Chunk size mismatch with saved state');
      }
      if (this.state.includeChecksums !== (options.includeChecksums ?? false)) {
        throw new Error('includeChecksums mismatch with saved state');
      }
    }

    const startIndex = this.state?.chunkIndex ?? 0;

    let chunkIndex = 0;
    for await (const chunk of this.stream.encryptStream(source, publicKey, options)) {
      if (chunkIndex < startIndex) {
        chunkIndex++;
        continue;
      }

      yield chunk;

      this.state = {
        version: ENCRYPTION_STATE_VERSION,
        chunkIndex: chunk.index + 1,
        bytesProcessed: (this.state?.bytesProcessed ?? 0) + (chunk.metadata?.originalSize ?? 0),
        publicKey: publicKeyHex,
        encryptionType: EciesEncryptionTypeEnum.Single,
        chunkSize: options.chunkSize ?? 1024 * 1024,
        includeChecksums: options.includeChecksums ?? false,
        timestamp: Date.now(),
      };

      if (options.onStateSaved && (chunk.index + 1) % autoSaveInterval === 0) {
        await options.onStateSaved({ ...this.state });
      }

      chunkIndex++;
    }
  }

  saveState(): IEncryptionState {
    if (!this.state) {
      throw new Error('No state to save');
    }
    const state = { ...this.state };
    // Add HMAC for integrity
    state.hmac = this.calculateStateHMAC(state);
    return state;
  }

  private calculateStateHMAC(state: IEncryptionState): string {
    const data = `${state.version}|${state.chunkIndex}|${state.bytesProcessed}|${state.publicKey}|${state.chunkSize}|${state.includeChecksums}|${state.timestamp}`;
    const hash = new Uint8Array(32);
    // Simple hash for integrity check (not cryptographic HMAC)
    const bytes = new TextEncoder().encode(data);
    for (let i = 0; i < bytes.length; i++) {
      hash[i % 32] ^= bytes[i];
    }
    return uint8ArrayToHex(hash);
  }

  static resume(
    stream: EncryptionStream,
    state: IEncryptionState
  ): ResumableEncryption {
    return new ResumableEncryption(stream, state);
  }

  private validateState(state: IEncryptionState): void {
    if (state.version !== ENCRYPTION_STATE_VERSION) {
      throw new Error(`Unsupported state version: ${state.version}`);
    }
    if (state.chunkIndex < 0) {
      throw new Error('Invalid chunk index');
    }
    const age = Date.now() - state.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      throw new Error('State too old (>24 hours)');
    }
    if (!state.publicKey || state.publicKey.length === 0) {
      throw new Error('Invalid public key in state');
    }
    // Verify HMAC if present
    if (state.hmac) {
      const expectedHMAC = this.calculateStateHMAC(state);
      if (state.hmac !== expectedHMAC) {
        throw new Error('State integrity check failed: HMAC mismatch');
      }
    }
  }
}
