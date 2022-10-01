import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { getWriteCli } from '../functions/getMetaplexCli';
import { PublicKey } from '@solana/web3.js';
import { toBigNumber } from '@metaplex-foundation/js';

const prisma = new PrismaClient();

async function reinsertNonConfirmedItemsInsert() {
  const result = require('minimist')(process.argv.slice(2));

  const metaplexWriteCli = await getWriteCli();

  const allTimedOut = await prisma.errorsCMChunksUpload.findMany({
    where: {
      actioned: false,
      collection: {
        mintCandyMachineId: result.cmid,
      },
    },
    include: {
      collection: true,
    },
  });

  const uniqueCandyMachines = [
    ...Array.from(new Set(allTimedOut.map(item => item.collection.mintCandyMachineId))),
  ];
  for (let index = 0; index < uniqueCandyMachines.length; index++) {
    const candyMachineAddy = uniqueCandyMachines[index];
    const candyMachine = await metaplexWriteCli
      .candyMachines()
      .findByAddress({
        address: new PublicKey(candyMachineAddy!),
      })
      .run();

    const items = allTimedOut.filter(
      item => item.collection.mintCandyMachineId === candyMachineAddy,
    );
    console.info(
      `Inserting items into the CM ${candyMachineAddy}, please wait...`,
    );
    const promisesArray: any[] = [];
    for (let index = 0; index < items.length; index++) {
      const errorCMChunksUpload = items[index];

      promisesArray.push(
        () =>
          new Promise(async resolve => {
            console.info(`Inserting Chunk N${index + 1} with 5 items`);
            resolve(
              await metaplexWriteCli
                .candyMachines()
                .insertItems({
                  candyMachine,
                  authority: metaplexWriteCli.identity(),
                  items: errorCMChunksUpload.items as any,
                  index: toBigNumber(errorCMChunksUpload.index),
                })
                .run()
                .then(async () => {
                  await prisma.errorsCMChunksUpload.update({
                    where: {
                      id: errorCMChunksUpload.id,
                    },
                    data: {
                      actioned: true,
                    },
                  });
                })
                .catch(async e => {
                  console.info(
                    `Error while inserting Chunk N${
                      index + 1
                    } for CM ${candyMachineAddy} - ${e.message}`,
                  );
                }),
            );
          }),
      );
    }
    const batchSize = 75;
    const batchedPromiseArray: any[] = [];
    for (let i = 0; i < promisesArray.length; i += batchSize) {
      const batch = promisesArray.slice(i, i + batchSize);
      batchedPromiseArray.push(batch);
    }

    for (let index = 0; index < batchedPromiseArray.length; index++) {
      await Promise.all(batchedPromiseArray[index].map(promise => promise()));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return;
}

reinsertNonConfirmedItemsInsert();
