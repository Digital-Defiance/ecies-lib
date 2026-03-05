/**
 * Wallet and seed structure for HD wallet operations.
 */
import { Wallet } from '@ethereumjs/wallet';
import { SecureBuffer } from '../../../secure-buffer';

export interface IWalletSeed {
  wallet: Wallet;
  seed: SecureBuffer;
}
