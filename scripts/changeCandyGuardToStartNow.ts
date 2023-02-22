import * as dotenv from 'dotenv';
dotenv.config();

import { addMinutes } from 'date-fns';
import { PrismaClient } from '@prisma/client';
import { getWriteCli } from '../functions/getMetaplexCli';
import { PublicKey } from '@solana/web3.js';
import { toDateTime } from '@metaplex-foundation/js';
const prisma = new PrismaClient();

async function changeCandyGuardToStartNow() {
  const metaplex = await getWriteCli(
    undefined,
    process.env.CREATOR_WALLET_SECRET!,
  );

  const logs = await prisma.candyMachineCreationLogs.findMany({
    where: {
      cmCreationType: 'GUARD',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  for (let index = 0; index < logs.length; index++) {
    const element = logs[index];
    const candyGuard = await metaplex.candyMachines().findCandyGuardByAddress({
      address: new PublicKey(element.accountAddress),
    });
    if (
      candyGuard.authorityAddress.toString() ===
      metaplex.identity().publicKey.toString()
    ) {
      console.log(candyGuard);
      const result = await metaplex
        .candyMachines()
        .updateCandyGuard({
          candyGuard: candyGuard.address,
          guards: {
            ...candyGuard.guards,
            startDate: {
              date: toDateTime(
                new Date(addMinutes(new Date(Date.now()), 15)).getTime(),
              ),
            },
          },
        })
        .then(async () =>
          prisma.candyMachineCreationLogs.delete({
            where: { id: element.id },
          }),
        )
        .catch(async e => {
          if (
            e
              .toString()
              .includes(
                'The program expected this account to be already initialized',
              )
          ) {
            await prisma.candyMachineCreationLogs.delete({
              where: { id: element.id },
            });
          } else {
            throw new Error(e);
          }
        });
      console.log('Result guard', result)
    }
  }
}

changeCandyGuardToStartNow();
