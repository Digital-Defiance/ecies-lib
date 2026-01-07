import { describe, it, expect, beforeEach } from '@jest/globals';
import { BatchVoteProcessor } from './persistent-state';

describe('Persistent State', () => {
  describe('BatchVoteProcessor', () => {
    let processor: BatchVoteProcessor;

    beforeEach(() => {
      processor = new BatchVoteProcessor(10);
    });

    it('should create with default batch size', () => {
      const defaultProcessor = new BatchVoteProcessor();
      expect(defaultProcessor).toBeDefined();
    });

    it('should create with custom batch size', () => {
      const customProcessor = new BatchVoteProcessor(100);
      expect(customProcessor).toBeDefined();
    });

    it('should add votes to batch', () => {
      const voter = { id: '1' };
      const vote = { choice: 0 };

      const shouldProcess = processor.addVote(voter, vote);
      expect(shouldProcess).toBe(false);
      expect(processor.getBatchSize()).toBe(1);
    });

    it('should signal when batch is full', () => {
      for (let i = 0; i < 9; i++) {
        const shouldProcess = processor.addVote({ id: `${i}` }, { choice: 0 });
        expect(shouldProcess).toBe(false);
      }

      const shouldProcess = processor.addVote({ id: '9' }, { choice: 0 });
      expect(shouldProcess).toBe(true);
      expect(processor.getBatchSize()).toBe(10);
    });

    it('should process batch', async () => {
      const votes: any[] = [];

      for (let i = 0; i < 5; i++) {
        processor.addVote({ id: `${i}` }, { choice: i % 3 });
      }

      await processor.processBatch(async (batch) => {
        votes.push(...batch);
      });

      expect(votes).toHaveLength(5);
      expect(processor.getBatchSize()).toBe(0);
    });

    it('should clear batch after processing', async () => {
      for (let i = 0; i < 10; i++) {
        processor.addVote({ id: `${i}` }, { choice: 0 });
      }

      await processor.processBatch(async () => {});
      expect(processor.getBatchSize()).toBe(0);
    });

    it('should handle empty batch', async () => {
      let called = false;
      await processor.processBatch(async () => {
        called = true;
      });

      expect(called).toBe(false);
    });

    it('should handle multiple batches', async () => {
      const allVotes: any[] = [];

      // First batch
      for (let i = 0; i < 10; i++) {
        processor.addVote({ id: `${i}` }, { choice: 0 });
      }
      await processor.processBatch(async (batch) => {
        allVotes.push(...batch);
      });

      // Second batch
      for (let i = 10; i < 20; i++) {
        processor.addVote({ id: `${i}` }, { choice: 1 });
      }
      await processor.processBatch(async (batch) => {
        allVotes.push(...batch);
      });

      expect(allVotes).toHaveLength(20);
    });

    it('should handle partial batch processing', async () => {
      const votes: any[] = [];

      for (let i = 0; i < 5; i++) {
        processor.addVote({ id: `${i}` }, { choice: 0 });
      }

      await processor.processBatch(async (batch) => {
        votes.push(...batch);
      });

      expect(votes).toHaveLength(5);
      expect(processor.getBatchSize()).toBe(0);
    });

    it('should preserve vote data', async () => {
      const voter1 = { id: '1', name: 'Alice' };
      const vote1 = { choice: 0, timestamp: 123 };
      const voter2 = { id: '2', name: 'Bob' };
      const vote2 = { choice: 1, timestamp: 456 };

      processor.addVote(voter1, vote1);
      processor.addVote(voter2, vote2);

      let receivedBatch: any[] = [];
      await processor.processBatch(async (batch) => {
        receivedBatch = batch;
      });

      expect(receivedBatch).toHaveLength(2);
      expect(receivedBatch[0].voter).toEqual(voter1);
      expect(receivedBatch[0].vote).toEqual(vote1);
      expect(receivedBatch[1].voter).toEqual(voter2);
      expect(receivedBatch[1].vote).toEqual(vote2);
    });

    it('should handle async processing errors', async () => {
      processor.addVote({ id: '1' }, { choice: 0 });

      await expect(
        processor.processBatch(async () => {
          throw new Error('Processing failed');
        }),
      ).rejects.toThrow('Processing failed');
    });

    it('should handle large batches', async () => {
      const largeProcessor = new BatchVoteProcessor(1000);

      for (let i = 0; i < 1000; i++) {
        largeProcessor.addVote({ id: `${i}` }, { choice: i % 3 });
      }

      let count = 0;
      await largeProcessor.processBatch(async (batch) => {
        count = batch.length;
      });

      expect(count).toBe(1000);
    });

    it('should maintain order of votes', async () => {
      const votes: number[] = [];

      for (let i = 0; i < 10; i++) {
        processor.addVote({ id: `${i}` }, { choice: i });
      }

      await processor.processBatch(async (batch) => {
        for (const item of batch) {
          votes.push(item.vote.choice);
        }
      });

      expect(votes).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('IVoteLogger Interface', () => {
    it('should define required methods', () => {
      // Interface test - just verify structure
      const mockLogger = {
        appendVote: async () => {},
        getVoteCount: () => 0,
        replayVotes: async function* () {},
      };

      expect(mockLogger.appendVote).toBeDefined();
      expect(mockLogger.getVoteCount).toBeDefined();
      expect(mockLogger.replayVotes).toBeDefined();
    });
  });

  describe('ICheckpointManager Interface', () => {
    it('should define required methods', () => {
      // Interface test - just verify structure
      const mockManager = {
        saveCheckpoint: async () => {},
        loadLatestCheckpoint: async () => null,
        listCheckpoints: async () => [],
      };

      expect(mockManager.saveCheckpoint).toBeDefined();
      expect(mockManager.loadLatestCheckpoint).toBeDefined();
      expect(mockManager.listCheckpoints).toBeDefined();
    });
  });
});
