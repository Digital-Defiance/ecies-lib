/**
 * Public Tally Feed
 *
 * Provides a real-time subscription API for publishing and consuming
 * interval tally updates during threshold voting. Observers (media,
 * auditors, public) subscribe to a poll and receive verified tallies
 * as decryption ceremonies complete.
 *
 * @module voting/threshold
 */

import type { PlatformID } from '../../../interfaces/platform-id';
import type { IntervalTally } from './interfaces/interval-tally';
import type { IPublicTallyFeed } from './interfaces/public-tally-feed';
import type { TallySubscription } from './interfaces/tally-subscription';

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

/**
 * Generates a unique subscription ID.
 */
function generateSubscriptionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Internal subscription record that implements TallySubscription.
 */
class Subscription<TID extends PlatformID> implements TallySubscription<TID> {
  readonly id: string;
  readonly pollId: TID;
  readonly onTally: (tally: IntervalTally<TID>) => void;
  private readonly _removeCallback: (id: string) => void;

  constructor(
    pollId: TID,
    onTally: (tally: IntervalTally<TID>) => void,
    removeCallback: (id: string) => void,
  ) {
    this.id = generateSubscriptionId();
    this.pollId = pollId;
    this.onTally = onTally;
    this._removeCallback = removeCallback;
  }

  unsubscribe(): void {
    this._removeCallback(this.id);
  }
}

/**
 * Real-time public tally feed for threshold voting.
 *
 * Publishes verified interval tallies and allows subscribers to receive
 * updates as they happen. Maintains a complete history of all published
 * tallies per poll.
 *
 * Features:
 * - Publish interval tallies with cryptographic proofs
 * - Subscribe to real-time updates for a specific poll
 * - Initial state delivery on subscription (current tally + history replay)
 * - Historical access to all previous interval tallies
 * - Lookup by specific interval number
 *
 * @example
 * ```typescript
 * const feed = new PublicTallyFeed<string>();
 *
 * // Subscribe to updates
 * const sub = feed.subscribe('poll-1', (tally) => {
 *   console.log(`Interval ${tally.intervalNumber}: ${tally.tallies}`);
 * });
 *
 * // Publish a tally (triggers subscriber callbacks)
 * feed.publish(intervalTally);
 *
 * // Query history
 * const history = feed.getHistory('poll-1');
 * const specific = feed.getTallyAtInterval('poll-1', 3);
 *
 * // Cleanup
 * sub.unsubscribe();
 * ```
 */
export class PublicTallyFeed<
  TID extends PlatformID = Uint8Array,
> implements IPublicTallyFeed<TID> {
  /** Poll ID → ordered list of tallies (by publish order) */
  private readonly _history: Map<string, IntervalTally<TID>[]> = new Map();

  /** Poll ID → interval number → tally (for fast lookup) */
  private readonly _intervalIndex: Map<
    string,
    Map<number, IntervalTally<TID>>
  > = new Map();

  /** Subscription ID → Subscription */
  private readonly _subscriptions: Map<string, Subscription<TID>> = new Map();

  /** Poll key → Set of subscription IDs */
  private readonly _pollSubscriptions: Map<string, Set<string>> = new Map();

  /**
   * Publish a new interval tally.
   *
   * Stores the tally in history and notifies all subscribers for the poll.
   *
   * @param tally - The interval tally to publish
   */
  publish(tally: IntervalTally<TID>): void {
    const pollKey = toKey(tally.pollId);

    // Store in history
    let history = this._history.get(pollKey);
    if (!history) {
      history = [];
      this._history.set(pollKey, history);
    }
    history.push(tally);

    // Index by interval number
    let intervalMap = this._intervalIndex.get(pollKey);
    if (!intervalMap) {
      intervalMap = new Map();
      this._intervalIndex.set(pollKey, intervalMap);
    }
    intervalMap.set(tally.intervalNumber, tally);

    // Notify subscribers
    const subIds = this._pollSubscriptions.get(pollKey);
    if (subIds) {
      for (const subId of subIds) {
        const sub = this._subscriptions.get(subId);
        if (sub) {
          sub.onTally(tally);
        }
      }
    }
  }

  /**
   * Subscribe to tally updates for a poll.
   *
   * On subscription, the callback is immediately invoked with the current
   * (latest) tally if one exists, providing initial state delivery.
   *
   * @param pollId - The poll to subscribe to
   * @param onTally - Callback invoked for each new tally
   * @returns A subscription handle with an `unsubscribe()` method
   */
  subscribe(
    pollId: TID,
    onTally: (tally: IntervalTally<TID>) => void,
  ): TallySubscription<TID> {
    const pollKey = toKey(pollId);

    const subscription = new Subscription<TID>(pollId, onTally, (id) => {
      this._subscriptions.delete(id);
      const subs = this._pollSubscriptions.get(pollKey);
      if (subs) {
        subs.delete(id);
        if (subs.size === 0) {
          this._pollSubscriptions.delete(pollKey);
        }
      }
    });

    this._subscriptions.set(subscription.id, subscription);

    let pollSubs = this._pollSubscriptions.get(pollKey);
    if (!pollSubs) {
      pollSubs = new Set();
      this._pollSubscriptions.set(pollKey, pollSubs);
    }
    pollSubs.add(subscription.id);

    // Initial state delivery: replay current tally
    const current = this.getCurrentTally(pollId);
    if (current) {
      onTally(current);
    }

    return subscription;
  }

  /**
   * Get the most recently published tally for a poll.
   *
   * @param pollId - The poll to query
   * @returns The latest tally, or undefined if none published
   */
  getCurrentTally(pollId: TID): IntervalTally<TID> | undefined {
    const history = this._history.get(toKey(pollId));
    if (!history || history.length === 0) return undefined;
    return history[history.length - 1];
  }

  /**
   * Get all historical tallies for a poll in publication order.
   *
   * @param pollId - The poll to query
   * @returns Ordered array of all published tallies
   */
  getHistory(pollId: TID): readonly IntervalTally<TID>[] {
    return this._history.get(toKey(pollId)) ?? [];
  }

  /**
   * Get the tally for a specific interval number.
   *
   * @param pollId - The poll to query
   * @param intervalNumber - The interval number to look up
   * @returns The tally for that interval, or undefined if not found
   */
  getTallyAtInterval(
    pollId: TID,
    intervalNumber: number,
  ): IntervalTally<TID> | undefined {
    const intervalMap = this._intervalIndex.get(toKey(pollId));
    if (!intervalMap) return undefined;
    return intervalMap.get(intervalNumber);
  }
}
