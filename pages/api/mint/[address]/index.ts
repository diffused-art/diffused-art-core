import NextCors from 'nextjs-cors';
import prisma from '../../../../lib/prisma';
import {
  applyRateLimit,
  getRateLimitMiddlewares,
} from '../../../../middlewares/applyRateLimit';
import { isValidPublicKey } from '../../../../utils/isValidPublicKey';

const middlewares = getRateLimitMiddlewares({ limit: 50 });

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

  if (req.method !== 'GET') {
    res.status(405).send({ message: 'Only GET requests allowed' });
    return;
  }

  const { address } = req.query;

  if (!isValidPublicKey(address)) {
    res.status(400).send({ message: 'Invalid address' });
    return;
  }

  const result = await prisma.mint.findUnique({
    where: { mint_address: address },
  });

  if (!result) {
    return res.status(404).json({ message: 'Not found.' });
  }
  return res.status(200).json({ data: result });
}
