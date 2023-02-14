import { Collection } from '@prisma/client';
import axios from 'axios';
import React, { useState } from 'react';
import useAnonymousNFTStorage from '../../../hooks/useAnonymousNFTStorage';
import useCandyMachineCreate from '../../../hooks/useCandyMachineCreate';
import {
  ActionTypesCreateCollectionStore,
  useCreateCollectionStore,
} from '../../../hooks/useCreateCollectionStore';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { generateAPIObjectFromStore } from './utils';

export default function PublishUpload() {
  const { state, dispatch } = useCreateCollectionStore();
  const [activeStep, setActiveStep] = useLocalStorage('activeStep', 0);
  const [isLoading, setIsLoading] = useState(false);
  const { uploadImage } = useAnonymousNFTStorage();
  const { createCollectionNFT, createCandyMachine, insertItems } = useCandyMachineCreate();

  if (state.publishStep !== 'upload') return null;

  const handleCreateCollectionOnDB = async () => {
    setIsLoading(true);
    const apiObject = generateAPIObjectFromStore(state);
    let collectionId = state.collectionId;
    if (!collectionId?.length) {
      const result = await axios({
        url: '/api/collection',
        method: 'POST',
        data: apiObject,
      });
      const collection: Collection = result.data.data;
      dispatch({
        type: ActionTypesCreateCollectionStore.SetFieldValue,
        payload: {
          field: 'collectionId',
          value: collection.id,
        },
      });
      collectionId = collection.id;
    }

    const nftPlaceholderImage = await axios({
      url: `/api/collection/${collectionId}/preview`,
      method: 'POST',
      responseType: 'blob',
    });
    const file = new File([nftPlaceholderImage.data], 'preview.png', {
      type: 'application/png',
    });

    const nftPlaceholderImageURL = await uploadImage(file);

    await axios({
      url: `/api/collection/${collectionId}`,
      method: 'PUT',
      data: {
        nftPlaceholderImageURL,
      },
    });
    setActiveStep(1);
    setIsLoading(false);
  };

  const createCollectionNFTCB = async () => {
    setIsLoading(true);
    await createCollectionNFT();
    setActiveStep(2);
    setIsLoading(false);
  };

  const createCandyMachineCB = async () => {
    setIsLoading(true);
    await createCandyMachine();
    setActiveStep(3);
    setIsLoading(false);
  };

  const insertItemsCB = async () => {
    setIsLoading(true);
    await insertItems();
    setActiveStep(3);
    setIsLoading(false);
  };

  return (
    <div>
      <h1 className="my-3">Nice, now lets publish your collection!</h1>
      <h1 className="my-3">
        For uploading your collection, you will need to go through a few
        steps...
      </h1>
      <h1 className="my-3">
        Just keep smashing the buttons as they appear, and it will be done soon
        😁
      </h1>
      {activeStep === 0 && (
        <button
          disabled={isLoading}
          onClick={handleCreateCollectionOnDB}
          className="bg-main-yellow text-black rounded my-3 p-3 text-center w-full"
        >
          {isLoading
            ? 'Loading...'
            : 'Click here to generate the collection data so that diffused.art can track your collection.'}
        </button>
      )}

      {activeStep === 1 && (
        <button
          disabled={isLoading}
          onClick={createCollectionNFTCB}
          className="bg-main-yellow text-black rounded my-3 p-3 text-center w-full"
        >
          {isLoading ? (
            'Loading...'
          ) : (
            <span>
              Now, click here to create the immutable Collection NFT, which your
              wallet will receive.
              <br />
              This NFT will be used to identify your drop. <br />
              So, as the artist, it is your duty to store safely this NFT (and
              never burn it!).
            </span>
          )}
        </button>
      )}

      {activeStep === 2 && (
        <button
          disabled={isLoading}
          onClick={createCandyMachineCB}
          className="bg-main-yellow text-black rounded my-3 p-3 text-center w-full"
        >
          {isLoading ? (
            'Loading...'
          ) : (
            <span>
              Nice, check your wallet, the NFT that represents your whole
              collection should be there! <br />
              We are almost there, now let&apos;s create the Candy Machine.
            </span>
          )}
        </button>
      )}

      {activeStep === 3 && (
        <button
          disabled={isLoading}
          onClick={insertItemsCB}
          className="bg-main-yellow text-black rounded my-3 p-3 text-center w-full"
        >
          {isLoading ? (
            'Loading...'
          ) : (
            <span>
              Candy Machine created! Finally, let`s upload the NFTs!
            </span>
          )}
        </button>
      )}
    </div>
  );
}
