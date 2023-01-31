import { Keypair } from '@solana/web3.js';
import { unlinkSync } from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import { generateStableDiffImageAsync } from '../../../../functions/ai-sources/stable-diffusion';
import { STABLE_DIFFUSION_DEFAULTS_FOR_METADATA } from '../../../../functions/ai-sources/stable-diffusion/defaults';
import { generateSemiRandomNumberStableDiffusionRange } from '../../../../functions/ai-sources/stable-diffusion/generateSemiRandomSeed';
import {
  applyRateLimit,
  getRateLimitMiddlewares,
} from '../../../../middlewares/applyRateLimit';
import { applyRequireAuth } from '../../../../middlewares/applyRequireAuth';
import getSourceFromEngine from '../../../../utils/getSourceFromEngine';
import { isValidV1SpecStableDiffusion } from '../../../../utils/isValidV1Spec';

const middlewares = getRateLimitMiddlewares({ limit: 50 });

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

  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }

  try {
    applyRequireAuth(req);
  } catch (error) {
    return res.status(401).send(error);
  }

  const { prompt, init_image, width, height, cfgScale, engine } = req.body;

  const specObject = {
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
      samples: STABLE_DIFFUSION_DEFAULTS_FOR_METADATA.samples,
      steps: STABLE_DIFFUSION_DEFAULTS_FOR_METADATA.steps,
    },
  };

  if ((await isValidV1SpecStableDiffusion(specObject)) === false) {
    return res
      .status(400)
      .send({ message: 'It is not valid diffused.art spec' });
  }

  // TODO: Check how to make it work for init_image, may need to remove start/end_schedule
  const imageData = await generateStableDiffImageAsync(specObject).catch(() => {
    return [];
  });
  if (imageData.length === 0) {
    return res
      .status(500)
      .json({ data: 'Error while generating image, please try again later!' });
  }
  const lastGeneratedImage = imageData[imageData.length - 1];
  unlinkSync(lastGeneratedImage.filePath as string);
  return res.status(200).json({ imageURL: lastGeneratedImage.filePathCDN });
}
