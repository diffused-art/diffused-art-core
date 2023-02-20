import {
  CandyMachine,
  sol,
  toBigNumber,
  toDateTime,
  TransactionBuilder,
} from '@metaplex-foundation/js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import axios from 'axios';
import { addMinutes } from 'date-fns';
import { useCallback } from 'react';
import { retry } from 'ts-retry-promise';
import { GUIDANCE_PRESETS } from '../functions/ai-sources/stable-diffusion/defaults';
import { AISource } from '../types';
import useAnonymousNFTStorage from './useAnonymousNFTStorage';
import {
  ActionTypesCreateCollectionStore,
  useCreateCollectionStore,
} from './useCreateCollectionStore';
import useMetaplexWriteCli from './useMetaplexWriteCli';

async function wrapInfiniteRetry(promise) {
  return await retry<any>(() => promise(), {
    retries: 'INFINITELY',
    delay: 1000,
    backoff: 'LINEAR',
    timeout: 10000000,
    logger: console.log,
  });
}

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

export default function useCandyMachineCreate() {
  const metaplexCli = useMetaplexWriteCli();
  const { uploadMetadata } = useAnonymousNFTStorage();
  const wallet = useWallet();
  const { connection } = useConnection();
  const { state, dispatch } = useCreateCollectionStore();
  const createCollectionNFT = useCallback(async () => {
    const {
      data: { data },
    } = await axios.get(`/api/collection/${state.collectionId}`);

    if (!data.collectionOnChainAddress) {
      const metadataURL = await uploadMetadata({
        name: data.mintName.replace(' #', ''),
        image: data.nftPlaceholderImageURL,
        description: data.description,
        attributes: getAttributes(data),
        properties: {
          files: [
            {
              type: 'image/png',
              uri: data.nftPlaceholderImageURL,
            },
          ],
          creators: [
            {
              address: process.env.NEXT_PUBLIC_DIFFUSED_ART_CREATOR,
              share: 10,
            },
            {
              address: data.artist.royaltiesWalletAddress,
              share: 90,
            },
          ],
        },
      });

      const collectionOnChainAddress: string = await metaplexCli
        .nfts()
        .create({
          uri: metadataURL,
          isMutable: false,
          name: data.mintName.replace(' #', ''),
          sellerFeeBasisPoints: 250,
          creators: [
            {
              address: new PublicKey(
                process.env.NEXT_PUBLIC_DIFFUSED_ART_CREATOR!,
              ),
              share: 10,
            },
            {
              address: new PublicKey(data.artist.royaltiesWalletAddress),
              share: 90,
            },
          ],
          isCollection: true,
        })
        .then(res => res.nft.address.toString())
        .catch(e => {
          if (
            e
              ?.toString()
              .includes?.(
                '[AccountNotFoundError] The account of type [MintAccount] was not found at the provided address [',
              )
          ) {
            return e
              ?.toString()
              ?.replace(
                '[AccountNotFoundError] The account of type [MintAccount] was not found at the provided address [',
                '',
              )
              .split('].')[0]
              .replace('].', '')
              .trim();
          } else {
            console.error('Error when creating Collection NFT >', e);
            throw new Error(`Error when creating Collection NFT - ${e}`);
          }
        });

      dispatch({
        type: ActionTypesCreateCollectionStore.SetFieldValue,
        payload: {
          field: 'collectionNFTAddress',
          value: collectionOnChainAddress,
        },
      });

      await axios.put(`/api/collection/${state.collectionId}`, {
        collectionOnChainAddress,
      });
    }
  }, [state.collectionId, uploadMetadata, metaplexCli, dispatch]);

  const createCandyMachine = useCallback(async () => {
    const {
      data: { data },
    } = await axios.get(`/api/collection/${state.collectionId}`);

    const creators = [
      {
        address: new PublicKey(process.env.NEXT_PUBLIC_DIFFUSED_ART_CREATOR!),
        share: 10,
        verified: false,
      },
      {
        address: new PublicKey(data.artist.royaltiesWalletAddress),
        share: 90,
        verified: true,
      },
    ];

    if (!data.mintCandyMachineId) {
      let startDate = toDateTime(data.mintOpenAt);
      if (new Date(data.mintOpenAt) >= new Date(Date.now())) {
        startDate = toDateTime(
          addMinutes(15, new Date(data.mintOpenAt).getTime()),
        );
      }

      const mintCandyMachineId: string = await wrapInfiniteRetry(() =>
        metaplexCli
          .candyMachines()
          .create({
            authority: metaplexCli.identity(),
            collection: {
              address: new PublicKey(data.collectionOnChainAddress),
              updateAuthority: metaplexCli.identity(),
            },
            guards: {
              botTax: { lamports: sol(0.01), lastInstruction: false },
              solPayment: {
                amount: sol(Number(data.mintPrice)),
                destination: new PublicKey(
                  process.env.NEXT_PUBLIC_DIFFUSED_ART_CREATOR!,
                ),
              },
              startDate: { date: startDate },
            },
            sellerFeeBasisPoints: Number(data.mintSellerFeeBasisPoints),
            itemsAvailable: toBigNumber(data.mintTotalSupply),
            itemSettings: {
              type: 'configLines',
              prefixName: `${data.mintName.replace(' #', '')} #$ID+1$`,
              nameLength: 0,
              prefixUri: `https://nftstorage.link/ipfs/`,
              uriLength: 59,
              isSequential: false,
            },
            symbol: data.mintSymbol,
            maxEditionSupply: toBigNumber(1),
            isMutable: true,
            creators,
          })
          .then(data => data.candyMachine.address.toString())
          .catch(e => {
            if (
              e
                ?.toString()
                .includes?.(
                  '[AccountNotFoundError] The account of type [CandyMachine] was not found at the provided address [',
                )
            ) {
              return e
                ?.toString()
                ?.replace(
                  '[AccountNotFoundError] The account of type [CandyMachine] was not found at the provided address [',
                  '',
                )
                .split('].')[0]
                .replace('].', '')
                .trim();
            } else {
              console.error('Error when creating candy machine >', e);
              throw new Error(`Error when creating candy machine - ${e}`);
            }
          }),
      );

      const candyMachine: CandyMachine = await wrapInfiniteRetry(() =>
        metaplexCli
          .candyMachines()
          .findByAddress({ address: new PublicKey(mintCandyMachineId) }),
      );

      console.info('Created Candy Machine - ', mintCandyMachineId);

      await axios.post(
        `/api/collection/${state.collectionId}/candy-machine-create-logs`,
        {
          mintCandyMachineId,
          mintGuardId: candyMachine.candyGuard?.address.toString(),
        },
      );

      // TODO: In case the need arises to update the candy guard authority as well. Shouldnt be needed tho.
      // const signatureGuard: string = await wrapInfiniteRetry(
      //   metaplexCli
      //     .candyMachines()
      //     .updateCandyGuardAuthority({
      //       authority: metaplexCli.identity(),
      //       newAuthority: new PublicKey(data.updateAuthorityPublicKey),
      //       candyGuard: new PublicKey(candyMachine.candyGuard?.address.toString() ?? ''),
      //     })
      //     .then(data => data.response.signature),
      // );
      // console.info('Created Candy Machine update auth updated - ', signatureGuard);

      await axios.put(`/api/collection/${state.collectionId}`, {
        mintCandyMachineId,
        mintGuardId: candyMachine.candyGuard?.address.toString(),
      });

      dispatch({
        type: ActionTypesCreateCollectionStore.SetFieldValue,
        payload: {
          field: 'collectionCandyMachineAddress',
          value: mintCandyMachineId,
        },
      });

      dispatch({
        type: ActionTypesCreateCollectionStore.SetFieldValue,
        payload: {
          field: 'collectionCandyGuardAddress',
          value: candyMachine.candyGuard?.address.toString() || '',
        },
      });

      console.info(
        'Candy Machine using the guard created, we are ready to go houston!',
      );
    }
  }, [state.collectionId, metaplexCli, dispatch]);

  const insertItems = useCallback(async () => {
    const {
      data: { data },
    } = await axios.get(`/api/collection/${state.collectionId}`);

    const candyMachine = await wrapInfiniteRetry(() =>
      metaplexCli
        .candyMachines()
        .findByAddress({ address: new PublicKey(data.mintCandyMachineId) }),
    );

    const uri = await uploadMetadata({
      name: data.mintName.replace(' #', ''),
      image: data.nftPlaceholderImageURL,
      description: data.description,
      attributes: getAttributes(data),
      properties: {
        files: [
          {
            type: 'image/png',
            uri: data.nftPlaceholderImageURL,
          },
        ],
        creators: [
          {
            address: process.env.NEXT_PUBLIC_DIFFUSED_ART_CREATOR,
            share: 10,
          },
          {
            address: data.artist.royaltiesWalletAddress,
            share: 90,
          },
        ],
      },
    });

    const items = Array(data.mintTotalSupply)
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

    console.log('chunkedItems', chunkedItems);

    const txnArray: Transaction[] = [];
    const blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight =
      await connection.getLatestBlockhash();
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

    const batchSize = 75;
    const batchedTxns: Transaction[][] = [];
    for (let i = 0; i < txnArray.length; i += batchSize) {
      const batch = txnArray.slice(i, i + batchSize);
      batchedTxns.push(batch);
    }

    const result = await wallet
      ?.signAllTransactions?.(txnArray)
      .catch(() => false);

    // User did not approve the transaction
    if (!result) {
      return;
    }
    const resultOfAll: any[] = [];
    for (let index = 0; index < batchedTxns.length; index++) {
      resultOfAll.push(
        await Promise.all(
          batchedTxns[index].map(txn =>
            sendAndConfirmTransaction(connection, txn),
          ),
        ),
      );
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const isSuccess = resultOfAll.every((result: any) => result.every((r: any) => !r?.value?.err));
    console.log('isSuccess', isSuccess);

    // const signature: string = await wrapInfiniteRetry(() =>
    //   metaplexCli
    //     .candyMachines()
    //     .update({
    //       authority: metaplexCli.identity(),
    //       newAuthority: new PublicKey(data.updateAuthorityPublicKey),
    //       candyMachine: new PublicKey(candyMachine.address.toString()),
    //     })
    //     .then(data => data.response.signature),
    // );
    // console.info('Created Candy Machine update auth updated - ', signature);

    // await axios.put(`/api/collection/${state.collectionId}`, {
    //   isPublished: true,
    // });

    console.info(
      `Finished inserting items into the CM! Please validate with "reinsertNonConfirmedItemsInsert" that all have been uploaded. 
        Hash: https://solana.fm/address/account/${candyMachine.address.toString()}`,
    );

    // dispatch({
    //   type: ActionTypesCreateCollectionStore.SetFieldValue,
    //   payload: {
    //     field: 'publishStep',
    //     value: 'done',
    //   },
    // });
  }, [
    state.collectionId,
    metaplexCli,
    dispatch,
    uploadMetadata,
    connection,
    wallet,
  ]);

  return {
    createCollectionNFT,
    createCandyMachine,
    insertItems,
  };
}
