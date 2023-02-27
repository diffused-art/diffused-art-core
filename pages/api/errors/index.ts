import NextCors from 'nextjs-cors';
import prisma from '../../../lib/prisma';

export default async function handle(req: any, res: any) {
  await NextCors(req, res, {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: process.env.ALLOWED_ORIGIN,
    optionsSuccessStatus: 200,
  });

  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' });
    return;
  }

  await prisma.errorsCMChunksUpload.create({
    data: {
      candyMachineAddress: req.body.candyMachineAddress,
      collectionId: req.body.collectionId,
      index: req.body.index,
      items: req.body.items,
      cause: req.body.cause,
      collection: {
        connect: {
          id: req.body.collectionId,
        },
      },
    },
  });

  return res.status(200).json({ result: 'success' });
}
