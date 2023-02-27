import * as dotenv from 'dotenv';
dotenv.config();

import { revealNFT } from '../functions/revealNFT';
import { Prisma, PrismaClient } from '@prisma/client';
import { getHashlist } from './helius/get-hashlist';
const prisma = new PrismaClient();

export async function revealAllMintedNFTS() {
  const collections = await prisma.collection.findMany({
    where: {
      isFullyRevealed: false,
      mintCandyMachineId: {
        not: null,
      },
      collectionOnChainAddress: {
        not: null,
      },
      hashList: {
        not: Prisma.JsonNull,
      },
    },
  });

  if (collections.length === 0) {
    console.info(`No collections to reveal`);
    return;
  }

  for (let index = 0; index < collections.length; index++) {
    const collection = collections[index];
    let hashList = (collection.hashList as string[]) ?? [];
    const freshHashlist = await getHashlist(
      collection.collectionOnChainAddress!.toString(),
    );
    hashList = [...new Set([...hashList, ...freshHashlist])];

    if (hashList.length === 0) {
      console.warn(
        `No hash list for collection ${collection.collectionOnChainAddress}`,
      );
      continue;
    }

    console.info(`Got minted NFTs (hash list) --- ${hashList.length} items`);

    const allRevealedMints = await prisma.mint.findMany({
      where: {
        mint_address: {
          in: hashList,
        },
        isRevealed: true,
      },
    });
    const allRevealedHashlist = allRevealedMints.map(mint => mint.mint_address);

    hashList = hashList.filter(mint => !allRevealedHashlist.includes(mint));

    const chunkSize = 25;
    const chunkedItems: any[] = [];
    for (let i = 0; i < hashList.length; i += chunkSize) {
      const chunk = hashList.slice(i, i + chunkSize);
      chunkedItems.push(chunk);
    }

    const promisesArray: any[] = [];
    for (let index = 0; index < chunkedItems.length; index++) {
      const chunk = chunkedItems[index];
      promisesArray.push(chunk.map(item => () => revealNFT(item)));
    }

    let promisesResults: any[] = [];

    for (let index = 0; index < promisesArray.length; index++) {
      console.info(
        `Revealing chunk of promises N${index + 1}... for CMID ${
          collection.mintCandyMachineId
        }`,
      );
      promisesResults.push(
        await Promise.allSettled(
          promisesArray[index].map(promise => promise()),
        ),
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.info(`Tryna reveal ${promisesResults.length}`);

    promisesResults = promisesResults.flatMap(results => results);

    console.info(
      `Success: ${
        promisesResults.filter(result => result.status === 'fulfilled').length
      } items`,
    );
    console.info(
      `Failure: ${
        promisesResults.filter(result => result.status === 'rejected').length
      } items`,
      promisesResults.filter(result => result.status === 'rejected'),
    );

    console.info(
      `Finished all promises for revelation of collection ${collection.id} title ${collection.title} cmid ${collection.mintCandyMachineId}`,
    );
  }
  return;
}
