/**
 * Threshold Poll Factory
 *
 * Creates threshold-enabled polls with Guardian validation and audit logging,
 * as well as standard single-authority polls for backward compatibility.
 *
 * @module voting/threshold
 */

import type { PublicKey } from 'paillier-bigint';
import type { IMember, PlatformID } from '../../../interfaces';
import { ImmutableAuditLog } from '../audit';
import { VotingMethod } from '../enumerations';
import type { IPoll } from '../interfaces/poll';
import { Poll } from '../poll-core';
import { GuardianStatus } from './enumerations/guardian-status';
import type { IThresholdPoll } from './interfaces/threshold-poll';
import type { ThresholdPollConfig } from './interfaces/threshold-poll-config';
import type { IThresholdPollFactory } from './interfaces/threshold-poll-factory';
import { ThresholdKeyGenerator } from './threshold-key-generator';
import { ThresholdPoll } from './threshold-poll';

/**
 * Error thrown when Guardian validation fails during threshold poll creation.
 */
export class InsufficientGuardiansError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientGuardiansError';
  }
}

/**
 * Error thrown when threshold poll configuration is invalid.
 */
export class InvalidThresholdPollConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidThresholdPollConfigError';
  }
}

/**
 * Factory for creating threshold-enabled and standard polls.
 *
 * Validates Guardian availability before creating threshold polls and
 * records threshold configuration in the audit log.
 *
 * @example
 * ```typescript
 * const factory = new ThresholdPollFactory<Uint8Array>();
 *
 * // Create a threshold poll
 * const thresholdPoll = await factory.createThresholdPoll(
 *   ['Alice', 'Bob', 'Charlie'],
 *   VotingMethod.Plurality,
 *   authority,
 *   thresholdConfig,
 * );
 *
 * // Create a standard poll (backward compatible)
 * const standardPoll = factory.createStandardPoll(
 *   ['Yes', 'No'],
 *   VotingMethod.YesNo,
 *   authority,
 * );
 * ```
 */
export class ThresholdPollFactory<
  TID extends PlatformID = Uint8Array,
> implements IThresholdPollFactory<TID> {
  /**
   * Create a threshold-enabled poll.
   *
   * Validates that:
   * - The authority has voting keys
   * - At least k Guardians are registered and online/registered
   * - The threshold configuration is valid
   *
   * If no key pair is provided in the config, generates one automatically.
   *
   * Records the threshold configuration in the audit log.
   *
   * @param choices - Poll choice names (minimum 2)
   * @param method - Voting method to use
   * @param authority - The election authority (must have voting keys)
   * @param thresholdConfig - Threshold configuration including Guardians and intervals
   * @returns A threshold-enabled poll
   * @throws InsufficientGuardiansError if not enough Guardians are available
   * @throws InvalidThresholdPollConfigError if configuration is invalid
   */
  createThresholdPoll(
    choices: string[],
    method: VotingMethod,
    authority: IMember<TID>,
    thresholdConfig: ThresholdPollConfig<TID>,
  ): IThresholdPoll<TID> {
    // Validate authority has voting keys
    if (!authority.votingPublicKey) {
      throw new Error('Authority must have voting public key');
    }

    // Validate threshold configuration
    const keyGen = new ThresholdKeyGenerator();
    keyGen.validateConfig(thresholdConfig.thresholdConfig);

    // Validate Guardian availability
    const registry = thresholdConfig.guardianRegistry;
    const totalGuardians = registry.count;
    const { threshold, totalShares } = thresholdConfig.thresholdConfig;

    if (totalGuardians < threshold) {
      throw new InsufficientGuardiansError(
        `Need at least ${threshold} registered Guardians, but only ${totalGuardians} are registered`,
      );
    }

    // Check that at least k Guardians are available (online or registered)
    const allGuardians = registry.getAllGuardians();
    const availableGuardians = allGuardians.filter(
      (g) =>
        g.status === GuardianStatus.Online ||
        g.status === GuardianStatus.Registered,
    );

    if (availableGuardians.length < threshold) {
      throw new InsufficientGuardiansError(
        `Need at least ${threshold} available Guardians (online or registered), but only ${availableGuardians.length} are available`,
      );
    }

    // Validate that registry totalShares matches config
    if (totalGuardians > totalShares) {
      throw new InvalidThresholdPollConfigError(
        `Guardian registry has ${totalGuardians} Guardians but threshold config specifies ${totalShares} total shares`,
      );
    }

    // Determine the public key to use
    let publicKey: PublicKey;
    if (thresholdConfig.keyPair) {
      publicKey = thresholdConfig.keyPair.publicKey;
    } else if (authority.votingPublicKey) {
      publicKey = authority.votingPublicKey;
    } else {
      throw new InvalidThresholdPollConfigError(
        'Either a pre-generated key pair or authority voting keys are required',
      );
    }

    // Generate poll ID
    const id = authority.idProvider.generate() as TID;

    // Create the threshold poll
    const poll = new ThresholdPoll<TID>(
      id,
      choices,
      method,
      authority,
      publicKey,
      thresholdConfig,
    );

    // Record threshold configuration in audit log
    const auditLog = poll.auditLog as ImmutableAuditLog<TID>;
    auditLog.recordPollCreated(id, {
      thresholdEnabled: true,
      threshold,
      totalShares,
      availableGuardians: availableGuardians.length,
      intervalTriggerType: thresholdConfig.intervalConfig.triggerType,
      ceremonyTimeoutMs: thresholdConfig.intervalConfig.ceremonyTimeoutMs,
    });

    return poll;
  }

  /**
   * Create a standard single-authority poll (backward compatible).
   *
   * This creates a regular poll without threshold decryption,
   * maintaining full backward compatibility with existing code.
   *
   * @param choices - Poll choice names (minimum 2)
   * @param method - Voting method to use
   * @param authority - The election authority (must have voting keys)
   * @returns A standard poll
   */
  createStandardPoll(
    choices: string[],
    method: VotingMethod,
    authority: IMember<TID>,
  ): IPoll<TID> {
    if (!authority.votingPublicKey) {
      throw new Error('Authority must have voting public key');
    }

    const id = authority.idProvider.generate() as TID;

    return new Poll<TID>(
      id,
      choices,
      method,
      authority,
      authority.votingPublicKey,
    );
  }
}
