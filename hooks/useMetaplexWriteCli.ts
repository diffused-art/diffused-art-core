import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { useMemo } from 'react';

export default function useMetaplexWriteCli() {
  const wallet = useWallet();
  return useMemo(
    () =>
      Metaplex.make(new Connection(process.env.NEXT_PUBLIC_RPC_URL!)).use(
        walletAdapterIdentity(wallet),
      ),
    [wallet],
  );
}
