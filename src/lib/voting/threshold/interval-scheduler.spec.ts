/**
 * Tests for IntervalScheduler
 *
 * Validates time-based, vote-count-based, and hybrid interval triggers,
 * minimum interval enforcement, and scheduling lifecycle.
 */
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { IntervalTriggerType } from './enumerations/interval-trigger-type';
import type { IntervalConfig } from './interfaces/interval-config';
import type { IntervalTriggerEvent } from './interfaces/interval-trigger-event';
import {
  IntervalScheduler,
  PollNotConfiguredError,
  InvalidIntervalConfigError,
  PollSchedulingStateError,
} from './interval-scheduler';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function makeTimeConfig(overrides?: Partial<IntervalConfig>): IntervalConfig {
  return {
    triggerType: IntervalTriggerType.TimeBased,
    timeIntervalMs: 60_000,
    minimumIntervalMs: 10_000,
    ceremonyTimeoutMs: 120_000,
    ...overrides,
  };
}

function makeVoteCountConfig(
  overrides?: Partial<IntervalConfig>,
): IntervalConfig {
  return {
    triggerType: IntervalTriggerType.VoteCountBased,
    voteCountInterval: 100,
    minimumIntervalMs: 10_000,
    ceremonyTimeoutMs: 120_000,
    ...overrides,
  };
}

function makeHybridConfig(overrides?: Partial<IntervalConfig>): IntervalConfig {
  return {
    triggerType: IntervalTriggerType.Hybrid,
    timeIntervalMs: 60_000,
    voteCountInterval: 100,
    minimumIntervalMs: 10_000,
    ceremonyTimeoutMs: 120_000,
    ...overrides,
  };
}

