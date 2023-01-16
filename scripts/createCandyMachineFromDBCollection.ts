import * as dotenv from 'dotenv';
dotenv.config();
import { Artist, Collection, PrismaClient } from '@prisma/client';
import { getWriteCli } from '../functions/getMetaplexCli';
import { AISource } from '../types';
import { PublicKey } from '@solana/web3.js';
import {
  CandyMachineV2,
  sol,
  toBigNumber,
  toDateTime,
  toMetaplexFile,
} from '@metaplex-foundation/js';
import { retry } from 'ts-retry-promise';
import { GUIDANCE_PRESETS } from '../functions/ai-sources/stable-diffusion/defaults';
import { refreshWebhookMonitor } from './helius/refresh-webhook-monitor';

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

  if (
    collection.promptSourceParams.guidance_preset ===
    GUIDANCE_PRESETS.GUIDANCE_PRESET_NONE
  ) {
    delete collection.promptSourceParams.guidance_preset;
    delete collection.promptSourceParams.guidance_cuts;
    delete collection.promptSourceParams.guidance_strength;
    delete collection.promptSourceParams.guidance_prompt;
    delete collection.promptSourceParams.guidance_models;
  } else {
    collection.promptSourceParams.guidance_cuts === 0
      ? delete collection.promptSourceParams.guidance_cuts
      : undefined;
    collection.promptSourceParams.guidance_strength === 0
      ? delete collection.promptSourceParams.guidance_strength
      : undefined;
    collection.promptSourceParams.guidance_prompt === 0
      ? delete collection.promptSourceParams.guidance_prompt
      : undefined;
    collection.promptSourceParams.guidance_models === 0
      ? delete collection.promptSourceParams.guidance_models
      : undefined;
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

  let [foundCollection] = (await prisma.collection.findMany({
    include: {
      artist: true,
    },
    where: {
      slugUrl,
      isFullyRevealed: false,
    },
  })) as (Collection & { artist: Artist })[];

  if (!foundCollection) {
    throw new Error('Collection not found');
  }

  const nftPlaceholderImage = await fetch(
    `http://localhost:3000/api/collection/${foundCollection.id}/preview?adminPassword=${process.env.MINT_PREVIEW_ADMIN_PASSWORD}`,
    { method: 'POST' },
  ).then(res => {
    return res.arrayBuffer();
  });

  const { metadata } = await metaplexWriteCli.nfts().uploadMetadata({
    image: toMetaplexFile(
      Buffer.from(nftPlaceholderImage),
      'nftPlaceholderImage.png',
    ),
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
            address: foundCollection?.artist.royaltiesWalletAddress,
            share: 90,
          },
        ],
      },
    });
    if ((uri?.length || 0) === 0) {
      console.error(`Couldnt generate unrevealed NFT`);
      return;
    }
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
              foundCollection?.artist.royaltiesWalletAddress,
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
            .replace('].', '');
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
    include: {
      artist: true,
    },
    where: {
      slugUrl,
    },
  })) as Collection & { artist: Artist };

  const creatorsArray = [
    {
      address: new PublicKey(process.env.FUNDED_WALLET_PUBKEY!),
      share: 10,
      verified: true,
    },
    {
      address: new PublicKey(foundCollection?.artist.royaltiesWalletAddress),
      share: 90,
      verified: false,
    },
  ];

  let candyMachineAddress: string | undefined = undefined;
  if (foundCollection.mintCandyMachineId) {
    console.info(
      `Candy machine already created for this collection, fetching!!`,
    );
    candyMachineAddress = foundCollection.mintCandyMachineId;
  } else {
    console.info(`Candy machine needs to be created, creating now...`);
    candyMachineAddress = await retry(
      () =>
        metaplexWriteCli
          .candyMachinesV2()
          .create({
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
            authority: new PublicKey(process.env.FUNDED_WALLET_PUBKEY!),
            // gatekeeper TODO: Add here to add botting protection
          })
          .then(data => data.candyMachine.address.toString())
          .catch(e => {
            if (
              e?.problem.includes(
                'No account was found at the provided address',
              )
            ) {
              return e?.problem
                ?.replace('No account was found at the provided address [', '')
                .replace('].', '');
            } else {
              console.error('Error when creating candy machine >', e);
              throw new Error('Error when creating candy machine');
            }
          }),
      {
        retries: 'INFINITELY',
        delay: 1000,
        backoff: 'LINEAR',
        timeout: 1000000,
        logger: console.log,
      },
    );
  }

  await prisma.collection.update({
    where: {
      slugUrl,
    },
    data: {
      mintCandyMachineId: candyMachineAddress,
    },
  });

  console.info(`DB updated with the CM ID! ${candyMachineAddress}`);

  console.info(
    `Candy Machine for collection created here: Hash: https://solana.fm/address/${candyMachineAddress} `,
  );

  const candyMachine = await retry(
    () =>
      metaplexWriteCli.candyMachinesV2().findByAddress({
        address: new PublicKey(candyMachineAddress || ''),
      }),
    {
      retries: 'INFINITELY',
      backoff: 'LINEAR',
      delay: 1000,
      timeout: 1000000,
      logger: console.log,
    },
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
            address: foundCollection?.artist.royaltiesWalletAddress,
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

  console.info('Refreshing Helius webhooks');
  await refreshWebhookMonitor();
  console.info('Helius webhooks refreshed');

  return;
}

createCandyMachineFromDBCollection();
