/**
 * Wallet and seed structure for HD wallet operations.
 */
import { Wallet } from '@ethereumjs/wallet';

export interface IWalletSeed {
  wallet: Wallet;
  seed: Uint8Array;
}
