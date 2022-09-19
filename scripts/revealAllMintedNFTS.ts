import * as dotenv from 'dotenv';
dotenv.config();
import { revealNFT } from '../functions/revealNFT';
import { Prisma, PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// TODO: Long term solution is to use something like Holaplex indexer, tho, and store on the DB as unrevealed item as the quicknode fetch mints is unreliable
export async function revealAllMintedNFTS() {
  const collections = await prisma.collection.findMany({
    where: {
      isFullyRevealed: false,
      mintCandyMachineId: {
        not: null,
      },
      hashList: {
        not: Prisma.AnyNull,
      },
    },
  });

  if (collections.length === 0) {
    console.info(`No collections to reveal`);
    return;
  }

  for (let index = 0; index < collections.length; index++) {
    const collection = collections[index];
    const hashList = (collection.hashList as string[]) ?? [];
    if (hashList.length === 0) {
      console.log(
        `No hash list for collection ${collection.collectionOnChainAddress}`,
      );
      continue;
    }

    console.info(`Got minted NFTs (hash list) --- ${hashList.length} items`);

    const chunkSize = 25;
    const chunkedItems = [];
    for (let i = 0; i < hashList.length; i += chunkSize) {
      const chunk = hashList.slice(i, i + chunkSize);
      chunkedItems.push(chunk);
    }

    const promisesArray = [];
    for (let index = 0; index < chunkedItems.length; index++) {
      const chunk = chunkedItems[index];
      promisesArray.push(chunk.map(item => () => revealNFT(item)));
    }

    let promisesResults = [];

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
    );

    console.info(
      `Finished all promises for revelation of collection ${collection.id} cmid ${collection.mintCandyMachineId}`,
    );
  }
  return;
}
