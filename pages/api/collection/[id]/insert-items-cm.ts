import NextCors from 'nextjs-cors';
import prisma from '../../../../lib/prisma';
import {
  applyRateLimit,
  getRateLimitMiddlewares,
} from '../../../../middlewares/applyRateLimit';
import { getWriteCli } from '../../../../functions/getMetaplexCli';
import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { CandyMachine, TransactionBuilder } from '@metaplex-foundation/js';
import { wrapInfiniteRetry } from '../../../../utils/wrapInfiniteRetry';
import { getAttributes } from '../../../../utils/getAttributes';

const middlewares = getRateLimitMiddlewares();

async function sendAndConfirmTransaction(
  connection: Connection,
  signedTransaction: Transaction,
) {
  const txid = await connection.sendRawTransaction(
    signedTransaction.serialize(),
    {
      skipPreflight: true,
    },
  );

  // Confirm the transaction
  const signatureStatus = await connection.confirmTransaction(
    txid,
    'confirmed',
  );

  return signatureStatus;
}

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

  console.log('Is here >>>');

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
  const candyMachine: CandyMachine = await wrapInfiniteRetry(() =>
    metaplexCli.candyMachines().findByAddress({
      address: new PublicKey(collection.mintCandyMachineId!),
    }),
  );

  const { uri } = await metaplexCli.nfts().uploadMetadata({
    name: collection.mintName.replace(' #', ''),
    image: collection.nftPlaceholderImageURL!,
    description: collection.description,
    attributes: getAttributes(collection),
    properties: {
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

  const items = Array(collection.mintTotalSupply)
    .fill(0)
    .map((_, i) => ({
      name: '',
      uri: uri.replace('https://nftstorage.link/ipfs/', ''),
    }));

  console.info(
    `Array created to be inserted into the CM (${
      items.length
    } items) ${JSON.stringify(items.slice(0, 5))}`,
  );

  const chunkSize = 5;
  const chunkedItems: any[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    chunkedItems.push(chunk);
  }

  const txnArray: Transaction[] = [];
  const blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight =
    await metaplexCli.connection.getLatestBlockhash();
  for (let index = 0; index < chunkedItems.length; index++) {
    const chunkItems = chunkedItems[index];
    console.info(`Creating TXN for Chunk N${index + 1} with 5 items`);
    const txBuilder: TransactionBuilder = metaplexCli
      .candyMachines()
      .builders()
      .insertItems({
        candyMachine,
        items: chunkItems,
        index: index * chunkSize,
      });

    txnArray.push(txBuilder.toTransaction(blockhashWithExpiryBlockHeight));
  }
  const rpcCli = metaplexCli.rpc();
  const signedTransactions = await Promise.all(
    txnArray.map(txn => rpcCli.signTransaction(txn, [metaplexCli.identity()])),
  );

  const batchSize = 75;
  const batchedTxns: Transaction[][] = [];
  for (let i = 0; i < signedTransactions.length; i += batchSize) {
    const batch = signedTransactions.slice(i, i + batchSize);
    batchedTxns.push(batch);
  }

  const resultOfAll: any[] = [];
  for (let index = 0; index < batchedTxns.length; index++) {
    resultOfAll.push(
      await Promise.all(
        batchedTxns[index].map(txn =>
          sendAndConfirmTransaction(metaplexCli.connection, txn),
        ),
      ),
    );
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  const signature: string = await wrapInfiniteRetry(() =>
    metaplexCli
      .candyMachines()
      .update({
        authority: metaplexCli.identity(),
        newAuthority: new PublicKey(collection.artist.royaltiesWalletAddress),
        candyMachine: new PublicKey(candyMachine.address.toString()),
      })
      .then(data => data.response.signature),
  );
  console.info('Updated Candy Machine update auth updated - ', signature);

  return res.status(200).json({ message: 'Success' });
}
