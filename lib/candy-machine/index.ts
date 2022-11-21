import {
  CandyMachineV2,
  Metaplex,
  walletAdapterIdentity,
} from '@metaplex-foundation/js';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
const metaplex = Metaplex.make(connection);

export function useCandyMachine(candyMachineId: string) {
  const wallet = useWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachineV2 | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    setIsLoadingState(true);
    metaplex
      .candyMachinesV2()
      .findByAddress({ address: new PublicKey(candyMachineId) })
      
      .then(cm => setCandyMachine(cm))
      .catch(() => setCandyMachine(null))
      .then(() => setIsLoadingState(false));
  }, [candyMachineId, wallet]);

  const onMint = async () => {
    setIsMinting(true);
    let mintHash: string | null = null;
    if (candyMachine) {
      const mintResult = await metaplex
        .use(walletAdapterIdentity(wallet))
        .candyMachinesV2()
        .mint({ 
          candyMachine, 
        })
        
        .catch((e) => {
          console.error(e);
          return null;
        });

      if (mintResult) {
        mintHash = mintResult.nft.mint.address.toString();
      } else {
        mintHash = null;
      }
    }
    setIsMinting(false);
    return mintHash;
  };

  return { candyMachine, onMint, isLoadingState, isMinting };
}
