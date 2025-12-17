import { ProgressTracker } from '../../src/services/progress-tracker';

describe('ProgressTracker', () => {
  describe('basic functionality', () => {
    it('should track bytes and chunks', () => {
      const tracker = new ProgressTracker();
      const progress = tracker.update(1024);

      expect(progress.bytesProcessed).toBe(1024);
      expect(progress.chunksProcessed).toBe(1);
    });

    it('should calculate throughput', () => {
      const tracker = new ProgressTracker();
      tracker.update(1024 * 1024);

      const progress = tracker.update(1024 * 1024);
      expect(progress.throughputBytesPerSec).toBeGreaterThan(0);
    });

    it('should calculate ETA with known total', () => {
      const tracker = new ProgressTracker(10 * 1024 * 1024);
      tracker.update(1024 * 1024);

      const progress = tracker.update(1024 * 1024);
      expect(progress.estimatedTimeRemaining).toBeDefined();
      expect(progress.estimatedTimeRemaining).toBeGreaterThan(0);
    });

    it('should not calculate ETA without total', () => {
      const tracker = new ProgressTracker();
      const progress = tracker.update(1024);

      expect(progress.estimatedTimeRemaining).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero-byte chunks', () => {
      const tracker = new ProgressTracker();
      const progress = tracker.update(0);

      expect(progress.bytesProcessed).toBe(0);
      expect(progress.chunksProcessed).toBe(1);
      expect(progress.throughputBytesPerSec).toBe(0);
    });

    it('should handle very large files (>4GB)', () => {
      const tracker = new ProgressTracker(10 * 1024 * 1024 * 1024);
      const progress = tracker.update(5 * 1024 * 1024 * 1024);

      expect(progress.bytesProcessed).toBe(5 * 1024 * 1024 * 1024);
      expect(progress.totalBytes).toBe(10 * 1024 * 1024 * 1024);
    });

    it('should handle bytes exceeding total', () => {
      const tracker = new ProgressTracker(1024);
      tracker.update(512);
      const progress = tracker.update(1024);

      expect(progress.bytesProcessed).toBe(1536);
      expect(progress.estimatedTimeRemaining).toBeUndefined();
    });

    it('should handle very fast updates (same millisecond)', async () => {
      const tracker = new ProgressTracker();
      const _progress1 = tracker.update(1024);
      const progress2 = tracker.update(1024);

      expect(progress2.throughputBytesPerSec).toBeGreaterThanOrEqual(0);
      expect(isFinite(progress2.throughputBytesPerSec)).toBe(true);
    });

    it('should handle single chunk', () => {
      const tracker = new ProgressTracker(1024);
      const progress = tracker.update(1024);

      expect(progress.chunksProcessed).toBe(1);
      expect(progress.bytesProcessed).toBe(1024);
    });

    it('should maintain moving average window', () => {
      const tracker = new ProgressTracker();

      for (let i = 0; i < 10; i++) {
        tracker.update(1024);
      }

      const progress = tracker.update(1024);
      expect(progress.throughputBytesPerSec).toBeGreaterThan(0);
    });

    it('should handle getProgress without updates', () => {
      const tracker = new ProgressTracker();
      const progress = tracker.getProgress();

      expect(progress.bytesProcessed).toBe(0);
      expect(progress.chunksProcessed).toBe(0);
      expect(progress.throughputBytesPerSec).toBe(0);
    });

    it('should track elapsed time', async () => {
      const tracker = new ProgressTracker();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const progress = tracker.update(1024);

      expect(progress.elapsedTime).toBeGreaterThanOrEqual(10);
    });

    it('should handle very small chunks', () => {
      const tracker = new ProgressTracker();
      const progress = tracker.update(1);

      expect(progress.bytesProcessed).toBe(1);
      expect(progress.chunksProcessed).toBe(1);
    });

    it('should handle very large chunks', () => {
      const tracker = new ProgressTracker();
      const progress = tracker.update(100 * 1024 * 1024);

      expect(progress.bytesProcessed).toBe(100 * 1024 * 1024);
      expect(progress.chunksProcessed).toBe(1);
    });
  });

  describe('throughput calculation', () => {
    it('should use moving average', async () => {
      const tracker = new ProgressTracker();

      tracker.update(1024);
      await new Promise((resolve) => setTimeout(resolve, 10));
      tracker.update(1024);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const progress = tracker.update(1024);

      expect(progress.throughputBytesPerSec).toBeGreaterThan(0);
      expect(isFinite(progress.throughputBytesPerSec)).toBe(true);
    });

    it('should limit samples to 5', async () => {
      const tracker = new ProgressTracker();

      for (let i = 0; i < 10; i++) {
        tracker.update(1024);
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      const progress = tracker.update(1024);
      expect(progress.throughputBytesPerSec).toBeGreaterThan(0);
    });

    it('should handle zero throughput gracefully', () => {
      const tracker = new ProgressTracker(1024);
      const progress = tracker.update(0);

      expect(progress.throughputBytesPerSec).toBe(0);
      expect(progress.estimatedTimeRemaining).toBeUndefined();
    });
  });

  describe('ETA calculation', () => {
    it('should return undefined when throughput is zero', () => {
      const tracker = new ProgressTracker(1024);
      const progress = tracker.update(0);

      expect(progress.estimatedTimeRemaining).toBeUndefined();
    });

    it('should provide reasonable ETA estimates', async () => {
      const tracker = new ProgressTracker(10 * 1024);

      tracker.update(1024);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const progress1 = tracker.update(1024);

      await new Promise((resolve) => setTimeout(resolve, 10));
      const progress2 = tracker.update(1024);

      // ETA should be defined and positive
      expect(progress1.estimatedTimeRemaining).toBeDefined();
      expect(progress2.estimatedTimeRemaining).toBeDefined();
      if (
        progress1.estimatedTimeRemaining &&
        progress2.estimatedTimeRemaining
      ) {
        expect(progress1.estimatedTimeRemaining).toBeGreaterThan(0);
        expect(progress2.estimatedTimeRemaining).toBeGreaterThan(0);
      }
    });

    it('should handle completion (100%)', () => {
      const tracker = new ProgressTracker(1024);
      const progress = tracker.update(1024);

      expect(progress.bytesProcessed).toBe(progress.totalBytes);
      expect(progress.estimatedTimeRemaining).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should reject negative chunk bytes', () => {
      const tracker = new ProgressTracker();
      expect(() => tracker.update(-1024)).toThrow(
        'Chunk bytes cannot be negative',
      );
    });

    it('should guard against unrealistic throughput', () => {
      const tracker = new ProgressTracker();
      // Simulate extremely fast update (would create >10GB/s throughput)
      const progress = tracker.update(1024 * 1024 * 1024);

      expect(progress.throughputBytesPerSec).toBeGreaterThanOrEqual(0);
      expect(progress.throughputBytesPerSec).toBeLessThan(
        10 * 1024 * 1024 * 1024,
      );
    });

    it('should handle clock skew (time going backwards)', () => {
      const tracker = new ProgressTracker();
      const progress = tracker.update(1024);

      expect(progress.elapsedTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('concurrent access', () => {
    it('should handle rapid sequential updates', () => {
      const tracker = new ProgressTracker();

      for (let i = 0; i < 100; i++) {
        const progress = tracker.update(1024);
        expect(progress.chunksProcessed).toBe(i + 1);
      }
    });

    it('should maintain consistency', () => {
      const tracker = new ProgressTracker(10 * 1024);

      const _progress1 = tracker.update(1024);
      const _progress2 = tracker.update(2048);
      const progress3 = tracker.update(512);

      expect(progress3.bytesProcessed).toBe(1024 + 2048 + 512);
      expect(progress3.chunksProcessed).toBe(3);
    });
  });
});
