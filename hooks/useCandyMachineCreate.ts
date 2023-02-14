import {
  CandyMachine,
  sol,
  toBigNumber,
  toDateTime,
} from '@metaplex-foundation/js';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { addMinutes } from 'date-fns';
import { useCallback, useState } from 'react';
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

      const signature: string = await wrapInfiniteRetry(() =>
        metaplexCli
          .candyMachines()
          .update({
            authority: metaplexCli.identity(),
            newAuthority: new PublicKey(data.updateAuthorityPublicKey),
            candyMachine: new PublicKey(mintCandyMachineId),
          })
          .then(data => data.response.signature),
      );
      console.info('Created Candy Machine update auth updated - ', signature);

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

      await axios.put(
        `/api/collection/${state.collectionId}`,
        {
          mintCandyMachineId,
          mintGuardId: candyMachine.candyGuard?.address.toString(),
        },
      );

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
          field: 'collectionCandyMachineAddress',
          value: mintCandyMachineId
        },
      });

      console.info(
        'Candy Machine using the guard and changed authority, we are ready to go houston!',
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
        name: `${i + 1}`,
        uri: uri.replace('https://nftstorage.link/ipfs/', ''),
      }));

    console.log(items);

    // insert items batched
  }, [state.collectionId, metaplexCli, dispatch, uploadMetadata]);

  return {
    createCollectionNFT,
    createCandyMachine,
    insertItems,
  };
}
