import { Prisma } from '@prisma/client';
import { revealNFT } from '../../functions/revealNFT';
import prisma from '../../lib/prisma';

export default async function handle(req: any, res: any) {
  console.log(`req.headers`, req.headers)
  if (
    req.method === 'POST' &&
    req.headers.authorization === process.env.HELIUS_WEBHOOK_AUTHENTICATION
  ) {
    res.status(403).send({ message: 'Not authenticated' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' });
    return;
  }

  const arrayOfTxs = req.body;
  for (let index = 0; index < arrayOfTxs.length; index++) {
    const tx = arrayOfTxs[index];
    const accountsList: string[] = tx.accountData.map(
      accountData => accountData.account,
    );
    const [collectionFound] = await prisma.collection.findMany({
      where: {
        mintCandyMachineId: {
          in: accountsList,
        },
      },
      take: 1,
    });
    console.info('Monitoring cmId', collectionFound.mintCandyMachineId);
    if (collectionFound) {
      const result = await prisma.collection.findUnique({
        where: {
          mintCandyMachineId: collectionFound.mintCandyMachineId || undefined,
        },
        include: {
          mints: true,
        },
      });
      if (result) {
        const mints: string[] = tx.tokenTransfers
          .map(tokenTransfer => tokenTransfer.mint)
          .filter(Boolean);
        console.info('Mints that just happened', mints);

        const uniqueMints = [
          ...new Set([
            ...mints,
            ...((result.hashList || []) as Prisma.JsonArray[]),
          ]),
        ] as string[];
        console.info('Mints to insert', uniqueMints);
        await prisma.collection.update({
          where: {
            id: result.id,
          },
          data: {
            hashList: uniqueMints,
          },
        });

        // Reveal NFTs as they come in from the webhook
        // TODO: Add to a bull worker queue
        for (let index = 0; index < mints.length; index++) {
          const mint_address = mints[index];
          revealNFT(mint_address);
        }
      }
    }
  }
  return res.status(200).json({ data: 'Webhook received' });
}
