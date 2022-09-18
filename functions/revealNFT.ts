import { Nft, NftWithToken, toMetaplexFile } from '@metaplex-foundation/js';
import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { getV1SpecFromAttributes } from '../utils/getV1SpecFromAttributes';
import { isValidPublicKey } from '../utils/isValidPublicKey';
import { isValidV1SpecStableDiffusion } from '../utils/isValidV1Spec';
import { generateStableDiffImageAsync } from './ai-sources/stable-diffusion';
import { generateSemiRandomNumberStableDiffusionRange } from './ai-sources/stable-diffusion/generateSemiRandomSeed';
import { getReadonlyCli, getWriteCli } from './getMetaplexCli';

const prisma = new PrismaClient();

type PossibleResults =
  | 'success'
  | 'already_revealed'
  | 'invalid_public_key'
  | 'uri_metadata_not_found'
  | 'invalid_collection_address'
  | 'nft_does_not_follow_morpheus_spec'
  | 'unknown_error';

async function updateNFTOnChain(
  newImage: Buffer,
  currentNft: Nft | NftWithToken,
  newAttributes: any,
) {
  const metaplexWriteCli = await getWriteCli();

  const { uri: newUri } = await metaplexWriteCli
    .nfts()
    .uploadMetadata({
      image: toMetaplexFile(newImage, 'generation.png'),
      attributes: newAttributes,
      files: [
        {
          type: 'image/png',
          uri: toMetaplexFile(newImage, 'generation.png'),
        },
      ],
    })
    .run();

  await metaplexWriteCli
    .nfts()
    .update({
      nftOrSft: currentNft,
      uri: newUri,
      isMutable: false,
    })
    .run();

  const updatedNFT: Nft | NftWithToken = (await metaplexWriteCli
    .nfts()
    .findByMint({ mintAddress: currentNft.address })
    .run()) as unknown as Nft | NftWithToken;

  const collectionFound = await prisma.collection.findFirst({
    where: {
      collectionOnChainAddress: updatedNFT.collection?.address?.toString(),
      isFullyRevealed: false,
    },
  });

  await prisma.mint.upsert({
    where: { mint_address: updatedNFT.address.toString() },
    create: {
      mint_address: updatedNFT.address.toString(),
      collectionId: collectionFound?.id as any,
      title: updatedNFT.name,
      description: updatedNFT.json?.description as any,
      image: updatedNFT.json?.image as any,
      attributes: updatedNFT.json?.attributes as any,
      rawMetadata: updatedNFT.json as any,
      isRevealed: true,
    },
    update: {
      title: updatedNFT.name,
      description: updatedNFT.json?.description as any,
      image: updatedNFT.json?.image as any,
      attributes: updatedNFT.json?.attributes as any,
      rawMetadata: updatedNFT.json as any,
      isRevealed: true,
    },
  });

  await prisma.mint.update({
    where: { mint_address: updatedNFT.address.toString() },
    data: {
      mint_address: updatedNFT.address.toString(),
      title: updatedNFT.name,
      description: updatedNFT.json?.description,
      image: updatedNFT.json?.image,
      attributes: updatedNFT.json?.attributes as any,
      rawMetadata: updatedNFT.json as any,
      isRevealed: true,
      updatedAt: new Date(Date.now()),
    },
  });

  const foundCollection = await prisma.collection.findFirst({
    where: {
      collectionOnChainAddress: updatedNFT.collection?.address?.toString(),
      isFullyRevealed: false,
    },
    include: {
      mints: true,
    },
  });

  const revealedMints = foundCollection?.mints.filter(mint => mint.isRevealed);

  if (foundCollection?.mintTotalSupply === revealedMints?.length) {
    await prisma.collection.update({
      where: {
        collectionOnChainAddress:
          foundCollection?.collectionOnChainAddress as any,
      },
      data: {
        isFullyRevealed: true,
      },
    });
  }
}

export async function revealNFT(
  mint_address: string,
): Promise<{ status: number; message: PossibleResults }> {
  if (!isValidPublicKey(mint_address)) {
    prisma.$disconnect();
    return { status: 400, message: 'invalid_public_key' };
  }

  const foundMint = await prisma.mint.findUnique({ where: { mint_address } });
  if (foundMint?.isRevealed) {
    prisma.$disconnect();
    return { status: 400, message: 'already_revealed' };
  }
  const metaplexCli = getReadonlyCli();
  const nftOnChainData: Nft | NftWithToken = (await metaplexCli
    .nfts()
    .findByMint({ mintAddress: new PublicKey(mint_address) })
    .run()) as unknown as Nft | NftWithToken;

  if (!nftOnChainData.isMutable) {
    await prisma.mint.update({
      where: { mint_address: nftOnChainData.address.toString() },
      data: {
        title: nftOnChainData.name,
        description: nftOnChainData.json?.description as any,
        image: nftOnChainData.json?.image as any,
        attributes: nftOnChainData.json?.attributes as any,
        rawMetadata: nftOnChainData.json as any,
        isRevealed: true,
        updatedAt: new Date(Date.now()),
      },
    });
    prisma.$disconnect();
    return { status: 400, message: 'already_revealed' };
  }

  if (
    nftOnChainData.collection?.verified &&
    nftOnChainData.collection?.address
  ) {
    const foundCollection = await prisma.collection.findFirst({
      where: {
        collectionOnChainAddress: nftOnChainData.collection.address?.toString(),
        isFullyRevealed: false,
      },
    });
    if (!foundCollection) {
      prisma.$disconnect();
      return { status: 400, message: 'invalid_collection_address' };
    }
  } else {
    prisma.$disconnect();
    return { status: 400, message: 'invalid_collection_address' };
  }

  // From here on, it means that the NFT is mutable and we can reveal it.
  if (!nftOnChainData.json) {
    prisma.$disconnect();
    return { status: 400, message: 'uri_metadata_not_found' };
  }

  if ((nftOnChainData.json.attributes?.length || 0) >= 1) {
    const specObject = getV1SpecFromAttributes(nftOnChainData.json.attributes!);
    const isValidStableDiffSpecObject = await isValidV1SpecStableDiffusion(
      specObject,
    );
    if (isValidStableDiffSpecObject) {
      const newObjectMetadata = {
        prompt: specObject.prompt,
        init_image: specObject.init_image,
        seed: generateSemiRandomNumberStableDiffusionRange(
          nftOnChainData.address.toString(),
        ),
        sourceParams: {
          ...specObject.sourceParams,
        },
        source: specObject.source,
      };
      const data = await generateStableDiffImageAsync(newObjectMetadata).catch(
        e => {
          throw new Error('Couldnt generate image', e);
        },
      );
      const lastGeneratedImage = data[data.length - 1];
      const nftAttributes: Array<{
        trait_type?: string;
        value?: string;
        [key: string]: unknown;
      }> = Object.entries(newObjectMetadata).flatMap(([key, value]) => {
        if (key === 'sourceParams') {
          return Object.entries(value as any).map(([key, paramValue]) => {
            return {
              trait_type: `source-param:${key}`,
              value: paramValue,
            };
          });
        }
        return {
          trait_type: key,
          value: value,
        };
      }) as any;
      await updateNFTOnChain(
        lastGeneratedImage.buffer,
        nftOnChainData,
        nftAttributes,
      );
      prisma.$disconnect();
      return { status: 200, message: 'success' };
    } else {
      prisma.$disconnect();
      return { status: 400, message: 'nft_does_not_follow_morpheus_spec' };
    }
  }
  prisma.$disconnect();
  return { status: 400, message: 'unknown_error' };
}
