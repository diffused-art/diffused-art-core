import crypto from 'crypto';
import { serialize } from 'cookie';
import prisma from '../../../lib/prisma';
import { Amplify } from 'aws-amplify';
import awsConfig from '../../../src/aws-exports.js';
Amplify.configure({ ...awsConfig, ssr: true });

export const config = {
  runtime: 'experimental-edge',
  unstable_allowDynamic: [
    '/node_modules/**',
  ],
}

export default async function getNonce(req, res) {
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
