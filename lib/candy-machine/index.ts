import {
  CandyMachine,
  DefaultCandyGuardSettings,
  walletAdapterIdentity,
} from '@metaplex-foundation/js';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import useMetaplexWriteCli from '../../hooks/useMetaplexWriteCli';

export function useCandyMachine(
  candyMachineId: string,
  collectionArtistAddress: string,
) {
  const metaplex = useMetaplexWriteCli();
  const wallet = useWallet();
  const [candyMachine, setCandyMachine] =
    useState<CandyMachine<DefaultCandyGuardSettings> | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    setIsLoadingState(true);
    metaplex
      .candyMachines()
      .findByAddress({ address: new PublicKey(candyMachineId) })

      .then(cm => setCandyMachine(cm))
      .catch(() => setCandyMachine(null))
      .then(() => setIsLoadingState(false));
  }, [candyMachineId, metaplex, wallet]);

  const onMint = async () => {
    setIsMinting(true);
    let mintHash: string | null = null;
    if (candyMachine) {
      console.log(candyMachine.collectionMintAddress.toString());
      console.log(`collectionArtistAddress`, collectionArtistAddress);
      mintHash = await metaplex
        .use(walletAdapterIdentity(wallet))
        .candyMachines()
        .mint({
          candyMachine,
          collectionUpdateAuthority: new PublicKey(
            collectionArtistAddress,
          ),
        })
        .then(res => res.nft.address.toString())
        .catch(e => {
          if (
            e
              ?.toString()
              .includes(
                'raised an error that is not recognized by the programs registered by the SDK',
              )
          ) {
            console.error('Error >', e);
            return null;
          } else if (
            e
              ?.toString()
              .includes?.(
                '[AccountNotFoundError] The account of type [MintAccount] was not found at the provided address [',
              )
          ) {
            return e
              ?.toString()
              ?.replace(
                '[AccountNotFoundError] The account of type [MintAccount] was not found at the provided address [',
                '',
              )
              .split('].')[0]
              .replace('].', '')
              .trim();
          }
        });
    }
    setIsMinting(false);
    return mintHash;
  };

  return { candyMachine, onMint, isLoadingState, isMinting };
}
