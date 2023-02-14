import NextCors from 'nextjs-cors';
import prisma from '../../../../lib/prisma';
import {
  applyRateLimit,
  getRateLimitMiddlewares,
} from '../../../../middlewares/applyRateLimit';

const middlewares = getRateLimitMiddlewares();

export default async function handle(req: any, res: any) {
  try {
    await applyRateLimit(req, res, middlewares);
  } catch {
    return res.status(429).send('Too Many Requests');
  }

  await NextCors(req, res, {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: process.env.ALLOWED_ORIGIN,
    optionsSuccessStatus: 200,
  });

  if (!['POST'].includes(req.method)) {
    res.status(405).send({ message: 'Only POST requests allowed' });
    return;
  }
  const collectionId: string = req.query.id;

  await Promise.all([
    prisma.candyMachineCreationLogs.create({
      data: {
        collectionId,
        cmCreationType: 'CANDY_MACHINE',
        accountAddress: req.body.mintCandyMachineId,
      },
    }),
    prisma.candyMachineCreationLogs.create({
      data: {
        collectionId,
        cmCreationType: 'GUARD',
        accountAddress: req.body.mintGuardId,
      },
    }),
  ]);

  return res.status(200).json({ data: 'Success!' });
}
