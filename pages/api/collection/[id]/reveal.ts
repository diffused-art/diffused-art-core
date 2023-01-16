import { Prisma } from '@prisma/client';
import NextCors from 'nextjs-cors';
import { revealNFT } from '../../../../functions/revealNFT';
import prisma from '../../../../lib/prisma';
import { isValidPublicKey } from '../../../../utils/isValidPublicKey';

export default async function handle(req: any, res: any) {
  await NextCors(req, res, {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: process.env.ALLOWED_ORIGIN,
    optionsSuccessStatus: 200,
  });

  if (req.method !== 'PUT') {
    res.status(405).send({ message: 'Only PUT requests allowed' });
    return;
  }

  const { id } = req.query;
  const { address } = req.body;
  if (!isValidPublicKey(address)) {
    res.status(400).send({ message: 'Invalid address' });
    return;
  }

  const result = await prisma.collection.findUnique({
    where: {
      id,
    },
    include: {
      mints: true,
    },
  });

  if (!result) {
    return res.status(404).json({ message: 'Not found.' });
  }

  const uniqueMints = [
    ...new Set([
      ...[address],
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

  // TODO: Add support for the bull queue worker add
  revealNFT(address);
  return res
    .status(200)
    .json({ data: `Mint ${address} now in queue to be revealed` });
}
