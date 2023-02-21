import { Keypair, PublicKey, Signer, Transaction } from '@solana/web3.js';
import NextCors from 'nextjs-cors';
import { getWriteCli } from '../../../../functions/getMetaplexCli';
import prisma from '../../../../lib/prisma';
import {
  applyRateLimit,
  getRateLimitMiddlewares,
} from '../../../../middlewares/applyRateLimit';
import { getAttributes } from '../../../../utils/getAttributes';

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

  if (!['POST'].includes(req.method)) {
    res.status(405).send({ message: 'Only POST requests allowed' });
    return;
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

  const metaplexCli = getWriteCli();

  const { uri: metadataURL } = await metaplexCli.nfts().uploadMetadata({
    image: collection.nftPlaceholderImageURL!,
    description: collection.description,
    attributes: getAttributes(collection),
    properties: {
      category: 'image',
      files: [
        {
          type: 'image/png',
          uri: collection.nftPlaceholderImageURL!,
        },
      ],
      creators: [
        {
          address: process.env.NEXT_PUBLIC_DIFFUSED_ART_CREATOR,
          share: 10,
        },
        {
          address: collection.artist.royaltiesWalletAddress,
          share: 90,
        },
      ],
    },
  });
  const transactionBuilder = await metaplexCli
    .nfts()
    .builders()
    .create(
      {
        tokenOwner: new PublicKey(collection.artist.royaltiesWalletAddress),
        uri: metadataURL,
        isMutable: false,
        updateAuthority: metaplexCli.identity(),
        name: collection.mintName.replace(' #', ''),
        sellerFeeBasisPoints: 250,
        creators: [
          {
            address: new PublicKey(
              process.env.NEXT_PUBLIC_DIFFUSED_ART_CREATOR!,
            ),
            share: 10,
          },
          {
            address: new PublicKey(collection.artist.royaltiesWalletAddress),
            share: 90,
          },
        ],
        isCollection: true,
      },
      {
        // TODO: Patchy hacky since payer expects a Signer
        // And I just want to make the updateAuthority pay for everything
        // Ideally, Metaplex/JS should allow for a payer to be a PublicKey
        payer: {
          publicKey: new PublicKey(collection.artist.royaltiesWalletAddress),
          secretKey: Keypair.generate().secretKey,
        } as Signer,
      },
    );
  const blockhashWithExpiryBlockHeight =
    await metaplexCli.connection.getLatestBlockhash();

  const extraKeypairsToSign: Signer[] = [];

  const transaction = new Transaction({
    recentBlockhash: blockhashWithExpiryBlockHeight.blockhash,
    feePayer: new PublicKey(collection.artist.royaltiesWalletAddress),
  });
  for (
    let index = 0;
    index < transactionBuilder.getInstructions().length;
    index++
  ) {
    const txIns = transactionBuilder.getInstructionsWithSigners()[index];
    for (const signer of txIns.signers) {
      // TODO: This guarantees that both the update authority (this server) and the royalties wallet address remain unsigned
      if (
        signer.publicKey.equals(metaplexCli.identity().publicKey) ||
        signer.publicKey.equals(
          new PublicKey(collection.artist.royaltiesWalletAddress),
        )
      ) {
        continue;
      }
      extraKeypairsToSign.push(signer as Signer);
    }
    transaction.add(txIns.instruction);
  }

  transaction.partialSign(metaplexCli.identity() as Signer);
  for (let index = 0; index < extraKeypairsToSign.length; index++) {
    const signer = extraKeypairsToSign[index];
    transaction.partialSign(signer);
  }
  return res.json({
    data: transaction.serialize({ requireAllSignatures: false }),
  });
}
