import { Decimal } from '@prisma/client/runtime';
import { Keypair } from '@solana/web3.js';
import { getToken } from 'next-auth/jwt';
import NextCors from 'nextjs-cors';
import { STABLE_DIFFUSION_DEFAULTS_FOR_METADATA } from '../../../functions/ai-sources/stable-diffusion/defaults';
import prisma from '../../../lib/prisma';
import {
  applyRateLimit,
  getRateLimitMiddlewares,
} from '../../../middlewares/applyRateLimit';
import { applyRequireAuth } from '../../../middlewares/applyRequireAuth';
import cryptojs from 'crypto-js';

const middlewares = getRateLimitMiddlewares();

const slugify = str =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' });
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

  const token = await getToken({ req });

  const updateAuthority = Keypair.generate();

  const collection = await prisma.collection.upsert({
    where: {
      slugUrl: slugify(req.body.title),
    },
    update: {},
    create: {
      slugUrl: slugify(req.body.title),
      title: req.body.title,
      description: req.body.description,
      promptPhrase: req.body.promptPhrase,
      promptInitImage: req.body.promptInitImage,
      promptSource: req.body.promptSource,
      promptSourceParams: {
        ...STABLE_DIFFUSION_DEFAULTS_FOR_METADATA,
        ...req.body.promptSourceParams,
      },
      bannerImageURL: req.body.bannerImageURL,
      mintName: req.body.mintName,
      mintPrice: new Decimal(Number(req.body.mintPrice)),
      mintSellerFeeBasisPoints: 250,
      mintOpenAt: new Date(req.body.mintOpenAt),
      // Figure a way to create a mint symbol
      mintSymbol: '',
      mintTotalSupply: Number(req.body.mintTotalSupply),
      artist: {
        connect: {
          // get from token artist id
          username: (token as any).username,
        },
      },
      updateAuthorityPublicKey: updateAuthority.publicKey.toString(),
      updateAuthorityPrivateKey: cryptojs.AES.encrypt(
        updateAuthority.secretKey.toString(),
        process.env.ENCRYPT_PASS,
      ).toString(),
      isPublished: false,
      isFullyRevealed: false,
      hashList: [],
    },
  });

  await prisma.collectionTag.createMany({
    data: req.body.tags.map((tagId: string) => ({
      collectionId: collection.id,
      tagId,
    })),
  });

  return res.status(200).json({ data: { ...collection, updateAuthorityPrivateKey: null } });
}
