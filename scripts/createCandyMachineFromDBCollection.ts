import * as dotenv from 'dotenv';
dotenv.config();
import { Collection, PrismaClient } from '@prisma/client';
import { getWriteCli } from '../functions/getMetaplexCli';
import { AISource } from '../typings';
import { PublicKey } from '@solana/web3.js';
import {
  CandyMachineV2,
  sol,
  toBigNumber,
  toDateTime,
  toMetaplexFile,
} from '@metaplex-foundation/js';
import { retry } from 'ts-retry-promise';
import { generatePlaceholderImage } from './generatePlaceholderImage';

const prisma = new PrismaClient();

function isCandyMachine(
  candyMachine: CandyMachineV2 | undefined,
): candyMachine is CandyMachineV2 {
  return (<CandyMachineV2>candyMachine)?.address !== undefined;
}

function getAttributes(collection) {
  const attributes: any[] = [];

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
  } else {
    delete collection.promptSourceParams.start_schedule;
    delete collection.promptSourceParams.end_schedule;
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
async function createCandyMachineFromDBCollection() {
  const result = require('minimist')(process.argv.slice(2));
  const slugUrl = result.slugUrl || '/sample-collection-cyberpunk-dragon';
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

  const nftPlaceholderImage = await generatePlaceholderImage(
    foundCollection.id,
    foundCollection.promptPhrase,
    foundCollection.promptInitImage as any,
    foundCollection.nftPlaceholderFontFamily as any,
    foundCollection.nftPlaceholderBackgroundColor as any,
    foundCollection.nftPlaceholderForegroundColor as any,
  );

  const { metadata } = await metaplexWriteCli.nfts().uploadMetadata({
    image: toMetaplexFile(nftPlaceholderImage, 'nftPlaceholderImage.png'),
  });
  const nftPlaceholderImageURL = metadata.image;

  await prisma.collection.update({
    where: {
      id: foundCollection.id,
    },
    data: {
      nftPlaceholderImageURL,
    },
  });

  if (!foundCollection.collectionOnChainAddress) {
    const { uri } = await metaplexWriteCli.nfts().uploadMetadata({
      name: foundCollection.mintName,
      image: nftPlaceholderImageURL,
      description: foundCollection.description,
      attributes: getAttributes(foundCollection),
      properties: {
        files: [
          {
            type: 'image/png',
            uri: nftPlaceholderImageURL,
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
    });
    console.info(`Collection NFT not found, creating now, please wait...`);
    const collectionNFTAddress: string = await metaplexWriteCli
      .nfts()
      .create({
        uri,
        isMutable: false,
        name: foundCollection.mintName,
        sellerFeeBasisPoints: 250,
        creators: [
          {
            address: new PublicKey(process.env.FUNDED_WALLET_PUBKEY!),
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
      .then(res => res.nft.address.toString())
      .catch(e => {
        if (
          e.message.includes(
            'raised an error that is not recognized by the programs registered by the SDK',
          )
        ) {
          console.error('Error >', e);
          throw new Error('Error when creating Collection NFT');
        } else if (
          e?.problem.includes(
            'The account of type [MintAccount] was not found at the provided address',
          )
        ) {
          return e?.problem
            ?.replace(
              'The account of type [MintAccount] was not found at the provided address [',
              '',
            )
            .replace(']', '');
        }
      });

    await new Promise(resolve => setTimeout(resolve, 10000));
    console.info(
      `Collection NFT minted successfully Hash: https://solana.fm/address/${collectionNFTAddress}`,
    );

    await prisma.collection.update({
      where: {
        slugUrl,
      },
      data: {
        collectionOnChainAddress: collectionNFTAddress,
      },
    });

    console.info(
      `Collection NFT (Metaplex Certified Collection) saved to the DB collection id: ${foundCollection.id}`,
    );
  }

  if (foundCollection.collectionOnChainAddress) {
    console.info(
      `Collection NFT already created for this registry, skipping!! Hash: https://solana.fm/address/${foundCollection?.collectionOnChainAddress}`,
    );
  }

  foundCollection = (await prisma.collection.findUnique({
    where: {
      slugUrl,
    },
  })) as Collection;

  const creatorsArray = [
    {
      address: new PublicKey(process.env.FUNDED_WALLET_PUBKEY!),
      share: 10,
      verified: true,
    },
    {
      address: new PublicKey(foundCollection?.artistRoyaltiesWalletAddress),
      share: 90,
      verified: false,
    },
  ];

  let candyMachine: CandyMachineV2 | undefined = undefined;
  if (foundCollection.mintCandyMachineId) {
    console.info(
      `Candy machine already created for this collection, fetching!!`,
    );
    candyMachine = await metaplexWriteCli.candyMachinesV2().findByAddress({
      address: new PublicKey(foundCollection.mintCandyMachineId),
    });
  } else {
    console.info(`Candy machine needs to be created, creating now...`);
    candyMachine = (
      await retry(
        () =>
          metaplexWriteCli.candyMachinesV2().create({
            collection: new PublicKey(
              foundCollection.collectionOnChainAddress!,
            ),
            itemsAvailable: toBigNumber(foundCollection.mintTotalSupply || 0),
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
            goLiveDate: toDateTime(foundCollection.mintOpenAt),
            isMutable: true,
            // gatekeeper TODO: Add here to add botting protection
          }),
        { retries: 15, delay: 1000, timeout: 1000000 },
      )
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
    `Candy Machine for collection created here: Hash: https://solana.fm/address/${candyMachine.address.toString()} `,
  );

  if (candyMachine.items.length !== foundCollection.mintTotalSupply) {
    const { uri } = await metaplexWriteCli.nfts().uploadMetadata({
      name: foundCollection.mintName,
      image: nftPlaceholderImageURL,
      description: foundCollection.description,
      attributes: getAttributes(foundCollection),
      properties: {
        files: [
          {
            type: 'image/png',
            uri: nftPlaceholderImageURL,
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
    });

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
    const chunkedItems: any[] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      chunkedItems.push(chunk);
    }

    console.info(`Inserting items into the CM, please wait...`);
    const promisesArray: any[] = [];
    for (let index = 0; index < chunkedItems.length; index++) {
      const chunkItems = chunkedItems[index];

      promisesArray.push(
        () =>
          new Promise(async resolve => {
            console.info(`Inserting Chunk N${index + 1} with 5 items`);
            if (isCandyMachine(candyMachine)) {
              resolve(
                await metaplexWriteCli
                  .candyMachinesV2()
                  .insertItems({
                    candyMachine,
                    authority: metaplexWriteCli.identity(),
                    items: chunkItems,
                    index: toBigNumber(index * chunkSize),
                  })
                  .catch(async e => {
                    if (
                      e.message.includes(
                        'Invalid response body while trying to fetch',
                      )
                    ) {
                      console.info(`Error while inserting Chunk N${index + 1}`);
                      if (isCandyMachine(candyMachine)) {
                        await prisma.errorsCMChunksUpload.create({
                          data: {
                            candyMachineAddress:
                              candyMachine.address.toString(),
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
                    }
                  }),
              );
            }
          }),
      );
    }

    const batchSize = 75;
    const batchedPromiseArray: any[] = [];
    for (let i = 0; i < promisesArray.length; i += batchSize) {
      const batch = promisesArray.slice(i, i + batchSize);
      batchedPromiseArray.push(batch);
    }

    for (let index = 0; index < batchedPromiseArray.length; index++) {
      await Promise.all(batchedPromiseArray[index].map(promise => promise()));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.info(
      `Finished inserting items into the CM! Please validate with "reinsertNonConfirmedItemsInsert" that all have been uploaded. Hash: https://solana.fm/address/account/${candyMachine.address.toString()}`,
    );
  } else {
    console.info('All items already inserted into the CM');
  }

  return;
}

createCandyMachineFromDBCollection();
