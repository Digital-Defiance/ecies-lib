import { EciesEncryptionTypeEnum } from '../enumerations/ecies-encryption-type';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId, getEciesI18nEngine } from '../i18n-setup';
import { IEncryptedChunk } from '../interfaces/encrypted-chunk';
import {
  ENCRYPTION_STATE_VERSION,
  IEncryptionState,
} from '../interfaces/encryption-state';
import { uint8ArrayToHex } from '../utils';
import { EncryptionStream, IEncryptStreamOptions } from './encryption-stream';

export interface IResumableOptions extends IEncryptStreamOptions {
  autoSaveInterval?: number;
  onStateSaved?: (state: IEncryptionState) => void | Promise<void>;
}

export class ResumableEncryption {
  private state: IEncryptionState | null = null;

  constructor(
    private readonly stream: EncryptionStream,
    initialState?: IEncryptionState,
  ) {
    if (initialState) {
      this.validateState(initialState);
      this.state = initialState;
    }
  }

  async *encrypt(
    source: AsyncIterable<Uint8Array>,
    publicKey: Uint8Array,
    options: IResumableOptions = {},
  ): AsyncGenerator<IEncryptedChunk, void, unknown> {
    const engine = getEciesI18nEngine();
    const autoSaveInterval = options.autoSaveInterval ?? 10;
    if (autoSaveInterval <= 0) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Resumable_AutoSaveIntervalMustBePositive,
        ),
      );
    }

    const publicKeyHex = uint8ArrayToHex(publicKey);
    if (this.state) {
      if (this.state.publicKey !== publicKeyHex) {
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_Resumable_PublicKeyMismatch,
          ),
        );
      }
      if (this.state.chunkSize !== (options.chunkSize ?? 1024 * 1024)) {
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_Resumable_ChunkSizeMismatch,
          ),
        );
      }
      if (this.state.includeChecksums !== (options.includeChecksums ?? false)) {
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_Resumable_IncludeChecksumsMismatch,
          ),
        );
      }
    }

    const startIndex = this.state?.chunkIndex ?? 0;

    let chunkIndex = 0;
    for await (const chunk of this.stream.encryptStream(
      source,
      publicKey,
      options,
    )) {
      if (chunkIndex < startIndex) {
        chunkIndex++;
        continue;
      }

      yield chunk;

      this.state = {
        version: ENCRYPTION_STATE_VERSION,
        chunkIndex: chunk.index + 1,
        bytesProcessed:
          (this.state?.bytesProcessed ?? 0) +
          (chunk.metadata?.originalSize ?? 0),
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
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Resumable_NoStateToSave,
        ),
      );
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
    state: IEncryptionState,
  ): ResumableEncryption {
    return new ResumableEncryption(stream, state);
  }

  private validateState(state: IEncryptionState): void {
    const engine = getEciesI18nEngine();
    if (state.version !== ENCRYPTION_STATE_VERSION) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Resumable_UnsupportedStateVersionTemplate,
          { version: state.version },
        ),
      );
    }
    if (state.chunkIndex < 0) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Resumable_InvalidChunkIndex,
        ),
      );
    }
    const age = Date.now() - state.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Resumable_StateTooOld,
        ),
      );
    }
    if (!state.publicKey || state.publicKey.length === 0) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Resumable_InvalidPublicKeyInState,
        ),
      );
    }
    // Verify HMAC if present
    if (state.hmac) {
      const expectedHMAC = this.calculateStateHMAC(state);
      if (state.hmac !== expectedHMAC) {
        throw new Error(
          engine.translate(
            EciesComponentId,
            EciesStringKey.Error_Resumable_StateIntegrityCheckFailed,
          ),
        );
      }
    }
  }
}
