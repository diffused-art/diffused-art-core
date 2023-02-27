import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { getWriteCli } from '../functions/getMetaplexCli';
import { PublicKey } from '@solana/web3.js';
const prisma = new PrismaClient();

// TODO: Should tweak to use rw creator address and then use sugar since it is connected here
async function drainCMV3FromAuthority() {
  const metaplex = await getWriteCli();

  const logs = await prisma.candyMachineCreationLogs.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  for (let index = 0; index < logs.length; index++) {
    const element = logs[index];
    if (element.cmCreationType === 'CANDY_MACHINE') {
      await metaplex
        .candyMachines()
        .delete({ candyMachine: new PublicKey(element.accountAddress) })
        .then(async () =>
          prisma.candyMachineCreationLogs.delete({ where: { id: element.id } }),
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
    }
  }
}

drainCMV3FromAuthority();
