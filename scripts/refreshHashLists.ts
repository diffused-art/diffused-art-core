import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import shell from 'shelljs';
const prisma = new PrismaClient();

export async function refreshHashLists() {
  const collections = await prisma.collection.findMany({
    where: {
      isFullyRevealed: false,
      mintCandyMachineId: {
        not: null,
      },
    },
  });

  for (let index = 0; index < collections.length; index++) {
    const collection = collections[index];
    console.info(
      `Getting hash list for candy machine... ${collection.mintCandyMachineId}`,
    );

    const collectionHashListSize = ((collection.hashList as string[]) || [])
      .length;

    if (collectionHashListSize === collection.mintTotalSupply) {
      console.info(
        `Collection hashlist for CMID ${collection.mintCandyMachineId} is fully fetched`,
      );
      return;
    }

    if (
      shell.exec(
        `metaboss snapshot mints -r ${process.env.RPC_URL_FETCHHASHLIST} --creator ${collection.mintCandyMachineId} --v2 --output ./output/hashlists`,
      ).code !== 0
    ) {
      shell.echo('Error: Couldnt fetch hash list');
      shell.exit(1);
      return;
    }

    const hashListAddresses = JSON.parse(
      fs
        .readFileSync(
          `./output/hashlists/${collection.mintCandyMachineId}_mint_accounts.json`,
          'utf8',
        )
        .toString(),
    );

    await prisma.collection.update({
      where: {
        id: collection.id,
      },
      data: {
        hashList: hashListAddresses,
      },
    });

    console.info(
      `Saved hashlist to DB with ${hashListAddresses.length} items for CMID ${collection.mintCandyMachineId}`,
    );
  }

  return;
}
