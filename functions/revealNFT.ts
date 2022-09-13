import { Nft, NftWithToken } from '@metaplex-foundation/js';
import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { AISource } from '../typings';
import { getV2SpecFromAttributes } from '../utils/getV2SpecFromAttributes';
import { isValidPublicKey } from '../utils/isValidPublicKey';
import { generateStableDiffImageAsync } from './ai-sources/stable-diffusion';
import { generateSemiRandomNumberStableDiffusionRange } from './ai-sources/stable-diffusion/generateSemiRandomSeed';
import { getReadonlyCli } from './getMetaplexCli';

const prisma = new PrismaClient();

type PossibleResults =
  | 'success'
  | 'already_revealed'
  | 'invalid_public_key'
  | 'uri_metadata_not_found'
  | 'invalid_collection_address'
  | 'nft_does_not_follow_morpheus_spec'
  | 'unknown_error';

export async function revealNFT(
  mint_address: string,
): Promise<{ status: number; message: PossibleResults }> {
  if (!isValidPublicKey(mint_address)) {
    return { status: 400, message: 'invalid_public_key' };
  }
  const foundMint = await prisma.mint.findUnique({ where: { mint_address } });
  if (foundMint?.isRevealed) {
    return { status: 400, message: 'already_revealed' };
  }
  const metaplexCli = getReadonlyCli();
  const nftOnChainData: Nft | NftWithToken = (await metaplexCli
    .nfts()
    .findByMint({ mintAddress: new PublicKey(mint_address) })
    .run()) as unknown as Nft | NftWithToken;

  if (!nftOnChainData.isMutable) {
    return { status: 400, message: 'already_revealed' };
  }

  // TODO: once structure is in place, uncomment this
  // if (nftOnChainData.collection?.verified && nftOnChainData.collection?.address) {
  //   const foundCollection = await prisma.collection.findUnique({ where: { collectionOnChainAddress: nftOnChainData.collection.address?.toString()  } });
  //   if (!foundCollection) {
  //     return { status: 400, message: 'invalid_collection_address'};
  //   }
  // } else {
  //   return { status: 400, message: 'invalid_collection_address'};
  // }

  // From here on, it means that the NFT is mutable and we can reveal it.
  if (!nftOnChainData.json) {
    return { status: 400, message: 'uri_metadata_not_found' };
  }

  if ((nftOnChainData.json.attributes?.length || 0) >= 1) {
    const specObject = getV2SpecFromAttributes(nftOnChainData.json.attributes!);
    if (AISource.StableDiffusion === specObject.source) {
      // TODO: If it generates here, it should return all params used in the v2 attributes spec format + the image URL to be uploaded back to NFT storage + new JSON on NFT storage
      await generateStableDiffImageAsync(specObject);
    } else {
      // TODO: Delete this once everything is asserted to work
      await generateStableDiffImageAsync({
        prompt: 'A dragon above you',
        init_image: 'https://i.imgur.com/LqTxvU9.png',
        sourceParams: {
          seed: generateSemiRandomNumberStableDiffusionRange(nftOnChainData.address.toString()),
        },
        source: AISource.StableDiffusion,
      });
      return { status: 400, message: 'nft_does_not_follow_morpheus_spec' };
    }

    // In case of success we should update the NFT on-chain data, do another update to mark it immutable and 
    // mark it as revealed on the DB (also save the entire data on the DB), should use funded wallet for this
  }
  return { status: 400, message: 'unknown_error' };
}
