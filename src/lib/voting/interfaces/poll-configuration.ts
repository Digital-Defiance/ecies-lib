/**
 * Poll configuration structure defining voting method and options.
 */
export interface PollConfiguration {
  readonly method: string;
  readonly choices: string[];
  readonly maxWeight?: bigint;
  readonly threshold?: { numerator: number; denominator: number };
}
