import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';
import { Amplify } from 'aws-amplify';
import awsConfig from '../../../../src/aws-exports.js';
Amplify.configure({ ...awsConfig, ssr: true });
export const config = {
  runtime: 'experimental-edge',
  unstable_allowDynamic: [
    '/node_modules/**',
  ],
}

export default async function handle(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).send({ message: 'Only GET requests allowed' });
    return;
  }

  const isAdmin =
    req.query.adminPassword === process.env.MINT_PREVIEW_ADMIN_PASSWORD;

  if (!isAdmin) {
    const token = await getToken({ req });
    if (token === null) {
      return res.status(401).json({
        message: 'Not authenticated',
      });
    }
    const isExpirated = new Date().getTime() / 1000 > (token as any)?.exp;
    if (isExpirated) {
      return res.status(401).json({
        message: 'Token expired, refresh the page and try again',
      });
    }
  }

  const collection = await prisma.collection.findUnique({
    where: { id: req.query.id },
  });
  if (!collection) {
    return res.status(404).json({ message: 'Not found.' });
  }

  switch (req.method) {
    case 'GET': {
      return res.status(200).json({ data: collection });
    }
    case 'PUT': {
      // TODO: Update preview image once there is a trust less mechanism for creating collections
      return res.status(200).json({ data: collection });
    }
    default:
      return res.status(404).json({ message: 'Not found.' });
  }
}
