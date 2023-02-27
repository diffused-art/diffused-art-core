import { Nft, NftWithToken, toMetaplexFile } from '@metaplex-foundation/js';
import { Artist, Collection, PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { subMinutes } from 'date-fns';
import { unlinkSync } from 'fs';
import { getV1SpecFromAttributes } from '../utils/getV1SpecFromAttributes';
import { isValidPublicKey } from '../utils/isValidPublicKey';
import { isValidV1SpecStableDiffusion } from '../utils/isValidV1Spec';
import { uploadStream } from '../utils/uploadStreamAWS';
import { generateStableDiffImageAsync } from './ai-sources/stable-diffusion';
import { generateSemiRandomNumberStableDiffusionRange } from './ai-sources/stable-diffusion/generateSemiRandomSeed';
import { getReadonlyCli, getWriteCli } from './getMetaplexCli';
import axios from 'axios';
import { generateAlphanumericString } from '../utils/generateAlphanumericString';
import { getNFTTillJSONIsFetcheable } from '../utils/getNFTTillJSONIsFetcheable';

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
  artistAddress: PublicKey,
) {
  const metaplexWriteCli = await getWriteCli();

  const { uri: newUri } = await metaplexWriteCli.nfts().uploadMetadata({
    ...currentNft.json,
    image: toMetaplexFile(newImage, 'generation.png'),
    attributes: newAttributes,
    properties: {
      ...currentNft.json?.properties,
      category: 'image',
      files: [
        {
          type: 'image/png',
          uri: toMetaplexFile(newImage, 'generation.png'),
        },
      ],
    },
  });

  await metaplexWriteCli.nfts().update({
    nftOrSft: currentNft,
    uri: newUri,
    newUpdateAuthority: artistAddress,
    isMutable: false,
  });

  const updatedNFT: Nft | NftWithToken = await getNFTTillJSONIsFetcheable(
    metaplexWriteCli,
    currentNft.address,
  );

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
  const nftOnChainData: Nft | NftWithToken = await getNFTTillJSONIsFetcheable(
    metaplexCli,
    new PublicKey(mint_address),
  );

  if (
    nftOnChainData.updateAuthorityAddress.toString() !==
      process.env.FUNDED_WALLET_PUBKEY &&
    nftOnChainData.isMutable
  ) {
    prisma.$disconnect();
    return {
      status: 400,
      message: 'candy_machine_not_managed_by_diffused_art',
    };
  }

  if (!nftOnChainData.isMutable) {
    const collectionFound = await prisma.collection.findUnique({
      where: {
        collectionOnChainAddress: nftOnChainData.collection?.address.toString(),
      },
    });
    const { id: collectionId } = collectionFound!;
    let filePathCDN: string | null = null;
    if (!foundMint?.rawMetadataCDN) {
      const metadata = Object.entries(
        collectionFound?.promptSourceParams as any,
      ).reduce((acc, [key, value]) => {
        if (key === 'sourceParams') return acc;
        return {
          ...acc,
          [key]: String(value),
        };
      }, {});

      const { writeStream, promise } = uploadStream({
        Key: `/image-generation/${
          (collectionFound?.promptSourceParams as any).engine
        }/${
          nftOnChainData.json?.attributes?.find(
            value => value.trait_type === 'seed',
          )?.value
        }-${generateAlphanumericString()}`,
        ContentType: 'image/png',
        Metadata: {
          ...metadata,
          init_image: collectionFound?.promptInitImage!,
          prompt: collectionFound?.promptPhrase!,
        },
      });
      const response = await axios({
        method: 'get',
        url:
          nftOnChainData.json?.image ||
          (foundMint?.rawMetadataCDN as any)?.image,
        responseType: 'stream',
      });
      response.data.pipe(writeStream);
      const result: any = await promise;
      filePathCDN = result.Location.replace(
        'https://stored-metadatas.s3.amazonaws.com/',
        process.env.CLOUDFRONT_DOMAIN,
      ).replace(
        'https://stored-metadatas.s3.us-east-2.amazonaws.com/',
        process.env.CLOUDFRONT_DOMAIN,
      );
    }

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
        image: filePathCDN || foundMint?.image!,
        attributes: nftOnChainData.json?.attributes as any,
        rawMetadata: nftOnChainData.json as any,
        rawMetadataCDN: {
          ...(nftOnChainData.json as any),
          image: filePathCDN || foundMint?.image!,
        },
        isRevealing: false,
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
        image: filePathCDN || nftOnChainData.json?.image!,
        attributes: nftOnChainData.json?.attributes as any,
        rawMetadata: nftOnChainData.json as any,
        rawMetadataCDN: {
          ...(nftOnChainData.json as any),
          image: filePathCDN || nftOnChainData.json?.image!,
        },
        isRevealing: false,
        isRevealed: true,
      },
    });
    prisma.$disconnect();
    return { status: 200, message: 'already_revealed' };
  }
  let foundCollection: (Collection & { artist: Artist }) | null = null;

  if (
    nftOnChainData.collection?.verified &&
    nftOnChainData.collection?.address
  ) {
    foundCollection = await prisma.collection.findFirst({
      include: {
        artist: true,
      },
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
        new PublicKey(foundCollection.artist.royaltiesWalletAddress),
      );
      await prisma.mint.update({
        where: { mint_address: nftOnChainData.address.toString() },
        data: {
          image: lastGeneratedImage.filePathCDN,
          rawMetadata: {
            ...nft.json,
          } as any,
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

export async function revealNFT(mint_address: string) {
  if (!isValidPublicKey(mint_address)) {
    prisma.$disconnect();
    return { status: 400, message: 'invalid_public_key' };
  }

  const foundMint = await prisma.mint.findUnique({ where: { mint_address } });

  if (foundMint?.isRevealed) return { status: 200, message: 'success' };

  if (foundMint?.isRevealing) {
    if (foundMint.updatedAt > subMinutes(new Date(Date.now()), 6)) {
      prisma.$disconnect();
      return { status: 400, message: 'nft_revealing_wait_for_conclusion' };
    } else {
      await prisma.mint.update({
        where: { mint_address },
        data: {
          isRevealing: false,
        },
      });
      if (foundMint.rawMetadata === null) {
        await revealNFT(mint_address);
      }
    }
  } else {
    let collectionFound = await prisma.collection.findFirst({
      where: {
        hashList: { array_contains: [mint_address] },
      },
    });

    if (!collectionFound) {
      const nft = await getReadonlyCli()
        .nfts()
        .findByMint({ mintAddress: new PublicKey(mint_address) })
        .catch(() => null);
      collectionFound = await prisma.collection.findFirst({
        where: {
          // TODO: Hack to not match undefined
          collectionOnChainAddress:
            nft?.collection?.address?.toString() || 'ARBITRARY_KEY',
        },
      });
      if (collectionFound) {
        collectionFound = await prisma.collection.update({
          where: {
            id: collectionFound.id,
          },
          data: {
            hashList: [...(collectionFound.hashList as any), mint_address],
          },
        });
      }
    }

    if (collectionFound) {
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

    prisma.$disconnect();
    return { status: 400, message: 'skipping_invalid_collection_mint_address' };
  }
}
