import crypto from 'crypto';
import { serialize } from 'cookie';
import prisma from '../../../lib/prisma';
import {
  applyRateLimit,
  getIP,
  getRateLimitMiddlewares,
} from '../../../middlewares/applyRateLimit';

const middlewares = getRateLimitMiddlewares();

export default async function getNonce(req, res) {
  try {
    await applyRateLimit(req, res, middlewares);
  } catch (e) {
    console.log(`Error on applyRateLimit`, e);
    return res.status(429).send('Too Many Requests');
  }

  if (req.method === 'GET') {
    const nonce = crypto.randomBytes(32).toString('base64');

    res.setHeader(
      'Set-Cookie',
      serialize('auth-nonce', nonce, {
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
      }),
    );

    await prisma.nonceTrashBin.create({
      data: {
        nonce,
        used: false,
      },
    });
    return res.status(200).json({ nonce });
  }

  return res.status(405).send({ message: 'Only GET requests allowed' });
}
