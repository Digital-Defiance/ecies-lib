import { IStreamProgress } from '../interfaces/stream-progress';
import { getEciesI18nEngine, EciesComponentId } from '../i18n-setup';
import { EciesStringKey } from '../enumerations/ecies-string-key';

/**
 * Tracks progress for streaming operations
 */
export class ProgressTracker {
  private startTime: number;
  private lastUpdateTime: number;
  private bytesProcessed: number = 0;
  private chunksProcessed: number = 0;
  private recentThroughputs: number[] = [];
  private readonly maxThroughputSamples = 5;

  constructor(private readonly totalBytes?: number) {
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
  }

  /**
   * Update progress with new chunk
   */
  update(chunkBytes: number): IStreamProgress {
    // Validate input
    if (chunkBytes < 0) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_Progress_ChunkBytesCannotBeNegative));
    }

    this.bytesProcessed += chunkBytes;
    this.chunksProcessed++;

    const now = Date.now();
    const elapsedTime = Math.max(0, now - this.startTime);
    const timeSinceLastUpdate = Math.max(0, now - this.lastUpdateTime);

    // Calculate instantaneous throughput (use elapsed time if same millisecond)
    const timeWindow = timeSinceLastUpdate > 0 ? timeSinceLastUpdate : Math.max(1, elapsedTime);
    if (chunkBytes > 0 && timeWindow > 0) {
      const instantThroughput = (chunkBytes / timeWindow) * 1000;
      // Guard against unrealistic throughput (>10GB/s)
      if (isFinite(instantThroughput) && instantThroughput < 10 * 1024 * 1024 * 1024) {
        this.recentThroughputs.push(instantThroughput);
        if (this.recentThroughputs.length > this.maxThroughputSamples) {
          this.recentThroughputs.shift();
        }
      }
    }

    this.lastUpdateTime = now;

    // Calculate average throughput
    const throughput =
      this.recentThroughputs.length > 0
        ? this.recentThroughputs.reduce((a, b) => a + b, 0) / this.recentThroughputs.length
        : 0;

    // Calculate ETA (guard against negative)
    let estimatedTimeRemaining: number | undefined;
    if (this.totalBytes && throughput > 0 && this.bytesProcessed < this.totalBytes) {
      const remainingBytes = this.totalBytes - this.bytesProcessed;
      estimatedTimeRemaining = Math.max(0, remainingBytes / throughput);
    }

    return {
      bytesProcessed: this.bytesProcessed,
      totalBytes: this.totalBytes,
      chunksProcessed: this.chunksProcessed,
      percentComplete: this.totalBytes ? Math.min(100, (this.bytesProcessed / this.totalBytes) * 100) : undefined,
      throughputBytesPerSec: throughput,
      throughput, // Alias
      estimatedTimeRemaining,
      startTime: this.startTime,
      elapsedTime,
    } as any;
  }

  /**
   * Get current progress without update
   */
  getProgress(): IStreamProgress {
    const elapsedTime = Math.max(0, Date.now() - this.startTime);
    const throughput =
      this.recentThroughputs.length > 0
        ? this.recentThroughputs.reduce((a, b) => a + b, 0) / this.recentThroughputs.length
        : 0;

    let estimatedTimeRemaining: number | undefined;
    if (this.totalBytes && throughput > 0 && this.bytesProcessed < this.totalBytes) {
      const remainingBytes = this.totalBytes - this.bytesProcessed;
      estimatedTimeRemaining = Math.max(0, remainingBytes / throughput);
    }

    return {
      bytesProcessed: this.bytesProcessed,
      totalBytes: this.totalBytes,
      chunksProcessed: this.chunksProcessed,
      percentComplete: this.totalBytes ? Math.min(100, (this.bytesProcessed / this.totalBytes) * 100) : undefined,
      throughputBytesPerSec: throughput,
      throughput, // Alias
      estimatedTimeRemaining,
      startTime: this.startTime,
      elapsedTime,
    } as any;
  }
}
