import { Nft, NftWithToken, Metaplex } from '@metaplex-foundation/js';
import { PublicKey } from '@solana/web3.js';
import { wrapInfiniteRetry } from './wrapInfiniteRetry';

export async function getNFTTillJSONIsFetcheable(
  metaplex: Metaplex,
  mintAddress: PublicKey,
): Promise<Nft | NftWithToken> {
  return wrapInfiniteRetry(
    () =>
      metaplex
        .nfts()
        .findByMint({ mintAddress })
        .then(nft => {
          if (nft.json) {
            return nft;
          }
          throw new Error('NFT JSON is not yet available');
        }) as unknown as Nft | NftWithToken,
  );
}
