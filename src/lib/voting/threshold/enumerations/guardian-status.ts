/**
 * Guardian availability status for threshold voting.
 *
 * Guardians are trusted key holders who possess shares of the threshold
 * decryption key. Their status is tracked to ensure sufficient Guardians
 * are available for decryption ceremonies.
 */
export enum GuardianStatus {
  /** Guardian is registered but not yet confirmed online */
  Registered = 'registered',
  /** Guardian is online and available for ceremonies */
  Online = 'online',
  /** Guardian is temporarily offline */
  Offline = 'offline',
  /** Guardian is permanently unavailable (requires backup activation) */
  Unavailable = 'unavailable',
}
