import { Prisma } from '@prisma/client';
import { Keypair } from '@solana/web3.js';
import { unlinkSync } from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import NextCors from 'nextjs-cors';
import { Readable } from 'stream';
import { generateStableDiffImageAsync } from '../../../../functions/ai-sources/stable-diffusion';
import { generateSemiRandomNumberStableDiffusionRange } from '../../../../functions/ai-sources/stable-diffusion/generateSemiRandomSeed';
import {
  applyRateLimit,
  getRateLimitMiddlewares,
} from '../../../../middlewares/applyRateLimit';
import { applyRequireAuth } from '../../../../middlewares/applyRequireAuth';
import getSourceFromEngine from '../../../../utils/getSourceFromEngine';

const middlewares = getRateLimitMiddlewares({ limit: 5 });

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    await applyRateLimit(req, res, middlewares);
  } catch {
    return res.status(429).send('Too Many Requests');
  }

  req.setTimeout(150000);
  await NextCors(req, res, {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: process.env.ALLOWED_ORIGIN,
    optionsSuccessStatus: 200,
  });

  if (req.method !== 'GET') {
    res.status(405).send({ message: 'Only GET requests allowed' });
    return;
  }

  try {
    applyRequireAuth(req);
  } catch (error) {
    return res.status(401).send(error);
  }

  const { prompt, init_image, width, height, cfgScale, engine } = req.body;

  // TODO: Check how to make it work for init_image, may need to remove start/end_schedule
  // Probably the solution here is to create a generic function: "generateBaseAIIMageSpecObject"
  // that set some defaults and take care of cleaning up the object where needed, similar to getAttributes from revealNFTs
  const imageData = await generateStableDiffImageAsync({
    prompt,
    init_image,
    source: getSourceFromEngine(engine),
    seed: generateSemiRandomNumberStableDiffusionRange(
      Keypair.generate().publicKey.toString(),
    ),
    sourceParams: {
      height,
      width,
      cfgScale,
      engine,
    },
  }).catch(() => {
    return [];
  });
  if (imageData.length === 0) {
    return res.status(200).json({ data: 'Couldnt generate image' });
  }
  const lastGeneratedImage = imageData[imageData.length - 1];
  res.setHeader('Content-Type', 'image/png');
  const readable = new Readable();
  readable._read = () => {};
  readable.push(lastGeneratedImage.buffer);
  readable.push(null);
  readable.pipe(res);
  unlinkSync(lastGeneratedImage.filePath as string);
  return;
}
