import { Collection } from '@prisma/client';
import axios from 'axios';
import React, { useState } from 'react';
import useAnonymousNFTStorage from '../../../hooks/useAnonymousNFTStorage';
import {
  ActionTypesCreateCollectionStore,
  useCreateCollectionStore,
} from '../../../hooks/useCreateCollectionStore';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { generateAPIObjectFromStore } from './utils';

// COLLECTION NFT CREATION INPUTTING ARTIST ROYALTIES ADDRESS AND COLLECTION INFO (REFETCH FRESH COLLECTION INFO)
// CANDY MACHINE CREATION V3 USING UPDATE AUTHORITY AND TREASURY
// UPLOAD CANDY MACHINE CONFIG LINES
export default function PublishUpload() {
  const { state, dispatch } = useCreateCollectionStore();
  const [activeStep, setActiveStep] = useLocalStorage('activeStep', 0);
  const [isLoading, setIsLoading] = useState(false);
  const { uploadImage } = useAnonymousNFTStorage();

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

  return (
    <div>
      <h1 className="my-3">Nice, now lets publish your collection!</h1>
      <h1 className="my-3">
        For uploading your collection, you will need to go through a few
        steps...
      </h1>
      <h1 className="my-3">
        Just keep smashing the buttons as they appear, and it will be done soon
        enough 😁
      </h1>
      {activeStep === 0 && (
        <button
          disabled={isLoading}
          onClick={handleCreateCollectionOnDB}
          className="bg-main-yellow text-black rounded my-3 p-3"
        >
          {isLoading
            ? 'Loading...'
            : 'Click here to generate the collection data so that diffused.art can track your collection.'}
        </button>
      )}
    </div>
  );
}
