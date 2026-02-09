import type { PublicKey } from 'paillier-bigint';
import type { PlatformID } from '../../../../interfaces/platform-id';
import type { IntervalTally } from './interval-tally';
import type { VerificationResult } from './verification-result';

/**
 * Interface for third-party tally verification.
 */
export interface ITallyVerifier<TID extends PlatformID = Uint8Array> {
  /** Verify a published interval tally */
  verify(
    tally: IntervalTally<TID>,
    encryptedTally: bigint[],
    verificationKeys: readonly Uint8Array[],
    publicKey: PublicKey,
    registeredGuardians: readonly number[],
  ): VerificationResult;
}
