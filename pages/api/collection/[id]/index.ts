import axios from 'axios';
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

  if (!['GET', 'PUT'].includes(req.method)) {
    res.status(405).send({ message: 'Only GET/PUT requests allowed' });
    return;
  }

  const isAdmin =
    req.query.adminPassword === process.env.MINT_PREVIEW_ADMIN_PASSWORD;

  if (!isAdmin) {
    try {
      await applyRequireAuth(req);
    } catch (error) {
      return res.status(401).send(error);
    }
  }

  const collection = await prisma.collection.findUnique({
    include: {
      artist: true,
    },
    where: { id: req.query.id },
  });

  if (!collection) {
    return res.status(404).json({ message: 'Not found.' });
  }

  switch (req.method) {
    case 'GET': {
      return res
        .status(200)
        .json({ data: { ...collection, updateAuthorityPrivateKey: null } });
    }
    case 'PUT': {
      const dataToUpdate = {};
      if (req.body.nftPlaceholderImageURL)
        dataToUpdate['nftPlaceholderImageURL'] =
          req.body.nftPlaceholderImageURL;
      if (req.body.mintOpenAt)
        dataToUpdate['mintOpenAt'] = new Date(req.body.mintOpenAt);
      if (req.body.collectionOnChainAddress)
        dataToUpdate['collectionOnChainAddress'] =
          req.body.collectionOnChainAddress;
      if (req.body.mintCandyMachineId)
        dataToUpdate['mintCandyMachineId'] = req.body.mintCandyMachineId;
      if (req.body.mintGuardId)
        dataToUpdate['mintGuardId'] = req.body.mintGuardId;
      if (req.body.isPublished) {
        dataToUpdate['isPublished'] = req.body.isPublished;
        let collections = await prisma.collection.findMany({
          where: {
            isFullyRevealed: false,
          },
        });
        collections = collections.filter(
          collection =>
            collection.mintTotalSupply !==
            [...new Set([...((collection.hashList as string[]) || [])])].length,
        );
        const accountAddresses = collections
          .map(({ mintCandyMachineId }) => mintCandyMachineId)
          .filter(Boolean);

        const { data } = await axios.get(
          `https://api.helius.xyz/v0/webhooks/${process.env.HELIUS_CM_MONITOR_ID}?api-key=${process.env.HELIUS_API_KEY}`,
        );

        const result = await axios.put(
          `https://api.helius.xyz/v0/webhooks/${process.env.HELIUS_CM_MONITOR_ID}?api-key=${process.env.HELIUS_API_KEY}`,
          {
            transactionTypes: data.transactionTypes,
            authHeader: data.authHeader,
            webhookURL: data.webhookURL,
            webhookType: data.webhookType,
            accountAddresses,
          },
        );
      }
      const collection = await prisma.collection.update({
        where: { id: req.query.id },
        data: dataToUpdate,
      });
      return res
        .status(200)
        .json({ data: { ...collection, updateAuthorityPrivateKey: null } });
    }
    default:
      return res.status(404).json({ message: 'Not found.' });
  }
}
