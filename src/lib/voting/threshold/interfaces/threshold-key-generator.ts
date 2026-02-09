import type { ThresholdKeyConfig } from './threshold-key-config';
import type { ThresholdKeyPair } from './threshold-key-pair';

/**
 * Interface for threshold key generation.
 */
export interface IThresholdKeyGenerator {
  /** Generate a new threshold key pair */
  generate(config: ThresholdKeyConfig): Promise<ThresholdKeyPair>;

  /** Validate a threshold configuration */
  validateConfig(config: ThresholdKeyConfig): void;
}