describe('IntervalScheduler', () => {
  describe('configure', () => {
    it('should accept a valid time-based config', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() =>
        scheduler.configure('poll-1', makeTimeConfig()),
      ).not.toThrow();
    });

    it('should accept a valid vote-count-based config', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() =>
        scheduler.configure('poll-1', makeVoteCountConfig()),
      ).not.toThrow();
    });

    it('should accept a valid hybrid config', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() =>
        scheduler.configure('poll-1', makeHybridConfig()),
      ).not.toThrow();
    });

    it('should reject negative minimumIntervalMs', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() =>
        scheduler.configure(
          'poll-1',
          makeTimeConfig({ minimumIntervalMs: -1 }),
        ),
      ).toThrow(InvalidIntervalConfigError);
    });

    it('should reject non-positive ceremonyTimeoutMs', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() =>
        scheduler.configure('poll-1', makeTimeConfig({ ceremonyTimeoutMs: 0 })),
      ).toThrow(InvalidIntervalConfigError);
    });

    it('should reject time-based config without timeIntervalMs', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() =>
        scheduler.configure(
          'poll-1',
          makeTimeConfig({ timeIntervalMs: undefined }),
        ),
      ).toThrow(InvalidIntervalConfigError);
    });

    it('should reject time-based config with timeIntervalMs < minimumIntervalMs', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() =>
        scheduler.configure(
          'poll-1',
          makeTimeConfig({ timeIntervalMs: 5_000, minimumIntervalMs: 10_000 }),
        ),
      ).toThrow(InvalidIntervalConfigError);
    });

    it('should reject vote-count config without voteCountInterval', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() =>
        scheduler.configure(
          'poll-1',
          makeVoteCountConfig({ voteCountInterval: undefined }),
        ),
      ).toThrow(InvalidIntervalConfigError);
    });

    it('should reject vote-count config with non-integer voteCountInterval', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() =>
        scheduler.configure(
          'poll-1',
          makeVoteCountConfig({ voteCountInterval: 10.5 }),
        ),
      ).toThrow(InvalidIntervalConfigError);
    });

    it('should reject reconfiguring a running poll', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure('poll-1', makeTimeConfig());
      scheduler.start('poll-1');
      expect(() => scheduler.configure('poll-1', makeTimeConfig())).toThrow(
        PollSchedulingStateError,
      );
      scheduler.stop('poll-1');
    });

    it('should allow reconfiguring a stopped poll', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure('poll-1', makeTimeConfig());
      scheduler.start('poll-1');
      scheduler.stop('poll-1');
      expect(() =>
        scheduler.configure('poll-1', makeVoteCountConfig()),
      ).not.toThrow();
    });
  });

  describe('start / stop', () => {
    it('should start and stop without error', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure('poll-1', makeTimeConfig());
      scheduler.start('poll-1');
      scheduler.stop('poll-1');
    });

    it('should throw when starting an unconfigured poll', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() => scheduler.start('unknown')).toThrow(PollNotConfiguredError);
    });

    it('should throw when starting an already running poll', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure('poll-1', makeTimeConfig());
      scheduler.start('poll-1');
      expect(() => scheduler.start('poll-1')).toThrow(PollSchedulingStateError);
      scheduler.stop('poll-1');
    });

    it('should be idempotent when stopping a non-running poll', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure('poll-1', makeTimeConfig());
      expect(() => scheduler.stop('poll-1')).not.toThrow();
    });
  });

  describe('time-based triggers', () => {
    it('should fire trigger after time interval elapses', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure('poll-1', makeTimeConfig({ timeIntervalMs: 60_000 }));

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.start('poll-1');

      jest.advanceTimersByTime(60_000);
      expect(events).toHaveLength(1);
      expect(events[0].intervalNumber).toBe(1);
      expect(events[0].triggerReason).toBe('time');
      expect(events[0].triggerType).toBe(IntervalTriggerType.TimeBased);
      expect(events[0].pollId).toBe('poll-1');

      scheduler.stop('poll-1');
    });

    it('should fire multiple triggers over time', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeTimeConfig({ timeIntervalMs: 30_000, minimumIntervalMs: 10_000 }),
      );

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.start('poll-1');

      jest.advanceTimersByTime(90_000);
      expect(events).toHaveLength(3);
      expect(events[0].intervalNumber).toBe(1);
      expect(events[1].intervalNumber).toBe(2);
      expect(events[2].intervalNumber).toBe(3);

      scheduler.stop('poll-1');
    });

    it('should not fire after stop', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeTimeConfig({ timeIntervalMs: 30_000, minimumIntervalMs: 10_000 }),
      );

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.start('poll-1');
      jest.advanceTimersByTime(30_000);
      expect(events).toHaveLength(1);

      scheduler.stop('poll-1');
      jest.advanceTimersByTime(60_000);
      expect(events).toHaveLength(1);
    });
  });

  describe('vote-count-based triggers', () => {
    it('should fire trigger when vote count threshold is reached', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeVoteCountConfig({ voteCountInterval: 5, minimumIntervalMs: 0 }),
      );

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.start('poll-1');

      for (let i = 0; i < 4; i++) {
        scheduler.notifyVote('poll-1');
      }
      expect(events).toHaveLength(0);

      scheduler.notifyVote('poll-1');
      expect(events).toHaveLength(1);
      expect(events[0].triggerReason).toBe('vote-count');
      expect(events[0].currentVoteCount).toBe(5);

      scheduler.stop('poll-1');
    });

    it('should fire again after another batch of votes', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeVoteCountConfig({ voteCountInterval: 3, minimumIntervalMs: 0 }),
      );

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.start('poll-1');

      for (let i = 0; i < 6; i++) {
        scheduler.notifyVote('poll-1');
      }
      expect(events).toHaveLength(2);
      expect(events[0].intervalNumber).toBe(1);
      expect(events[0].currentVoteCount).toBe(3);
      expect(events[1].intervalNumber).toBe(2);
      expect(events[1].currentVoteCount).toBe(6);

      scheduler.stop('poll-1');
    });

    it('should not fire when poll is not running', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeVoteCountConfig({ voteCountInterval: 1, minimumIntervalMs: 0 }),
      );

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      // Not started yet
      scheduler.notifyVote('poll-1');
      expect(events).toHaveLength(0);
    });
  });

  describe('hybrid triggers', () => {
    it('should fire on time trigger in hybrid mode', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeHybridConfig({
          timeIntervalMs: 30_000,
          voteCountInterval: 1000,
          minimumIntervalMs: 10_000,
        }),
      );

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.start('poll-1');
      jest.advanceTimersByTime(30_000);

      expect(events).toHaveLength(1);
      expect(events[0].triggerReason).toBe('time');

      scheduler.stop('poll-1');
    });

    it('should fire on vote-count trigger in hybrid mode', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeHybridConfig({
          timeIntervalMs: 600_000,
          voteCountInterval: 5,
          minimumIntervalMs: 0,
        }),
      );

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.start('poll-1');

      for (let i = 0; i < 5; i++) {
        scheduler.notifyVote('poll-1');
      }

      expect(events).toHaveLength(1);
      expect(events[0].triggerReason).toBe('vote-count');

      scheduler.stop('poll-1');
    });
  });

  describe('minimum interval enforcement', () => {
    it('should suppress vote-count triggers within minimum interval', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeVoteCountConfig({
          voteCountInterval: 1,
          minimumIntervalMs: 60_000,
        }),
      );

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.start('poll-1');

      // First vote triggers immediately (elapsed since start > 0 is tricky with fake timers)
      // Advance past minimum interval first
      jest.advanceTimersByTime(60_000);
      scheduler.notifyVote('poll-1');
      expect(events).toHaveLength(1);

      // Second vote immediately after should be suppressed
      scheduler.notifyVote('poll-1');
      expect(events).toHaveLength(1);

      // After minimum interval passes, next vote should trigger
      jest.advanceTimersByTime(60_000);
      scheduler.notifyVote('poll-1');
      expect(events).toHaveLength(2);

      scheduler.stop('poll-1');
    });
  });

  describe('triggerFinal', () => {
    it('should fire a final trigger with poll-close reason', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure('poll-1', makeTimeConfig());

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.start('poll-1');
      scheduler.triggerFinal('poll-1');

      expect(events).toHaveLength(1);
      expect(events[0].triggerReason).toBe('poll-close');
      expect(events[0].intervalNumber).toBe(1);
    });

    it('should stop the scheduler when triggering final', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeTimeConfig({ timeIntervalMs: 30_000, minimumIntervalMs: 10_000 }),
      );

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.start('poll-1');
      scheduler.triggerFinal('poll-1');

      // No more time-based triggers should fire
      jest.advanceTimersByTime(120_000);
      expect(events).toHaveLength(1);
    });

    it('should work even if poll was not started', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure('poll-1', makeTimeConfig());

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.triggerFinal('poll-1');
      expect(events).toHaveLength(1);
      expect(events[0].triggerReason).toBe('poll-close');
    });

    it('should include correct vote count in final trigger', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeVoteCountConfig({
          voteCountInterval: 1000,
          minimumIntervalMs: 0,
        }),
      );

      scheduler.start('poll-1');
      for (let i = 0; i < 42; i++) {
        scheduler.notifyVote('poll-1');
      }

      const events: IntervalTriggerEvent<string>[] = [];
      scheduler.onTrigger((e) => events.push(e));

      scheduler.triggerFinal('poll-1');
      expect(events[0].currentVoteCount).toBe(42);
    });
  });

  describe('getCurrentInterval', () => {
    it('should return 0 before any triggers', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure('poll-1', makeTimeConfig());
      expect(scheduler.getCurrentInterval('poll-1')).toBe(0);
    });

    it('should increment after triggers', () => {
      const scheduler = new IntervalScheduler<string>();
      scheduler.configure(
        'poll-1',
        makeTimeConfig({ timeIntervalMs: 10_000, minimumIntervalMs: 0 }),
      );
      scheduler.start('poll-1');

      jest.advanceTimersByTime(20_000);
      expect(scheduler.getCurrentInterval('poll-1')).toBe(2);

      scheduler.stop('poll-1');
    });

    it('should throw for unconfigured poll', () => {
      const scheduler = new IntervalScheduler<string>();
      expect(() => scheduler.getCurrentInterval('unknown')).toThrow(
        PollNotConfiguredError,
      );
    });
  });
});
