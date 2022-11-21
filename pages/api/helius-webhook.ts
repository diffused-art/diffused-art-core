import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';

export default async function handle(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' });
    return;
  }

  const arrayOfTxs = req.body;
  for (let index = 0; index < arrayOfTxs.length; index++) {
    const tx = arrayOfTxs[index];
    const cmId = tx.accountData[5]?.account;
    console.log('Monitoring cmId', cmId);
    const result = await prisma.collection.findUnique({
      where: { mintCandyMachineId: cmId },
      include: {
        mints: true,
      },
    });
    if (result) {
      const mints = tx.tokenTransfers
        .flat()
        .map(tokenTransfer => tokenTransfer.mint)
        .filter(Boolean);
      console.log('Mints that just happened', cmId);
      const mintsToInsert = new Set(
        ...mints,
        ...(result.hashList as Prisma.JsonArray[]),
      );
      const uniqueMints = [...mintsToInsert] as string[];
      console.log('Mints to insert', uniqueMints);
      await prisma.collection.update({
        where: {
          id: result.id,
        },
        data: {
          hashList: uniqueMints,
        },
      });
    }
  }
  return res.status(200).json({ data: 'Webhook received' });
}
