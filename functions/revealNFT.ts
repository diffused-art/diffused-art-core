import { Nft, NftWithToken, toMetaplexFile } from '@metaplex-foundation/js';
import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { unlinkSync } from 'fs';
import { retry } from 'ts-retry-promise';
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
  | 'unknown_error'
  | 'candy_machine_not_managed_by_diffused_art';

async function updateNFTOnChain(
  newImage: Buffer,
  currentNft: Nft | NftWithToken,
  newAttributes: any,
) {
  const metaplexWriteCli = await getWriteCli();

  const { uri: newUri } = await metaplexWriteCli.nfts().uploadMetadata({
    name: currentNft.name,
    image: toMetaplexFile(newImage, 'generation.png'),
    attributes: newAttributes,
    files: [
      {
        type: 'image/png',
        uri: toMetaplexFile(newImage, 'generation.png'),
      },
    ],
  });
  await metaplexWriteCli.nfts().update({
    nftOrSft: currentNft,
    uri: newUri,
    isMutable: false,
  });

  const updatedNFT: Nft | NftWithToken = (await metaplexWriteCli
    .nfts()
    .findByMint({ mintAddress: currentNft.address })) as unknown as
    | Nft
    | NftWithToken;

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
      collection: {
        connect: {
          id: collectionFound?.id as any,
        },
      },
      title: updatedNFT.name,
      description: updatedNFT.json?.attributes?.find(
        attribute => attribute.trait_type === 'prompt',
      )?.value as any,
      image: updatedNFT.json?.image as any,
      attributes: updatedNFT.json?.attributes as any,
      rawMetadata: updatedNFT.json as any,
      isRevealed: true,
    },
    update: {
      collection: {
        connect: {
          id: collectionFound?.id as any,
        },
      },
      title: updatedNFT.name,
      description: updatedNFT.json?.attributes?.find(
        attribute => attribute.trait_type === 'prompt',
      )?.value as any,
      image: updatedNFT.json?.image as any,
      attributes: updatedNFT.json?.attributes as any,
      rawMetadata: updatedNFT.json as any,
      isRevealed: true,
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

  return updatedNFT;
}

async function revealNFTCore(
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
  const nftOnChainData: Nft | NftWithToken = await retry(
    () => metaplexCli.nfts().findByMint({ mintAddress: new PublicKey(mint_address) }),
    {
      retries: 'INFINITELY',
      delay: 1000,
      backoff: 'LINEAR',
      timeout: 1000000,
      logger: console.log,
    },
  ) as unknown as Nft | NftWithToken;

  // TODO: Change to use collection update authority, currently not implemented on the DB
  if (
    nftOnChainData.updateAuthorityAddress.toString() !==
    process.env.FUNDED_WALLET_PUBKEY
  ) {
    prisma.$disconnect();
    return {
      status: 400,
      message: 'candy_machine_not_managed_by_diffused_art',
    };
  }

  if (!nftOnChainData.isMutable) {
    const collectionId = (
      await prisma.collection.findUnique({
        where: {
          collectionOnChainAddress:
            nftOnChainData.collection?.address.toString(),
        },
      })
    )?.id;
    await prisma.mint.upsert({
      where: { mint_address: nftOnChainData.address.toString() },
      create: {
        mint_address: nftOnChainData.address.toString(),
        collection: {
          connect: {
            id: collectionId,
          },
        },
        title: nftOnChainData.name,
        description: nftOnChainData.json?.attributes?.find(
          attribute => attribute.trait_type === 'prompt',
        )?.value as any,
        image: nftOnChainData.json?.image as any,
        attributes: nftOnChainData.json?.attributes as any,
        rawMetadata: nftOnChainData.json as any,
        isRevealed: true,
      },
      update: {
        collection: {
          connect: {
            id: collectionId,
          },
        },
        title: nftOnChainData.name,
        description: nftOnChainData.json?.attributes?.find(
          attribute => attribute.trait_type === 'prompt',
        )?.value as any,
        image: nftOnChainData.json?.image as any,
        attributes: nftOnChainData.json?.attributes as any,
        rawMetadata: nftOnChainData.json as any,
        isRevealed: true,
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
      const newObjectMetadata: any = {
        prompt: specObject.prompt,
        seed: generateSemiRandomNumberStableDiffusionRange(
          nftOnChainData.address.toString(),
        ),
        sourceParams: {
          ...specObject.sourceParams,
        },
        source: specObject.source,
      };
      if (specObject.init_image) {
        newObjectMetadata.init_image = specObject.init_image;
      }

      const data = await generateStableDiffImageAsync(newObjectMetadata).catch(
        () => {
          throw new Error('Couldnt generate image');
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
      const nft = await updateNFTOnChain(
        lastGeneratedImage.buffer,
        nftOnChainData,
        nftAttributes,
      );
      await prisma.mint.update({
        where: { mint_address: nftOnChainData.address.toString() },
        data: {
          image: lastGeneratedImage.filePathCDN,
          rawMetadataCDN: {
            ...nft.json,
            image: lastGeneratedImage.filePathCDN,
          } as any,
        },
      });
      unlinkSync(lastGeneratedImage.filePath as string);
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

// ERROR WITH UPDATE INSTRUCTION AND COLLECTION NFT DELETED ON CHAIN (CHECK LOGS TO DEBUG)
export async function revealNFT(mint_address: string) {
  if (!isValidPublicKey(mint_address)) {
    prisma.$disconnect();
    return { status: 400, message: 'invalid_public_key' };
  }

  const foundMint = await prisma.mint.findUnique({ where: { mint_address } });
  if (foundMint?.isRevealing) {
    prisma.$disconnect();
    return { status: 400, message: 'nft_revealing_wait_for_conclusion' };
  } else {
    const collectionFound = await prisma.collection.findFirst({
      where: {
        hashList: { array_contains: [mint_address] },
      },
    });
    await prisma.mint.upsert({
      where: { mint_address },
      create: {
        mint_address,
        collection: {
          connect: {
            id: collectionFound?.id as any,
          },
        },
        title: collectionFound?.title ?? 'Collection NFT',
        description: `Collection NFT - ${collectionFound?.description}`,
        image: collectionFound?.nftPlaceholderImageURL as any,
        isRevealing: true,
      },
      update: {
        collection: {
          connect: {
            id: collectionFound?.id as any,
          },
        },
        isRevealing: true,
      },
    });

    const result: null | { status: number; message: PossibleResults } =
      await new Promise((resolve, reject) =>
        revealNFTCore(mint_address)
          .then(result => {
            return resolve(result);
          })
          .catch(async e => {
            console.error(`Error revealing NFT ${mint_address}`, e);
            await prisma.mint.update({
              where: { mint_address },
              data: {
                isRevealed: false,
                isRevealing: false,
              },
            });
            return reject(null);
          }),
      );

    if (result?.status === 200) {
      await prisma.mint.update({
        where: { mint_address },
        data: {
          isRevealed: true,
          isRevealing: false,
        },
      });
    } else {
      await prisma.mint.update({
        where: { mint_address },
        data: {
          isRevealed: false,
          isRevealing: false,
        },
      });
    }

    prisma.$disconnect();

    return result;
  }
}
