import { PublicKey } from '@solana/web3.js';

export function isValidPublicKey(key: string) {
  try {
    new PublicKey(key);
    return true;
  } catch (error) {
    return false;
  }
}
