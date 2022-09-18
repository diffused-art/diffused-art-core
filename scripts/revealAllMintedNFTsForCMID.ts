import * as dotenv from 'dotenv';
dotenv.config();
import { getReadonlyCli } from '../functions/getMetaplexCli';
import { revealNFT } from '../functions/revealNFT';
import { PublicKey } from '@solana/web3.js';
import { PrismaClient } from '@prisma/client';
import { Metadata } from '@metaplex-foundation/js';
import axios from 'axios';
const prisma = new PrismaClient();

function getNFTHashListUsingQuicknode(cmid: string) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const data = {
    jsonrpc: '2.0',
    id: 1,
    method: 'qn_fetchNFTsByCreator',
    params: [
      {
        creator: cmid,
        page: 1,
        perPage: 40,
      },
    ],
  };
  axios
    .post(process.env.RPC_URL!, data, config)
    .then(function (response) {
      // handle success
      console.log(response.data);
    })
    .catch(err => {
      // handle error
      console.log(err);
    });
}

// TODO: Long term solution is to use something like Holaplex indexer, tho, and store on the DB as unrevealed item as the quicknode fetch mints is unreliable
async function createCandyMachineFromDBCollection() {
  const result = require('minimist')(process.argv.slice(2));
  const cmid = result.cmid;
  const metaplexCli = await getReadonlyCli();

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

  const mintedNFTs: Metadata[] = (await metaplexCli
    .candyMachines()
    .findMintedNfts({
      candyMachine: new PublicKey(cmid),
    })
    .run()) as any;

  console.info(`Got minted NFTs (hash list) --- ${mintedNFTs.length} items`);

  const hashListAddress = mintedNFTs.map(mint => mint.mintAddress.toString());
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
