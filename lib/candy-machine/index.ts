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
      mintHash = await metaplex
        .use(walletAdapterIdentity(wallet))
        .candyMachinesV2()
        .mint({
          candyMachine,
        })
        .then(res => res.nft.address.toString())
        .catch(e => {
          if (
            e.message.includes(
              'raised an error that is not recognized by the programs registered by the SDK',
            )
          ) {
            console.error('Error >', e);
            return null;
          } else if (
            e?.message.includes(
              'The account of type [MintAccount] was not found at the provided address',
            )
          ) {
            const message = e?.message.substring(e?.message.indexOf('The account of type [MintAccount] was not found at the provided address ['))
            return message
              ?.replace(
                'The account of type [MintAccount] was not found at the provided address [',
                '',
              )
              .split('.]')[0]
              .replace('].', '');
          }
        });
    }
    setIsMinting(false);
    return mintHash;
  };

  return { candyMachine, onMint, isLoadingState, isMinting };
}
