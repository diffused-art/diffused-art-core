import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { getWriteCli } from '../functions/getMetaplexCli';
import { AISource } from '../typings';
import { PublicKey } from '@solana/web3.js';
import { sol, toBigNumber, toDateTime } from '@metaplex-foundation/js';

const prisma = new PrismaClient();

function getAttributes(collection) {
  const attributes = [];

  if (collection.promptSource === 'STABLEDIFFUSION') {
    attributes.push({
      trait_type: 'source',
      value: AISource.STABLEDIFFUSION,
    });
  }

  if (collection.promptPhrase) {
    attributes.push({
      trait_type: 'prompt',
      value: collection.promptPhrase,
    });
  }

  if (collection.promptInitImage) {
    attributes.push({
      trait_type: 'init_image',
      value: collection.promptInitImage,
    });
  }

  attributes.push(
    ...(Object.entries(collection.promptSourceParams as any).map(
      ([key, value]) => {
        return {
          trait_type: `source-param:${key}`,
          value,
        };
      },
    ) as any[]),
  );

  return attributes;
}
async function createCandyMachineFromDBCollection(
  slugUrl = '/sample-collection-cyberpunk-dragon',
) {
  const metaplexWriteCli = await getWriteCli();

  let [foundCollection] = await prisma.collection.findMany({
    where: {
      slugUrl,
      isFullyRevealed: false,
    },
  });

  if (!foundCollection) {
    throw new Error('Collection not found');
  }

  if (!foundCollection.collectionOnChainAddress) {
    const { uri } = await metaplexWriteCli
      .nfts()
      .uploadMetadata({
        name: foundCollection.mintName,
        image: foundCollection.nftPlaceholderImageURL,
        description: foundCollection.description,
        attributes: getAttributes(foundCollection),
        properties: {
          files: [
            {
              type: 'image/png',
              uri: foundCollection?.nftPlaceholderImageURL,
            },
          ],
          creators: [
            {
              address: process.env.FUNDED_WALLET_PUBKEY,
              share: 10,
            },
            {
              address: foundCollection?.artistRoyaltiesWalletAddress,
              share: 90,
            },
          ],
        },
      })
      .run();
    const { nft: collectionNFT } = await metaplexWriteCli
      .nfts()
      .create({
        uri,
        isMutable: false,
        name: foundCollection.mintName,
        sellerFeeBasisPoints: 250,
        creators: [
          {
            address: new PublicKey(process.env.FUNDED_WALLET_PUBKEY),
            share: 10,
          },
          {
            address: new PublicKey(
              foundCollection?.artistRoyaltiesWalletAddress,
            ),
            share: 90,
          },
        ],
        isCollection: true,
      })
      .run();

    await prisma.collection.update({
      where: {
        slugUrl,
      },
      data: {
        collectionOnChainAddress: collectionNFT.address.toString(),
      },
    });

    console.info(
      `Collection NFT (Metaplex Certified Collection) created successfully!! Hash: https://solscan.io/token/${collectionNFT.address}`,
    );
  }

  if (foundCollection.collectionOnChainAddress) {
    console.info(
      `Collection NFT already created for this registry, skipping!! Hash: https://solscan.io/token/${foundCollection?.collectionOnChainAddress}`,
    );
  }

  foundCollection = await prisma.collection.findUnique({
    where: {
      slugUrl,
    },
  });

  const creatorsArray = [
    {
      address: new PublicKey(process.env.FUNDED_WALLET_PUBKEY),
      share: 10,
      verified: true,
    },
    {
      address: new PublicKey(foundCollection?.artistRoyaltiesWalletAddress),
      share: 90,
      verified: false,
    },
  ];

  let candyMachine = null;
  await new Promise(resolve => setTimeout(resolve, 5000));
  if (foundCollection.mintCandyMachineId) {
    console.info(
      `Candy machine already created for this collection, fetching!!`,
    );
    candyMachine = await metaplexWriteCli
      .candyMachines()
      .findByAddress({
        address: new PublicKey(foundCollection.mintCandyMachineId),
      })
      .run();
  } else {
    console.info(`Candy machine needs to be created, creating now...`);
    candyMachine = (
      await metaplexWriteCli
        .candyMachines()
        .create({
          collection: new PublicKey(foundCollection.collectionOnChainAddress!),
          itemsAvailable: toBigNumber(foundCollection.mintTotalSupply),
          price: sol(foundCollection.mintPrice.toNumber()),
          // TODO: Needed to support SPL Tokens
          // tokenMint: foundCollection?.mintTokenSPL
          //   ? new PublicKey(foundCollection?.mintTokenSPL)
          //   : undefined,
          sellerFeeBasisPoints: foundCollection.mintSellerFeeBasisPoints,
          creators: creatorsArray,
          retainAuthority: true,
          symbol: foundCollection.mintSymbol,
          maxEditionSupply: toBigNumber(0),
          goLiveDate: toDateTime(foundCollection.mintOpenAt.getTime()),
          isMutable: true,
          // gatekeeper TODO: Add here to add botting protection
        })
        .run()
    ).candyMachine;
  }

  await prisma.collection.update({
    where: {
      slugUrl,
    },
    data: {
      mintCandyMachineId: candyMachine.address.toString(),
    },
  });

  console.info(`DB updated with the CM ID! ${candyMachine.address.toString()}`);

  console.info(
    `Candy Machine for collection created here: Hash: https://solscan.io/account/${candyMachine.address.toString()} `,
  );

  if (candyMachine.items.length !== foundCollection.mintTotalSupply) {
    const { uri } = await metaplexWriteCli
      .nfts()
      .uploadMetadata({
        name: foundCollection.mintName,
        image: foundCollection.nftPlaceholderImageURL,
        description: foundCollection.description,
        attributes: getAttributes(foundCollection),
        properties: {
          files: [
            {
              type: 'image/png',
              uri: foundCollection?.nftPlaceholderImageURL,
            },
          ],
          creators: [
            {
              address: process.env.FUNDED_WALLET_PUBKEY,
              share: 10,
            },
            {
              address: foundCollection?.artistRoyaltiesWalletAddress,
              share: 90,
            },
          ],
        },
      })
      .run();

    const items = Array(foundCollection.mintTotalSupply)
      .fill(0)
      .map((_, i) => ({
        name: `${foundCollection.mintName} #${i + 1}`,
        uri,
      }));

    console.info(
      `Array created to be inserted into the CM (${
        items.length
      } items) ${JSON.stringify(items.slice(0, 5))}`,
    );

    const chunkSize = 5;
    const chunkedItems = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      chunkedItems.push(chunk);
    }

    console.info(`Inserting items into the CM, please wait...`);
    const promisesArray = [];
    for (let index = 0; index < chunkedItems.length; index++) {
      const chunkItems = chunkedItems[index];

      promisesArray.push(
        () =>
          new Promise(async resolve => {
            console.info(`Inserting Chunk N${index + 1} with 5 items`);
            resolve(
              await metaplexWriteCli
                .candyMachines()
                .insertItems({
                  candyMachine,
                  authority: metaplexWriteCli.identity(),
                  items: chunkItems,
                  index: toBigNumber(index * chunkSize),
                })
                .run()
                .catch(async e => {
                  if (
                    e.message.includes(
                      'Invalid response body while trying to fetch',
                    )
                  ) {
                    console.info(`Error while inserting Chunk N${index + 1}`);
                    await prisma.errorsCMChunksUpload.create({
                      data: {
                        candyMachineAddress: candyMachine.address.toString(),
                        collection: {
                          connect: {
                            id: foundCollection.id,
                          },
                        },
                        index: index * chunkSize,
                        items: chunkItems,
                        cause: e.message,
                      },
                    });
                  }
                }),
            );
          }),
      );
    }

    const batchSize = 75;
    const batchedPromiseArray = [];
    for (let i = 0; i < promisesArray.length; i += batchSize) {
      const batch = promisesArray.slice(i, i + batchSize);
      batchedPromiseArray.push(batch);
    }

    for (let index = 0; index < batchedPromiseArray.length; index++) {
      await Promise.all(batchedPromiseArray[index].map(promise => promise()));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.info(
      `Finished inserting items into the CM! Please validate with "reinsertNonConfirmedItemsInsert" that all have been uploaded. Hash: https://solscan.io/account/${candyMachine.address.toString()}`,
    );
  } else {
    console.info('All items already inserted into the CM');
  }

  return;
}

createCandyMachineFromDBCollection();
