/**
 * Persistent State Interfaces for Large-Scale Elections
 * Browser-compatible interfaces - actual persistence in node-ecies-lib
 */

interface VoteBatch {
  voter: unknown;
  vote: unknown;
}

/**
 * Memory-efficient batch processor (browser-compatible)
 */
export class BatchVoteProcessor {
  private readonly batchSize: number;
  private currentBatch: VoteBatch[] = [];

  constructor(batchSize = 1000) {
    this.batchSize = batchSize;
  }

  addVote(voter: unknown, vote: unknown): boolean {
    this.currentBatch.push({ voter, vote });
    return this.currentBatch.length >= this.batchSize;
  }

  async processBatch(
    processor: (batch: VoteBatch[]) => Promise<void>,
  ): Promise<void> {
    if (this.currentBatch.length === 0) return;
    await processor(this.currentBatch);
    this.currentBatch = [];
  }

  getBatchSize(): number {
    return this.currentBatch.length;
  }
}
