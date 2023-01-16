import { getToken } from 'next-auth/jwt';
import NextCors from 'nextjs-cors';
import prisma from '../../../../lib/prisma';
import {
  applyRateLimit,
  getRateLimitMiddlewares,
} from '../../../../middlewares/applyRateLimit';
import { applyRequireAuth } from '../../../../middlewares/applyRequireAuth';

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

  if (req.method !== 'PUT') {
    res.status(405).send({ message: 'Only PUT requests allowed' });
    return;
  }

  const isAdmin =
    req.query.adminPassword === process.env.MINT_PREVIEW_ADMIN_PASSWORD;

  if (!isAdmin) {
    try {
      applyRequireAuth(req);
    } catch (error) {
      return res.status(401).send(error);
    }
  }

  const collection = await prisma.collection.findUnique({
    where: { id: req.query.id },
  });
  if (!collection) {
    return res.status(404).json({ message: 'Not found.' });
  }

  switch (req.method) {
    case 'PUT': {
      // TODO: Update preview image once there is a trust less mechanism for creating collections
      return res.status(200).json({ data: collection });
    }
    default:
      return res.status(404).json({ message: 'Not found.' });
  }
}
