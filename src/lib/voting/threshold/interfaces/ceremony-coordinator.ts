import type { PlatformID } from '../../../../interfaces/platform-id';
import type { Ceremony } from './ceremony';
import type { PartialDecryption } from './partial-decryption';

/**
 * Interface for coordinating decryption ceremonies.
 */
export interface ICeremonyCoordinator<TID extends PlatformID = Uint8Array> {
  /** Start a new decryption ceremony */
  startCeremony(
    pollId: TID,
    intervalNumber: number,
    encryptedTally: bigint[],
  ): Ceremony<TID>;

  /** Submit a partial decryption */
  submitPartial(ceremonyId: string, partial: PartialDecryption): boolean;

  /** Get ceremony by ID */
  getCeremony(ceremonyId: string): Ceremony<TID> | undefined;

  /** Get ceremonies for a poll */
  getCeremoniesForPoll(pollId: TID): readonly Ceremony<TID>[];

  /** Subscribe to ceremony completion events */
  onCeremonyComplete(callback: (ceremony: Ceremony<TID>) => void): void;
}
