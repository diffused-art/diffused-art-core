import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { getWriteCli } from '../../functions/getMetaplexCli';

const prisma = new PrismaClient();

async function mintFromCMID() {
  const result = require('minimist')(process.argv.slice(2));
  const metaplexWriteCli = await getWriteCli();
  const candyMachine = await metaplexWriteCli
    .candyMachines()
    .findByAddress({
      address: new PublicKey(result.cmid),
    })
    .run();

  const mintResult = await metaplexWriteCli
    .candyMachines()
    .mint({
      candyMachine,
    })
    .run();

  const collectionFound = await prisma.collection.findUnique({
    where: {
      mintCandyMachineId: candyMachine.address.toString(),
    },
  });

  await prisma.mint.create({
    data: {
      mint_address: mintResult.nft.address.toString(),
      collectionId: collectionFound?.id as any,
      title: mintResult.nft.name,
      description: mintResult.nft.json?.description as any,
      image: mintResult.nft.json?.image as any,
      attributes: mintResult.nft.json?.attributes as any,
      rawMetadata: mintResult.nft.json as any,
      isRevealed: false,
    },
  });

  console.info(mintResult.nft);
}

mintFromCMID();
