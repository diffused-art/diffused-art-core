import { NextApiRequest, NextApiResponse, PageConfig } from 'next';
import NextCors from 'nextjs-cors';
import {
  applyRateLimit,
  getRateLimitMiddlewares,
} from '../../../../middlewares/applyRateLimit';
import { applyRequireAuth } from '../../../../middlewares/applyRequireAuth';

const middlewares = getRateLimitMiddlewares({ limit: 50 });

import formidable from 'formidable';
import { Readable, Writable } from 'stream';
import { uploadStream } from '../../../../utils/uploadStreamAWS';
import { nanoid } from 'nanoid';

const formidableConfig = {
  keepExtensions: true,
  maxFileSize: 5_000_000,
  maxFieldsSize: 5_000_000,
  maxFields: 1,
  allowEmptyFiles: false,
  multiples: false,
};

function formidablePromise(
  req: NextApiRequest,
  opts?: Parameters<typeof formidable>[0],
): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((accept, reject) => {
    const form = formidable(opts);

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      return accept({ fields, files });
    });
  });
}

const fileConsumer = <T = unknown>(acc: T[]) => {
  const writable = new Writable({
    write: (chunk, _enc, next) => {
      acc.push(chunk);
      next();
    },
  });

  return writable;
};

async function handle(req: NextApiRequest, res: NextApiResponse) {
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

  try {
    const chunks: never[] = [];

    await formidablePromise(req, {
      ...formidableConfig,
      fileWriteStreamHandler: () => fileConsumer(chunks),
    });

    const fileData = Buffer.concat(chunks);

    const { writeStream, promise } = uploadStream({
      Key: `/image-teasers/${nanoid(50)}`,
      ContentType: 'image/png',
    });
    const readable = new Readable();
    readable._read = () => {};
    readable.push(fileData);
    readable.push(null);

    readable.pipe(writeStream);
    const result: any = await promise;
    const cdnPath = result.Location.replace(
      'https://stored-metadatas.s3.amazonaws.com/',
      process.env.CLOUDFRONT_DOMAIN,
    ).replace(
      'https://stored-metadatas.s3.us-east-2.amazonaws.com/',
      process.env.CLOUDFRONT_DOMAIN,
    );

    return res.status(200).json({
      data: cdnPath,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

export default handle;
