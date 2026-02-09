/**
 * Interval Scheduler
 *
 * Manages decryption interval triggers for threshold voting polls.
 * Supports time-based, vote-count-based, and hybrid interval triggers
 * with minimum interval enforcement to prevent excessive ceremonies.
 *
 * @module voting/threshold
 */

import type { PlatformID } from '../../../interfaces/platform-id';
import { IntervalTriggerType } from './enumerations/interval-trigger-type';
import type { IntervalConfig } from './interfaces/interval-config';
import type { IIntervalScheduler } from './interfaces/interval-scheduler';
import type { IntervalTriggerEvent } from './interfaces/interval-trigger-event';

/**
 * Error thrown when a poll is not configured for interval scheduling.
 */
export class PollNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PollNotConfiguredError';
  }
}

/**
 * Error thrown when an interval configuration is invalid.
 */
export class InvalidIntervalConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidIntervalConfigError';
  }
}

/**
 * Error thrown when a poll is already started or already stopped.
 */
export class PollSchedulingStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PollSchedulingStateError';
  }
}

/**
 * Converts a PlatformID to a string key for Map lookups.
 */
function toKey<TID extends PlatformID>(id: TID): string {
  if (id instanceof Uint8Array) {
    return Array.from(id)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return String(id);
}

/** Internal state tracked per poll */
interface PollState<TID extends PlatformID> {
  readonly pollId: TID;
  readonly config: IntervalConfig;
  intervalNumber: number;
  voteCount: number;
  votesSinceLastTrigger: number;
  running: boolean;
  timerId: ReturnType<typeof setInterval> | null;
  lastTriggerTime: number;
}

/**
 * Validates an IntervalConfig, throwing InvalidIntervalConfigError on problems.
 */
function validateConfig(config: IntervalConfig): void {
  if (config.minimumIntervalMs < 0) {
    throw new InvalidIntervalConfigError(
      `minimumIntervalMs must be >= 0, got ${config.minimumIntervalMs}`,
    );
  }
  if (config.ceremonyTimeoutMs <= 0) {
    throw new InvalidIntervalConfigError(
      `ceremonyTimeoutMs must be > 0, got ${config.ceremonyTimeoutMs}`,
    );
  }

  const needsTime =
    config.triggerType === IntervalTriggerType.TimeBased ||
    config.triggerType === IntervalTriggerType.Hybrid;
  const needsVoteCount =
    config.triggerType === IntervalTriggerType.VoteCountBased ||
    config.triggerType === IntervalTriggerType.Hybrid;

  if (needsTime) {
    if (config.timeIntervalMs === undefined || config.timeIntervalMs <= 0) {
      throw new InvalidIntervalConfigError(
        `timeIntervalMs must be > 0 for ${config.triggerType} triggers, got ${config.timeIntervalMs}`,
      );
    }
    if (config.timeIntervalMs < config.minimumIntervalMs) {
      throw new InvalidIntervalConfigError(
        `timeIntervalMs (${config.timeIntervalMs}) must be >= minimumIntervalMs (${config.minimumIntervalMs})`,
      );
    }
  }

  if (needsVoteCount) {
    if (
      config.voteCountInterval === undefined ||
      config.voteCountInterval <= 0 ||
      !Number.isInteger(config.voteCountInterval)
    ) {
      throw new InvalidIntervalConfigError(
        `voteCountInterval must be a positive integer for ${config.triggerType} triggers, got ${config.voteCountInterval}`,
      );
    }
  }
}

/**
 * Scheduler for interval decryption triggers in threshold voting.
 *
 * Supports three trigger modes:
 * - **TimeBased**: Fires at fixed time intervals (e.g., every 30 minutes)
 * - **VoteCountBased**: Fires after a certain number of new votes
 * - **Hybrid**: Fires on whichever condition is met first (time or vote count)
 *
 * Enforces a minimum interval between triggers to prevent excessive
 * decryption ceremonies.
 *
 * @example
 * ```typescript
 * const scheduler = new IntervalScheduler<string>();
 * scheduler.configure('poll-1', {
 *   triggerType: IntervalTriggerType.TimeBased,
 *   timeIntervalMs: 60_000,
 *   minimumIntervalMs: 30_000,
 *   ceremonyTimeoutMs: 120_000,
 * });
 * scheduler.onTrigger((event) => {
 *   console.log(`Interval ${event.intervalNumber} triggered`);
 * });
 * scheduler.start('poll-1');
 * ```
 */
export class IntervalScheduler<
  TID extends PlatformID = Uint8Array,
> implements IIntervalScheduler<TID> {
  private readonly _polls: Map<string, PollState<TID>> = new Map();
  private readonly _triggerListeners: Array<
    (event: IntervalTriggerEvent<TID>) => void
  > = [];

  /**
   * Configure interval scheduling for a poll.
   *
   * @throws InvalidIntervalConfigError if the configuration is invalid
   * @throws PollSchedulingStateError if the poll is already running
   */
  configure(pollId: TID, config: IntervalConfig): void {
    validateConfig(config);

    const key = toKey(pollId);
    const existing = this._polls.get(key);
    if (existing?.running) {
      throw new PollSchedulingStateError(
        `Cannot reconfigure poll '${key}' while it is running. Stop it first.`,
      );
    }

    this._polls.set(key, {
      pollId,
      config,
      intervalNumber: 0,
      voteCount: 0,
      votesSinceLastTrigger: 0,
      running: false,
      timerId: null,
      lastTriggerTime: 0,
    });
  }

  /**
   * Start scheduling for a poll.
   *
   * For time-based and hybrid triggers, starts a repeating timer.
   * For vote-count-based triggers, the scheduler waits for notifyVote() calls.
   *
   * @throws PollNotConfiguredError if the poll has not been configured
   * @throws PollSchedulingStateError if the poll is already running
   */
  start(pollId: TID): void {
    const state = this.getState(pollId);
    if (state.running) {
      throw new PollSchedulingStateError(
        `Poll '${toKey(pollId)}' is already running`,
      );
    }

    state.running = true;
    state.lastTriggerTime = Date.now();

    const needsTimer =
      state.config.triggerType === IntervalTriggerType.TimeBased ||
      state.config.triggerType === IntervalTriggerType.Hybrid;

    if (needsTimer && state.config.timeIntervalMs) {
      state.timerId = setInterval(() => {
        this.emitTrigger(state, 'time');
      }, state.config.timeIntervalMs);
    }
  }

  /**
   * Stop scheduling for a poll.
   *
   * Clears any active timer and marks the poll as not running.
   *
   * @throws PollNotConfiguredError if the poll has not been configured
   */
  stop(pollId: TID): void {
    const state = this.getState(pollId);
    if (!state.running) {
      return; // idempotent
    }

    if (state.timerId !== null) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    state.running = false;
  }

  /**
   * Notify the scheduler that a new vote has been cast.
   *
   * For vote-count-based and hybrid triggers, this may fire a trigger
   * if the vote count threshold is reached.
   *
   * @throws PollNotConfiguredError if the poll has not been configured
   */
  notifyVote(pollId: TID): void {
    const state = this.getState(pollId);
    if (!state.running) return;

    state.voteCount++;
    state.votesSinceLastTrigger++;

    const needsVoteCount =
      state.config.triggerType === IntervalTriggerType.VoteCountBased ||
      state.config.triggerType === IntervalTriggerType.Hybrid;

    if (
      needsVoteCount &&
      state.config.voteCountInterval !== undefined &&
      state.votesSinceLastTrigger >= state.config.voteCountInterval
    ) {
      this.emitTrigger(state, 'vote-count');
    }
  }

  /**
   * Trigger a final decryption ceremony when a poll closes.
   *
   * This always fires regardless of minimum interval enforcement,
   * as the final tally must be computed.
   *
   * @throws PollNotConfiguredError if the poll has not been configured
   */
  triggerFinal(pollId: TID): void {
    const state = this.getState(pollId);

    // Stop the scheduler if running
    if (state.running) {
      this.stop(pollId);
    }

    // Final trigger always fires, bypassing minimum interval
    state.intervalNumber++;
    const event: IntervalTriggerEvent<TID> = {
      pollId: state.pollId,
      intervalNumber: state.intervalNumber,
      triggerType: state.config.triggerType,
      triggerReason: 'poll-close',
      currentVoteCount: state.voteCount,
      timestamp: Date.now(),
    };

    for (const listener of this._triggerListeners) {
      listener(event);
    }
  }

  /**
   * Subscribe to interval trigger events.
   */
  onTrigger(callback: (event: IntervalTriggerEvent<TID>) => void): void {
    this._triggerListeners.push(callback);
  }

  /**
   * Get the current interval number for a poll.
   *
   * @throws PollNotConfiguredError if the poll has not been configured
   */
  getCurrentInterval(pollId: TID): number {
    return this.getState(pollId).intervalNumber;
  }

  /**
   * Emit a trigger event, enforcing minimum interval between triggers.
   */
  private emitTrigger(
    state: PollState<TID>,
    reason: 'time' | 'vote-count',
  ): void {
    const now = Date.now();
    const elapsed = now - state.lastTriggerTime;

    if (elapsed < state.config.minimumIntervalMs) {
      return; // Rate-limited
    }

    state.intervalNumber++;
    state.lastTriggerTime = now;
    state.votesSinceLastTrigger = 0;

    const event: IntervalTriggerEvent<TID> = {
      pollId: state.pollId,
      intervalNumber: state.intervalNumber,
      triggerType: state.config.triggerType,
      triggerReason: reason,
      currentVoteCount: state.voteCount,
      timestamp: now,
    };

    for (const listener of this._triggerListeners) {
      listener(event);
    }
  }

  /**
   * Get the internal state for a poll, throwing if not configured.
   */
  private getState(pollId: TID): PollState<TID> {
    const key = toKey(pollId);
    const state = this._polls.get(key);
    if (!state) {
      throw new PollNotConfiguredError(
        `Poll '${key}' has not been configured for interval scheduling`,
      );
    }
    return state;
  }
}
