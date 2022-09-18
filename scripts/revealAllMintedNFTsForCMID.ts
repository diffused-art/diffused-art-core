import * as dotenv from 'dotenv';
dotenv.config();
import { revealNFT } from '../functions/revealNFT';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import shell from 'shelljs';
const prisma = new PrismaClient();

// TODO: Long term solution is to use something like Holaplex indexer, tho, and store on the DB as unrevealed item as the quicknode fetch mints is unreliable
async function createCandyMachineFromDBCollection() {
  const result = require('minimist')(process.argv.slice(2));
  const cmid = result.cmid;

  const foundCollection = await prisma.collection.findUnique({
    where: {
      mintCandyMachineId: cmid,
    },
  });

  if (foundCollection.isFullyRevealed) {
    console.info(`This collection is already fully revealed`);
    return;
  }

  console.info(`Getting hash list for candy machine... ${result.cmid}`);
  if (shell.exec(`metaboss snapshot mints -r ${process.env.RPC_URL_ALCHEMY} --creator ${result.cmid} --v2 --output ./output/hashlists`).code !== 0) {
    shell.echo('Error: Couldnt fetch hash list');
    shell.exit(1);
    return;
  }

  const hashListAddress = JSON.parse(fs.readFileSync(`./output/hashlists/${result.cmid}_mint_accounts.json`, 'utf8').toString());

  console.info(`Got minted NFTs (hash list) --- ${hashListAddress.length} items`);

  const chunkSize = 25;
  const chunkedItems = [];
  for (let i = 0; i < hashListAddress.length; i += chunkSize) {
    const chunk = hashListAddress.slice(i, i + chunkSize);
    chunkedItems.push(chunk);
  }

  const promisesArray = [];
  for (let index = 0; index < chunkedItems.length; index++) {
    const chunk = chunkedItems[index];
    promisesArray.push(chunk.map(item => () => revealNFT(item)));
  }

  for (let index = 0; index < promisesArray.length; index++) {
    console.info(`Revealing chunk of promises N${index + 1}...`);
    await Promise.allSettled(promisesArray[index].map(promise => promise()));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.info(`Finished all promises.`);
  return;
}

createCandyMachineFromDBCollection();
